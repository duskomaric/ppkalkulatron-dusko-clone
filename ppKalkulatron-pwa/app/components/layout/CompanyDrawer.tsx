import { Drawer } from "./Drawer";
import type { Company } from "~/types/company";

interface CompanyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  selectedCompanyId: number | null;
  onSelect: (company: Company) => void;
}

export function CompanyDrawer({ isOpen, onClose, companies, selectedCompanyId, onSelect }: CompanyDrawerProps) {
  return (
    <Drawer title="Izmjena kompanije" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-2">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => {
              onSelect(company);
              onClose();
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCompanyId === company.id
                ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-black text-xs shadow-glow-primary shrink-0 ${
              selectedCompanyId === company.id
                ? "bg-primary text-white"
                : "bg-[var(--color-border)] text-[var(--color-text-dim)]"
            }`}>
              {company.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-black text-[var(--color-text-main)] leading-none mb-1 truncate">{company.name}</p>
              <p className="text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">VAT: {company.vat_number}</p>
            </div>
          </button>
        ))}
      </div>
    </Drawer>
  );
}
