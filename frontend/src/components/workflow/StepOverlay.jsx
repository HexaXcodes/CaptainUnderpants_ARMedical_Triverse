// src/components/workflow/StepOverlay.jsx
// Mounted ON TOP of the AR scene. The AR scene fills the viewport;
// this overlay draws controls + step text without blocking the camera.

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, Sparkles, Info, X } from 'lucide-react';
import SeverityBadge from '../common/SeverityBadge';
import { useStepExplanation } from '../../hooks/useStepExplanation';

const StepOverlay = ({
  workflowName,
  severity,
  steps = [],
  currentStep = 0,
  onPrev,
  onNext,
  onExit,
  emergencyNumber = '112',
  callEmergency = false
}) => {
  const step = steps[currentStep];
  const [explainerOpen, setExplainerOpen] = useState(false);

  const { data: explanation, loading: explLoading } = useStepExplanation({
    workflowName,
    severity,
    step
  });

  const total = steps.length;
  const progress = total ? ((currentStep + 1) / total) * 100 : 0;

  return (
    <>
      {/* Top status bar — workflow + severity + exit */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <div className="px-3 py-1.5 bg-bone/90 backdrop-blur border-2 border-ink rounded-lg shadow-brutal-sm flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{workflowName}</span>
          <SeverityBadge severity={severity} />
        </div>
        <button
          onClick={onExit}
          className="w-9 h-9 grid place-items-center bg-bone/90 backdrop-blur border-2 border-ink rounded-lg shadow-brutal-sm hover:bg-bone"
          title="Exit"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Severe — emergency call CTA pinned to top-center */}
      {callEmergency && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <a
            href={`tel:${emergencyNumber}`}
            className="btn-danger animate-pulse-slow"
          >
            <Phone size={18} strokeWidth={3} />
            CALL {emergencyNumber} NOW
          </a>
        </div>
      )}

      {/* Bottom step panel */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5">
        <div className="card-glass p-5 sm:p-6 animate-slide-up">
          {/* Progress */}
          <div className="flex items-center justify-between mb-3">
            <span className="label-display">Step {currentStep + 1} of {total}</span>
            <span className="font-mono text-xs text-ink/60">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step content */}
          {step ? (
            <>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-ink leading-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-ink/80 leading-relaxed">{step.instruction}</p>

              {/* Why this matters — collapsible */}
              <button
                onClick={() => setExplainerOpen((v) => !v)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-primary hover:text-primary-600"
              >
                <Sparkles size={14} strokeWidth={2.5} />
                {explainerOpen ? 'Hide explanation' : 'Why this matters?'}
              </button>

              {explainerOpen && (
                <div className="mt-3 p-4 bg-accent/20 border-2 border-ink rounded-xl">
                  {explLoading && <p className="font-mono text-xs text-ink/60">thinking…</p>}
                  {explanation?.why && (
                    <p className="text-sm text-ink leading-relaxed">{explanation.why}</p>
                  )}
                  {explanation?.warnings?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {explanation.warnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-urgent">
                          <Info size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {explanation?.personalizedNote && (
                    <div className="mt-3 pt-3 border-t border-ink/20">
                      <p className="label-display mb-1">For this patient</p>
                      <p className="text-sm text-ink/80">{explanation.personalizedNote}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-ink/60 font-mono text-sm">No active step.</p>
          )}

          {/* Step nav */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={currentStep === 0}
              className="btn-ghost flex-1"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              Back
            </button>
            <button
              onClick={onNext}
              disabled={currentStep >= total - 1}
              className="btn-primary flex-[2]"
            >
              Next Step
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepOverlay;
