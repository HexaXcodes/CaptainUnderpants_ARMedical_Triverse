// src/pages/ARExperience.jsx
//
// This page is intentionally minimal — it's just the AR container + overlay.
// The AR engineer will replace <ARScene /> with the AR.js implementation.
// Don't add UI here — extend StepOverlay or the contexts instead.

import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ARScene from '../components/ar/ARScene';
import StepOverlay from '../components/workflow/StepOverlay';
import { useWorkflow } from '../context/WorkflowContext';

const ARExperience = () => {
  const {
    selectedWorkflow,
    selectedSeverity,
    activeScenario,
    currentStep,
    nextStep,
    prevStep,
    reset
  } = useWorkflow();
  const navigate = useNavigate();

  // If user landed here without a scenario, bounce back
  if (!activeScenario) return <Navigate to="/workflow" replace />;

  // Lock body scroll while AR is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleExit = () => {
    reset();
    navigate('/workflow');
  };

  // Optional callback the real AR scene can fire — left here for the AR team.
  const handleMarkerFound = (markerId) => {
    // hook-up point: AR engineer can call this when an AR marker is detected.
    // For now it's a no-op — the scenario is already loaded via context.
    // console.log('marker detected:', markerId);
  };

  return (
    <div className="ar-container fixed inset-0 bg-ink overflow-hidden">
      {/* AR layer — replace with real AR.js implementation */}
      <ARScene
        workflow={selectedWorkflow}
        severity={selectedSeverity}
        currentStep={currentStep}
        steps={activeScenario.steps}
        onMarkerFound={handleMarkerFound}
        onStepComplete={nextStep}
      />

      {/* Overlay UI */}
      <StepOverlay
        workflowName={activeScenario.workflowName}
        severity={selectedSeverity}
        steps={activeScenario.steps}
        currentStep={currentStep}
        onPrev={prevStep}
        onNext={nextStep}
        onExit={handleExit}
        callEmergency={!!activeScenario.callEmergency}
        emergencyNumber={activeScenario.emergencyNumber || '112'}
      />
    </div>
  );
};

export default ARExperience;
