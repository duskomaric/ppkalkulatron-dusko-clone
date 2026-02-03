import React from "react";

export type BadgeColor = "green" | "gray" | "red" | "amber" | "blue";

interface StatusBadgeProps {
    label: string;
    color: BadgeColor;
    className?: string;
}

export function StatusBadge({ label, color, className = "" }: StatusBadgeProps) {
    const colorClasses = {
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    return (
        <span
            className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border backdrop-blur-md ${colorClasses[color]} ${className}`}
        >
            {label}
        </span>
    );
}
