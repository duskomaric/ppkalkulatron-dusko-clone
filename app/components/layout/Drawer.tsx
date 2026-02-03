import React from "react";
import { XIcon } from "~/components/ui/icons";

interface DrawerProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ title, children, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-lg bg-[#16161E] rounded-t-[32px] sm:rounded-[24px] shadow-2xl overflow-hidden animate-slide-in-bottom border-t border-white/5">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
