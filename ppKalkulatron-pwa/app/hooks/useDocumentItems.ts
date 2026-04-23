import { useCallback } from "react";
import type { InvoiceItemInput } from "~/types/invoice";
import type { Client } from "~/types/client";

/**
 * Shared logic for managing document items (invoices, quotes, proformas).
 * Handles item CRUD, totals recalculation, and client selection.
 */
export function useDocumentItems(
  formData: { items: InvoiceItemInput[]; [key: string]: any },
  setFormData: (updater: (prev: any) => any) => void,
  emptyItem: InvoiceItemInput,
  setSelectedClient: (client: Client | null) => void,
) {
  const recalculateTotals = useCallback((items: InvoiceItemInput[]) => {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const taxTotal = items.reduce((s, i) => s + i.tax_amount, 0);
    setFormData(prev => ({ ...prev, items, subtotal, tax_total: taxTotal, total: subtotal + taxTotal }));
  }, [setFormData]);

  const handleItemChange = useCallback((index: number, item: InvoiceItemInput) => {
    const newItems = [...formData.items];
    newItems[index] = item;
    recalculateTotals(newItems);
  }, [formData.items, recalculateTotals]);

  const handleItemRemove = useCallback((index: number) => {
    if (formData.items.length <= 1) return;
    recalculateTotals(formData.items.filter((_, i) => i !== index));
  }, [formData.items, recalculateTotals]);

  const addItem = useCallback(() => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  }, [setFormData, emptyItem]);

  const handleClientChange = useCallback((client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client?.id || 0 }));
  }, [setFormData, setSelectedClient]);

  return { handleItemChange, handleItemRemove, addItem, handleClientChange, recalculateTotals };
}
