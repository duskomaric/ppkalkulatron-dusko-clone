import type { ComponentType } from "react";
import {
  FileTextIcon,
  ContactRoundIcon,
  FileCheckIcon,
  BoxesIcon,
  FileSlidersIcon,
  FileInputIcon
} from "~/components/ui/icons";
import type { CompanyModuleId } from "~/types/company";
import { APP_CONFIG } from "./app";

type NavItem = {
  id: CompanyModuleId;
  icon: ComponentType<{ className?: string }>;
  label: string;
  path: string;
  title: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'quotes', icon: FileSlidersIcon, label: APP_CONFIG.titles.quotes || 'Ponude', path: '/quotes', title: APP_CONFIG.titles.quotes || 'Ponude' },
  { id: 'proformas', icon: FileCheckIcon, label: APP_CONFIG.titles.proformas || 'Predračuni', path: '/proformas', title: APP_CONFIG.titles.proformas || 'Predračuni' },
  { id: 'invoices', icon: FileTextIcon, label: APP_CONFIG.titles.invoices || 'Računi', path: '/invoices', title: APP_CONFIG.titles.invoices || 'Računi' },
  { id: 'clients', icon: ContactRoundIcon, label: APP_CONFIG.titles.clients || 'Klijenti', path: '/clients', title: APP_CONFIG.titles.clients || 'Klijenti' },
  { id: 'articles', icon: BoxesIcon, label: APP_CONFIG.titles.articles || 'Artikli', path: '/articles', title: APP_CONFIG.titles.articles || 'Artikli' },
  { id: 'incomes', icon: FileInputIcon, label: APP_CONFIG.titles.incomes || 'Knjiga prihoda', path: '/income-book', title: APP_CONFIG.titles.incomes || 'Knjiga prihoda' },
];
