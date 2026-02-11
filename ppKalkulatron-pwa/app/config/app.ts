export const APP_CONFIG = {
    name: "++Kalkulatron",
    version: "1.0.0",
    titles: {
        login: "Prijava",
        invoices: "Računi",
        clients: "Klijenti",
        articles: "Artikli",
        proformas: "Predračuni",
        quotes: "Ponude",
        settings: "Podešavanja",
        user: "Moj Nalog",
        company: "Izmjena kompanije"
    }
};

export function getPageTitle(titleKey: string): string {
    const pageTitle = (APP_CONFIG.titles as any)[titleKey.toLowerCase()] || titleKey;
    return `${pageTitle} | ${APP_CONFIG.name}`;
}
