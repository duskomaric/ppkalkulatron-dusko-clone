import { useNavigate } from "react-router";
import { Drawer } from "./Drawer";
import { DrawerNavItem } from "./DrawerNavItem";
import {
  BoxesIcon,
  Building2Icon,
  CogIcon,
  CreditCardIcon,
  CurrencyEuroIcon,
  FileTextIcon,
  GripIcon,
  MailIcon,
} from "~/components/ui/icons";
import type { Company } from "~/types/company";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompany: Company | null;
}

function useSubscriptionInfo(company: Company | null) {
  if (!company?.subscription_ends_at) {
    return { isLifetime: true, daysLeft: null, label: "Lifetime" };
  }
  const endDate = new Date(company.subscription_ends_at);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    isLifetime: false,
    daysLeft,
    label: endDate.toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

export function SettingsDrawer({ isOpen, onClose, selectedCompany }: SettingsDrawerProps) {
  const navigate = useNavigate();
  const subInfo = useSubscriptionInfo(selectedCompany);
  const hasSubNotification = !subInfo.isLifetime && subInfo.daysLeft !== null && subInfo.daysLeft < 30;

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Drawer title="Podešavanja" isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className={`relative overflow-hidden rounded-xl transition-all flex items-center gap-3 px-4 py-3 ${
          hasSubNotification
            ? 'bg-gradient-to-r from-red-500/15 via-red-500/10 to-transparent border-l-4 border-red-500'
            : subInfo.isLifetime
              ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-l-4 border-emerald-500'
              : 'bg-[var(--color-surface)] border-l-4 border-[var(--color-border)]'
        }`}>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            hasSubNotification
              ? 'bg-red-500/25 text-red-400'
              : subInfo.isLifetime
                ? 'bg-emerald-500/25 text-emerald-400'
                : 'bg-primary/15 text-primary'
          }`}>
            <BoxesIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Licenca</span>
            <p className={`text-sm font-bold truncate ${
              hasSubNotification
                ? 'text-red-400'
                : subInfo.isLifetime
                  ? 'text-emerald-400'
                  : 'text-[var(--color-text-main)]'
            }`}>
              {subInfo.isLifetime
                ? "Lifetime Plan"
                : hasSubNotification
                  ? `Ističe za ${subInfo.daysLeft} dana`
                  : `Važi do ${subInfo.label}`
              }
            </p>
          </div>
          {subInfo.isLifetime && (
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md shrink-0">
              ∞
            </span>
          )}
          {hasSubNotification && (
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse shrink-0" />
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] px-1 pt-2 pb-1 first:pt-0">
          Zajednička podešavanja
        </p>
        <DrawerNavItem
          onClick={() => goTo("/settings/company")}
          icon={Building2Icon}
          title="Profil kompanije"
          description="Podaci o firmi, adresa i JIB/PIB"
          className="shadow-glow-primary/5"
        />
        <DrawerNavItem
          onClick={() => goTo("/settings/mail")}
          icon={MailIcon}
          title="Mail"
          description="Slanje faktura i fiskalnih računa, SMTP"
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] px-1 pt-4 pb-1">
          Podešavanja dokumenata
        </p>
        <DrawerNavItem
          onClick={() => goTo("/settings/general")}
          icon={CogIcon}
          title="Generalno"
          description="Defaulti dokumenata, numeracija, napomene i štampa"
        />
        <DrawerNavItem
          onClick={() => goTo("/settings/visual")}
          icon={GripIcon}
          title="Vizuelna podešavanja"
          description="Podešavanje menija i rasporeda modula"
        />
        <DrawerNavItem
          onClick={() => goTo("/settings/bank-accounts")}
          icon={CreditCardIcon}
          title="Bankovni računi"
          description="Upravljanje računima za isplatu"
        />
        <DrawerNavItem
          onClick={() => goTo("/settings/currencies")}
          icon={CurrencyEuroIcon}
          title="Valute"
          description="Konfiguracija valuta i formata"
        />
        <DrawerNavItem
          onClick={() => goTo("/settings/fiscal")}
          icon={FileTextIcon}
          title="Fiskalizacija"
          description="OFS ESIR – cloud ili lokalni uređaj"
        />
      </div>
    </Drawer>
  );
}
