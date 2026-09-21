import { TILE_PROVIDERS } from '../../constants/layers';

export const getProvider = (id) => TILE_PROVIDERS.find((p) => p.id === id) || TILE_PROVIDERS[0];

export const BHUVAN_PORTAL = import.meta.env.VITE_BHUVAN_PORTAL || 'https://bhuvan-app1.nrsc.gov.in/';
export const FIRMS_PORTAL = import.meta.env.VITE_FIRMS_PORTAL || 'https://firms.modaps.eosdis.nasa.gov/map/';
