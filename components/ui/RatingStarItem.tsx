"use client";

import React from 'react';
import styled from 'styled-components';

interface RatingStarProps {
  checked?: boolean;
  onChange?: () => void;
  className?: string;
}

const StyledWrapper = styled.div`
  .container {
    display: inline-block;
    position: relative;
    cursor: pointer;
    font-size: 20px;
    user-select: none;
    transition: transform 0.2s ease;
  }

  .container:hover {
    transform: scale(1.1);
  }

  .container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    position: relative;
    top: 0;
    left: 0;
    height: 1.3em;
    width: 1.3em;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .container input:checked ~ .checkmark {
    filter: drop-shadow(0 0 5px rgba(255, 180, 0, 0.3));
  }

  .container .checkmark svg {
    fill: #e2e8f0;
    transition: fill 0.3s ease;
  }

  .container input:checked ~ .checkmark svg {
    fill: #ffb400;
  }
`;

const RatingStar: React.FC<RatingStarProps> = ({ checked, onChange, className }) => {
  return (
    <StyledWrapper className={className}>
      <label className="container">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <div className="checkmark">
          <svg viewBox="0 0 256 256">
            <rect fill="none" height="256" width="256" />
            <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.07-31.05-51.06,31.05a16,16,0,0,1-23.84-17.34l13.51-58.6L21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.06,28.06Z" />
          </svg>
        </div>
      </label>
    </StyledWrapper>
  );
};

export default RatingStar;
