import React from "react";
import { PlusIcon } from "./icons";

export interface CreateButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function CreateButton({ label, onClick, icon: Icon = PlusIcon, className = "" }: CreateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-wider shadow-glow-primary transition-all active:scale-[0.98] cursor-pointer ${className}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}
