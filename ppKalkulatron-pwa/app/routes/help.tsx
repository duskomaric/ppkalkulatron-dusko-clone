import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { InfoIcon } from "~/components/ui/icons";

export default function HelpPage() {
    const { selectedCompany } = useAuth();

    return (
        <AppLayout
            title="Pomoć"
            selectedCompany={selectedCompany}
            onCompanyChange={() => {}}
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
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-glow-primary transition-all"
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
                        Ovaj vodič će vam pomoći da brzo počnete sa radom i maksimalno iskoristite sve funkcionalnosti aplikacije.
                    </p>
                </section>

                {/* Početak rada */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Početak rada</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">1. Podešavanje profila kompanije</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Prvo što trebate uraditi je da popunite podatke o vašoj kompaniji. Idite na <strong>Podešavanja → Profil kompanije</strong> 
                                i unesite sve potrebne informacije: naziv, adresu, JIB/PIB broj, kontakt podatke.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Profil kompanije</p>
                                <div className="w-full rounded-lg overflow-hidden border border-[var(--color-border)]">
                                    <picture>
                                        <source
                                            media="(min-width: 768px)"
                                            srcSet="/images/desktop_company-profile.jpg"
                                        />
                                        <img
                                            src="/images/mobile_company-profile.jpg"
                                            alt="Profil kompanije"
                                            className="w-full h-auto object-cover"
                                        />
                                    </picture>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">2. Dodavanje bankovnih računa</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U sekciji <strong>Podešavanja → Bankovni računi</strong> dodajte račune na koje klijenti mogu vršiti uplate. 
                                Možete dodati više računa i označiti jedan kao podrazumijevani.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Bankovni računi</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">3. Konfiguracija valuta</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Valute</strong> možete dodati valute koje koristite u poslovanju. 
                                Sistem podržava više valuta, a možete označiti jednu kao podrazumijevanu (Default). 
                                <strong> Podrazumijevana valuta će se automatski koristiti</strong> prilikom kreiranja novih ponuda, predračuna i računa.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Valute</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rad sa klijentima */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Rad sa klijentima</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Dodavanje novog klijenta</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Idite na stranicu <strong>Klijenti</strong> i kliknite na dugme <strong>+ Dodaj klijenta</strong>. 
                                Popunite sve potrebne podatke: naziv, email, telefon, adresu, JIB/PIB broj. 
                                Nakon što sačuvate, klijent će biti dostupan za korišćenje u svim dokumentima.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Dodavanje klijenta</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Upravljanje klijentima</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Na listi klijenata možete pretraživati, filtrirati i uređivati postojeće klijente. 
                                Klikom na klijenta otvara se detaljni prikaz gdje možete vidjeti sve dokumente vezane za tog klijenta.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Lista klijenata</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rad sa artiklima */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Rad sa artiklima</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Dodavanje artikla</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Na stranici <strong>Artikli</strong> možete dodati proizvode ili usluge koje prodajete. 
                                Za svaki artikal unesite naziv, opis, cijenu, jedinicu mjere (kom, kg, m, itd.) i stopu PDV-a. 
                                Artikli se automatski koriste prilikom kreiranja faktura, ponuda i predračuna.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Dodavanje artikla</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Cjenovne liste</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Za svaki artikal možete definirati više cijena (npr. standardna, popust, VIP cijena). 
                                Ove cijene se mogu koristiti u različitim situacijama prilikom kreiranja dokumenata.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Cjenovne liste</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Kreiranje dokumenata */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Kreiranje dokumenata</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Ponude (Quotes)</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Ponude su preliminarni dokumenti koje šaljete klijentima prije potvrde narudžbe. 
                                Idite na <strong>Ponude → + Nova ponuda</strong>, odaberite klijenta, dodajte artikle i popunite sve potrebne podatke. 
                                Ponuda može biti konvertovana u predračun ili račun.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Kreiranje ponude</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Predračuni (Proformas)</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Predračuni se koriste kada želite da izdate dokument prije izvršenja usluge ili isporuke robe. 
                                Kreiraju se slično kao ponude, a mogu biti konvertovani u račun kada je usluga izvršena.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Kreiranje predračuna</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Računi (Invoices)</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Računi su finalni dokumenti koji se izdaju nakon izvršenja usluge ili isporuke robe. 
                                Mogu se kreirati direktno ili konvertovati iz ponude/predračuna. 
                                Računi se mogu fiskalizovati ako je konfigurisan OFS ESIR uređaj.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Kreiranje računa</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fiskalizacija */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Fiskalizacija - OFS ESIR</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Podešavanje fiskalnog uređaja</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                U <strong>Podešavanja → Fiskalizacija</strong> možete konfigurisati povezivanje sa OFS ESIR fiskalnim uređajem. 
                                Sistem podržava dva moda: <strong>Cloud</strong> i <strong>Lokalni</strong>.
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
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Fiskalizacija podešavanja</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Skeniranje lokalne mreže</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Ako koristite lokalni mod, sistem može automatski pronaći uređaj na vašoj lokalnoj mreži. 
                                Kliknite na dugme <strong>Skeniraj mrežu</strong> i sistem će pretražiti dostupne uređaje. 
                                Kada se uređaj pronađe, možete ga odabrati i automatski popuniti Base URL.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Skeniranje mreže</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Testiranje konekcije</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Prije korišćenja, preporučujemo da testirate konekciju sa uređajem. 
                                Koristite dugmad <strong>Test Attention</strong> i <strong>Test Status</strong> da provjerite 
                                da li je uređaj dostupan i da li API key radi ispravno.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Testiranje konekcije</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Generalna podešavanja */}
                <section className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h2 className="text-lg font-black text-[var(--color-text-main)] mb-4">Generalna podešavanja</h2>
                    <div className="space-y-4">
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
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Generalna podešavanja</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-2">Numeracija dokumenata</h3>
                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed mb-3">
                                Sistem automatski generiše brojeve za sve dokumente. Možete konfigurisati format numeracije 
                                i početni broj u generalnim podešavanjima.
                            </p>
                            <div className="bg-[var(--color-page-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-dim)] mb-2">Screenshot: Numeracija</p>
                                <div className="w-full h-48 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                                    <span className="text-[var(--color-text-dim)] text-sm">Screenshot će biti dodat ovdje</span>
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
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-glow-primary transition-all"
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
