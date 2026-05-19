# Plan modula: Knjiga prihoda

## 1. Zakonski okvir i PDF kolone

Prema praksi u BiH (KPR, obrt, PDV obveznici), knjiga prihoda sadrži redove sa sljedećim kolonama koje **moraju** biti na generisanom PDF-u:

| Red. br. | Kolona | Opis |
|----------|--------|------|
| 1 | **Red. br.** | Redni broj stavke |
| 2 | **Datum knjiženja** | Datum kada se stavka knjiži |
| 3 | **Opis promjene** | Naziv, broj i datum dokumenta za knjiženje |
| 4a | **Naplaćeni prihodi od prodaje – Usluge** | Iznos (prodaja usluga) |
| 4b | **Naplaćeni prihodi od prodaje – Roba** | Iznos (prodaja robe) |
| 4c | **Naplaćeni prihodi od prodaje – Proizvod** | Iznos (prodaja proizvoda) |
| 5 | **Naplaćeni ostali prihodi** | Ostali prihodi (npr. kamata, subvencije) |
| 6 | **Naplaćeni finansijski prihodi** | Finansijski prihodi |
| 7 | **Ukupno naplaćeni prihodi** | Zbir kolona 4a+4b+4c+5+6 |
| 8 | **Obračunati PDV** | PDV u prihodima (samo za PDV obveznike) |

Napomena: Ako kompanija **nije** PDV obveznik, kolona „Obračunati PDV” se ne prikazuje (već imamo logiku `is_vat_obligor` na računima).

---

## 2. Korisnički scenario: uplata na banku

Korisnik evidentira:

- **Iznos** uplate  
- **Datum** uplate  
- **Banku** (odabir bankovnog računa kompanije)  
- **Svrhu doznake** sa bankovnog izvoda (tekst)

Zatim:

- **Opcija A:** Odabere **račun (fakturu)** po kojem je plaćeno.  
  - Ako je uplata **u cijelosti** = iznos računa: iznose po vrstama (usluge/roba/proizvod) i PDV računamo automatski iz stavki računa (preko tipa artikla).  
  - Ako je **parcijalna uplata**: iznos koji korisnik unosi manji je od iznosa računa; potrebno je **proporcionalno** razvrstati taj iznos po usluga/roba/proizvod (i PDV).  
- **Opcija B:** Ne veže račun (npr. ostali prihodi, kamata, subvencija).  
  - Korisnik ručno unosi **Ostali prihodi** i/ili **Finansijski prihodi** .  
  - Opis promjene = svrha doznake ili ručni opis.

---

## 3. Istraživanje: parcijalna uplata i alokacija

U računovodstvenim sistemima (Sage, NetSuite, QuickBooks, IRIS):

- **Parcijalna uplata** = uplata manja od ukupnog duga na računu.  
- **Alokacija:**  
  - Jedna uplata može biti raspoređena na **više računa** (više stavki u knjizi).  
  - Jedan račun može biti plaćen u **više uplata**.  
- Za **knjigu prihoda** dovoljno je da **jedna stavka knjige** odgovara jednom „dokumentu” ili jednoj logičkoj alokaciji:  
  - jedna stavka = jedna uplata vezana za **jedan** račun (cijeli ili dio), **ili**  
  - jedna stavka = jedna uplata bez računa (ostali/finansijski prihodi).

Preporuka za naš modul:

- **Jedna stavka knjige prihoda = jedan red u PDF-u.**  
- Ako jedna bankovna transakcija pokriva npr. 2 računa, korisnik kreira **2 stavke** (isti datum, ista banka, svrha može biti ista ili po stavci), svaka sa svojim iznosom i opisom.  
- **Parcijalna uplata na jedan račun:** korisnik bira račun i unosi **iznos uplate** (manji od iznosa računa). Sistem **proporcionalno** rasporedi taj iznos na usluge/roba/proizvod (i PDV) prema strukturi računa (stavke + tip artikla). Ne treba posebna entiteta „Payment” za MVP; dovoljna je jedna tabela stavki knjige.

---

## 4. Predlog modela podataka (API)

### 4.1 Jedna tabela: `income_book_entries` (stavke knjige prihoda)

Jedan red = jedna stavka u knjigi = jedan red na PDF-u.

