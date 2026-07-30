"use client";

import { Input } from "tdesign-react";
import { SearchIcon } from "tdesign-icons-react";

interface CompassSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CompassSearchBar({
  value,
  onChange,
}: CompassSearchBarProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Input
        value={value}
        onChange={(next) => onChange(typeof next === "string" ? next : "")}
        placeholder="搜索指南、专业或学院…"
        clearable
        size="large"
        prefixIcon={<SearchIcon />}
        className="compass-search-input w-full"
      />
    </div>
  );
}
