const MAP = {
  'Open':                     'badge-open',
  'Assigned':                 'badge-assigned',
  'In Progress':              'badge-inprogress',
  'Pending Customer Response':'badge-pending',
  'Escalated':                'badge-escalated',
  'Resolved':                 'badge-resolved',
  'Closed':                   'badge-closed',
}

export default function StatusBadge({ status }) {
  return <span className={`badge ${MAP[status] || 'badge-closed'}`}>{status}</span>
}
