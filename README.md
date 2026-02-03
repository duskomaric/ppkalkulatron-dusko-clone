“Counters tabela” (preporuka za API: jednostavno + sigurno)
Napravi tabelu npr. document_counters:
company_id
type (invoice/quote/proforma)
year (ili period_key)
last_number (int)
unique: (company_id, type, year)
Next number endpoint:
u transakciji SELECT ... FOR UPDATE ili lockForUpdate():
counter = firstOrCreate(...)
counter->last_number++
save
vrati formatted string + numeric counter
Prednost: najčistije za “daj mi naredni broj” + concurrency safe.
Mana: jedna dodatna tabela.
3) “Reservation/preview” (ako hoćeš i ‘preview’ bez rezervacije)
   Kombinacija opcije #2 + koncept “rezervisanih brojeva”:
   endpoint GET /next-number može raditi samo preview (ne mijenja counter)
   endpoint POST /reserve-number stvarno inkrementira i vraća rezervisan broj
   dokument se kreira sa već rezervisanim brojem
   Prednost: UI može prikazati “sljedeći broj” bez side-effecta, a opet imaš siguran “commit”.
   Mana: više endpointa/stanja; moraš odlučiti šta sa rezervacijama koje nikad ne postanu dokument (rupe u numeraciji).
