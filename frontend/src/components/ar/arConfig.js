// src/components/ar/arConfig.js
// ============================================================================
//  Single source of truth for AR module configuration.
//  Adjust here only — never hardcode URLs / values inside components.
// ============================================================================

// CDN script URLs.
// Pinned versions for stability — do NOT use "latest".
export const AFRAME_CDN =
  '/lib/aframe.min.js';

export const ARJS_CDN =
  '/lib/aframe-ar.js';

// Marker presets.
// Hiro is the default AR.js training marker — works out of the box.
// Add custom .patt files under public/markers/ and reference them via "url".
export const MARKERS = {
  hiro: { type: 'preset', value: 'hiro' },
  kanji: { type: 'preset', value: 'kanji' },
  wound:   { type: 'pattern', value: '/markers/pattern-wound.patt' },
  burn:    { type: 'pattern', value: '/markers/pattern-burn.patt' },
  cardiac: { type: 'pattern', value: '/markers/pattern-cardiac.patt' }
};

export const WORKFLOW_TO_MARKER = {
  wound_care: 'wound',
  burn_care:  'burn',
  cpr:        'cardiac'
};

// AR.js scene parameters — tuned for mobile stability over fidelity.
export const SCENE_PARAMS = {
  // Lower detection mode = faster, less battery drain
  detectionMode: 'mono_and_matrix',
  matrixCodeType: '3x3',
  // Use webcam (not video file)
  sourceType: 'webcam',
  // Disable verbose AR.js debug UI in production demo
  debugUIEnabled: false,
  // Disable verbose console logs
  trackingMethod: 'best',
  // patternRatio matches what the marker generator produced
  patternRatio: 0.5
};

// Renderer params — keep GPU usage modest.
export const RENDERER_PARAMS = {
  antialias: true,
  alpha: true,
  precision: 'mediump',
  logarithmicDepthBuffer: false
};

// Per-severity color palette for overlays
export const SEVERITY_COLORS = {
  mild:     '#22C55E', // green
  moderate: '#F59E0B', // amber
  severe:   '#EF4444'  // red
};

// Default overlay colors when severity unknown
export const DEFAULT_COLORS = {
  highlight: '#55B0DD',
  arrow:     '#91C0FA',
  text:      '#FFFFFF',
  textBg:    '#0A0F14'
};
