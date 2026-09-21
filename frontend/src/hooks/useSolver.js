import { useCallback, useEffect, useRef, useState } from 'react';
import { solveRelocation } from '../utils/optimizer';

/* Runs the relocation solver and reveals its convergence trace progressively
   so the UI can animate the optimisation for the jury. */
export function useSolver() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);

  const run = useCallback((payload) => {
    setRunning(true); setResult(null); setRevealed([]); setProgress(0);
    const res = solveRelocation(payload);
    const trace = res.iterations;
    let i = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      i += Math.max(1, Math.ceil(trace.length / 22));
      setRevealed(trace.slice(0, i));
      setProgress(Math.min(100, Math.round((i / trace.length) * 100)));
      if (i >= trace.length) {
        clearInterval(timer.current);
        setResult(res);
        setRunning(false);
      }
    }, 90);
    return res;
  }, []);

  useEffect(() => () => clearInterval(timer.current), []);

  const reset = useCallback(() => { clearInterval(timer.current); setResult(null); setRevealed([]); setProgress(0); setRunning(false); }, []);

  return { run, reset, running, result, revealed, progress };
}
