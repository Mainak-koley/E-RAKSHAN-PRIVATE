import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TILE_PROVIDERS } from '../constants/layers';

const MapContext = createContext(null);
export const useMapCtx = () => useContext(MapContext);

export function MapProvider({ children }) {
  const [visible, setVisible] = useState(() => Object.fromEntries([
    ['habitations', true], ['redzones', true], ['safesites', false], ['shelters', true],
    ['roads', false], ['incidents', true], ['vehicles', true], ['assignments', false],
  ]));
  const [opacities, setOpacities] = useState({ redzones: 0.42, hazardTint: 0.55 });
  const [basemap, setBasemap] = useState(() => import.meta.env.VITE_DEFAULT_BASEMAP || 'dark');
  const [selected, setSelected] = useState(null); // { type, id }
  const [flyTarget, setFlyTarget] = useState(null); // { center, zoom, nonce }
  const [mode, setMode] = useState('view'); // 'view' | 'incident'
  const [assignments, setAssignments] = useState(null); // relocation result overlay
  const [highlightIds, setHighlightIds] = useState([]); // habitation ids to pulse
  const [aiMarker, setAiMarker] = useState(null); // { lat, lng, label, source, nonce }

  const toggleLayer = useCallback((id) => setVisible((v) => ({ ...v, [id]: !v[id] })), []);
  const setLayerVisible = useCallback((id, show) => setVisible((v) => ({ ...v, [id]: show })), []);
  const setOpacity = useCallback((id, val) => setOpacities((o) => ({ ...o, [id]: val })), []);
  const flyTo = useCallback((center, zoom = 13) => setFlyTarget({ center, zoom, nonce: Date.now() }), []);
  const select = useCallback((type, id) => setSelected({ type, id }), []);
  const markLocation = useCallback((marker) => setAiMarker(marker ? { ...marker, nonce: Date.now() } : null), []);

  const value = useMemo(() => ({
    visible, toggleLayer, setLayerVisible, opacities, setOpacity,
    basemap, setBasemap, providers: TILE_PROVIDERS,
    selected, select, setSelected,
    flyTarget, flyTo,
    mode, setMode,
    assignments, setAssignments,
    highlightIds, setHighlightIds,
    aiMarker, setAiMarker, markLocation,
  }), [visible, toggleLayer, setLayerVisible, opacities, setOpacity, basemap, selected, select, flyTarget, flyTo, mode, assignments, highlightIds, aiMarker, markLocation]);

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
