import { useState, useCallback } from "react";
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

  const showToast = useCallback((message: string, type: ToastType = initialType) => {
    setToast({ message, type, isVisible: true });
  }, [initialType]);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
