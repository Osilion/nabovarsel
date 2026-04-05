# Nabovarsel

Nabovarsel-app for byggesaker i Norge. Send, spor og administrer nabovarsler digitalt.

## Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Supabase** (auth + database)
- **Zustand** (client state)
- **Lucide** (ikoner)
- **Vercel** (deploy)

## Funksjoner

- **Dashboard** – oversikt over alle prosjekter med status
- **Prosjekter** – opprett nabovarsel-prosjekter med eiendomssøk via Kartverket
- **Naboliste** – hent naboer fra Grunnboken (placeholder API), legg til manuelt
- **Varsling** – send nabovarsel via Altinn (placeholder API)
- **Sporing** – følg opp status, svar og protester
- **Auth** – innlogging/registrering via Supabase

## Integrasjoner

| Tjeneste    | Status          | Beskrivelse                              |
|-------------|-----------------|------------------------------------------|
| Kartverket  | ✅ Tilkoblet    | Adressesøk via Geonorge                  |
| Grunnboken  | 🔲 Placeholder  | Eierdata – kobles til når API er klart   |
| Altinn      | 🔲 Placeholder  | Sending av nabovarsel – kobles til Altinn 3 |
| Utskiller   | 🔲 Planlagt     | Import av prosjekter fra Utskiller-appen |

## Kom i gang

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Appen kjører i **mock-modus** uten Supabase-konfigurasjon – med testdata for alle funksjoner.

## Database

Supabase-migrasjonen ligger i `web/supabase/migrations/001_nabovarsel_schema.sql`.

Tabeller:
- `profiles` – brukerprofiler
- `projects` – nabovarsel-prosjekter (eiendom, status, frist)
- `neighbors` – naboliste med eierinfo og varselstatus
- `notification_log` – audit trail for sendte varsler
- `documents` – vedlegg (situasjonsplan, tegninger etc.)

## Deploy

1. Push til GitHub
2. Importer i Vercel med root directory `web`
3. Sett opp Supabase-prosjekt og legg inn env vars
4. Kjør migrasjonen i Supabase SQL Editor
