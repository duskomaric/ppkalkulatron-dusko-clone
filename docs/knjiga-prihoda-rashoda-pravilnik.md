# Usklađenost s Pravilnikom (Sl. glasnik RS 98/15) i plan za Knjigu rashoda

## Izvor

Pravilnik o sadržaju i načinu vođenja knjiga i evidencija i pravila za usklađivanje prihoda i rashoda od samostalne djelatnosti (1.12.2015., Službeni glasnik RS br. 98/15).  
Član 11: obveznik vodi **knjigu prihoda** i **knjigu rashoda** (uz knjigu stalnih sredstva i knjigu potraživanja i obaveza) pri principu jednostavnog knjigovodstva.  
Član 2: prihodi se priznaju u periodu kada su **stvarno naplaćeni**, rashodi u periodu kada su **plaćeni**.

---

## 1. Analiza: Knjiga prihoda vs Prilog 1 Pravilnika

### 1.1 Prilog 1 – službene kolone Knjige prihoda

| Br. | Naziv kolone |
|-----|----------------|
| 1   | Red. br. |
| 3   | Datum knjiženja |
| 4   | Opis promjene (naziv, broj i datum dokumenta za knjiženje) |
| 5   | Naplaćeni prihodi od prodaje |
| 6   | Naplaćeni ostali prihodi |
| 7   | Naplaćeni finansijski prihodi |
| 8   | Ukupno naplaćeni prihodi |
| 9   | Obračunati proizvoda robe usluga (PDV) |
| 10  | PDV (ili isti sadržaj kao 9) |
| -   | Doneseno stanje / Ukupno za prenos |

### 1.2 Trenutna implementacija (aplikacija + PDF)

| Pravilnik | Aplikacija / baza | PDF | Status |
|-----------|-------------------|-----|--------|
| Red. br. | `entry_number` | Red. br. | ✓ |
| Datum knjiženja | `booking_date` | Datum knjiž. | ✓ |
| Opis promjene | `description` | Opis promjene | ✓ |
| Naplaćeni prihodi od prodaje | Rasparčano na: `amount_services`, `amount_goods`, `amount_products` | Usluge (4a), Roba (4b), Proizvodi (4c) | ✓ (detaljnije od minimuma) |
| Naplaćeni ostali prihodi | `amount_other_income` | Naplaćeni ostali prihodi | ✓ |
| Naplaćeni finansijski prihodi | `amount_financial_income` | Naplaćeni fin. prihodi | ✓ |
| Ukupno naplaćeni prihodi | `total_amount` | Ukupno naplaćeni prihodi | ✓ |
| Obračunati PDV / PDV | `vat_amount` | Obračunati PDV (jedna kolona) | ✓ (kod obveznika PDV-a; jedna kolona za PDV je prihvatljivo) |
| - | `payment_date`, `bank_account_id`, `invoice_id` | - | ✓ dopunski podaci za naplatu |

### 1.3 Zaključak za Knjigu prihoda

- **Usklađenost:** Knjiga prihoda je u skladu s Pravilnikom.
- Prihodi od prodaje su detaljno podijeljeni na Usluge / Robu / Proizvodi (više od minimuma iz Priloga 1).
- Svi obavezni elementi (redni broj, datum knjiženja, opis, naplaćeni prihodi po vrstama, ukupno, PDV) su pokriveni.
- PDF može imati na početku stranice blok „Osnovni podaci o obvezniku / radnji” (ime, JMB, adresa, naziv, djelatnost, šifra, JIB) kao u Prilogu 1 – opcionalno poboljšanje za izgled.

---

## 2. Plan za Knjigu rashoda (Prilog 2 Pravilnika)

### 2.1 Prilog 2 – kolone Knjige rashoda

| Br. | Naziv kolone | Napomena |
|-----|----------------|----------|
| 1   | Red. br. | |
| 3   | Datum knjiženja | |
| 4   | Opis promjene (naziv, broj i datum dokumenta) | |
| 5   | **Plaćeni rashodi – Nabavna vrijednost proizvoda, robe i učinka** | Član 6 |
| 6   | **Plaćeni rashodi – Materijal, gorivo i energija** | |
| 7   | **Plaćeni rashodi – Bruto zarade, naknade i ostali lični rashodi** | |
| 8   | **Plaćeni rashodi – Proizvodne usluge** | |
| 9   | **Plaćeni rashodi – Ostali rashodi (osim manjkova)** | |
| 10  | **Plaćeni rashodi – Finansijski rashodi** | Član 4 (kamate) |
| 11  | Amortizacija | |
| 12  | Manjak zaliha | Član 8, 9 |
| 13  | Ulazni PDV | |
| 14  | **Ukupno rashodi koji se priznaju** | |
| 15  | **Rashodi koji se ne priznaju** | Član 3 (npr. nevezani za djelatnost, plaćeno unaprijed) |

Plus: Doneseno stanje / Ukupno za prenos.

### 2.2 Pravna pravila važna za implementaciju

- **Član 2:** Rashodi se priznaju u periodu kada su **plaćeni** (datum plaćanja je ključan).
- **Član 3:** Rashodi koji nisu u vezi s djelatnošću ne priznaju se; plaćeni unaprijed priznaju se kad nastanu.
- **Član 4:** Kamate (finansijski rashodi) – posebni uvjeti (zajam za djelatnost, tržišna stopa itd.).
- **Član 7:** Zakupnina – odbitak samo za poslovnu uporabu; avansi raspoređeni po periodu.
- **Član 8–9:** Manjak zaliha – normativi, zapisnik i popisna lista.

### 2.3 Predloženi model podataka (ExpenseBookEntry)

