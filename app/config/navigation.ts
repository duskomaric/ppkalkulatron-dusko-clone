import {
  FileTextIcon,
  ContactRoundIcon,
  FileCheckIcon,
  BoxesIcon,
  FileSlidersIcon
} from "~/components/ui/icons";
import { APP_CONFIG } from "./app";

export const NAV_ITEMS = [
  { id: 'proformas', icon: FileCheckIcon, label: APP_CONFIG.titles.proformas || 'Predračuni', path: '/proformas', title: APP_CONFIG.titles.proformas || 'Predračuni' },
  { id: 'quotes', icon: FileSlidersIcon, label: APP_CONFIG.titles.quotes || 'Ponude', path: '/quotes', title: APP_CONFIG.titles.quotes || 'Ponude' },
  { id: 'invoices', icon: FileTextIcon, label: APP_CONFIG.titles.invoices || 'Računi', path: '/invoices', title: APP_CONFIG.titles.invoices || 'Računi' },
  { id: 'clients', icon: ContactRoundIcon, label: APP_CONFIG.titles.clients || 'Klijenti', path: '/clients', title: APP_CONFIG.titles.clients || 'Klijenti' },
  { id: 'articles', icon: BoxesIcon, label: APP_CONFIG.titles.articles || 'Artikli', path: '/articles', title: APP_CONFIG.titles.articles || 'Artikli' },
];
