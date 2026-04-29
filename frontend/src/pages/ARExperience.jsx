// src/pages/ARExperience.jsx
//
// This page is intentionally minimal — it's just the AR container + overlay.
// The AR engineer will replace <ARScene /> with the AR.js implementation.
// Don't add UI here — extend StepOverlay or the contexts instead.

import { useEffect, useState } from 'react';
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
  const [cameraStarted, setCameraStarted] = useState(false);
  const [markerStatus, setMarkerStatus] = useState({ found: false, id: null });

  // Lock body scroll while AR is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // If user landed here without a scenario, bounce back
  if (!activeScenario) return <Navigate to="/workflow" replace />;

  const handleExit = () => {
    reset();
    navigate('/workflow');
  };

  // Optional callback the real AR scene can fire — left here for the AR team.
  const handleMarkerFound = (markerId) => {
    setMarkerStatus({ found: true, id: markerId });
    // hook-up point: AR engineer can call this when an AR marker is detected.
    // For now it's a no-op — the scenario is already loaded via context.
    // console.log('marker detected:', markerId);
  };

  const handleMarkerLost = (markerId) => {
    setMarkerStatus({ found: false, id: markerId });
  };

  return (
    <div className="ar-container fixed inset-0 bg-transparent overflow-hidden" style={{ zIndex: 2 }}>
      {/* AR layer — replace with real AR.js implementation */}
      <ARScene
        workflow={selectedWorkflow}
        severity={selectedSeverity}
        currentStep={currentStep}
        steps={activeScenario.steps}
        onMarkerFound={handleMarkerFound}
        onMarkerLost={handleMarkerLost}
        onStepComplete={nextStep}
        onCameraStarted={() => setCameraStarted(true)}
        onExit={handleExit}
      />

      {/* Overlay UI */}
      {cameraStarted && (
        <>
          <div className="fixed top-4 left-4 z-[10000] px-3 py-2 bg-bone/90 backdrop-blur border-2 border-ink rounded-lg shadow-brutal-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              {markerStatus.found ? '✓ Marker locked' : 'Point at HIRO marker'}
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink">
              {selectedWorkflow?.name || 'AR ready'}
            </p>
          </div>

          {/* Show recommendations immediately — AR overlay tracks the marker but
              the guide panel is always visible so the medic doesn't need to hold
              the marker perfectly steady to read the steps. */}
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
        </>
      )}
    </div>
  );
};

export default ARExperience;
