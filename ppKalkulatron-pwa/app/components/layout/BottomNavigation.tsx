import { Link, useLocation } from "react-router";
import type { NAV_ITEMS } from "~/config/navigation";

interface BottomNavigationProps {
  items: (typeof NAV_ITEMS[0] & { isDrawerTrigger?: boolean })[];
  onDrawerOpen: () => void;
}

export function BottomNavigation({ items, onDrawerOpen }: BottomNavigationProps) {
  const location = useLocation();

  if (items.length === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 flex justify-center pointer-events-auto">
      <nav className="bg-[var(--color-glass)] backdrop-blur-2xl border border-[var(--color-border-strong)] rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-around gap-2 sm:gap-4 w-full max-w-md sm:max-w-lg">
        {items.map((item, index) => {
          const isActive = !item.isDrawerTrigger && location.pathname === item.path;
          const Icon = item.icon;

          const content = (
            <>
              <div className={`relative p-2 sm:p-2.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary/25 shadow-glow-primary ring-1 ring-primary/40' : 'bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)]'}`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isActive ? 'text-primary' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)]'}`} />
                {isActive && <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse-slow pointer-events-none" />}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 sm:block max-w-[64px] sm:max-w-none truncate text-center ${isActive ? 'text-primary' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)]'}`}>
                {item.title}
              </span>
            </>
          );

          let element;
          if (item.isDrawerTrigger) {
            element = (
              <button
                key={item.id}
                onClick={onDrawerOpen}
                title={item.title}
                className="cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110"
              >
                {content}
              </button>
            );
          } else {
            element = (
              <Link
                key={item.id}
                to={item.path}
                title={item.title}
                className={`cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'scale-110 sm:scale-125 -translate-y-1' : 'hover:scale-110'}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={item.id} className="flex items-center gap-2 sm:gap-4">
              {element}
              {item.isDrawerTrigger && index === 0 && items.length > 1 && (
                <div className="h-8 sm:h-10 w-[1px] bg-[var(--color-border-strong)] mx-1 sm:mx-2 opacity-50" />
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
