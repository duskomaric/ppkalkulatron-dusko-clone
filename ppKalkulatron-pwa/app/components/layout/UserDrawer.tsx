import { useNavigate } from "react-router";
import { Drawer } from "./Drawer";
import {UserIcon, InfoIcon, LogOutIcon} from "~/components/ui/icons";
import type { User } from "~/types/user";

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

export function UserDrawer({ isOpen, onClose, user, onLogout }: UserDrawerProps) {
  const navigate = useNavigate();

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Drawer title="Moj nalog" isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-2xl mb-4 border border-[var(--color-border)] relative overflow-hidden">
        <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-glow-primary shrink-0 z-10">
          {user?.first_name[0]}{user?.last_name[0]}
        </div>
        <div className="z-10">
          <p className="font-black text-base text-[var(--color-text-main)] leading-tight italic tracking-tight">{user?.first_name} {user?.last_name}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mt-0.5">{user?.email}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <button
          onClick={() => goTo("/profile")}
          className="w-full text-left p-3.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-all flex items-center gap-3 border border-transparent hover:border-[var(--color-border)] group cursor-pointer"
        >
          <div className="h-7 w-7 bg-[var(--color-border)] rounded-lg flex items-center justify-center text-[var(--color-text-dim)] group-hover:text-primary transition-colors">
            <UserIcon className="h-4 w-4" />
          </div>
          Moj Profil
        </button>
        <button
          onClick={() => goTo("/help")}
          className="w-full text-left p-3.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-all flex items-center gap-3 border border-transparent hover:border-[var(--color-border)] group cursor-pointer"
        >
          <div className="h-7 w-7 bg-[var(--color-border)] rounded-lg flex items-center justify-center text-[var(--color-text-dim)] group-hover:text-primary transition-colors">
            <InfoIcon className="h-4 w-4" />
          </div>
          Pomoć
        </button>
        <button
          onClick={onLogout}
          className="w-full text-left p-3.5 text-xs font-black uppercase tracking-widest text-red-500/80 hover:text-red-500 hover:bg-red-400/5 rounded-xl transition-all flex items-center gap-3 border border-transparent hover:border-red-500/20 group cursor-pointer"
        >
          <div className="h-7 w-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 transition-colors">
            <LogOutIcon className="h-4 w-4" />
          </div>
          Odjavi se
        </button>
      </div>
    </Drawer>
  );
}
