// src/components/ar/OverlayObjects.jsx
// ============================================================================
//  Reusable A-Frame overlay primitives that can sit inside an <a-marker>.
//
//  Each primitive is a tiny wrapper around <a-entity> that emits the right
//  geometry/material props. Keeping these as React components means the AR
//  scene markup stays declarative and easy to read.
// ============================================================================

import { DEFAULT_COLORS } from './arConfig';

// ---------- HighlightCircle ------------------------------------------------
//  Pulsing ring that draws attention to a point on the marker.
export const HighlightCircle = ({
  position = '0 0.01 0',
  radius = 0.6,
  color = DEFAULT_COLORS.highlight,
  pulse = true
}) => (
  <a-entity position={position}>
    <a-ring
      color={color}
      radius-inner={radius * 0.85}
      radius-outer={radius}
      rotation="-90 0 0"
      material={`opacity: 0.85; transparent: true; shader: flat; color: ${color}`}
    >
      {pulse && (
        <a-animation
          attribute="scale"
          from="1 1 1"
          to="1.25 1.25 1.25"
          dur="900"
          direction="alternate"
          repeat="indefinite"
          easing="ease-in-out-sine"
        />
      )}
    </a-ring>
  </a-entity>
);

// ---------- DirectionalArrow ----------------------------------------------
//  3D arrow pointing at a target spot. Hover-floats to feel alive.
export const DirectionalArrow = ({
  position = '0 0.6 0',
  rotation = '0 0 0',
  color = DEFAULT_COLORS.arrow,
  bob = true
}) => (
  <a-entity position={position} rotation={rotation}>
    {/* Shaft */}
    <a-cylinder
      color={color}
      height="0.6"
      radius="0.06"
      position="0 0 0"
      material={`shader: flat; color: ${color}`}
    />
    {/* Tip */}
    <a-cone
      color={color}
      height="0.3"
      radius-bottom="0.16"
      radius-top="0"
      position="0 -0.45 0"
      rotation="180 0 0"
      material={`shader: flat; color: ${color}`}
    />
    {bob && (
      <a-animation
        attribute="position"
        from={position}
        to={`${position.split(' ')[0]} ${parseFloat(position.split(' ')[1]) + 0.15} ${position.split(' ')[2]}`}
        dur="1100"
        direction="alternate"
        repeat="indefinite"
        easing="ease-in-out-sine"
      />
    )}
  </a-entity>
);

// ---------- FloatingText ---------------------------------------------------
//  Text panel that hovers above the marker. Includes a backing plane so the
//  text reads against any environment.
export const FloatingText = ({
  position = '0 1.4 0',
  text = '',
  color = DEFAULT_COLORS.text,
  bgColor = DEFAULT_COLORS.textBg,
  width = 3.2
}) => (
  <a-entity position={position} look-at="[camera]">
    {/* Backing plane */}
    <a-plane
      width={width}
      height="0.55"
      color={bgColor}
      material={`opacity: 0.85; transparent: true; shader: flat; color: ${bgColor}`}
    />
    {/* Border accent */}
    <a-plane
      width={width + 0.06}
      height="0.61"
      color={DEFAULT_COLORS.highlight}
      position="0 0 -0.001"
      material={`opacity: 0.55; transparent: true; shader: flat; color: ${DEFAULT_COLORS.highlight}`}
    />
    <a-text
      value={text}
      align="center"
      color={color}
      width={width * 1.6}
      position="0 0 0.01"
      wrap-count="40"
      anchor="center"
      baseline="center"
    />
  </a-entity>
);

// ---------- StepBadge ------------------------------------------------------
//  Small 3D tile showing the current step number above the marker.
export const StepBadge = ({
  position = '0 2.0 0',
  number = 1,
  color = DEFAULT_COLORS.highlight
}) => (
  <a-entity position={position} look-at="[camera]">
    <a-circle
      radius="0.32"
      color={color}
      material={`shader: flat; color: ${color}`}
    />
    <a-text
      value={`${number}`}
      align="center"
      color="#FFFFFF"
      width="3"
      position="0 0 0.01"
      anchor="center"
      baseline="center"
    />
  </a-entity>
);
