export const PAGE_THEMES: Record<string, string> = {
  "/invoices": "245, 158, 11",  // Amber
  "/clients": "34, 197, 94",    // Green
  "/proformas": "168, 85, 247", // Purple
  "/quotes": "244, 63, 94",   // Rose
  "/articles": "14, 165, 233",    // Blue
  "/": "168, 85, 247",         // Purple (Login)
};

export const DEFAULT_THEME = "34, 197, 94"; // Green

export function getThemeByPath(pathname: string): string {
  // Exact match first
  if (PAGE_THEMES[pathname]) return PAGE_THEMES[pathname];
  
  // Prefix match for nested routes (if any)
  const match = Object.keys(PAGE_THEMES).find(path => pathname.startsWith(path));
  return match ? PAGE_THEMES[match] : DEFAULT_THEME;
}
