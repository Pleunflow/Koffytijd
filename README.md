# Koffytijd ☕

Interne website waarmee collega's per kantoor samen koffie bestellen. Iemand roept
"Koffytijd", collega's hebben 2 minuten om hun drankje door te geven, de haler krijgt
een gedeeld lijstje, en een koffiesaldo houdt bij wie vaak haalt en wie vaak laat halen.

Deze fase draait op **één laptop op het kantoornetwerk**. Collega's openen de site via
`http://<ip-van-laptop>:3000`. Hij kan ook op Vercel + Neon
(zie [Op Vercel zetten](#op-vercel-zetten-met-neon)).

## Wat heb je nodig

- [Node.js](https://nodejs.org) 20.9 of nieuwer
- [pnpm](https://pnpm.io) (`corepack enable` activeert de versie uit `package.json`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (voor Postgres 16)

## Lokaal draaien

```bash
pnpm install
pnpm db:up       # start Postgres in Docker (maakt ook .env aan als die nog niet bestaat)
pnpm db:migrate  # zet de tabellen klaar
pnpm db:seed     # de 4 kantoren
pnpm dev         # http://localhost:3000, luistert op 0.0.0.0:3000
```

`pnpm db:up` kopieert bij de eerste keer `.env.example` naar `.env` en vult
`AUTH_SECRET` met een willekeurige waarde. De echte `.env` staat in `.gitignore`.

Open daarna http://localhost:3000, kies je kantoor, vul je naam in en roep Koffytijd.

### Alle scripts

| Script             | Wat het doet                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `pnpm db:up`       | Start Postgres 16 in Docker (data blijft bewaard in een volume)   |
| `pnpm db:down`     | Stopt Postgres (data blijft bewaard)                              |
| `pnpm db:migrate`  | Voert de Drizzle-migraties uit                                    |
| `pnpm db:generate` | Maakt een nieuwe migratie na een wijziging in `db/schema.ts`      |
| `pnpm db:seed`     | Zet de 4 kantoren in de database (mag vaker)                      |
| `pnpm dev`         | Dev-server op `0.0.0.0:3000`, bereikbaar voor andere laptops      |
| `pnpm test`        | Vitest (gebruikt de database `koffytijd_test`, dus eerst `db:up`) |
| `pnpm lint`        | ESLint                                                            |
| `pnpm typecheck`   | TypeScript                                                        |
| `pnpm format`      | Prettier                                                          |

## Collega's laten meedoen

1. Zorg dat jouw laptop en die van je collega's op **hetzelfde netwerk** zitten
   (kantoorwifi, niet de gastenwifi).
2. Zoek het IP-adres van jouw laptop op:

   **macOS**

   ```bash
   ipconfig getifaddr en0
   ```

   Niets te zien? Probeer `ipconfig getifaddr en1`, of kijk in
   Systeeminstellingen → Netwerk → Wi-Fi → Details → TCP/IP.

   **Windows** (PowerShell of Opdrachtprompt)

   ```powershell
   ipconfig
   ```

   Zoek bij je wifi-adapter de regel **IPv4-adres**, bijvoorbeeld `192.168.1.23`.

3. Draai `pnpm dev` en stuur je collega's de link: **`http://<jouw-ip>:3000`**,
   bijvoorbeeld `http://192.168.1.23:3000`.
4. Collega's kiezen bij hun eerste bezoek hun kantoor en naam. Laat het tabblad open:
   als iemand Koffytijd roept, knippert de tab-titel "☕ Koffytijd!".

Werkt de link niet?

- **Firewall**: macOS of Windows vraagt bij de eerste start of Node binnenkomende
  verbindingen mag accepteren. Kies _Toestaan_. (Windows: sta in elk geval
  _Privénetwerken_ toe.)
- **Ander IP-bereik**: de dev-server staat standaard `192.168.x.x`, `10.x.x.x` en
  `172.x.x.x` toe. Valt jullie netwerk daarbuiten, zet dan het IP in `.env`:
  `DEV_ORIGINS=1.2.3.4` en herstart `pnpm dev`.
- **Laptop dicht of in slaap** = Koffytijd offline.

## Zo werkt het

- **Eén actieve ronde per kantoor.** Roept iemand Koffytijd terwijl er al een ronde
  loopt, dan krijgt die het meedoen-scherm. Afgedwongen met een partial unique index
  (`round_one_open_per_office_uq`).
- **120 seconden, en de server bepaalt de tijd.** `ends_at` wordt op de server gezet.
  De browser telt alleen af vanaf die waarde, gecorrigeerd voor het klokverschil met
  de server.
- **Na `ends_at` of na _Ronde afronden_** kun je niet meer bestellen, wijzigen of
  overslaan (`ROUND_CLOSED`, met een `FOR UPDATE`-lock tegen races).
- **Verrekenen gebeurt precies één keer.** Dat gebeurt bij _Ronde afronden_, of lazy bij
  het eerste request na `ends_at` als niemand klikt. Het zit in één transactie, en de
  `UPDATE round SET settled = true WHERE settled = false` is de claim die maar één keer
  lukt.
  - Haler: +1 per drankje dat hij voor een ander haalt. Z'n eigen drankje telt niet.
  - Elke collega die iets laat halen: −1. Overslaan: 0.
- **Saldo is een ledger.** `saldo_event` bevat `delta` en `reason`
  (`haal` / `besteld` / `opdracht_reset`), en het saldo is de som per (kantoor, collega).
  Bij ≤ −10 krijg je een opdracht, van −7 tot −9 staat er "bijna!". De knop
  _Opdracht gedaan_ boekt een `opdracht_reset` die het saldo op 0 zet.
- **Live verversen**: elke 2 seconden `GET /api/office/[id]/state`, met de ronde,
  bestellingen, timer en saldo's. Geen websockets.

## Projectstructuur

```
app/                 pagina + API-routes (Route Handlers)
  api/office/[id]/state            GET: alles voor het scherm (wordt gepolld)
  api/office/[id]/rounds           POST: Koffytijd roepen
  api/office/[id]/opdracht-reset   POST: Opdracht gedaan
  api/rounds/[id]/orders           POST: bestellen / wijzigen / overslaan
  api/rounds/[id]/close            POST: Ronde afronden
  api/orders/[id]                  PATCH: afvinken
  api/session, api/me              lokaal inloggen, kantoor wijzigen
components/koffy/    de schermen
components/ui/       shadcn/ui-componenten (Toppy-stijl)
db/                  Drizzle-schema, migraties, seed
lib/auth.ts          de enige plek die weet hoe je inlogt (getCurrentUser)
lib/koffy.ts         alle regels (rondes, bestellen, verrekenen, opdracht)
lib/menu.ts          drankjes en opties
lib/saldo.ts         saldo-regels en opdrachten
lib/view.ts          welk scherm je ziet
lib/brand.ts         merk (BRAND=toppy|heuts)
```

## Inloggen

`AUTH_MODE=local`: bij je eerste bezoek kies je kantoor en naam. Dat wordt een
`user`-record, en het user-id gaat, ondertekend met `AUTH_SECRET`, in een httpOnly-cookie.
Er is geen wachtwoord en geen eigen identity. Wil je als iemand anders testen? Gebruik
een ander browserprofiel of een privévenster.

Google SSO (better-auth, beperkt tot het Workspace-domein) komt na overleg met IT.
Dan verandert alleen `lib/auth.ts`: `getCurrentUser()` haalt de collega dan uit de
better-auth-sessie en koppelt via `user.email`. De rest van de app merkt er niets van.

## Op Vercel zetten (met Neon)

1. Importeer de GitHub-repo in Vercel (Add New → Project). De standaardinstellingen zijn goed.
2. Voeg een database toe: in het Vercel-project **Storage → Create Database → Neon**,
   regio **Frankfurt (eu-central-1)**. Vercel zet dan zelf `DATABASE_URL` en
   `DATABASE_URL_UNPOOLED`.
3. Zet bij **Settings → Environment Variables** nog `AUTH_SECRET` (een willekeurige
   reeks van minstens 32 tekens, bv. `openssl rand -hex 32`).
4. Deploy. Het script `vercel-build` voert eerst de migraties en de seed uit en bouwt
   daarna de app. Er is geen losse stap nodig.

Polling, lazy verrekenen en de ledger werken serverless zonder aanpassingen: geen cron,
geen achtergrondproces. Iedereen met de link kan meedoen met zijn naam; Google SSO komt
later in `lib/auth.ts`.

## Nog open / bekende punten

- De iconen voor megafoon en auto zijn tijdelijke vervangers. De officiële SVG's
  uit `assets/icons/` zaten niet in de handoff. Vervang ze in `components/icons.tsx`.
- shadcn/ui is handmatig opgezet (`components.json` + `components/ui/`), want het
  registry was niet bereikbaar bij het bouwen. `pnpm dlx shadcn@latest add <component>`
  werkt gewoon.
- _Opdracht gedaan_ mag voor v1 door iedereen in het kantoor.
