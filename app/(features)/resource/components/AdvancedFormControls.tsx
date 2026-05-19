"use client";

import React from "react";
import styled from "styled-components";

const StyledWrapper = styled.div`
  .input-group {
    position: relative;
    width: 100%;
  }

  .input {
    width: 100%;
    border: solid 1.5px #6b7280; /* 深灰色 */
    border-radius: 1rem;
    background: none;
    padding: 1rem;
    font-size: 1rem;
    color: #111827;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input::placeholder {
    color: transparent;
    transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input:focus::placeholder {
    color: #9ca3af;
  }

  .input.has-value::placeholder {
    color: transparent;
  }

  .user-label {
    position: absolute;
    left: 15px;
    color: #6b7280;
    pointer-events: none;
    transform: translateY(1rem);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    background-color: transparent;
  }

  .input:focus {
    outline: none;
    border-color: var(--first-color, #8b5cf6);
  }

  .input:focus ~ .user-label,
  .input.has-value ~ .user-label {
    transform: translateY(-50%) scale(0.8);
    background-color: #fff;
    padding: 0 0.2em;
  }

  .input:focus ~ .user-label {
    color: var(--first-color, #8b5cf6);
  }

  /* 下拉选单离右侧更远 */
  select.input {
    appearance: none;
    padding-right: 3.75rem;
    cursor: pointer;
    background-image: url('data:image/svg+xml;utf8,<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 6.75L9 11.25L13.5 6.75" fill="none" stroke="%236b7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    background-repeat: no-repeat;
    background-position: right 1.15rem center;
    background-size: 1rem 1rem;
  }

  textarea.input {
    min-height: 120px;
    resize: vertical;
  }

  /* 修复：使用 SVG 背景做拉伸把手，确保可以明显显示 */
  textarea.input::-webkit-resizer {
    background-color: transparent;
    background-image: url('data:image/svg+xml;utf8,<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><g stroke="%239ca3af" stroke-width="1.5" stroke-linecap="round"><path d="M10 14L14 10M6 14L14 6" /></g></svg>');
    background-repeat: no-repeat;
    background-position: bottom 4px right 4px;
    background-size: 14px 14px;
  }

  @media (max-width: 640px) {
    .input {
      border-radius: 0.875rem;
      padding: 0.875rem 0.875rem 0.8rem;
      font-size: 0.95rem;
    }

    .user-label {
      left: 14px;
      transform: translateY(0.92rem);
      font-size: 0.875rem;
    }

    select.input {
      padding-right: 3.25rem;
      background-position: right 0.95rem center;
    }

    textarea.input {
      min-height: 108px;
    }
  }
`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const AdvancedInput: React.FC<InputProps> = ({ label, className, value, ...props }) => {
  return (
    <StyledWrapper className={className}>
      <div className="input-group">
        <input
          {...props}
          value={value}
          className={`input ${value ? "has-value" : ""}`}
        />
        <label className="user-label">{label}</label>
      </div>
    </StyledWrapper>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: React.ReactNode;
}

export const AdvancedSelect: React.FC<SelectProps> = ({ label, className, value, children, ...props }) => {
  return (
    <StyledWrapper className={className}>
      <div className="input-group">
        <select
          {...props}
          value={value}
          className={`input has-value`}
        >
          {children}
        </select>
        <label className="user-label">
          {label}
        </label>
      </div>
    </StyledWrapper>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: React.ReactNode;
}

export const AdvancedTextarea: React.FC<TextareaProps> = ({ label, className, value, ...props }) => {
  return (
    <StyledWrapper className={className}>
      <div className="input-group">
        <textarea
          {...props}
          value={value}
          className={`input ${value ? "has-value" : ""}`}
        />
        <label className="user-label">{label}</label>
      </div>
    </StyledWrapper>
  );
};

const UnderlineStyledWrapper = styled.div`
  .input-group {
    position: relative;
    width: 100%;
  }

  .input-underline {
    width: 100%;
    border: none;
    border-bottom: solid 1.5px #d1d5db;
    border-radius: 0;
    background: transparent;
    padding: 0.75rem 0.25rem;
    font-size: 1rem;
    color: #111827;
    transition: border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input-underline::placeholder {
    color: transparent;
    transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input-underline:focus::placeholder {
    color: #9ca3af;
  }

  .input-underline.has-value::placeholder {
    color: transparent;
  }

  .input-underline:focus {
    outline: none;
    border-bottom-color: var(--first-color, #8b5cf6);
  }

  .input-underline:disabled {
    border-bottom-color: #e5e7eb;
  }

  .user-label {
    position: absolute;
    left: 0;
    color: #6b7280;
    pointer-events: none;
    transform: translateY(0.75rem);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    background-color: transparent;
  }

  .input-underline:focus ~ .user-label,
  .input-underline.has-value ~ .user-label {
    transform: translateY(-50%) scale(0.8);
    background-color: #fff;
    padding: 0 0.2em;
  }

  .input-underline:focus ~ .user-label {
    color: var(--first-color, #8b5cf6);
  }
`;

interface UnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const UnderlineInput: React.FC<UnderlineInputProps> = ({ label, className, value, ...props }) => {
  return (
    <UnderlineStyledWrapper className={className}>
      <div className="input-group">
        <input
          {...props}
          value={value}
          className={`input-underline ${value ? "has-value" : ""}`}
        />
        <label className="user-label">{label}</label>
      </div>
    </UnderlineStyledWrapper>
  );
};
