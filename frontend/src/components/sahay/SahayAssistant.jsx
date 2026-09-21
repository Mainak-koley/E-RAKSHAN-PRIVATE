import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CircleDot,
  ClipboardList,
  GripVertical,
  Mic,
  MicOff,
  Minimize2,
  Navigation,
  Send,
  Settings2,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

import { useDemo } from '../../context/DemoContext';
import { useAlerts } from '../../context/AlertContext';
import { useMapCtx } from '../../context/MapContext';
import { api } from '../../services/api/client';
import {
  buildPriorityQueue,
  runSahayCommand,
  SAHAY_SUGGESTIONS,
} from '../../services/sahay/commandEngine';
import {
  askOllama,
  OLLAMA_ENABLED,
} from '../../services/sahay/ollamaClient';

import '../../styles/sahay.css';

const POS_KEY = 'sahay-position-v1';
const HISTORY_KEY = 'sahay-audit-v1';
const VOICE_WS =
  import.meta.env.VITE_SAHAY_VOICE_WS || 'ws://127.0.0.1:8787/ws';

function getStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function makeAudit(event, detail) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    at: new Date().toISOString(),
    event,
    detail,
  };
}

export default function SahayAssistant() {
  const demo = useDemo();
  const { districtId } = demo;
  const { alerts } = useAlerts();
  const mapCtx = useMapCtx();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [state, setState] = useState('listening');
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [autoReadAlerts, setAutoReadAlerts] = useState(true);
  const [tab, setTab] = useState('chat');

  const [position, setPosition] = useState(() =>
    getStored(POS_KEY, null)
  );

  const [history, setHistory] = useState(() =>
    getStored(HISTORY_KEY, [])
  );

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'System ready. Say “Hey SAI” or ask me about the current response.',
    },
  ]);

  const [recommendation, setRecommendation] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceBridgeReady, setVoiceBridgeReady] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0.2);
  const [isDragging, setIsDragging] = useState(false);
  const [dashboardEntry, setDashboardEntry] = useState(false);

  const wakeRef = useRef(wakeEnabled);
  const voiceEnabledRef = useRef(voiceEnabled);
  const handlingRef = useRef(null);
  const alertIdsRef = useRef(new Set());
  const dragRef = useRef(null);
  const voiceSocketRef = useRef(null);
  const ollamaAbortRef = useRef(null);
  const voiceReconnectRef = useRef(null);

  const queue = useMemo(
    () => buildPriorityQueue(demo),
    [demo]
  );

  useEffect(() => {
    wakeRef.current = wakeEnabled;
  }, [wakeEnabled]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem(
      POS_KEY,
      JSON.stringify(position)
    );
  }, [position]);

  useEffect(() => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.slice(0, 40))
    );
  }, [history]);

  /* Entrance animation trigger ONLY ONCE right after user logs in */
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem(
      'sahay_just_logged_in'
    );

    if (justLoggedIn) {
      sessionStorage.removeItem('sahay_just_logged_in');
      setDashboardEntry(true);

      const timer = window.setTimeout(
        () => setDashboardEntry(false),
        2000
      );

      return () => window.clearTimeout(timer);
    }

    setDashboardEntry(false);
    return undefined;
  }, [location.pathname]);

  const addAudit = useCallback(
    (event, detail) => {
      setHistory((items) => [
        makeAudit(event, detail),
        ...items,
      ].slice(0, 40));
    },
    []
  );

  const sendVoice = useCallback((payload) => {
    const socket = voiceSocketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }

    return false;
  }, []);

  const speakText = useCallback(
    (text, enabled = true, onState = setState) => {
      if (!enabled || !text) return;

      if (sendVoice({ type: 'speak', text })) {
        onState('speaking');
        return;
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance =
          new SpeechSynthesisUtterance(text);

        utterance.rate = 1.02;
        utterance.pitch = 1;

        utterance.onstart = () => {
          onState('speaking');
        };

        const finishSpeech = () => {
          onState('listening');
        };

        utterance.onend = finishSpeech;
        utterance.onerror = finishSpeech;

        window.speechSynthesis.speak(utterance);
      }
    },
    [sendVoice]
  );

  const applyAction = useCallback(
    (action) => {
      if (!action) return;

      if (action.kind === 'back') {
        navigate(-1);
        return;
      }

      if (action.kind === 'navigate') {
        navigate(action.path, {
          state: action.state,
        });
        return;
      }

      if (action.kind === 'map-roads') {
        mapCtx.setLayerVisible?.('roads', true);

        if (action.focusId) {
          navigate('/map', {
            state: {
              focusId: action.focusId,
            },
          });
        } else {
          navigate('/map');
        }

        return;
      }

      if (action.kind === 'mark-location') {
        mapCtx.markLocation?.({
          lat: action.lat,
          lng: action.lng,
          label: action.label,
          source: action.source,
          id: action.id,
        });

        navigate('/map');
        return;
      }

      if (action.kind === 'report') {
        navigate('/reports');
      }
    },
    [mapCtx, navigate]
  );

  /*
   * SAI command handler
   *
   * Backend priority:
   * 1. Django API for briefing/status
   * 2. Deterministic command engine for operational commands
   * 3. Ollama for unmatched/general questions
   */
  const handleCommand = useCallback(
    async (spoken) => {
      const text = String(spoken || '').trim();

      if (!text) return;

      setOpen(true);
      setState('processing');

      setMessages((items) => [
        ...items.slice(-7),
        {
          role: 'user',
          text,
        },
      ]);

      let result;

      /*
       * Django-backed briefing/status command.
       */
      const isBriefingQuery =
        /\b(brief|briefing|situation update|situation report|current situation|what.*happening|status)\b/i.test(
         text
       );

       const isCapacityQuery =
  /\b(shelter capacity|shelter beds|free beds|available beds|how much shelter capacity|how many shelter beds)\b/i.test(
    text
  );

if (isCapacityQuery) {
  try {
    const data = await api.get(`/dashboard/summary/?district=${districtId}`);

    const freeBeds =
      Number(data?.free_beds || 0);

    const operationalShelters =
      Number(data?.operational_shelters || 0);

    result = {
      text:
        `${freeBeds.toLocaleString('en-IN')} shelter beds are currently free ` +
        `across ${operationalShelters} operational shelters.`,

      type: 'capacity',
      matched: true,
    };

    addAudit(
      'Django shelter capacity',
      text
    );
  } catch (error) {
    result = runSahayCommand(
      text,
      {
        demo,
        alerts,
      }
    );
  }
} else if (isBriefingQuery) {
        try {
          const data = await api.get('/sai/briefing/');

          const critical =
            Number(data?.critical_habitations || 0);

          const priorityName =
            data?.highest_priority?.name ||
            'No habitation';

          const priorityScore = Math.round(
            Number(
              data?.highest_priority?.priority_score || 0
            ) * 100
          );

          const freeBeds =
            Number(data?.free_beds || 0);

          const isolated =
            Number(
              data?.isolated_habitations || 0
            );

          result = {
            text:
              `${critical} critical habitation` +
              `${critical === 1 ? '' : 's'} require attention. ` +
              `${priorityName} has the highest current priority at ` +
              `${priorityScore} out of 100. ` +
              `${freeBeds.toLocaleString('en-IN')} shelter beds are currently free across the district. ` +
              `${isolated} habitation` +
              `${isolated === 1 ? '' : 's'} are currently isolated.`,

            type: 'briefing',
            matched: true,
          };

          addAudit(
            'Django briefing',
            text
          );
        } catch (error) {
          /*
           * If Django is temporarily unavailable,
           * preserve the existing deterministic fallback.
           */
          result = runSahayCommand(
            text,
            {
              demo,
              alerts,
            }
          );
        }
      } else {
        result = runSahayCommand(
          text,
          {
            demo,
            alerts,
          }
        );
      }

      /*
       * Unmatched deterministic commands go to Ollama.
       */
      if (
        result?.matched === false &&
        OLLAMA_ENABLED
      ) {
        ollamaAbortRef.current?.abort();

        const controller =
          new AbortController();

        ollamaAbortRef.current = controller;

        setMessages((items) => [
          ...items.slice(-7),
          {
            role: 'assistant',
            text: '…',
            type: 'ollama',
          },
        ]);

        try {
          const full = await askOllama(
            text,
            {
              signal: controller.signal,

              onToken: (partial) => {
                setMessages((items) => {
                  const next = [...items];

                  next[next.length - 1] = {
                    role: 'assistant',
                    text: partial,
                    type: 'ollama',
                  };

                  return next;
                });
              },
            }
          );

          addAudit(
            'General question (Ollama)',
            text
          );

          setMessages((items) => {
            const next = [...items];

            next[next.length - 1] = {
              role: 'assistant',
              text: full,
              type: 'ollama',
            };

            return next;
          });

          speakText(
            full,
            voiceEnabledRef.current,
            setState
          );

          if (!voiceEnabledRef.current) {
            setState('listening');
          }

          return;
        } catch (error) {
          if (error?.name === 'AbortError') {
            return;
          }

          setMessages((items) => {
            const next = [...items];

            next[next.length - 1] = {
              role: 'assistant',
              text:
                `${result.text} ` +
                `(Local AI assistant is unreachable — make sure Ollama is running.)`,
              type: 'info',
            };

            return next;
          });

          setState('listening');
          return;
        }
      }

      /*
       * Display deterministic/Django result.
       */
      window.setTimeout(() => {
        setMessages((items) => [
          ...items.slice(-7),
          {
            role: 'assistant',
            text: result.text,
            type: result.type,
          },
        ]);

        setRecommendation(
          result.recommendation || null
        );

        applyAction(result.action);

        if (
          result.type !== 'briefing'
        ) {
          addAudit(
            result.type === 'recommendation'
              ? 'Recommendation issued'
              : result.type === 'location'
                ? 'Location marked'
                : 'Assistant command',
            text
          );
        }

        speakText(
          result.text,
          voiceEnabledRef.current,
          setState
        );

        if (!voiceEnabledRef.current) {
          setState('listening');
        }
      }, 180);
    },
    [
      addAudit,
      alerts,
      applyAction,
      demo,
      speakText,
    ]
  );

  handlingRef.current = handleCommand;

  /*
   * Local WebSocket voice bridge
   */
  useEffect(() => {
    let cancelled = false;
    let socket;

    const connect = () => {
      if (cancelled) return;

      try {
        socket = new WebSocket(VOICE_WS);
      } catch {
        setVoiceBridgeReady(false);
        return;
      }

      voiceSocketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;

        setVoiceBridgeReady(true);

        socket.send(
          JSON.stringify({
            type: 'set_wake',
            enabled: wakeRef.current,
          })
        );
      };

      socket.onmessage = (event) => {
        let data;

        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'ready') {
          setVoiceBridgeReady(true);

          socket.send(
            JSON.stringify({
              type: 'set_wake',
              enabled: wakeRef.current,
            })
          );
        }

        else if (data.type === 'wake') {
          setOpen(true);
          setState('listening');
          setVoiceLevel(0.85);

          if (data.command) {
            handlingRef.current?.(
              data.command
            );
          } else {
            setMessages((items) => [
              ...items.slice(-7),
              {
                role: 'assistant',
                text: 'Yes, I am listening.',
              },
            ]);

            speakText(
              'Yes, I am listening.',
              voiceEnabledRef.current,
              setState
            );
          }
        }

        else if (data.type === 'transcript') {
          setOpen(true);
          setState('processing');

          handlingRef.current?.(
            data.text
          );
        }

        else if (data.type === 'status') {
          setState(
            data.state || 'listening'
          );

          setVoiceLevel(
            data.state === 'speaking'
              ? 1
              : 0.65
          );
        }

        else if (data.type === 'error') {
          setState('listening');

          setMessages((items) => [
            ...items.slice(-7),
            {
              role: 'assistant',
              text:
                data.message ||
                'SAI voice service reported an error.',
            },
          ]);
        }
      };

      socket.onclose = () => {
        setVoiceBridgeReady(false);

        if (!cancelled) {
          voiceReconnectRef.current =
            window.setTimeout(
              connect,
              3000
            );
        }
      };

      socket.onerror = () => {
        setVoiceBridgeReady(false);
      };
    };

    connect();

    return () => {
      cancelled = true;

      if (voiceReconnectRef.current) {
        window.clearTimeout(
          voiceReconnectRef.current
        );
      }

      try {
        socket?.close();
      } catch {
        // ignore
      }

      voiceSocketRef.current = null;
    };
  }, [speakText]);

  useEffect(() => {
    sendVoice({
      type: 'set_wake',
      enabled: wakeEnabled,
    });

    if (!wakeEnabled) {
      sendVoice({
        type: 'stop',
      });
    }
  }, [wakeEnabled, sendVoice]);

  useEffect(() => {
    return () => {
      ollamaAbortRef.current?.abort();

      try {
        sendVoice({
          type: 'stop',
        });
      } catch {
        // ignore
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sendVoice]);

  /*
   * Critical alert read-aloud system
   */
  useEffect(() => {
    const current = new Set(
      alerts.map((alert) => alert.id)
    );

    if (!alertIdsRef.current.size) {
      alertIdsRef.current = current;
      return;
    }

    const newCritical = alerts.find(
      (alert) =>
        !alertIdsRef.current.has(alert.id) &&
        alert.severity === 'critical' &&
        alert.status === 'new'
    );

    alertIdsRef.current = current;

    if (
      !newCritical ||
      !autoReadAlerts
    ) {
      return;
    }

    const text =
      `Critical alert. ${newCritical.message}`;

    setMessages((items) => [
      ...items.slice(-7),
      {
        role: 'assistant',
        text,
        type: 'alert',
      },
    ]);

    addAudit(
      'Critical alert read aloud',
      newCritical.type
    );

    speakText(
      text,
      voiceEnabledRef.current,
      setState
    );
  }, [
    addAudit,
    alerts,
    autoReadAlerts,
    speakText,
  ]);

  const handleMicClick = useCallback(() => {
    setOpen(true);
    setState('listening');

    if (
      sendVoice({
        type: 'listen',
      })
    ) {
      return;
    }

    setMessages((items) => [
      ...items.slice(-7),
      {
        role: 'assistant',
        text:
          'Local voice bridge is offline. Start the SAI voice bridge to use the microphone.',
      },
    ]);
  }, [sendVoice]);

  const submit = (event) => {
    event?.preventDefault();

    handleCommand(input);

    setInput('');
  };

  const approve = (decision) => {
    if (!recommendation) return;

    addAudit(
      `Officer ${decision}`,
      `${recommendation.team} for ${recommendation.location}`
    );

    setMessages((items) => [
      ...items.slice(-7),
      {
        role: 'assistant',
        text:
          `Recommendation ${decision}. ` +
          `No field deployment was made automatically.`,
        type: 'approval',
      },
    ]);

    setRecommendation(null);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;

    const box =
      event.currentTarget.closest(
        '.sahay-widget'
      );

    const rect =
      box.getBoundingClientRect();

    dragRef.current = {
      offsetX:
        event.clientX - rect.left,
      offsetY:
        event.clientY - rect.top,
    };

    event.preventDefault();

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    setIsDragging(true);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;

    const width = 58;
    const height = 58;

    const x = Math.max(
      8,
      Math.min(
        window.innerWidth - width - 8,
        event.clientX -
          dragRef.current.offsetX
      )
    );

    const y = Math.max(
      8,
      Math.min(
        window.innerHeight - height - 8,
        event.clientY -
          dragRef.current.offsetY
      )
    );

    setPosition({
      x,
      y,
    });
  };

  const stopDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const panelPlacement = (() => {
    const x =
      position?.x ??
      Math.max(
        8,
        window.innerWidth - 78
      );

    const y =
      position?.y ??
      Math.max(
        8,
        window.innerHeight - 76
      );

    const panelWidth = Math.min(
      350,
      Math.max(
        260,
        window.innerWidth - 26
      )
    );

    const panelHeight = 390;

    const openRight =
      x +
        58 +
        panelWidth +
        12 <=
      window.innerWidth;

    const openDown =
      y +
        58 +
        panelHeight +
        12 <=
      window.innerHeight;

    return (
      `${openRight ? 'sahay-panel-right' : 'sahay-panel-left'} ` +
      `${openDown ? 'sahay-panel-down' : 'sahay-panel-up'}`
    );
  })();

  const wrapperStyle = position
    ? {
        left: position.x,
        top: position.y,
        '--sahay-voice-level':
          voiceLevel,
      }
    : {
        '--sahay-voice-level':
          voiceLevel,
      };

  return (
    <div
      className={
        `sahay-widget ` +
        `${position ? 'sahay-positioned' : ''} ` +
        `${isDragging ? 'is-dragging' : ''} ` +
        `${dashboardEntry ? 'sahay-dashboard-entry' : ''}`
      }
      style={wrapperStyle}
    >
      {open && (
        <section
          className={`sahay-panel ${panelPlacement}`}
          aria-label="SAI emergency response assistant"
        >
          <header className="sahay-panel-head">
            <span className="sahay-title">
              <span className="sahay-mini-mark">
                <Navigation size={14} />
              </span>
              {' '}
              SAI
            </span>

            <span
              className={`sahay-state sahay-state-${state}`}
            >
              <i />

              {state === 'processing'
                ? 'Analysing'
                : state === 'listening'
                  ? 'Listening'
                  : state === 'speaking'
                    ? 'Speaking'
                    : 'Ready'}
            </span>

            <div className="sahay-head-actions">
              <button
                type="button"
                title="Settings"
                onClick={() =>
                  setSettingsOpen(
                    (value) => !value
                  )
                }
              >
                <Settings2 size={15} />
              </button>

              <button
                type="button"
                title="Minimise"
                onClick={() =>
                  setOpen(false)
                }
              >
                <Minimize2 size={15} />
              </button>

              <button
                type="button"
                title="Close"
                onClick={() =>
                  setOpen(false)
                }
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {settingsOpen && (
            <div className="sahay-settings">
              <label>
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(event) =>
                    setVoiceEnabled(
                      event.target.checked
                    )
                  }
                />

                {voiceEnabled ? (
                  <Volume2 size={13} />
                ) : (
                  <VolumeX size={13} />
                )}

                Voice replies
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={wakeEnabled}
                  onChange={(event) =>
                    setWakeEnabled(
                      event.target.checked
                    )
                  }
                />

                Wake on “Hey SAI”
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={autoReadAlerts}
                  onChange={(event) =>
                    setAutoReadAlerts(
                      event.target.checked
                    )
                  }
                />

                Read critical alerts
              </label>

              <span
                className={
                  `tiny ${
                    voiceBridgeReady
                      ? 'text-cyan'
                      : 'text-faint'
                  }`
                }
              >
                {voiceBridgeReady
                  ? 'Local voice bridge connected'
                  : 'Local voice bridge offline'}
              </span>
            </div>
          )}

          <div className="sahay-tabs">
            <button
              type="button"
              className={
                tab === 'chat'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setTab('chat')
              }
            >
              Assistant
            </button>

            <button
              type="button"
              className={
                tab === 'queue'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setTab('queue')
              }
            >
              Priority queue
              {' '}
              <b>{queue.length}</b>
            </button>

            <button
              type="button"
              className={
                tab === 'history'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setTab('history')
              }
            >
              Audit
            </button>
          </div>

          {tab === 'chat' && (
            <div className="sahay-chat">
              <div
                className="sahay-wave"
                aria-hidden="true"
              >
                {Array.from(
                  { length: 9 },
                  (_, index) => (
                    <i key={index} />
                  )
                )}
              </div>

              <div className="sahay-messages">
                {messages
                  .slice(-4)
                  .map(
                    (
                      message,
                      index
                    ) => (
                      <p
                        key={`${message.role}-${index}`}
                        className={
                          `sahay-message ` +
                          `${message.role} ` +
                          `${message.type || ''}`
                        }
                      >
                        {message.text}
                      </p>
                    )
                  )}
              </div>

              {recommendation && (
                <div className="sahay-approval-card">
                  <span>
                    <ShieldCheck size={14} />
                    {' '}
                    Human approval required
                  </span>

                  <strong>
                    {recommendation.team}
                  </strong>

                  <small>
                    {recommendation.location}
                    {' · '}
                    priority{' '}
                    {recommendation.priority}
                    {' · '}
                    confidence{' '}
                    {recommendation.confidence}
                  </small>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        approve('approved')
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        approve('modified')
                      }
                    >
                      Modify
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        approve('rejected')
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              <div className="sahay-suggestions">
                {SAHAY_SUGGESTIONS.map(
                  (suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() =>
                        handleCommand(
                          suggestion
                        )
                      }
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>

              <form
                className="sahay-input"
                onSubmit={submit}
              >
                <input
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  placeholder="Ask SAI..."
                  aria-label="Ask SAI"
                />

                <button
                  type="button"
                  className={
                    state === 'listening'
                      ? 'listening'
                      : ''
                  }
                  title={
                    state === 'listening'
                      ? 'Stop listening'
                      : 'Speak a command'
                  }
                  onClick={
                    handleMicClick
                  }
                >
                  {state === 'listening' ? (
                    <MicOff size={16} />
                  ) : (
                    <Mic size={16} />
                  )}
                </button>

                <button
                  type="submit"
                  title="Send command"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {tab === 'queue' && (
            <div className="sahay-queue">
              {queue.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    `sahay-queue-row ${item.level}`
                  }
                  onClick={() =>
                    handleCommand(
                      `Why is ${item.name} high priority?`
                    )
                  }
                >
                  <b>0{item.rank}</b>

                  <span>
                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      {item.team}
                      {item.isolated
                        ? ' · isolated'
                        : ''}
                    </small>
                  </span>

                  <em>{item.score}</em>
                </button>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="sahay-history">
              {history.length ? (
                history
                  .slice(0, 8)
                  .map((item) => (
                    <div key={item.id}>
                      <ClipboardList
                        size={13}
                      />

                      <span>
                        <strong>
                          {item.event}
                        </strong>

                        <small>
                          {item.detail}
                        </small>
                      </span>

                      <time>
                        {new Date(
                          item.at
                        ).toLocaleTimeString(
                          'en-IN',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </time>
                    </div>
                  ))
              ) : (
                <p>
                  No assistant decisions
                  recorded yet.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <div className="sahay-fab-wrap">
        <button
          className={`sahay-fab ${state}`}
          type="button"
          aria-label="Open SAI assistant"
          onClick={() => {
            setOpen(
              (value) => !value
            );

            if (!open) {
              setState('listening');
            }
          }}
        >
          <span className="sahay-fab-ring" />

          <span className="sahay-fab-core">
            <CircleDot size={22} />
            <Mic size={13} />
          </span>

          <span
            className="sahay-voice-pulse"
            aria-hidden="true"
          />
        </button>

        <button
          className="sahay-drag"
          type="button"
          aria-label="Drag SAI"
          onPointerDown={
            onPointerDown
          }
          onPointerMove={
            onPointerMove
          }
          onPointerUp={stopDrag}
          onPointerCancel={
            stopDrag
          }
        >
          <GripVertical size={14} />
        </button>
      </div>
    </div>
  );
}