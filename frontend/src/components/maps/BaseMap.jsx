import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProvider } from '../../services/providers/tileProviders';
import { useMapCtx } from '../../context/MapContext';
import { MAP_CENTER, MAP_ZOOM } from '../../constants/layers';

/* Leaflet lifecycle owner. Children receive the map via onReady. */
export default function BaseMap({ onReady, onClick, className = '', center = MAP_CENTER, zoom = MAP_ZOOM }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  const { basemap, flyTarget, mode } = useMapCtx();

  useEffect(() => {
    if (mapRef.current || !elRef.current) return undefined;
    const map = L.map(elRef.current, {
      center, zoom, zoomControl: true,
      attributionControl: true, preferCanvas: false,
    });
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    onReady?.(map);

    // delegated click handler for popup action buttons
    const delegation = (e) => {
      const btn = e.target.closest?.('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'zoom') {
        map.flyTo([parseFloat(btn.dataset.lat), parseFloat(btn.dataset.lng)], 14, { duration: 0.8 });
      }
      btn.closest('.leaflet-popup')?.querySelector('.leaflet-popup-close-button')?.click();
    };
    map.getContainer().addEventListener('click', delegation);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);
    return () => {
      ro.disconnect();
      map.getContainer().removeEventListener('click', delegation);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Tile layer swap */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const p = getProvider(basemap);
    tileRef.current = L.tileLayer(p.url, { attribution: p.attribution, maxZoom: p.maxZoom, subdomains: p.subdomains || 'abc' }).addTo(map);
    tileRef.current.setZIndex(0);
  }, [basemap]);

  /* Fly-to requests */
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo(flyTarget.center, flyTarget.zoom ?? 13, { duration: 0.9 });
  }, [flyTarget]);

  /* Click-to-report & map location marking handler */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const handler = (e) => {
      if (clickRef.current) {
        clickRef.current(e.latlng);
      }
    };
    map.on('click', handler);
    if (mode === 'incident') {
      map.getContainer().style.cursor = 'crosshair';
    }
    return () => {
      map.off('click', handler);
      map.getContainer().style.cursor = '';
    };
  }, [mode]);

  return <div ref={elRef} className={`map-canvas ${className}`} />;
}
