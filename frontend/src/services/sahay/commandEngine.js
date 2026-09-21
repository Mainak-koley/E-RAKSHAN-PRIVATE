import { fmtInt } from '../../utils/format';
import { centroidOf } from '../../utils/geo';

const TEAM_BY_BAND = {
  critical: 'Team Alpha · Landslide & medical response',
  high: 'Team Bravo · Rapid response',
  moderate: 'Team Charlie · Field assessment',
  low: 'Nearest field unit · Monitoring',
};

const pageCommands = [
  {
    words: ['dashboard', 'command centre', 'command center'],
    path: '/dashboard',
    label: 'Command Dashboard',
  },
  {
    words: ['tactical map', 'map'],
    path: '/map',
    label: 'Tactical Map',
  },
  {
    words: ['habitations', 'habitation'],
    path: '/habitations',
    label: 'Habitations',
  },
  {
    words: ['risk analysis', 'risk', 'red zone'],
    path: '/risk',
    label: 'Red-Zone Indexer',
  },
  {
    words: ['relocation'],
    path: '/relocation',
    label: 'Relocation Engine',
  },
  {
    words: ['safe site', 'safe sites'],
    path: '/sites',
    label: 'Safe Sites',
  },
  {
    words: ['shelter capacity', 'capacity', 'shelter'],
    path: '/capacity',
    label: 'Capacity Control',
  },
  {
  words: [
    'optimiser',
    'optimizer',
    'optimization',
    'optimisation',
    'milp',
  ],
  path: '/optimization',
  label: 'Optimiser',
},
  {
    words: ['field report', 'field'],
    path: '/field',
    label: 'Field Reports',
  },
  {
    words: ['alert'],
    path: '/alerts',
    label: 'Alert Centre',
  },
  {
    words: ['report'],
    path: '/reports',
    label: 'Incident Reports',
  },
];

function topHabitations(demo) {
  return [...(demo.evaluated || [])].sort(
    (a, b) => b.analysis.priority - a.analysis.priority
  );
}

function subjectFor(query, rows) {
  const q = query.toLowerCase();

  return (
    rows.find((item) =>
      q.includes(item.properties.name.toLowerCase())
    ) || rows[0]
  );
}

function levelFor(score) {
  if (score >= 0.8) return 'critical';
  if (score >= 0.62) return 'high';
  if (score >= 0.42) return 'moderate';
  return 'low';
}

function capacitySummary(demo) {
  const shelters = demo.shelters?.features || [];

  const total = shelters.reduce(
    (sum, f) => sum + (f.properties.capacity || 0),
    0
  );

  const occupied = shelters.reduce(
    (sum, f) => sum + (f.properties.occupancy || 0),
    0
  );

  const open = shelters.filter(
    (f) => f.properties.operational
  ).length;

  return {
    total,
    occupied,
    free: Math.max(0, total - occupied),
    open,
  };
}

function safeNearest(demo, feature) {
  if (!feature) return [];

  return demo
    .nearestShelters(centroidOf(feature.geometry), 3)
    .filter((row) => row.free > 0);
}

export function createBriefing(demo, alerts) {
  const rows = topHabitations(demo);

  const critical = rows.filter(
    (f) => f.analysis.priority >= 0.8
  );

  const blocked = (demo.roads?.features || []).filter(
    (r) => r.properties.status === 'blocked'
  );

  const capacity = capacitySummary(demo);

  const latest = (alerts || [])
    .filter((a) => a.status !== 'resolved')
    .slice(0, 1)[0];

  const lead = rows[0];

  if (!lead) {
    return 'Operational data is still loading. Please try again in a moment.';
  }

  return `${critical.length || 'No'} critical habitation${
    critical.length === 1 ? '' : 's'
  } require attention. ${
    lead.properties.name
  } has the highest current priority at ${
    Math.round(lead.analysis.priority * 100)
  } out of 100. ${
    blocked.length
      ? `${blocked.length} road route${
          blocked.length === 1 ? ' is' : 's are'
        } blocked.`
      : 'No road blockages are currently recorded.'
  } ${fmtInt(capacity.free)} shelter beds are free across ${
    capacity.open
  } operational shelters.${
    latest ? ` Latest alert: ${latest.type}.` : ''
  }`;
}

export function buildPriorityQueue(demo) {
  return topHabitations(demo)
    .slice(0, 5)
    .map((item, index) => {
      const score = Math.round(
        item.analysis.priority * 100
      );

      const level = levelFor(
        item.analysis.priority
      );

      return {
        rank: index + 1,
        id: item.properties.id,
        name: item.properties.name,
        score,
        level,
        team: TEAM_BY_BAND[level],
        isolated: demo.isIsolated?.(
          item.properties.id
        ),
      };
    });
}

function featureCenter(feature) {
  if (!feature?.geometry) return null;

  try {
    return centroidOf(feature.geometry);
  } catch {
    return null;
  }
}

