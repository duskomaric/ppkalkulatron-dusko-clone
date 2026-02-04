import React from "react";

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
    return (
        <div className="py-20 text-center bg-[#16161E]/40 border border-dashed border-white/5 rounded-2xl">
            <Icon className="h-8 w-8 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{message}</p>
        </div>
    );
}
