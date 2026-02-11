import { useState } from "react";
import type { ToastType } from "~/components/ui/Toast";

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface UseToastOptions {
  initialType?: ToastType;
  initialMessage?: string;
}

export function useToast(options: UseToastOptions = {}) {
  const { initialType = "success", initialMessage = "" } = options;
  const [toast, setToast] = useState<ToastState>({
    message: initialMessage,
    type: initialType,
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = initialType) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return { toast, showToast, hideToast };
}
