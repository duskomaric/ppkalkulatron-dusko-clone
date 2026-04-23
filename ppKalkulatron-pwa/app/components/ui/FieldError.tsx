import type { ReactNode } from "react";

interface FieldErrorProps {
  children: ReactNode;
  className?: string;
}

export function FieldError({ children, className = "" }: FieldErrorProps) {
  return (
    <p className={`text-[10px] font-bold text-red-500 ml-1 uppercase tracking-tight ${className}`}>
      {children}
    </p>
  );
}
