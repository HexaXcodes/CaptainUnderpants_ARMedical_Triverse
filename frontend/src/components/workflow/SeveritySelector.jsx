// src/components/workflow/SeveritySelector.jsx
const OPTIONS = [
  { id: 'mild',     label: 'Mild',     desc: 'I can handle this',         color: 'bg-emerald-200' },
  { id: 'moderate', label: 'Moderate', desc: 'Need some guidance',         color: 'bg-amber-200' },
  { id: 'severe',   label: 'Severe',   desc: 'Emergency — call now',      color: 'bg-urgent text-white' }
];

const SeveritySelector = ({ available = ['mild','moderate','severe'], value, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {OPTIONS.filter((o) => available.includes(o.id)).map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={[
              'text-left p-4 border-2 border-ink rounded-xl transition',
              active
                ? `${opt.color} shadow-brutal translate-x-[-2px] translate-y-[-2px]`
                : 'bg-white/70 backdrop-blur-md shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px]'
            ].join(' ')}
          >
            <div className="font-display font-bold text-lg">{opt.label}</div>
            <div className="text-xs font-mono uppercase tracking-wider opacity-80 mt-1">{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
};

export default SeveritySelector;
