import { 
  FileTextIcon, 
  ContactRoundIcon, 
  FileCheckIcon, 
  BoxesIcon, 
  FileSlidersIcon 
} from "~/components/ui/icons";

export const NAV_ITEMS = [
  { id: 'proformas', icon: FileCheckIcon, label: 'Proformas', path: '/proformas', title: 'Proforme' },
  { id: 'quotes', icon: FileSlidersIcon, label: 'Quotes', path: '/quotes', title: 'Ponude' },
  { id: 'invoices', icon: FileTextIcon, label: 'Invoices', path: '/invoices', title: 'Računi' },
  { id: 'clients', icon: ContactRoundIcon, label: 'Clients', path: '/clients', title: 'Klijenti' },
  { id: 'articles', icon: BoxesIcon, label: 'Articles', path: '/articles', title: 'Artikli' },
];
