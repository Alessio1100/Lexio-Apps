# Lexio Apps

Hub personale di mini-app, costruito come singola web app PWA hostabile su Vercel. La home è un launcher: selezioni l'app che vuoi usare. Aggiungere nuove app è semplice.

## App incluse

- **Flashcard PMCSN** (`/flashcard-pmcsn`) — 85 flashcard di *Performance Modeling of Computer Systems and Networks* (13 mazzi) con algoritmo di apprendimento spaziato a 3 livelli (Non la so / In parte / La so).

## Struttura

```
app/
  page.js                  HOME — launcher di Lexio Apps
  layout.js                metadata + manifest PWA
  globals.css
  flashcard-pmcsn/
    page.js                l'app Flashcard PMCSN
lib/
  apps.js                  registro delle app mostrate in home
  cards.js                 le 85 flashcard
  scheduler.js             algoritmo di apprendimento spaziato
public/
  manifest.json, sw.js, icon-192.png, icon-512.png
```

## Aggiungere una nuova app

1. Crea la route: `app/<slug>/page.js`.
2. Aggiungi una voce in `lib/apps.js`:
   ```js
   {
     slug: "mia-app",
     name: "Nome App",
     description: "Cosa fa.",
     icon: "AB",
     accent: "#22c55e",
     available: true,
   }
   ```
Comparirà automaticamente nella home. Metti `available: false` per mostrarla come «presto» senza link.

## Sviluppo locale

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy su Vercel

1. Push di questa cartella su un repo Git.
2. vercel.com → Add New → Project → importa il repo. Framework: Next.js (auto). Nessuna env var.
3. Deploy.

Oppure: `npm i -g vercel && vercel`.

## PWA

`public/manifest.json` + `public/sw.js` rendono l'app installabile e usabile offline. Su mobile: apri il sito → «Aggiungi a schermata Home».