Polja u bazi (iznosi u **pfeningu**, cijeli brojevi), usporedba s Prilogom 2:

| Kolona Pravilnika | Predloženo polje (API/DB) | Tip |
|-------------------|---------------------------|-----|
| Red. br. | `entry_number` | integer |
| Datum knjiženja | `booking_date` | date |
| Opis | `description` | string, nullable |
| Plaćeni rashodi – Nabavna vr. proizvoda, robe, učinka | `amount_purchase_value` | integer (pfening) |
| Plaćeni rashodi – Materijal, gorivo, energija | `amount_materials_fuel_energy` | integer |
| Plaćeni rashodi – Bruto zarade, naknade, lični | `amount_wages_personal` | integer |
| Plaćeni rashodi – Proizvodne usluge | `amount_production_services` | integer |
| Plaćeni rashodi – Ostali (osim manjkova) | `amount_other_expenses` | integer |
| Plaćeni rashodi – Finansijski | `amount_financial_expenses` | integer |
| Amortizacija | `amount_depreciation` | integer |
| Manjak zaliha | `amount_inventory_shortage` | integer |
| Ulazni PDV | `amount_input_vat` | integer |
| Ukupno rashodi koji se priznaju | `total_recognized` | integer (izračun ili unos) |
| Rashodi koji se ne priznaju | `amount_not_recognized` | integer |
| - | `payment_date` | date, nullable (datum plaćanja – Član 2) |
| - | `bank_account_id` | FK, nullable |
| - | `supplier_id` ili sl. | FK, nullable (opcionalno) |
| - | `document_reference` | string, nullable (naziv, broj, datum dokumenta) |

Opcionalno: `company_id`, `notes`, `created_at`, `updated_at`, indeksi za `company_id`, `booking_date`, `entry_number`.

### 2.4 Faze implementacije Knjige rashoda

**Faza 1 – Backend (API)**  
1. Migracija: tablica `expense_book_entries` s kolonama iz tablice iznad.  
2. Model `ExpenseBookEntry` (veza na `Company`, opcionalno `BankAccount`, validacija).  
3. Kontroler: `ExpenseBookEntryController` – index (filteri: godina, datum od–do, pretraga), show, store, update, destroy.  
4. Request klase: Index, Store, Update (validacija iznosa, datuma, obaveznih polja).  
5. Resource za JSON (s istim poljima + relacije).  
6. Rute pod `/{company}/expense-book-entries` (i eventualno PDF kao `income-book-entries`).  
7. Provjera modula: ako company ima uključen modul `expenses`, rute su dostupne.

**Faza 2 – PDF izvoz (Prilog 2)**  
8. View `pdf/expense-book-entries.blade.php`: zaglavlje „KNJIGA RASHODA”, osnovni podaci obveznika/radnje (kao u Pravilniku), tablica s kolonama 1–15.  
9. Servis `ExpenseBookEntryPdfService` (generiranje + download), endpoint za preuzimanje PDF-a po periodu.

**Faza 3 – PWA (frontend)**  
10. Tipovi: `ExpenseBookEntry`, `ExpenseBookEntryInput`, response tipovi.  
11. API klijent: `getExpenseBookEntries`, `create`, `update`, `delete`, `downloadPdf`.  
12. Stranica/ruta npr. `expense-book` (zaštita po modulu „Knjiga rashoda”).  
13. Lista: zaglavlje tablice u skladu s Prilogom 2 (sve kolone), redovi s iznosima, filtriranje po godini/datumu, pretraga.  
14. Forma stavke: sva polja iz modela; iznosi preko **CurrencyInput** (bankomat stil) u KM; validacija ukupnog priznatog (suma stavki + amortizacija + manjak + ulazni PDV minus nepriznati).  
15. Detalj stavke (drawer): prikaz svih polja.  
16. Mobilni prikaz: kartice s raspadom po vrstama rashoda (kao kod knjige prihoda) i ukupnim priznatim/nepriznatim.  
17. Navigacija: stavka „Knjiga rashoda” u izborniku (vidljiva ako je modul uključen).

**Faza 4 – Usklađenost i nijanse**  
18. Na formi ili u help tekstu naglasiti: rashodi se priznaju kada su plaćeni (Član 2); nepriznati rashodi (Član 3) unose se u kolonu „Rashodi koji se ne priznaju”.  
19. Opcionalno: „Doneseno stanje” / „Ukupno za prenos” na dnu PDF-a (kumulativno po stranici ili po godini).

### 2.5 Kraća checklist za Knjigu rashoda

- [ ] Migracija `expense_book_entries`  
- [ ] Model + Resource + Request klase  
- [ ] ExpenseBookEntryController (CRUD + PDF)  
- [ ] Rute i provjera modula `expenses`  
- [ ] PDF view usklađen s Prilogom 2  
- [ ] Tipovi i API u PWA  
- [ ] Stranica `expense-book`: lista, filtri, paginacija  
- [ ] Forma: sva polja, CurrencyInput za iznose  
- [ ] Detalj stavke, brisanje, potvrda  
- [ ] Mobilni prikaz (kartice s raspadom)  
- [ ] Navigacija i zaštita po modulu  

---

## 3. Sažetak

- **Knjiga prihoda:** Usklađena s Pravilnikom (Prilog 1); prihodi od prodaje čak i detaljnije (Usluge/Roba/Proizvodi).  
- **Knjiga rashoda:** Nema je još u aplikaciji; plan iznad definira strukturu prema Prilogu 2 i Članovima 2, 3, 4, 7–9 te faze (backend → PDF → PWA) za implementaciju.
