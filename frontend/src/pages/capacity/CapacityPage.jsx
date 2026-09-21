import { useMemo, useState } from 'react';
import { Tent, TrendingUp, Download, Gauge } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import ShelterCard from '../../components/shelters/ShelterCard';
import GaugeChart from '../../components/charts/GaugeChart';
import Badge from '../../components/common/Badge';
import { SelectInput } from '../../components/common/Inputs';
import { exportCSV } from '../../utils/csv';
import { useDemo } from '../../context/DemoContext';
import { fmtInt } from '../../utils/format';

export default function CapacityPage() {
  const demo = useDemo();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('load');

  const shelters = demo.shelters.features;
  const totals = useMemo(() => shelters.reduce((a, f) => ({
    cap: a.cap + f.properties.capacity, occ: a.occ + f.properties.occupancy,
    free: a.free + Math.max(0, f.properties.capacity - f.properties.occupancy),
  }), { cap: 0, occ: 0, free: 0 }), [shelters]);

  const over = shelters.filter((f) => f.properties.occupancy / f.properties.capacity > 0.9);
  const closed = shelters.filter((f) => !f.properties.operational);

  const rows = useMemo(() => shelters
    .filter((f) => (filter === 'all' ? true : filter === 'critical' ? f.properties.occupancy / f.properties.capacity > 0.9 : filter === 'closed' ? !f.properties.operational : f.properties.medical_support))
    .sort((a, b) => (sort === 'load'
      ? b.properties.occupancy / b.properties.capacity - a.properties.occupancy / a.properties.capacity
      : sort === 'free'
        ? (b.properties.capacity - b.properties.occupancy) - (a.properties.capacity - a.properties.occupancy)
        : a.properties.name.localeCompare(b.properties.name))), [shelters, filter, sort]);

  return (
    <div className="page">
      <PageHeader
        kicker="Shelter carrying capacity"
        title="Capacity Control"
        subtitle="Interactive occupancy management — adjust loads, close/reopen shelters, watch the network respond."
        actions={(
          <button type="button" className="btn" onClick={() => exportCSV('shelter-capacity.csv', shelters.map((f) => ({
            id: f.properties.id, name: f.properties.name, type: f.properties.type,
            capacity: f.properties.capacity, occupancy: f.properties.occupancy,
            utilisation: `${Math.round((f.properties.occupancy / f.properties.capacity) * 100)}%`,
            medical: f.properties.medical_support ? 'yes' : 'no', operational: f.properties.operational ? 'yes' : 'no',
          })))}><Download size={14} /> Export CSV</button>
        )}
      />

      <div className="stat-grid">
        <StatCard icon={Tent} accent="cyan" label="Total capacity" value={fmtInt(totals.cap)} sub={`${shelters.length} shelters`} />
        <StatCard icon={Gauge} accent="amber" label="Current occupancy" value={fmtInt(totals.occ)} sub={`${Math.round((totals.occ / totals.cap) * 100)}% of network`} />
        <StatCard icon={TrendingUp} accent="green" label="Free beds" value={fmtInt(totals.free)} sub="available now" />
        <StatCard icon={Gauge} accent={over.length ? 'red' : 'green'} label="Shelters >90% full" value={over.length} sub={`${closed.length} closed`} />
      </div>

      <div className="grid-split mt-4">
        <div className="col gap-3">
          <Card>
            <div className="row gap-3 wrap">
              <SelectInput label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} options={[
                { value: 'all', label: 'All shelters' }, { value: 'critical', label: '>90% occupied' },
                { value: 'medical', label: 'Medical-capable' }, { value: 'closed', label: 'Closed' }]}
              />
              <SelectInput label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={[
                { value: 'load', label: 'Occupancy ↓' }, { value: 'free', label: 'Free beds ↓' }, { value: 'name', label: 'Name' }]}
              />
            </div>
          </Card>
          <div className="grid-2">
            {rows.map((f) => <ShelterCard key={f.properties.id} shelter={f} />)}
          </div>
        </div>

        <div className="col gap-3">
          <Card title="Network utilisation" icon={Gauge} accent>
            <GaugeChart
              value={totals.cap ? totals.occ / totals.cap : 0}
              height={190}
              color={totals.occ / totals.cap > 0.9 ? '#f87171' : totals.occ / totals.cap > 0.7 ? '#fbbf24' : '#34d399'}
              label="of total network capacity"
              sublabel={`${fmtInt(totals.occ)} / ${fmtInt(totals.cap)}`}
            />
          </Card>
          <Card title="Pressure alerts" icon={Gauge} subtitle="Fires automatically as you push loads">
            {over.length === 0 && <div className="tiny text-faint">No shelter above 90% — headroom available for the current relocation plan.</div>}
            {over.map((f) => (
              <div key={f.properties.id} className="row between gap-2 mb-2">
                <span className="small">{f.properties.name}</span>
                <Badge tone="red" dot pulse>{Math.round((f.properties.occupancy / f.properties.capacity) * 100)}% — prepare overflow</Badge>
              </div>
            ))}
            <div className="divider" />
            <div className="tiny text-faint">Per the research doc: current site capacity is a clearly labelled simulated value; authorised officials would update real capacities here through the dashboard.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
