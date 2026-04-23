import { useEffect } from "react";
import type { ReactNode } from "react";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  backdropClassName?: string;
  contentClassName?: string;
  zIndexClassName?: string;
  closeOnBackdrop?: boolean;
}

export function ModalShell({
  isOpen,
  onClose,
  children,
  overlayClassName = "flex items-center justify-center p-4",
  backdropClassName = "bg-black/60",
  contentClassName = "",
  zIndexClassName = "z-[1100]",
  closeOnBackdrop = true,
}: ModalShellProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClassName} ${overlayClassName}`.trim()}>
      <div
        className={`absolute inset-0 ${backdropClassName}`.trim()}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div className={`relative z-10 ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
