export const PAGE_THEMES: Record<string, string> = {
    // Entry
    "/": "139, 92, 246",                  // Violet – Login / entry

    // Business core
    "/invoices": "245, 158, 11",          // Amber – money / invoices
    "/clients": "34, 197, 94",            // Green – people / partners
    "/proformas": "236, 72, 153",         // Pink – pre-documents
    "/quotes": "239, 68, 68",             // Red – offers / urgency
    "/articles": "59, 130, 246",          // Blue – products / services

    // Settings (teal → blue family, iste ali različite)
    "/settings/general": "20, 184, 166",        // Teal
    "/settings/company": "14, 165, 233",        // Sky Blue
    "/settings/bank-accounts": "56, 189, 248",  // Light Blue
    "/settings/currencies": "45, 212, 191",     // Aqua
    "/settings/fiscal": "13, 148, 136",         // Deep Teal

    // Profile
    "/profile": "99, 102, 241",            // Indigo – personal space
};


export const DEFAULT_THEME = "34, 197, 94"; // Green

export function getThemeByPath(pathname: string): string {
  // Exact match first
  if (PAGE_THEMES[pathname]) return PAGE_THEMES[pathname];
  
  // Prefix match for nested routes (if any)
  const match = Object.keys(PAGE_THEMES).find(path => pathname.startsWith(path));
  return match ? PAGE_THEMES[match] : DEFAULT_THEME;
}
