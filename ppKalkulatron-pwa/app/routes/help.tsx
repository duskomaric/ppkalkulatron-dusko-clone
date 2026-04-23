import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { InfoIcon, MailIcon, ChevronDownIcon, ChevronRightIcon } from "~/components/ui/icons";
import { APP_CONFIG } from "~/config/app";

export default function HelpPage() {
    const { selectedCompany } = useAuth();
    const location = useLocation();
    const [expandedProvider, setExpandedProvider] = useState<string | null>("gmail");

    // Handle scroll to hash on load/change
    useEffect(() => {
        const hash = location.hash;
        if (!hash) return;

        const targetId = hash.substring(1);
        let attempts = 0;

        const scrollAttempt = () => {
            const element = document.getElementById(targetId);
            if (element) {
                const headerOffset = 80; // Approximate header height
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
                return true;
            }
            return false;
        };

        // Try immediately and then with intervals
        if (!scrollAttempt()) {
            const interval = setInterval(() => {
                attempts++;
                if (scrollAttempt() || attempts > 15) {
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [location.pathname, location.hash]);

    const toggleProvider = (id: string) => {
        setExpandedProvider(expandedProvider === id ? null : id);
    };

    return (
        <AppLayout
            title="Pomoć"
            selectedCompany={selectedCompany}
            onCompanyChange={() => { }}
        >
            <div className="space-y-8">
                {/* Podrška - Link na početku */}
                <section className="bg-primary/10 border-2 border-primary rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white">
                            <InfoIcon className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black text-[var(--color-text-main)]">Potrebna vam je pomoć?</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-4">
                        Ako imate pitanja, probleme ili trebate dodatnu podršku, kontaktirajte nas putem našeg servisnog sistema.
                    </p>
                    <a
                        href="https://plusplusit.atlassian.net/jira/servicedesk/projects/PPI/queues/custom/1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-glow-primary transition-all cursor-pointer"
                    >
                        <span>Otvori servisni sistem</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </section>

                {/* Uvod */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <InfoIcon className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black text-[var(--color-text-main)]">Dobrodošli u ppKalkulatron</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed">
                        ppKalkulatron je moderni sistem za upravljanje faktura, ponuda, predračuna i klijenata.
                        Omogućava kreiranje dokumenata, upravljanje klijentima i artiklima, fiskalizaciju računa (OFS ESIR) i slanje dokumenata putem maila.
                        Ovaj vodič objašnjava korak po korak kako da podešavate kompaniju, dodajete bankovne račune i valute, te kako da radite s dokumentima i fiskalizacijom.
                    </p>
                </section>

                {/* Početak rada */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Početak rada</h2>
                    <div className="space-y-4">
                        <div id="company-profile" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">1. Profil kompanije – osnovni podaci</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Prvo što trebate uraditi je da popunite podatke o vašoj kompaniji. Idite na <strong>Podešavanja → Profil kompanije</strong>
                                i unesite naziv firme, adresu, JIB/PIB broj, email i telefon. Ovi podaci se ispisuju na svim dokumentima (račun, ponuda, predračun),
                                pa je važno da budu tačni. Nakon unosa kliknite <strong>Sačuvaj Promjene</strong>.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Profil kompanije</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="bank-accounts" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">2. Bankovni računi</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Bankovni računi</strong> dodajte žiro račune na koje klijenti vrše uplate.
                                Za svaki račun unesite naziv banke, broj računa i opciono SWIFT. Opcija <strong>Prikaz na dokumentima</strong> određuje
                                da li se račun ispisuje na PDF-u računa, ponude i predračuna. Prvi dodani račun automatski se prikazuje na dokumentima.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Bankovni računi</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="currencies" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">3. Konfiguracija valuta</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Valute</strong> dodajte valute (npr. BAM, EUR, USD): kod (3 slova), simbol i puni naziv. Jednu valutu označite kao podrazumijevanu (Default);
                                ona će se automatski predlagati pri kreiranju novih ponuda, predračuna i računa. Prva dodana valuta postaje podrazumijevana. Na pojedinačnom dokumentu valutu i dalje možete promijeniti.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Valute</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rad sa klijentima */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Rad sa klijentima</h2>
                    <div className="space-y-4">
                        <div id="clients" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Dodavanje novog klijenta</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Idite na stranicu <strong>Klijenti</strong> i kliknite na dugme <strong>+ Dodaj klijenta</strong>.
                                Popunite naziv (obavezno), email, telefon, adresu i JIB/PIB broj. Klijent sa popunjenim podacima bit će dostupan u odabiru pri kreiranju ponude, predračuna ili računa.
                                Nakon čuvanja možete ga odmah odabrati u novom dokumentu.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Klijenti</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Upravljanje klijentima</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Na listi klijenata možete pretraživati po imenu (min. 3 znaka), filtrirati po statusu (Aktivan/Neaktivan) i uređivati postojeće klijente.
                                Klikom na red otvara se detaljni prikaz gdje možete mijenjati podatke klijenta ili vidjeti sve dokumente vezane za njega.
                                Neaktivan klijent se i dalje prikazuje u listi dokumenata, ali ga možete isključiti iz novih ponuda ako želite.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Lista klijenata</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rad sa artiklima */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Rad sa artiklima</h2>
                    <div className="space-y-4">
                        <div id="articles" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Dodavanje artikla</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Na stranici <strong>Artikli</strong> kliknite <strong>+ Novi artikal</strong> i unesite naziv, opciono opis, cijenu, jedinicu mjere (kom, kg, m, itd.),
                                tip artikla i stopu PDV-a. Artikli se zatim prikazuju u dropdownu pri dodavanju stavki na ponudi, predračunu ili računu;
                                možete pretraživati po nazivu i birati količinu, a cijena i PDV se računaju automatski.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Artikli</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Cjenovne liste</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Za svaki artikal unesete jedinicu mjere (kom, kg, m, itd.), cijenu i stopu PDV-a. Pri kreiranju računa ili ponude
                                birate artikal iz liste i količinu; ukupna cijena i PDV se računaju automatski. Artikli s tipom i porezom olakšavaju konzistentnost dokumenata.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Cjenovne liste</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Knjiga prihoda */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Knjiga prihoda</h2>
                    <div id="income-book-allocation" className="scroll-mt-24">
                        <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Obračun iznosa iz fakture</h3>
                        <p className="text-sm text-[var(--color-text-main)] leading-relaxed">
                            U formi stavke knjige prihoda možete uključiti opciju <strong>Poveži sa fakturom</strong>, odabrati fakturu i unijeti iznos uplate.
                            Zatim kliknite dugme <strong>Izračunaj iznose</strong> da aplikacija pozove API i rasporedi iznose po poljima (usluge, roba, proizvodi, PDV).
                            Nakon obračuna možete ručno korigovati vrijednosti prije konačnog čuvanja stavke.
                        </p>
                    </div>
                </section>

                {/* Kreiranje dokumenata */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Kreiranje dokumenata</h2>
                    <div className="space-y-4">
                        <div id="quotes" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Ponude (Quotes)</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Ponude su preliminarni dokumenti koje šaljete klijentima prije potvrde narudžbe. Idite na <strong>Ponude → + Nova ponuda</strong>,
                                odaberite klijenta iz liste, dodajte stavke (artikle) s količinama i popunite datum i datum važenja („Važi do”).
                                Možete preuzeti PDF ili poslati ponudu mailom. Kada klijent prihvati, konvertujte ponudu u predračun ili direktno u račun — svi podaci se prenose.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Kreiranje ponude</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="proformas" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Predračuni (Proformas)</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Predračuni se koriste kada želite izdati dokument prije izvršenja usluge ili isporuke robe. Kreiraju se kao ponude: odabir klijenta,
                                stavke, datum i dospijeće. Kada je usluga izvršena ili roba isporučena, konvertujte predračun u račun jednim klikom;
                                broj predračuna i sve stavke prelaze na novi račun. Predračun možete i poslati mailom ili preuzeti kao PDF.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Kreiranje predračuna</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="invoices" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Računi (Invoices)</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Računi su finalni dokumenti koji se izdaju nakon izvršenja usluge ili isporuke. Mogu se kreirati direktno (Novi račun) ili konvertovati iz ponude ili predračuna.
                                Na računu možete preuzeti PDF, poslati ga mailom i, ako je podešena fiskalizacija (OFS ESIR), izvršiti fiskalizaciju i štampati. Za stornirani račun koristi se opcija Refundacija.
                                Filtriranje po statusu (Kreiran, Fiskaliziran, Storniran) i po načinu plaćanja olakšava pregled.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Kreiranje računa</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fiskalizacija */}
                <section id="fiscalization" className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] scroll-mt-24">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Fiskalizacija - OFS ESIR</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Podešavanje fiskalnog uređaja</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Fiskalizacija</strong> konfigurišete povezivanje sa OFS ESIR fiskalnim uređajem. Sistem podržava <strong>Cloud</strong> (uređaj preko pos.ofs.ba) i <strong>Lokalni</strong> (uređaj na vašoj mreži).
                                Nakon unosa Base URL-a, API ključa i ostalih parametara možete testirati konekciju i zatim fiskalizovati račune direktno iz aplikacije te štampati original ili kopiju.
                            </p>
                            <div className="space-y-3 mb-3">
                                <div className="bg-[var(--color-page-bg)] rounded-xl p-3 border border-[var(--color-border)]">
                                    <p className="text-xs font-bold text-[var(--color-text-main)] mb-1">Cloud mod</p>
                                    <p className="text-xs text-[var(--color-text-main)]">
                                        Za cloud mod potrebno je unijeti: Base URL, API Key, Serijski broj i PAK.
                                        Uređaj mora biti povezan na internet i dostupan preko cloud servisa.
                                    </p>
                                </div>
                                <div className="bg-[var(--color-page-bg)] rounded-xl p-3 border border-[var(--color-border)]">
                                    <p className="text-xs font-bold text-[var(--color-text-main)] mb-1">Lokalni mod</p>
                                    <p className="text-xs text-[var(--color-text-main)]">
                                        Za lokalni mod potrebno je unijeti: Base URL (IP adresa uređaja) i API Key.
                                        Sistem može automatski skenirati lokalnu mrežu da pronađe uređaj.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Fiskalizacija</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Skeniranje lokalne mreže</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Ako koristite lokalni mod, sistem može automatski pronaći OFS ESIR uređaj na vašoj mreži. Kliknite <strong>Skeniraj mrežu</strong>;
                                aplikacija pretražuje dostupne uređaje i kada ga pronađe, možete ga odabrati i automatski popuniti Base URL. Korisno ako ne znate tačnu IP adresu uređaja.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Skeniranje mreže</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Testiranje konekcije</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Prije fiskalizacije preporučujemo testiranje konekcije. Dugmad <strong>Test Attention</strong> i <strong>Test Status</strong> provjeravaju
                                da li je uređaj dostupan i da li je API ključ ispravan. Ako testovi prolaze, možete sigurno fiskalizovati račune i štampati.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Testiranje konekcije</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Podešavanje mail servera (SMTP) */}
                <section id="mail-setup" className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] scroll-mt-24">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black text-[var(--color-text-main)]">Podešavanje mail servera (SMTP)</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-6">
                        Da biste slali fakture i druge dokumente direktno iz aplikacije s vaše email adrese, u <strong>Podešavanja → Mail</strong> konfigurišete SMTP server:
                        adresa i ime pošiljaoca, host (npr. smtp.gmail.com), port, korisničko ime i app lozinku. Bez podešenog SMTP-a aplikacija može koristiti sistemsku konfiguraciju.
                        Ispod su uputstva po provajderu (Gmail, Outlook, Yahoo, iCloud) za generisanje app lozinke.
                    </p>

                    <div className="space-y-3">
                        {/* Gmail Accordion */}
                        <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleProvider("gmail")}
                                className="w-full flex items-center justify-between p-4 bg-[var(--color-page-bg)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                            >
                                <span className="text-sm font-black text-primary uppercase tracking-widest italic flex items-center gap-2">
                                    Gmail
                                </span>
                                {expandedProvider === "gmail" ? <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-dim)]" /> : <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />}
                            </button>
                            {expandedProvider === "gmail" && (
                                <div className="p-5 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-3 text-sm text-[var(--color-text-main)] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p>1. Prijavite se na vaš <a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Account</a> i otvorite sekciju <strong>Security</strong>.</p>
                                    <p>2. Osigurajte da je opcija <strong>2-Step Verification</strong> uključena (On).</p>
                                    <p>3. Otvorite: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com/apppasswords</a>.</p>
                                    <p>4. U polje <strong>App name</strong> upišite <strong>{APP_CONFIG.name}</strong> i kliknite <strong>Create</strong>.</p>
                                    <p>5. Dobit ćete 16 znakova. Tu lozinku unesite u polje <strong>SMTP lozinka</strong> u aplikaciji (bez razmaka).</p>
                                    <div className="mt-2 text-xs text-[var(--color-text-dim)] bg-[var(--color-page-bg)] p-3 rounded-xl border border-dashed border-[var(--color-border)]">
                                        <strong>Parametri:</strong> Host: <code className="text-primary">smtp.gmail.com</code> | Port: <code className="text-primary">587</code> | Enkripcija: <code className="text-primary">TLS</code>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Outlook Accordion */}
                        <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleProvider("outlook")}
                                className="w-full flex items-center justify-between p-4 bg-[var(--color-page-bg)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                            >
                                <span className="text-sm font-black text-primary uppercase tracking-widest italic">
                                    Outlook / Office365
                                </span>
                                {expandedProvider === "outlook" ? <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-dim)]" /> : <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />}
                            </button>
                            {expandedProvider === "outlook" && (
                                <div className="p-5 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-3 text-sm text-[var(--color-text-main)] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p>1. Prijavite se na <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Security</a>.</p>
                                    <p>2. Odaberite <strong>Advanced security options</strong>.</p>
                                    <p>3. Potražite sekciju <strong>App passwords</strong> i kliknite na <strong>Create a new app password</strong>.</p>
                                    <p>4. Kopirajte generisanu lozinku u polje <strong>SMTP lozinka</strong> u aplikaciji.</p>
                                    <div className="mt-2 text-xs text-[var(--color-text-dim)] bg-[var(--color-page-bg)] p-3 rounded-xl border border-dashed border-[var(--color-border)]">
                                        <strong>Parametri:</strong> Host: <code className="text-primary">smtp.office365.com</code> | Port: <code className="text-primary">587</code> | Enkripcija: <code className="text-primary">TLS</code>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Yahoo Accordion */}
                        <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleProvider("yahoo")}
                                className="w-full flex items-center justify-between p-4 bg-[var(--color-page-bg)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                            >
                                <span className="text-sm font-black text-primary uppercase tracking-widest italic">
                                    Yahoo
                                </span>
                                {expandedProvider === "yahoo" ? <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-dim)]" /> : <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />}
                            </button>
                            {expandedProvider === "yahoo" && (
                                <div className="p-5 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-3 text-sm text-[var(--color-text-main)] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p>1. Idi na <strong>Account Security</strong> u postavkama vašeg Yahoo naloga.</p>
                                    <p>2. Klikni na <strong>Generate app password</strong>.</p>
                                    <p>3. Odaberi <strong>Other App</strong> i upiši <strong>{APP_CONFIG.name}</strong>.</p>
                                    <p>4. Kopirajte dobijenu lozinku u aplikaciju.</p>
                                    <div className="mt-2 text-xs text-[var(--color-text-dim)] bg-[var(--color-page-bg)] p-3 rounded-xl border border-dashed border-[var(--color-border)]">
                                        <strong>Parametri:</strong> Host: <code className="text-primary">smtp.mail.yahoo.com</code> | Port: <code className="text-primary">587</code> | Enkripcija: <code className="text-primary">TLS</code>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* iCloud Accordion */}
                        <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleProvider("icloud")}
                                className="w-full flex items-center justify-between p-4 bg-[var(--color-page-bg)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                            >
                                <span className="text-sm font-black text-primary uppercase tracking-widest italic">
                                    iCloud
                                </span>
                                {expandedProvider === "icloud" ? <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-dim)]" /> : <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />}
                            </button>
                            {expandedProvider === "icloud" && (
                                <div className="p-5 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-3 text-sm text-[var(--color-text-main)] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p>1. Prijavite se na <a href="https://appleid.apple.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">appleid.apple.com</a>.</p>
                                    <p>2. U sekciji <strong>Sign-In and Security</strong> odaberite <strong>App-Specific Passwords</strong>.</p>
                                    <p>3. Kliknite na <strong>Generate an app-specific password</strong> i unesite <strong>{APP_CONFIG.name}</strong>.</p>
                                    <p>4. Kopirajte generisanu lozinku u polje <strong>SMTP lozinka</strong> u aplikaciji.</p>
                                    <div className="mt-2 text-xs text-[var(--color-text-dim)] bg-[var(--color-page-bg)] p-3 rounded-xl border border-dashed border-[var(--color-border)]">
                                        <strong>Parametri:</strong> Host: <code className="text-primary">smtp.mail.me.com</code> | Port: <code className="text-primary">587</code> | Enkripcija: <code className="text-primary">TLS</code>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Generalna podešavanja */}
                <section id="general-settings" className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] scroll-mt-24">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Generalna podešavanja</h2>
                    <div className="space-y-4">
                        <div id="stampa-racuna" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Štampa računa</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Generalno → Štampa računa</strong> podešavate dizajn dokumenata (šablon), podrazumijevani broj dana za rok plaćanja računa,
                                predračuna i važenja ponude, te jezik dokumenata. Odabrani šablon i podrazumijevana valuta (iz Valuta) koriste se pri kreiranju novih dokumenata;
                                po potrebi ih možete promijeniti na samom dokumentu.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Štampa računa</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Šablon dokumenta i valuta</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Generalno</strong> možete odabrati šablon koji će se koristiti za štampanje dokumenata.
                                Sistem podržava više šablona, a možete odabrati onaj koji najbolje odgovara vašim potrebama.
                            </p>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                <strong>Napomena:</strong> Valuta za dokumente se određuje preko Currency modela.
                                U <strong>Podešavanja → Valute</strong> označite jednu valutu kao "Default" i ona će se automatski koristiti
                                prilikom kreiranja novih dokumenata. Možete promijeniti valutu za svaki dokument pojedinačno prilikom kreiranja.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Generalna podešavanja</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="numeration" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Numeracija dokumenata</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Generalno → Numeracija</strong> podešavate format brojeva za račun, predračun i ponudu. Format je tipa prefiks-broj/godina (npr. INV-1/2025);
                                ako prefiks nije unesen, koristi se samo broj/godina. Možete uključiti reset brojača godišnje, broj nula (padding), prefikse po vrstama dokumenata i početne brojeve.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Numeracija</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="menu-settings" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Podešavanje Menija</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Vizuelna podešavanja</strong> odaberete koji moduli (Računi, Ponude, Predračuni, Klijenti, Artikli) želite u glavnom donjem meniju — najviše 4.
                                Ostali moduli ostaju dostupni u fioci „Dokumenti” ili u drawer navigaciji. Redoslijed možete mijenjati prevlačenjem.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Podešavanje menija</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="notes" className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Napomene</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Generalno → Napomene</strong> možete postaviti podrazumijevani tekst napomene koji će se automatski unositi na novim računima, ponudama i predračunima.
                                Korisno je za instrukcije za plaćanje, žiro račune, rokove ili opće uslove. Na pojedinačnom dokumentu napomenu i dalje možete uređivati ili ostaviti praznu.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest italic">Vizuelni prikaz: Napomene</p>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Uskoro</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:hidden aspect-[9/16] bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Mobile</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku mobilne verzije</p>
                                    </div>
                                    <div className="hidden md:flex aspect-video bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
                                        <InfoIcon className="h-8 w-8 text-[var(--color-text-dim)] mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)] mb-1">Desktop</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] opacity-60 italic">Placeholder za sliku desktop verzije</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Savjeti i najbolje prakse */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Savjeti i najbolje prakse</h2>
                    <div className="space-y-3">
                        <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-main)] mb-2">✓ Redovno ažurirajte podatke</p>
                            <p className="text-xs text-[var(--color-text-main)]">
                                Povremeno provjeravajte i ažurirajte podatke o kompaniji, klijentima i artiklima
                                kako biste osigurali tačnost dokumenata.
                            </p>
                        </div>
                        <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-main)] mb-2">✓ Koristite artikle umjesto ručnog unosa</p>
                            <p className="text-xs text-[var(--color-text-main)]">
                                Kreiranje artikala omogućava brže kreiranje dokumenata i konzistentnost cijena kroz sistem.
                            </p>
                        </div>
                        <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-main)] mb-2">✓ Testirajte fiskalizaciju prije produkcije</p>
                            <p className="text-xs text-[var(--color-text-main)]">
                                Uvijek testirajte konekciju sa fiskalnim uređajem prije nego što počnete sa stvarnim fiskalizacijama.
                            </p>
                        </div>
                        <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-main)] mb-2">✓ Koristite konverziju dokumenata</p>
                            <p className="text-xs text-[var(--color-text-main)]">
                                Umjesto kreiranja novog dokumenta, koristite opciju konverzije iz ponude u predračun ili račun
                                kako biste sačuvali sve podatke i ubrzali proces.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Kontakt i podrška */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Kontakt i podrška</h2>
                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-4">
                        Ako imate pitanja ili problema, možete nas kontaktirati putem našeg servisnog sistema.
                        Naš tim će vam rado pomoći da riješite sve probleme i maksimalno iskoristite funkcionalnosti aplikacije.
                    </p>
                    <a
                        href="https://plusplusit.atlassian.net/jira/servicedesk/projects/PPI/queues/custom/1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-glow-primary transition-all cursor-pointer"
                    >
                        <span>Otvori servisni sistem</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </section>
            </div>
        </AppLayout>
    );
}
