// src/pages/WorkflowSelect.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bandage, Flame, HeartPulse, Zap, ArrowRight, ClipboardList } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/common/Card';
import WorkflowCard from '../components/workflow/WorkflowCard';
import SeveritySelector from '../components/workflow/SeveritySelector';
import ErrorMsg from '../components/common/ErrorMsg';
import Spinner from '../components/common/Spinner';
import { workflowService } from '../services/workflowService';
import { useWorkflow } from '../context/WorkflowContext';

const ICONS = {
  wound_care: Bandage,
  burn_care:  Flame,
  cpr:        HeartPulse
};

// Symptom questions per workflow. Each answer maps to a severity score:
//   0 = mild, 1 = moderate, 2 = severe
const ASSESSMENT_QUESTIONS = {
  burn_care: [
    {
      q: 'How large is the burned area?',
      options: [
        { label: 'Smaller than my palm',       score: 0 },
        { label: 'About the size of my palm',  score: 1 },
        { label: 'Larger than my palm',        score: 2 },
      ]
    },
    {
      q: 'What does the burn look like?',
      options: [
        { label: 'Red and painful (like sunburn)',        score: 0 },
        { label: 'Blistered or very swollen',             score: 1 },
        { label: 'White, brown, or charred — or no pain', score: 2 },
      ]
    },
    {
      q: 'Where is the burn located?',
      options: [
        { label: 'Arm, leg, or torso',                         score: 0 },
        { label: 'Near a joint (knee, elbow, shoulder)',        score: 1 },
        { label: 'Face, hands, feet, groin, or airway area',   score: 2 },
      ]
    },
  ],
  wound_care: [
    {
      q: 'Is the bleeding under control with pressure?',
      options: [
        { label: 'Yes — bleeding has slowed',       score: 0 },
        { label: 'Partially — still oozing a lot',  score: 1 },
        { label: 'No — bleeding heavily or spurting', score: 2 },
      ]
    },
    {
      q: 'How deep does the wound appear?',
      options: [
        { label: 'Shallow scratch or scrape',     score: 0 },
        { label: 'Cuts through skin into tissue', score: 1 },
        { label: 'Very deep — bone or muscle visible', score: 2 },
      ]
    },
    {
      q: 'Is there an object embedded in the wound?',
      options: [
        { label: 'No',                            score: 0 },
        { label: 'Small debris (gravel, glass)',  score: 1 },
        { label: 'Large object still in wound',   score: 2 },
      ]
    },
  ],
  cpr: [
    {
      q: 'Is the person responsive?',
      options: [
        { label: 'Yes — responds to voice',            score: 0 },
        { label: 'Barely — moaning, confused',         score: 1 },
        { label: 'No — unconscious, not breathing',    score: 2 },
      ]
    },
    {
      q: 'Is the person breathing normally?',
      options: [
        { label: 'Yes — normal breathing',      score: 0 },
        { label: 'Irregular or gasping',        score: 1 },
        { label: 'No breathing detected',       score: 2 },
      ]
    },
    {
      q: 'Do they have a pulse?',
      options: [
        { label: 'Yes — strong pulse',    score: 0 },
        { label: 'Weak or irregular',     score: 1 },
        { label: 'No pulse detected',     score: 2 },
      ]
    },
  ],
};

// Map total score across 3 questions to a severity label
function scoreToSeverity(total, available) {
  let level;
  if (total <= 1)      level = 'mild';
  else if (total <= 3) level = 'moderate';
  else                 level = 'severe';

  // Fall back to closest available if the detected level isn't offered
  if (available.includes(level)) return level;
  if (level === 'mild'     && available.includes('moderate')) return 'moderate';
  if (level === 'severe'   && available.includes('moderate')) return 'moderate';
  return available[0] || 'mild';
}

