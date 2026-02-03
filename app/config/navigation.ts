import {
  FileTextIcon,
  ContactRoundIcon,
  FileCheckIcon,
  BoxesIcon,
  FileSlidersIcon
} from "~/components/ui/icons";
import { APP_CONFIG } from "./app";

export const NAV_ITEMS = [
  { id: 'proformas', icon: FileCheckIcon, label: 'Proformas', path: '/proformas', title: APP_CONFIG.titles.proformas || 'Proforme' },
  { id: 'quotes', icon: FileSlidersIcon, label: 'Quotes', path: '/quotes', title: APP_CONFIG.titles.quotes || 'Ponude' },
  { id: 'invoices', icon: FileTextIcon, label: 'Invoices', path: '/invoices', title: APP_CONFIG.titles.invoices },
  { id: 'clients', icon: ContactRoundIcon, label: 'Clients', path: '/clients', title: APP_CONFIG.titles.clients },
  { id: 'articles', icon: BoxesIcon, label: 'Articles', path: '/articles', title: APP_CONFIG.titles.articles },
];