function searchableFeatures(demo) {
  const groups = [
    ...(demo?.evaluated || []).map((f) => ({
      f,
      source: 'Habitation',
    })),

    ...(demo?.effectiveRedzones?.features || []).map(
      (f) => ({
        f,
        source: 'Red zone',
      })
    ),

    ...(demo?.safeSites?.features || []).map(
      (f) => ({
        f,
        source: 'Safe site',
      })
    ),

    ...(demo?.shelters?.features || []).map(
      (f) => ({
        f,
        source: 'Shelter',
      })
    ),

    ...(demo?.incidents?.features || []).map(
      (f) => ({
        f,
        source: 'Incident',
      })
    ),

    ...(demo?.roads?.features || []).map(
      (f) => ({
        f,
        source: 'Road',
      })
    ),
  ];

  return groups.filter(({ f }) => f?.properties);
}

export function resolveSahayLocation(rawText, demo) {
  const text = String(rawText || '').trim();

  const match =
    text.match(
      /(?:mark|locate|find|pin)\s+(?:the\s+)?(?:location\s+of\s+|location\s+)?(.+?)(?:\s+on\s+(?:the\s+)?map)?[.!?]?$/i
    ) ||
    text.match(
      /show\s+(?:the\s+)?location\s+of\s+(.+?)(?:\s+on\s+(?:the\s+)?map)?[.!?]?$/i
    );

  if (!match) return null;

  const requested = match[1]
    .trim()
    .replace(
      /^(?:location|place)\s+/i,
      ''
    )
    .trim();

  if (!requested) return null;

  const q = requested.toLowerCase();
  const rows = searchableFeatures(demo);

  const exact = rows.find(
    ({ f }) =>
      String(
        f.properties.name || ''
      ).toLowerCase() === q
  );

  const contains = rows.find(({ f }) => {
    const name = String(
      f.properties.name || ''
    ).toLowerCase();

    return (
      name.includes(q) ||
      q.includes(name)
    );
  });

  const token = rows.find(({ f }) => {
    const name = String(
      f.properties.name || ''
    ).toLowerCase();

    return q
      .split(/\s+/)
      .filter(Boolean)
      .some(
        (part) =>
          part.length > 2 &&
          name.includes(part)
      );
  });

  const hit = exact || contains || token;

  if (!hit) {
    return {
      found: false,
      requested,
    };
  }

  const center = featureCenter(hit.f);

  if (!center) {
    return {
      found: false,
      requested,
    };
  }

  return {
    found: true,
    requested,
    label: hit.f.properties.name,
    source: hit.source,
    center,
    id: hit.f.properties.id,
  };
}

