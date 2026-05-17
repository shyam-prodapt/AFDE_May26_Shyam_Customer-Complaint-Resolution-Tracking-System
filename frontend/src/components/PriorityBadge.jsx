const MAP = {
  Low:      'badge priority-low',
  Medium:   'badge priority-medium',
  High:     'badge priority-high',
  Critical: 'badge priority-critical',
}

export default function PriorityBadge({ priority }) {
  return <span className={MAP[priority] || 'badge'}>{priority}</span>
}
