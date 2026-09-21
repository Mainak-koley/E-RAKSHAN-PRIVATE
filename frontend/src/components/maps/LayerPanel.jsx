import { useState } from 'react';
import { Layers, Eye, EyeOff, Crosshair, Satellite, Minus, Plus } from 'lucide-react';
import { useMapCtx } from '../../context/MapContext';
import { LAYER_DEFS } from '../../constants/layers';
import { RangeInput, SelectInput } from '../common/Inputs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/* Layers & overlays control — collapsible so it never blocks the map.
   Auto-minimises on small screens unless the user chose a state. */
export default function LayerPanel() {
  const { visible, toggleLayer, opacities, setOpacity, basemap, setBasemap, providers, mode, setMode } = useMapCtx();
  const narrow = useMediaQuery('(max-width: 860px)');
  const [pref, setPref] = useLocalStorage('panel-layers', null); // null = auto
  const collapsed = pref == null ? narrow : pref;

  if (collapsed) {
    return (
      <button type="button" className="map-panel panel-mini" title="Show layers & overlays" onClick={() => setPref(false)}>
        <Layers size={15} />
      </button>
    );
  }

  return (
    <div className="map-panel" style={{ width: 236, maxWidth: 'calc(100vw - 96px)', maxHeight: 'calc(100% - 60px)', overflowY: 'auto', padding: '8px 12px 10px' }}>
      <div className="row between mb-2">
        <span className="row gap-2 small strong"><Layers size={14} className="text-cyan" /> Layers & Overlays</span>
        <button type="button" className="icon-btn" style={{ width: 22, height: 22, minWidth: 22, border: 0 }} title="Minimise" onClick={() => setPref(true)}><Minus size={12} /></button>
      </div>
      {LAYER_DEFS.map((l) => (
        <div className="layer-row" key={l.id}>
          <button
            type="button"
            onClick={() => toggleLayer(l.id)}
            className="icon-btn"
            style={{ width: 24, height: 24, minWidth: 24, border: 0, padding: 0, color: visible[l.id] ? l.color : 'var(--text-faint)' }}
            title={visible[l.id] ? 'Hide layer' : 'Show layer'}
          >
            {visible[l.id] ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <span className="layer-swatch" style={{ background: l.color, color: l.color, opacity: visible[l.id] ? 1 : 0.25 }} />
          <span style={{ opacity: visible[l.id] ? 1 : 0.4 }} className="flex-1">{l.label}</span>
          {l.live && <span className="tiny text-purple">LIVE</span>}
        </div>
      ))}
      <div className="divider" />
      <RangeInput
        label="Red zone opacity"
        min={0.08} max={0.7} step={0.02}
        value={opacities.redzones}
        display={opacities.redzones.toFixed(2)}
        onChange={(v) => setOpacity('redzones', v)}
      />
      <div className="divider" />
      <SelectInput
        label="Basemap"
        value={basemap}
        onChange={(e) => setBasemap(e.target.value)}
        options={providers.map((p) => ({ value: p.id, label: p.label }))}
      />
      <div className="row gap-2 mt-2">
        {mode === 'incident' ? (
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => setMode('view')}><Crosshair size={12} /> Cancel drop-pin</button>
        ) : (
          <button type="button" className="btn btn-sm btn-block" onClick={() => setMode('incident')}><Crosshair size={12} /> Report incident here</button>
        )}
      </div>
      <div className="row gap-2 mt-2">
        <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => LAYER_DEFS.forEach((l) => { if (!visible[l.id]) toggleLayer(l.id); })}><Satellite size={12} /> Show all layers</button>
      </div>
    </div>
  );
}