export function runSahayCommand(
  rawText,
  { demo, alerts = [] }
) {
  const text = rawText.trim();

  const query = text
    .toLowerCase()
    .replace(
      /^hey\s+sahay[,.]?\s*/i,
      ''
    )
    .replace(
      /^hey\s+sai[,.]?\s*/i,
      ''
    );

  const rows = topHabitations(demo);

  const target = subjectFor(
    query,
    rows
  );

  const priority = target
    ? Math.round(
        target.analysis.priority * 100
      )
    : null;

  if (!query) {
    return {
      text: 'I am listening. You can ask about priorities, routes, shelter capacity, reports, or any page.',
      type: 'info',
    };
  }

  const location = resolveSahayLocation(
    text,
    demo
  );

  if (location) {
    if (location.found) {
      return {
        text: `Located ${location.label} on the current district map.`,
        type: 'location',
        action: {
          kind: 'mark-location',
          lat: location.center[0],
          lng: location.center[1],
          label: location.label,
          source: location.source,
          id: location.id,
        },
      };
    }

    return {
      text: `I could not find ${location.requested} in the available map data.`,
      type: 'location',
    };
  }

  if (
    /\b(go back|back)\b/.test(query)
  ) {
    return {
      text: 'Going back to the previous view.',
      type: 'navigation',
      action: {
        kind: 'back',
      },
    };
  }

  if (
    /\b(alerts?|warnings?|notifications?)\b/.test(
      query
    )
  ) {
    return {
      text: alerts.length
        ? `${alerts.length} active alert${
            alerts.length === 1 ? '' : 's'
          } are currently recorded.`
        : 'There are currently no active alerts recorded.',
      type: 'alerts',
      action: {
        kind: 'navigate',
        path: '/alerts',
      },
    };
  }

  if (
  /critical\s+(habitation|location|village)|show.*critical|immediate attention|need.*attention/.test(
    query
  )
) {
  const priorityList = rows
    .slice(0, 5)
    .map(
      (item, index) =>
        `${index + 1}. ${item.properties.name} — ${Math.round(
          item.analysis.priority * 100
        )}/100`
    )
    .join(', ');

  return {
    text: priorityList
      ? `The current highest-priority habitations are: ${priorityList}.`
      : 'No habitation priority data is currently available.',
    type: 'priority',
    matched: true,
      };
      }
  if (
    /blocked\s+(road|route)|(?:road|roads|route|routes).*blocked|map.*blocked/.test(
      query
    )
  ) {
    return {
      text: 'Opening the Tactical Map with the road network enabled. Blocked routes are shown in the map layer.',
      type: 'navigation',
      action: {
        kind: 'map-roads',
      },
    };
  }

  if (
    /brief|situation update|situation report|current situation|what.*happening|status/.test(
      query
    )
  ) {
    return {
      text: createBriefing(
        demo,
        alerts
      ),
      type: 'briefing',
    };
  }

  if (
   /generate.*report|report.*(?:for|about)/.test(
    query
  )
) {
    return {
      text: `I prepared a situation-report draft using the live ${
        demo.district?.name ||
        'district'
      } demo data. Review it in Incident Reports before sharing.`,
      type: 'report',
      action: {
        kind: 'report',
        target,
      },
    };
  }

  if (
    /shelter|capacity|bed/.test(
      query
    )
  ) {
    const capacity =
      capacitySummary(demo);

    const nearest =
      safeNearest(
        demo,
        target
      );

    return {
      text: `${fmtInt(
        capacity.free
      )} beds are currently available across ${
        capacity.open
      } operational shelters. ${
        target
          ? `For ${
              target.properties.name
            }, the nearest available option is ${
              nearest[0]?.shelter
                .properties.name ||
              'still being evaluated'
            }.`
          : ''
      }`,
      type: 'capacity',
      action: {
        kind: 'navigate',
        path: '/capacity',
      },
    };
  }

  if (
    /why|explain|reason/.test(
      query
    ) &&
    target
  ) {
    const a =
      target.analysis;

    return {
      text: `${target.properties.name} is priority ${priority} because of hazard exposure ${Math.round(
        a.hazard * 100
      )}%, vulnerability ${Math.round(
        a.vulnerability * 100
      )}%, and population exposure ${Math.round(
        a.exposure * 100
      )}%. ${
        demo.isIsolated?.(
          target.properties.id
        )
          ? 'It is currently isolated with no safe land route.'
          : 'Its road access is still under monitoring.'
      }`,
      type: 'explanation',
      action: {
        kind: 'navigate',
        path: '/habitations',
        state: {
          focusId:
            target.properties.id,
        },
      },
    };
  }

  if (
    /team|rescue first|send.*rescue|deploy/.test(
      query
    ) &&
    target
  ) {
    const level =
      levelFor(
        target.analysis.priority
      );

    const team =
      TEAM_BY_BAND[level];

    return {
      text: `${target.properties.name} is the highest current rescue priority at ${priority}. I recommend ${team}. This is a recommendation only and needs officer approval before any field action.`,
      type: 'recommendation',
      recommendation: {
        location:
          target.properties.name,
        priority,
        team,
        confidence:
          target.analysis.priority >=
          0.75
            ? 'High'
            : 'Medium',
      },
      action: {
        kind: 'navigate',
        path: '/map',
        state: {
          focusId:
            target.properties.id,
        },
      },
    };
  }

  if (
    /route|road|isolated|alternate/.test(
      query
    ) &&
    target
  ) {
    const blocked =
      (
        demo.roads
          ?.features || []
      ).filter(
        (r) =>
          r.properties.status ===
          'blocked'
      ).length;

    return {
      text: demo.isIsolated?.(
        target.properties.id
      )
        ? `${target.properties.name} is currently isolated. No safe land route is available; field verification and air or specialist response assessment are required.`
        : `${target.properties.name} is not marked isolated. ${
            blocked
              ? `${blocked} blocked road route${
                  blocked === 1
                    ? ' is'
                    : 's are'
                } factored into the recommended plan.`
              : 'No blocked road is currently recorded.'
          }`,
      type: 'route',
      action: {
        kind: 'map-roads',
        focusId:
          target.properties.id,
      },
    };
  }

  if (
   /relocat|where.*move/.test(
    query
   ) &&
   target
) {
    const nearest =
      safeNearest(
        demo,
        target
      );

    const list = nearest
      .map(
        (row) =>
          `${row.shelter.properties.name} (${fmtInt(
            row.free
          )} free)`
      )
      .join(', ');

    return {
      text: `${target.properties.name} should be assessed for relocation to ${
        list ||
        'the nearest operational shelter after capacity verification'
      }. The final allocation remains subject to officer approval.`,
      type: 'relocation',
      action: {
        kind: 'navigate',
        path: '/relocation',
        state: {
          preselect:
            target.properties.id,
        },
      },
    };
  }

  const page =
    pageCommands.find(
      (item) =>
        item.words.some(
          (word) =>
            query.includes(word)
        )
    );

  if (
    /\b(open|show|go to)\b/.test(
      query
    ) &&
    page
  ) {
    return {
      text: `Opening ${page.label}.`,
      type: 'navigation',
      action: {
        kind: 'navigate',
        path: page.path,
      },
    };
  }

  return {
    text: 'I can help with rescue priority, risk explanations, routes, shelters, relocation, reports, and page navigation. Try: “Which location needs rescue first?”',
    type: 'info',
    matched: false,
  };
}

export const SAHAY_SUGGESTIONS = [
  'Which location needs rescue first?',
  'Show critical habitations',
  'Do we have enough shelter capacity?',
];