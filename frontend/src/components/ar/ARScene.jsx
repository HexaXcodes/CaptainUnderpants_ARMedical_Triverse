// src/components/ar/ARScene.jsx
// ============================================================================
//  Top-level AR module entry point. Drop this into the host app:
//
//    <ARScene
//      workflow={{ id, name }}
//      severity="mild"
//      currentStep={0}
//      onMarkerFound={(id) => ...}
//      onMarkerLost={(id) => ...}
//      onStepComplete={(stepIndex) => ...}
//    />
//
//  Responsibilities:
//   - Lazy-load A-Frame + AR.js scripts
//   - Gate camera access behind an explicit user tap (mobile autoplay rules)
//   - Mount/unmount the <a-scene> safely (avoids memory leaks on route change)
//   - Forward marker events to parent
// ============================================================================

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Camera, AlertTriangle, Loader2, ScanLine } from 'lucide-react';
import { useArScripts } from './useArScripts';
import MarkerTracker from './MarkerTracker';
import StepRenderer from './StepRenderer';
import { WORKFLOW_TO_MARKER, SCENE_PARAMS, RENDERER_PARAMS } from './arConfig';

// Build the arjs="..." attribute string from config + extra opts
const buildArjsAttr = () => {
  const params = {
    ...SCENE_PARAMS
  };
  return Object.entries(params)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
};

const buildRendererAttr = () =>
  Object.entries(RENDERER_PARAMS)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

const ARScene = ({
  workflow,
  severity,
  currentStep = 0,
  onMarkerFound,
  onMarkerLost,
  onStepComplete
}) => {
  const { ready: scriptsReady, error: scriptError } = useArScripts();
  const [armed, setArmed] = useState(false);   // user has tapped "Start Camera"
  const [cameraError, setCameraError] = useState(null);
  const sceneRef = useRef(null);

  // Resolve which marker to listen for
  const markerKey = useMemo(() => {
    return WORKFLOW_TO_MARKER[workflow?.id] || 'hiro';
  }, [workflow?.id]);

  // Resolve current step from the workflow's step list (if provided)
  const step = useMemo(() => {
    const steps = workflow?.steps || [];
    return steps[currentStep] || null;
  }, [workflow, currentStep]);

  // Probe the camera to surface permission errors clearly to the user.
  // We don't keep this stream — AR.js opens its own. We just fail fast if denied.
  const requestCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // getUserMedia must be triggered by a user gesture on iOS / Android Chrome
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      // Stop our probe track immediately — AR.js will open its own
      stream.getTracks().forEach((t) => t.stop());
      setArmed(true);
    } catch (err) {
      console.error('[AR] Camera permission failed:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Enable it in your browser settings and try again.'
          : err.name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'Could not start the camera. Make sure you are on HTTPS.'
      );
    }
  }, []);

  // Cleanup on unmount: dispose A-Frame scene + stop any rogue camera tracks.
  useEffect(() => {
    return () => {
      // Stop camera streams left attached to <video> elements created by AR.js
      const videos = document.querySelectorAll('video');
      videos.forEach((v) => {
        const stream = v.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((t) => t.stop());
        }
        v.srcObject = null;
      });
      // Detach scene if still in DOM
      const scene = sceneRef.current;
      if (scene && typeof scene.pause === 'function') {
        try { scene.pause(); } catch { /* noop */ }
      }
    };
  }, []);

  const arjsAttr = useMemo(buildArjsAttr, []);
  const rendererAttr = useMemo(buildRendererAttr, []);

  // -----------------------------------------------------------------------
  //  Render gates: scripts loading → permission gate → AR scene
  // -----------------------------------------------------------------------

  if (scriptError) {
    return (
      <ErrorState
        title="AR runtime failed to load"
        message={scriptError.message}
      />
    );
  }

  if (!scriptsReady) {
    return (
      <LoadingState label="Loading AR runtime…" />
    );
  }

  if (!armed) {
    return (
      <PermissionGate
        onArm={requestCamera}
        error={cameraError}
        workflow={workflow}
      />
    );
  }

  // -----------------------------------------------------------------------
  //  Live AR scene
  // -----------------------------------------------------------------------
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <a-scene
        ref={sceneRef}
        embedded
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer={rendererAttr}
        arjs={arjsAttr}
      >
        {/* Asset preload could go here if needed */}
        <a-assets timeout="3000" />

        <MarkerTracker
          markerKey={markerKey}
          onFound={onMarkerFound}
          onLost={onMarkerLost}
        >
          <StepRenderer
            step={step}
            severity={severity}
            totalSteps={(workflow?.steps || []).length}
          />
        </MarkerTracker>

        {/* Default camera entity required by AR.js */}
        <a-entity camera />
      </a-scene>
    </div>
  );
};

// -----------------------------------------------------------------------------
//  Sub-views (kept inline so the AR module ships as a single drop-in)
// -----------------------------------------------------------------------------

const LoadingState = ({ label }) => (
  <div className="absolute inset-0 grid place-items-center bg-black text-white">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="animate-spin" size={28} />
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">
        {label}
      </p>
    </div>
  </div>
);

const ErrorState = ({ title, message }) => (
  <div className="absolute inset-0 grid place-items-center bg-black text-white p-6">
    <div className="max-w-sm text-center space-y-3">
      <AlertTriangle className="mx-auto text-red-400" size={32} />
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-white/70">{message}</p>
      <p className="font-mono text-xs text-white/40 mt-4">
        Reload the page or check your network.
      </p>
    </div>
  </div>
);

const PermissionGate = ({ onArm, error, workflow }) => (
  <div className="absolute inset-0 grid place-items-center bg-black text-white p-6">
    <div className="w-full max-w-sm space-y-4 text-center">
      <div className="w-16 h-16 mx-auto grid place-items-center bg-white/10 border-2 border-white/30 rounded-2xl">
        <Camera size={28} />
      </div>
      <h3 className="font-bold text-2xl">Ready to scan</h3>
      <p className="text-sm text-white/70">
        {workflow?.name
          ? `Point your camera at the marker to start "${workflow.name}".`
          : 'Point your camera at the AR marker.'}
      </p>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-left">
          <AlertTriangle size={16} className="text-red-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}
      <button
        onClick={onArm}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 active:scale-95 transition"
      >
        <ScanLine size={18} />
        Start camera
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        Requires HTTPS · grant camera permission
      </p>
    </div>
  </div>
);

export default ARScene;