| Polje | Tip | Opis |
|------|-----|------|
| `id` | bigint PK | |
| `company_id` | FK companies | |
| `entry_number` | integer | Redni broj u knjizi (npr. po godini/periodu, unutar kompanije) |
| `booking_date` | date | Datum knjiženja |
| `description` | string, nullable | Opis promjene (naziv, broj i datum dokumenta); može automatski iz računa ili ručno |
| `amount_services` | integer (pfening) | Prihodi od prodaje – usluge |
| `amount_goods` | integer (pfening) | Prihodi od prodaje – roba |
| `amount_products` | integer (pfening) | Prihodi od prodaje – proizvod |
| `amount_other_income` | integer (pfening) | Ostali prihodi |
| `amount_financial_income` | integer (pfening) | Finansijski prihodi |
| `total_amount` | integer (pfening) | Ukupno (zbir 5 iznosnih kolona); može i computed |
| `vat_amount` | integer (pfening) | Obračunati PDV |
| `bank_account_id` | FK, nullable | Na koji bankovni račun je uplata |
| `payment_date` | date, nullable | Datum uplate (sa izvoda) |
| `purpose_from_statement` | string, nullable | Svrha doznake sa izvoda |
| `invoice_id` | FK invoices, nullable | Povezani račun (ako je uplata po računu) |
| `notes` | text, nullable | Napomene |
| `created_at`, `updated_at` | timestamps | |

Pravila:

- **Ukupno:** `total_amount` = `amount_services` + `amount_goods` + `amount_products` + `amount_other_income` + `amount_financial_income`. Može se držati kao izračunato polje ili validirati pri snimanju.  
- **Redni broj:** `entry_number` se automatski dodeljuje unutar kompanije (npr. po godini), pri kreiranju stavke.

### 4.2 Kako popuniti stavku

**Kada korisnik veže račun (`invoice_id` + iznos uplate):**

1. Učitati račun sa stavkama i `article.type` (usluga/roba/proizvod).  
2. Za svaki tip (services, goods, products) izračunati:  
   - iznos prihoda po tipu na računu (iz `InvoiceItem.total` gdje `article.type` = taj tip),  
   - PDV po tipu ako treba (iz `InvoiceItem.tax_amount`).  
3. Ako je **cijela uplata** (uneseni iznos = `invoice.total`):  
   - upisati te iznose u `amount_services/goods/products` i `vat_amount`,  
   - `description` = npr. „Faktura br. X, datum DD.MM.GGGG.”.  
4. Ako je **parcijalna uplata** (uneseni iznos < `invoice.total`):  
   - koeficijent = `payment_amount / invoice.total`,  
   - sve kategorije (i PDV) pomnožiti tim koeficijentom i zaokružiti (npr. na cijele feninge),  
   - upisati u odgovarajuća polja stavke,  
   - `description` = npr. „Faktura br. X, datum DD.MM.GGGG. (parcijalna uplata).”

**Kada korisnik ne veže račun:**

- `invoice_id` = null.  
- Korisnik unosi jednu ili obje: `amount_other_income`, `amount_financial_income`.  
- `amount_services/goods/products` = 0, `vat_amount` = 0 (ili po posebnim pravilima ako zakon zahtijeva).  
- `description` = svrha doznake ili ručni opis.

Ostala polja (datum knjiženja, banka, datum uplate, svrha doznake) korisnik uvijek unosi (ili biramo razumne defaulte, npr. datum knjiženja = danas).

---

## 5. Ostali prihodi i finansijski prihodi

- **Ostali prihodi:** npr. subvencije, dotacije, ostali neposlovni prihodi koji nisu prodaja niti finansijski.  
- **Finansijski prihodi:** npr. kamata na tekući račun, dividende, tečajne razlike (ako se vode kao prihod).

U našem modelu to su samo dva numerička polja; korisnik u formi za „uplatu bez računa” bira šta unosi (ostali / finansijski / oba) i upisuje iznose. Bez posebne podvrste; ako kasnije zatreba (npr. za izvještaje), može se dodati `income_type` (sales / other / financial) ili slično.

---

## 6. Faze implementacije

### Faza 1 – API

1. **Migracija**  
   - Kreirati tabelu `income_book_entries` sa kolonama iz 4.1.  
   - Dodati indekse: `company_id`, `booking_date`, `invoice_id`, eventualno `(company_id, entry_number)` za redni broj.

2. **Model**  
   - `IncomeBookEntry`: fillable, casts (datumi, integer za iznose), relacije: `company`, `bankAccount`, `invoice`.  
   - Accessor ili atribut za `total_amount` ako ga držimo kao zbir (ili ga računati u resource-u).

3. **Logika za popunu iz računa**  
   - Servis ili metoda u modelu/controlleru:  
     - Input: `invoice_id`, `payment_amount` (pfening), opciono `booking_date`, `payment_date`, `bank_account_id`, `purpose_from_statement`.  
     - Iz računa (items + article type) izračunati iznose po usluga/roba/proizvod i PDV.  
     - Za parcijalnu uplatu: koeficijent i proporcionalni iznosi.  
     - Vratiti ili direktno snimiti u `IncomeBookEntry`.

