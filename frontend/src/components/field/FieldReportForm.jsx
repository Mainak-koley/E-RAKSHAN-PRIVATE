import { useState } from 'react';
import { MapPin, Send } from 'lucide-react';
import { TextInput, TextArea, SelectInput } from '../common/Inputs';
import Button from '../common/Button';
import { INCIDENT_TYPES, SEVERITIES } from '../../constants/layers';
import { MAP_CENTER } from '../../constants/layers';

const DEFAULT_CENTER = { lat: MAP_CENTER[0], lng: MAP_CENTER[1] };

export default function FieldReportForm({ onSubmit, defaultCenter = DEFAULT_CENTER }) {
  const [form, setForm] = useState({
    type: 'Flooded Road', severity: 'high', description: '', location_name: '',
    coordinates: [defaultCenter.lng, defaultCenter.lat],
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Describe what you observe — this drives verification.';
    if (!form.location_name.trim()) errs.location_name = 'Pin a landmark name.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(form);
    setForm((f) => ({ ...f, description: '', location_name: '' }));
  };

  const jitter = () => set('coordinates', [
    defaultCenter.lng + (Math.random() - 0.5) * 0.05,
    defaultCenter.lat + (Math.random() - 0.5) * 0.05,
  ]);

  return (
    <div>
      <div className="grid-2">
        <SelectInput
          label="Incident type"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          options={INCIDENT_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <SelectInput
          label="Severity"
          value={form.severity}
          onChange={(e) => set('severity', e.target.value)}
          options={Object.entries(SEVERITIES).map(([k, v]) => ({ value: k, label: v.label }))}
        />
      </div>
      <TextInput
        label="Location name"
        placeholder="e.g. Bridge near Kambalakkad junction"
        value={form.location_name}
        onChange={(e) => set('location_name', e.target.value)}
        hint={errors.location_name}
      />
      <TextArea
        label="Observation"
        rows={3}
        placeholder="Bridge approach is under ~40cm of water; buses turning back…"
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        hint={errors.description}
      />
      <div className="row between gap-2">
        <span className="tiny text-faint row gap-2"><MapPin size={12} /> GPS: {form.coordinates[1].toFixed(4)}°N {form.coordinates[0].toFixed(4)}°E</span>
        <span className="row gap-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={jitter}>Move pin nearby</button>
        </span>
      </div>
      <Button variant="primary" block className="mt-3" icon={Send} onClick={submit}>Submit field report</Button>
      <div className="tiny text-faint mt-2">Reports enter the queue as UNVERIFIED with source confidence 0.9 (field officer). Verification raises the OSIRIS confidence score.</div>
    </div>
  );
}
