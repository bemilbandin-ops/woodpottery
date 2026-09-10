# RÅFORM / woodpottery

Svensk mörk butiksmall för små upplagor i trä och keramik, med lokal admin/CMS och tydliga adaptergränser för framtida backend.

## Starta lokalt

```powershell
npm install
npm run dev
```

Produktionskontroll:

```powershell
npm test -- --run
npm run build
```

## Admin

Öppna `/admin`.

Demoinloggning:

- användare: `admin`
- lösenord: `verkstad`

Detta är avsiktligt **inte säker autentisering**. En helt frontendbaserad inloggning kan inte skydda adminfunktioner på en publik webbplats. UI:t använder `AuthAdapter`, så en senare server-/Supabase-/annan autentisering kan ersätta `src/adapters/auth.ts` utan att adminvyerna behöver byggas om.

## Vad admin kan ändra

- skapa, redigera och ta bort produkter
- titel, slug, kategori, pris, lager, synlighet, hero-status och ordning
- produktbild via URL eller lokal uppladdning
- alt-text, kort beskrivning och detaljer
- alla publika fasta texter i innehållsregistret
- egna textblock som kan läggas till/tas bort på startsida, sidfot, köpvillkor och integritet
- fet, kursiv, understruken, textstorlek och textjustering
- butiksnamn, kontaktadress, Instagram, frakt och fri-frakt-gräns
- lokalt skapade demoorder
- återställning till seed-data

Rasterbilder som laddas upp i demot skalas ned till max 1600 px och sparas i webbläsarens localStorage. När riktig backend läggs till bör media flyttas till objektlagring.

## Backend-gränser

Frontendkomponenterna anropar inte localStorage direkt för butikens persistenta data.

- `src/adapters/repository.ts` — `ShopRepository` för produkter, texter, inställningar och order
- `src/adapters/auth.ts` — `AuthAdapter` för session/inloggning
- `src/adapters/checkout.ts` — `CheckoutAdapter` för order/kassa

För en riktig butik byter du implementationerna bakom dessa gränssnitt till API-anrop och skyddar admin/API-rutter på serversidan.

## Kassa

Nuvarande kassa är en fungerande **demokassa**: den validerar lager, räknar totalsumma/frakt, minskar lokalt lager och sparar en lokal order. Den drar ingen betalning och säger inte att betalning har genomförts.

En riktig betalningslösning ska implementeras i `CheckoutAdapter` via backend. Då kan Stripe/Klarna/annan leverantör kopplas in utan att produkt-, varukorgs- och adminflödena behöver struktureras om.

## Innehåll och säker rendering

Rich text saneras med DOMPurify före publik rendering. Public UI är på svenska och priser visas i SEK.

## Demoassets

`public/assets/` innehåller tre lokala SVG-bilder så sidan är visuellt komplett direkt. Byt dem via admin när riktiga produktbilder finns.

## Deploy

Projektet är en vanlig Vite-app. `vercel.json` innehåller SPA-rewrite så `/admin`, `/villkor` och `/integritet` fungerar vid direktladdning på Vercel.

Innan verklig publicering behöver minst följande bytas/konfigureras: säker backend-auth, riktig checkout/betalning, riktiga kontaktuppgifter, köpvillkor/integritetstext och produktbilder.