4. **API rute (npr. pod `/{company}/...`)**  
   - `GET income-book-entries` – lista stavki (filteri: period datuma, opciono invoice_id).  
   - `POST income-book-entries` – kreiranje stavke (ručni unos ili sa `invoice_id` + iznos; backend poziva logiku iz tač. 3).  
   - `GET income-book-entries/{id}` – jedna stavka.  
   - `PUT/PATCH income-book-entries/{id}` – izmjena (npr. ispravka opisa, datuma, ručna korekcija iznosa).  
   - `DELETE income-book-entries/{id}` – brisanje (ako zakon i politika dozvoljavaju).  
   - Request validacija: obavezna polja (company, booking_date, bar jedan iznos ili invoice_id + payment_amount), da `total_amount` odgovara zbiru.

5. **Redni broj**  
   - Pri `POST` automatski dodeliti `entry_number` (npr. max(entry_number) + 1 za tu kompaniju u toj godini; ili po drugom pravilu koje odgovara KPR).

6. **PDF**  
   - Endpoint (npr. `GET income-book-entries/pdf` za period) koji generiše PDF sa kolonama iz tač. 1.  
   - Podaci: sortirano po `booking_date`, pa `entry_number`.  
   - Za kompanije koje nisu PDV obveznik: kolonu „Obračunati PDV” izostaviti ili prikazati kao 0 (prema već postojećoj logici `is_vat_obligor`).

7. **Modul**  
   - Ako kompanija ima `enabled_modules`, dodati modul npr. `income_book` i u navigaciji (API i kasnije PWA) prikazivati „Knjiga prihoda” samo ako je modul aktivan.

### Faza 2 – PWA

1. **Ruta i layout**  
   - Npr. `/income-book` (ili pod Settings). Lista stavki sa filterima (period).

2. **Kreiranje / uređivanje stavke**  
   - Forma:  
     - Datum knjiženja, datum uplate, banka (select), svrha doznake.  
     - Opcija: „Vezi uz račun” – select računa (lista neplaćanih ili svih), polje „Iznos uplate”.  
     - Ako nije vezan račun: polja „Ostali prihodi”, „Finansijski prihodi” (i opciono opis).  
   - Pri snimanju: poziv API-ja koji na backendu izračuna usluge/roba/proizvod/PDV ako je proslijeđen `invoice_id` i iznos.

3. **Pregled i PDF**  
   - Tabela stavki (red. br., datum, opis, iznosi po kolonama, ukupno, PDV).  
   - Dugme „Preuzmi PDF” za odabrani period.

4. **Parcijalna uplata u UI**  
   - Kad korisnik odabere račun, prikazati ukupan iznos računa i preostali dug (ako već postoje uplate za taj račun – vidi tač. 7).  
   - Unos „Iznos uplate” manji od iznosa računa = parcijalna uplata; backend već zna kako da proporcionalno rasporedi.

### Opciono kasnije

- **Praćenje duga po računu:** agregacija `income_book_entries` po `invoice_id` da se vidi koliko je „naplaćeno” po računu; u formi prikazati „preostali dug” i onemogućiti unos većeg iznosa od duga.  
- **Jedna bankovna transakcija – više stavki:** ostaje kao „više unosa sa istim datumom i bankom”; posebna entiteta „Bank payment” nije nužna za MVP.  
- **Knjiga rashoda:** sličan model u nekoj budućoj fazi.

---

## 7. Rezime odluka

| Pitanje | Odluka |
|--------|--------|
| Jedna stavka = jedan red u knjizi? | Da. Jedna stavka = jedan red na PDF-u. |
| Posebna tabela „Payment”? | Ne za MVP. Jedna tabela `income_book_entries` dovoljna. |
| Parcijalna uplata | Proporcionalna raspodjela iznosa uplate na usluge/roba/proizvod (i PDV) prema strukturi odabranog računa. |
| Ostali / finansijski prihodi | Dva polja; korisnik ručno unosi iznose kada ne veže račun. |
| Redni broj | Automatski, npr. po godini po kompaniji. |
| PDF | Jedan endpoint za period; kolone kao u tač. 1; PDV kolonu sakriti ako `!company->is_vat_obligor`. |

Kada odobriš ovaj plan, sljedeći korak je implementacija Faze 1 (migracija, model, servis za izračun iz računa, CRUD API, redni broj, PDF, modul) na API-ju.
