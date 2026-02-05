import React from "react";

export type BadgeColor = "green" | "gray" | "red" | "amber" | "blue";

interface StatusBadgeProps {
    label: string;
    color: BadgeColor;
    className?: string;
}

export function StatusBadge({ label, color, className = "" }: StatusBadgeProps) {
    const colorClasses = {
        green: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
        gray: "bg-[var(--color-gray)]/10 text-[var(--color-gray)] border-[var(--color-gray)]/20",
        red: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
        amber: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
        blue: "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20",
    };

    return (
        <span
            className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border backdrop-blur-md ${colorClasses[color]} ${className}`}
        >
            {label}
        </span>
    );
}