// ─── Severity Assessment Modal ───────────────────────────────────────────────
const SeverityAssessment = ({ workflowId, available, onDone, onSkip }) => {
  const questions = ASSESSMENT_QUESTIONS[workflowId] || [];
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const step = answers.findIndex((a) => a === null);
  const done = step === -1;

  const pick = (qIdx, option) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = option;
      return next;
    });
  };

  const handleConfirm = () => {
    const total = answers.reduce((s, a) => s + (a?.score ?? 0), 0);
    onDone(scoreToSeverity(total, available));
  };

  if (questions.length === 0) {
    onSkip();
    return null;
  }

  const currentQ = questions[step === -1 ? questions.length - 1 : step];
  const currentIdx = step === -1 ? questions.length - 1 : step;

  return (
    <div className="mt-8 animate-slide-up">
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <ClipboardList size={18} className="text-primary" strokeWidth={2.5} />
          <p className="label-display">Quick Severity Check</p>
          <span className="ml-auto font-mono text-xs text-ink/50">
            {Math.min(currentIdx + 1, questions.length)} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentIdx + (done ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        {!done ? (
          <>
            <h3 className="font-display font-bold text-lg mb-4">{currentQ.q}</h3>
            <div className="space-y-2">
              {currentQ.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => pick(currentIdx, opt)}
                  className="w-full text-left px-4 py-3 border-2 border-ink/20 rounded-xl hover:border-primary hover:bg-primary/5 transition font-mono text-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="font-display font-bold text-lg mb-1">All done!</p>
            <p className="text-sm text-ink/70 mb-5">
              Based on your answers, we've estimated the severity. You can adjust it below before launching.
            </p>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-mono shrink-0">Q{i + 1}</span>
                  <span className="text-ink/80">{answers[i]?.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={onSkip} className="btn-ghost text-sm">
                Set manually
              </button>
              <button onClick={handleConfirm} className="btn-primary">
                Use detected severity
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </>
        )}

        {!done && (
          <div className="mt-4 flex justify-between">
            <button onClick={onSkip} className="btn-ghost text-sm">
              Skip — set manually
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const WorkflowSelect = () => {
  const navigate = useNavigate();
  const { loadScenario, detect } = useWorkflow();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [launching, setLaunching] = useState(false);
  // 'assess' | 'manual' — which panel to show after picking a workflow
  const [panel, setPanel] = useState('assess');

  useEffect(() => {
    workflowService.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const availableSeverities = useMemo(() => picked?.severities || [], [picked]);

  const handlePick = (wf) => {
    setPicked(wf);
    setSeverity(wf.severities?.[0] || null);
    setPanel('assess');
  };

  const handleAssessmentDone = (detectedSeverity) => {
    setSeverity(detectedSeverity);
    setPanel('manual');
  };

  const handleLaunch = async () => {
    if (!picked || !severity) return;
    setLaunching(true);
    try {
      await loadScenario(picked.id, severity);
      navigate('/ar');
    } catch (err) {
      setError(err.message || 'Could not load scenario.');
    } finally {
      setLaunching(false);
    }
  };

  const handleQuickStart = async (wfId) => {
    setLaunching(true);
    try {
      await detect(wfId);
      navigate('/ar');
    } catch (err) {
      setError(err.message || 'Quick start failed.');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-display mb-2">Scenarios</p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl leading-[0.95]">
            Pick a <span className="text-primary">situation</span>.
          </h1>
          <p className="text-ink/70 mt-2">
            Answer 3 quick questions to auto-detect severity, or set it manually.
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner label="loading scenarios…" />
      ) : (
        <>
          <ErrorMsg className="mb-4">{error}</ErrorMsg>

          {/* Workflow grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((wf, idx) => (
              <WorkflowCard
                key={wf.id}
                icon={ICONS[wf.id] || Zap}
                name={wf.name}
                description={wf.description}
                severities={wf.severities}
                accent={idx % 2 === 0 ? 'primary' : 'accent'}
                onClick={() => handlePick(wf)}
              />
            ))}
          </div>

          {/* Assessment or manual severity panel */}
          {picked && panel === 'assess' && (
            <SeverityAssessment
              workflowId={picked.id}
              available={availableSeverities}
              onDone={handleAssessmentDone}
              onSkip={() => setPanel('manual')}
            />
          )}

          {picked && panel === 'manual' && (
            <div className="mt-8 animate-slide-up">
              <Card>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                  <div>
                    <p className="label-display">Selected</p>
                    <h3 className="font-display font-bold text-2xl">{picked.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPanel('assess')}
                      className="btn-ghost text-sm"
                    >
                      <ClipboardList size={15} strokeWidth={2.5} /> Re-assess
                    </button>
                    <button
                      onClick={() => handleQuickStart(picked.id)}
                      disabled={launching}
                      className="btn-ghost"
                    >
                      <Zap size={16} strokeWidth={2.5} /> AR Quick Start
                    </button>
                  </div>
                </div>

                <p className="label-display mb-3">Severity</p>
                <SeveritySelector
                  available={availableSeverities}
                  value={severity}
                  onChange={setSeverity}
                />

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleLaunch}
                    disabled={!severity || launching}
                    className="btn-primary"
                  >
                    {launching ? 'Launching…' : 'Launch AR'}
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
};

export default WorkflowSelect;
