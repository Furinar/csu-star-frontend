"use client";

import React from "react";
import styles from "./ModernCheckbox.module.css";

interface ModernCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const ModernCheckbox: React.FC<ModernCheckboxProps> = ({
  checked,
  onChange,
  label,
  className,
}) => {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <svg
          viewBox="0 0 64 64"
          height="1.2em"
          width="1.2em"
          className="text-slate-400"
        >
          <path
            d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength="575.0541381835938"
            className={styles.path}
          />
        </svg>
        {label && <span className="text-sm text-slate-600">{label}</span>}
      </label>
    </div>
  );
};

export default ModernCheckbox;
