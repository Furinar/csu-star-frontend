"use client";

import React from 'react';
import styled from 'styled-components';

interface ActionSubmitButtonProps {
  label: string;
  sentLabel?: string;
  isSent?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const StyledWrapper = styled.div<{ $isSent: boolean }>`
  .button {
    --primary: #334155;
    --neutral-1: #ffffff;
    --radius: 9999px;

    cursor: pointer;
    border-radius: var(--radius);
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s ease;
    min-width: 140px;
    padding: 10px 24px;
    height: 44px;
    font-size: 14px;
    font-weight: 500;
    background: var(--neutral-1);
    color: #0f172a;
    overflow: hidden;
  }

  .button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(15, 23, 42, 0.12);
    border-color: #cbd5e1;
  }

  .button:active:not(:disabled) {
    transform: translateY(0);
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f1f5f9;
  }

  .state {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .state--default {
    transform: ${props => props.$isSent ? 'translateY(-150%)' : 'translateY(0)'};
  }

  .state--sent {
    position: absolute;
    transform: ${props => props.$isSent ? 'translateY(0)' : 'translateY(150%)'};
    color: #10b981;
  }

  .icon svg {
    width: 18px;
    height: 18px;
  }
`;

const ActionSubmitButton: React.FC<ActionSubmitButtonProps> = ({ 
  label, 
  sentLabel = "已完成", 
  isSent = false, 
  onClick, 
  disabled, 
  className,
  type = "button"
}) => {
  return (
    <StyledWrapper $isSent={isSent} className={className}>
      <button 
        className="button" 
        onClick={onClick} 
        disabled={disabled}
        type={type}
      >
        <div className="state state--default">
          <span>{label}</span>
        </div>
        <div className="state state--sent">
          <div className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span>{sentLabel}</span>
        </div>
      </button>
    </StyledWrapper>
  );
};

export default ActionSubmitButton;
