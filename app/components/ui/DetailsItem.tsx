import React from "react";

interface DetailsItemProps {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string | null | undefined | boolean;
    color?: string;
}

export function DetailsItem({ icon: Icon, label, value, color }: DetailsItemProps) {
    return (
        <div className="flex items-center gap-2.5 p-2 bg-white/5 rounded-xl border border-white/5">
            <div className={`h-7 w-7 ${color || 'bg-primary/10 text-primary'} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
                <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-0.5">{label}</p>
                <p className="text-[10px] font-bold text-white truncate italic leading-none">
                    {typeof value === 'boolean' ? (value ? 'Aktivan' : 'Neaktivan') : (value || '-')}
                </p>
            </div>
        </div>
    );
}
