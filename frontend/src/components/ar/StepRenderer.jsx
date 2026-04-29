// src/components/ar/StepRenderer.jsx
// ============================================================================
//  Picks which overlays to render for the current step.
//  Decoupled from MarkerTracker so it can be reused inside any marker.
// ============================================================================

import { HighlightCircle, DirectionalArrow, FloatingText, StepBadge } from './OverlayObjects';
import { SEVERITY_COLORS, DEFAULT_COLORS } from './arConfig';

/**
 * @param {Object}  props
 * @param {Object}  props.step      One step from the workflow:
 *   { id, title, instruction, highlightPosition, objectPosition, color }
 * @param {string}  props.severity  'mild' | 'moderate' | 'severe'
 * @param {number}  props.totalSteps
 */
const StepRenderer = ({ step, severity, totalSteps }) => {
  if (!step) return null;

  // Color resolution priority: explicit step.color → severity color → default
  const accent =
    step.color ||
    SEVERITY_COLORS[severity] ||
    DEFAULT_COLORS.highlight;

  // Severe scenarios get an alert-red highlight regardless of step.color,
  // unless the step explicitly overrides.
  const highlightColor = step.color || (severity === 'severe' ? SEVERITY_COLORS.severe : accent);

  return (
    <a-entity>
      <HighlightCircle
        position={step.highlightPosition || '0 0.01 0'}
        color={highlightColor}
        radius={0.6}
      />
      <DirectionalArrow
        position={step.objectPosition || '0 0.6 0'}
        color={accent}
      />
      <StepBadge
        position="0 2.0 0"
        number={step.id || '?'}
        color={accent}
      />
      <FloatingText
        position="0 1.4 0"
        text={step.title || ''}
      />
    </a-entity>
  );
};

export default StepRenderer;
