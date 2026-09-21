import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

/* Generic sortable table.
   columns: [{ key, label, numeric, render(row), width, sortValue(row) }] */
export default function DataTable({ columns, rows, rowKey, onRowClick, selectedKey, emptyText = 'No records match the current filters.', dense }) {
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const val = (r) => (col?.sortValue ? col.sortValue(r) : r[col?.key]);
    return [...rows].sort((a, b) => {
      const x = val(a); const y = val(b);
      if (x == null) return 1; if (y == null) return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir;
      return String(x).localeCompare(String(y)) * sort.dir;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  if (!rows?.length) {
    return <div className="empty">{emptyText}</div>;
  }

  return (
    <div className="table-wrap" style={dense ? { maxHeight: 420, overflowY: 'auto' } : undefined}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`${c.numeric ? 'num' : ''} ${c.sortable === false ? '' : 'sortable'}`}
                style={c.width ? { width: c.width } : undefined}
                onClick={c.sortable === false ? undefined : () => toggleSort(c.key)}
              >
                <span className={`row gap-1 ${c.numeric ? 'center' : ''}`}>
                  {c.label}
                  {c.sortable === false ? null : sort.key === c.key
                    ? (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
                    : <ArrowUpDown size={10} style={{ opacity: 0.4 }} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => {
            const key = rowKey ? rowKey(r, idx) : r.id;
            return (
              <tr
                key={key}
                className={`${onRowClick ? 'clickable' : ''} ${selectedKey === key ? 'selected' : ''}`}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.numeric ? 'num' : ''}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
