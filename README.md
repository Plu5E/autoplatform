# Autoplatform — Installatie & Deploy

## Wat zit in dit project?

- `/src/app/verkoper` — de verkoper wizard (5 stappen, automatisch bod)
- `/src/app/dashboard` — het garage dashboard (leads, marges, white-label)
- `/src/app/api/leads` — API voor leads aanmaken en ophalen
- `/src/app/api/garages/marges` — API voor marges instellen
- `/src/lib/bod.ts` — bod berekeningslogica
- `/supabase/schema.sql` — volledige database structuur
- `/public/embed.js` — embed script voor op 2maal2.be

---

## Stap 1 — Supabase database opzetten

1. Ga naar **supabase.com** → open uw project
2. Klik links op **SQL Editor**
3. Klik op **New query**
4. Kopieer de volledige inhoud van `supabase/schema.sql`
5. Plak en klik **Run**
6. U ziet: "Success. No rows returned" → database is klaar

Uw database bevat nu:
- Tabel `garages` (met 2maal2 als standaard garage)
- Tabel `leads` (alle voertuigaanvragen)
- Tabel `marges` (uw aankoopmarge-instellingen)
- Tabel `notificaties` (log van verstuurde e-mails)
- Storage bucket `voertuig-fotos`

---

## Stap 2 — API keys ophalen uit Supabase

1. Ga in Supabase naar **Settings → API**
2. Kopieer:
   - **Project URL** → dit is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → dit is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → dit is `SUPABASE_SERVICE_ROLE_KEY`

Bewaar deze drie waarden — u heeft ze nodig in stap 4.

---

## Stap 3 — Code naar GitHub uploaden

### Optie A: via GitHub website (geen technische kennis nodig)

1. Ga naar **github.com** → klik **New repository**
2. Naam: `autoplatform` → klik **Create repository**
3. Klik op **uploading an existing file**
4. Sleep alle bestanden uit de gedownloade zip naar het upload-venster
5. Klik **Commit changes**

### Optie B: via terminal (sneller)

```bash
cd autoplatform
git init
git add .
git commit -m "eerste versie"
git remote add origin https://github.com/UW-GEBRUIKERSNAAM/autoplatform.git
git push -u origin main
```

---

## Stap 4 — Deployen op Vercel

1. Ga naar **vercel.com** → klik **Add New Project**
2. Klik **Import** naast uw `autoplatform` repository
3. Vercel detecteert automatisch dat het Next.js is → klik **Deploy**
4. De eerste deploy mislukt (geen environment variables) → dat is normaal

**Environment variables instellen:**
1. Ga naar uw project op Vercel → **Settings → Environment Variables**
2. Voeg deze toe (één per één, kopieer exact):

| Naam | Waarde |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://JOUW-PROJECT-ID.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | jouw anon key uit stap 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | jouw service role key uit stap 2 |
| `GARAGE_EMAIL` | info@2maal2.be |
| `GARAGE_NAAM` | 2maal2 |

3. Klik na elke variabele op **Save**
4. Ga naar **Deployments → klik de laatste deploy → Redeploy**
5. Na 1–2 minuten: uw platform is live op `autoplatform.vercel.app`

---

## Stap 5 — Testen

Open in uw browser:
- `https://autoplatform.vercel.app/verkoper` → de wizard voor verkopers
- `https://autoplatform.vercel.app/dashboard` → uw garage dashboard

Vul de wizard volledig in en klik "Bod bevestigen".
Ga daarna naar het dashboard — de lead staat er binnen enkele seconden in.

---

## Stap 6 — Koppelen aan 2maal2.be

Voeg dit toe aan uw website op de pagina waar u de knop wil:

```html
<script
  src="https://autoplatform.vercel.app/embed.js"
  data-garage="2maal2">
</script>
```

De knop "Verkoop uw wagen" verschijnt automatisch en opent de wizard.

---

## Stap 7 — Eigen domein instellen (optioneel)

1. Ga in Vercel naar **Settings → Domains**
2. Typ `autos.2maal2.be` → klik **Add**
3. Vercel toont een CNAME-record, bv: `cname.vercel-dns.com`
4. Log in bij uw domeinbeheerder (Combell, One.com, enz.)
5. Voeg een CNAME-record toe:
   - **Naam:** `autos`
   - **Waarde:** `cname.vercel-dns.com`
6. Na 5–30 minuten is `autos.2maal2.be` live

---

## E-mailnotificaties inschakelen (optioneel)

1. Ga naar **resend.com** → maak gratis account aan
2. Ga naar **API Keys → Create API Key**
3. Voeg toe in Vercel: `RESEND_API_KEY` = jouw sleutel
4. Verander ook de `from`-adres in `/src/app/api/leads/route.ts`:
   ```
   from: 'platform@2maal2.be'
   ```
   → Dit vereist dat u `2maal2.be` verifieert in Resend (gratis, 5 minuten)

---

## Problemen?

**"Supabase error: relation does not exist"**
→ Schema nog niet uitgevoerd — voer stap 1 opnieuw uit

**"Garage niet gevonden"**
→ Controleer of `GARAGE_EMAIL` exact overeenkomt met wat in de database staat

**Wizard laadt niet**
→ Controleer `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

Bij vragen: open een nieuwe chat en plak de foutmelding — ik los het op.
