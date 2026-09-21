import { useMemo, useState } from 'react';
import { Tent, Download, Search } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import SiteCard from '../../components/sites/SiteCard';
import { SelectInput } from '../../components/common/Inputs';
import { exportCSV } from '../../utils/csv';
import { useDemo } from '../../context/DemoContext';
import { DEFAULT_SUITABILITY_WEIGHTS, SUITABILITY_FACTORS } from '../../constants/risk';
import { fmtPct } from '../../utils/format';

export default function SitesPage() {
  const demo = useDemo();
  const [type, setType] = useState('all');
  const [amenity, setAmenity] = useState('all');
  const [sort, setSort] = useState('suitability');

  const types = useMemo(() => [...new Set(demo.safeSites.features.map((f) => f.properties.type))], [demo.safeSites]);
  const amenities = useMemo(() => [...new Set(demo.safeSites.features.flatMap((f) => f.properties.amenities || []))], [demo.safeSites]);

  const rows = useMemo(() => demo.safeSites.features
    .filter((f) => (type === 'all' || f.properties.type === type)
      && (amenity === 'all' || (f.properties.amenities || []).includes(amenity)))
    .sort((a, b) => (sort === 'suitability' ? b.properties.suitability - a.properties.suitability
      : sort === 'area' ? b.properties.area_ha - a.properties.area_ha
        : a.properties.name.localeCompare(b.properties.name))), [demo.safeSites, type, amenity, sort]);

  return (
    <div className="page">
      <PageHeader
        kicker="Candidate relocation sites"
        title="Safe Sites"
        subtitle="Suitability scored on the documented framework — hazard safety 30 · capacity 20 · connectivity 15 · terrain 15 · livelihood 10 · services 10."
        actions={(
          <button type="button" className="btn" onClick={() => exportCSV('safe-sites.csv', rows.map((f) => ({
            id: f.properties.id, name: f.properties.name, type: f.properties.type, suitability: f.properties.suitability, area_ha: f.properties.area_ha,
            ...Object.fromEntries(SUITABILITY_FACTORS.map((s) => [s.id, fmtPct(f.properties[s.id] / 100)])),
          })))}><Download size={14} /> Export</button>
        )}
      />

      <Card>
        <div className="row gap-3 wrap">
          <SelectInput label="Site type" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: 'all', label: 'All types' }, ...types.map((t) => ({ value: t, label: t }))]} />
          <SelectInput label="Must have amenity" value={amenity} onChange={(e) => setAmenity(e.target.value)} options={[{ value: 'all', label: 'Any amenity' }, ...amenities.map((t) => ({ value: t, label: t }))]} />
          <SelectInput label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} options={[
            { value: 'suitability', label: 'Suitability ↓' }, { value: 'area', label: 'Area ↓' }, { value: 'name', label: 'Name A→Z' }]}
          />
          <span className="tiny text-faint" style={{ alignSelf: 'flex-end', paddingBottom: 14 }}>{rows.length} sites · click a card to fly there on the tactical map</span>
        </div>
      </Card>

      <div className="grid-3 mt-4">
        {rows.map((f) => <SiteCard key={f.properties.id} site={f} />)}
      </div>
    </div>
  );
}
