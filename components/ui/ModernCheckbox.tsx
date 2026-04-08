"use client";

import React from "react";
import styled from "styled-components";

interface ModernCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const StyledWrapper = styled.div`
  .container {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .container input {
    display: none;
  }

  .container svg {
    overflow: visible;
  }

  .path {
    fill: none;
    stroke: currentColor;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition:
      stroke-dasharray 0.5s ease,
      stroke-dashoffset 0.5s ease;
    stroke-dasharray: 241 9999999;
    stroke-dashoffset: 0;
  }

  .container input:checked ~ svg .path {
    stroke-dasharray: 70.5096664428711 9999999;
    stroke-dashoffset: -262.2723388671875;
  }
`;

const ModernCheckbox: React.FC<ModernCheckboxProps> = ({ checked, onChange, label, className }) => {
  return (
    <StyledWrapper className={className}>
      <label className="container">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange?.(e.target.checked)} 
        />
        <svg viewBox="0 0 64 64" height="1.2em" width="1.2em" className="text-slate-400">
          <path
            d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength="575.0541381835938"
            className="path"
          />
        </svg>
        {label && <span className="text-sm text-slate-600">{label}</span>}
      </label>
    </StyledWrapper>
  );
};

export default ModernCheckbox;
