// src/pages/WorkflowSelect.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bandage, Flame, HeartPulse, Zap, ArrowRight } from 'lucide-react';
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

const WorkflowSelect = () => {
  const navigate = useNavigate();
  const { loadScenario, detect } = useWorkflow();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null); // workflow object
  const [severity, setSeverity] = useState(null);
  const [launching, setLaunching] = useState(false);

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
            Choose manually, or use AR Quick Start to let the marker decide.
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

          {/* Severity panel — appears once a scenario is picked */}
          {picked && (
            <div className="mt-8 animate-slide-up">
              <Card>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                  <div>
                    <p className="label-display">Selected</p>
                    <h3 className="font-display font-bold text-2xl">{picked.name}</h3>
                  </div>
                  <button
                    onClick={() => handleQuickStart(picked.id)}
                    disabled={launching}
                    className="btn-ghost"
                  >
                    <Zap size={16} strokeWidth={2.5} /> AR Quick Start
                  </button>
                </div>

                <p className="label-display mb-3">How severe is it?</p>
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
