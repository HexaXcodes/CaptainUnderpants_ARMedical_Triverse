// src/components/common/SeverityBadge.jsx
const STYLES = {
  mild:     'bg-emerald-200 text-emerald-900',
  moderate: 'bg-amber-200 text-amber-900',
  severe:   'bg-urgent text-white'
};

const SeverityBadge = ({ severity, className = '' }) => {
  if (!severity) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 border-2 border-ink rounded-md font-mono text-[10px] uppercase tracking-[0.2em] ${STYLES[severity] || 'bg-ink/10'} ${className}`}
    >
      {severity}
    </span>
  );
};

export default SeverityBadge;
