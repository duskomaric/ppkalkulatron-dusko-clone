import React, { useEffect } from "react";
import { XIcon } from "~/components/ui/icons";

interface DrawerProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ title, children, isOpen, onClose }) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-lg bg-[#0B0B0F] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-slide-in-bottom border border-white/10 flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-[#16161E]/50 backdrop-blur-xl sticky top-0 z-10">
          <h2 className="text-base font-black text-white tracking-tight italic">{title}</h2>
          <button 
            onClick={onClose}
            className="cursor-pointer h-8 w-8 flex items-center justify-center bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 pb-24 sm:pb-10">
          {children}
        </div>
      </div>
    </div>
  );
};
