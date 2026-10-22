# Legal Product Studio · Law, by design.

Sito one-page per uno studio che porta il **giurista designer** dentro i team di prodotto digitali: legal design, Value Sensitive Design e FRIA, accessibilità (European Accessibility Act) e audit dei dark pattern.

Statico, senza build e senza dipendenze: HTML, CSS e JavaScript puri.

## Avvio in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## Struttura

```
index.html              pagina unica
assets/css/fonts.css    @font-face dei caratteri ospitati in locale
assets/css/styles.css   design token (colori, tipografia, spazi) e stili
assets/js/main.js       interazioni (revisioni nell'hero, slider prima/dopo,
                        dark vs fair pattern, tab norma → user story,
                        autovalutazione, modulo contatti)
assets/fonts/           Atkinson Hyperlegible Next e Mono (licenza SIL OFL)
assets/img/             favicon e immagine di anteprima per i social
```

## Sezioni

| Ancora | Contenuto |
| --- | --- |
| `#top` | Hero con revisione "track changes" dal legalese all'italiano chiaro, con indice Gulpease calcolato dal vivo |
| `#problema` | Art. 1: il legale che arriva alla fine, curva del costo di una modifica, sanzioni GDPR e AI Act |
| `#manifesto` | Art. 2: il giurista *nel* prodotto, team interattivo, cinque commi di principi |
| `#servizi` | Art. 3: Legal Copilot, Legal Design & Content, VSD & FRIA, Accessibilità, Fair Pattern Audit |
| `#laboratorio` | Art. 4: slider prima/dopo, dark vs fair pattern, dalla norma alla user story |
| `#metodo` | Art. 5: Discovery, Co-design, Build, Rilascio e cura |
| `#valore` | Art. 6: valore di business e confronto con la consulenza tradizionale |
| `#checkup` | Autovalutazione "compliant o virtuoso?" con timbro finale |
| `#faq` | Art. 7: domande frequenti |
| `#contatti` | Modulo per la Discovery Call |

## Prima di andare online

1. **Dati dello studio.** Verifica l'indirizzo `ciao@legalproductstudio.tech` (compare in `index.html` e nell'attributo `data-email` del modulo) e sostituisci `P.IVA 00000000000` nel footer e `[ragione sociale e indirizzo]` nella finestra "Privacy in breve".
2. **Modulo contatti.** Senza configurazione apre il programma di posta del visitatore con la richiesta già compilata. Per ricevere le richieste direttamente, imposta nel `<form id="contact-form">` l'attributo `data-endpoint` con l'URL di un servizio di form (per esempio Formspree): il modulo invierà i dati in POST.
3. **Marchio.** Il wordmark "Legal Product Studio" è composto nel carattere del sito (Atkinson Hyperlegible) per restare leggibile. Se preferisci il logo ufficiale di legalproductstudio.tech, sostituisci `.brand-name` con il file del logo e un `alt` "Legal Product Studio".
4. **Contenuti legali.** I riferimenti normativi (art. 7 e 83 GDPR, art. 50 e 99 AI Act, Direttiva (UE) 2019/882 e D.Lgs. 82/2022, art. 33 Codice del Consumo, linee guida EDPB e Garante) vanno fatti rivedere dal giurista dello studio prima della pubblicazione.

## Scelte di progetto

- **Il sito pratica ciò che vende.** Nessun cookie, nessun tracker, nessuna richiesta a terze parti (i font sono ospitati in locale), navigazione da tastiera, link "Vai al contenuto", focus visibile e mai coperto dalle barre fisse, pulsanti da almeno 44 px, carosello che non si annuncia da solo e si mette in pausa, rispetto di `prefers-reduced-motion`. Verificato con axe-core (WCAG 2.2 AA, nessuna violazione).
- **Tipografia.** Un solo carattere, Atkinson Hyperlegible, progettato dal Braille Institute per chi ha una vista ridotta: titoli in grassetto, niente corsivi, niente maiuscole spaziate, nessun testo sotto i 14 px. Una sola scala fluida dal telefono al desktop: etichette 14, testo secondario 16, testo corrente 17→18, introduzioni 18→21, titoli di schede 22→28, titoli di sezione 30→48, hero 38→68 (token `--t-*` in `styles.css`). Il barrato compare solo su parole brevi del motivo "revisioni"; i testi lunghi restano sempre leggibili.
- **Contrasti.** Tutte le coppie testo/sfondo superano WCAG 2.2 AA in entrambi i temi e, per il testo corrente, la soglia APCA Lc 60. I bordi dei campi del modulo superano 3:1.
- **Tema.** Un solo tema chiaro, anche su dispositivi impostati in modalità scura.
- **Animazioni.** In stile Apple, con curve di easing morbide: l'hero entra in sequenza, i contenuti salgono in posizione mentre si scorre (con un leggero sfocato), la frase del manifesto si accende parola per parola, i numeri contano fino al valore, la curva dei costi si disegna da sola, lo slider prima/dopo fa una passata dimostrativa e il riquadro dell'hero si allontana scorrendo. Senza JavaScript o con "riduci movimento" attivo tutto è visibile e fermo.
- **Linguaggio visivo.** La pagina è uno "statuto in revisione": articoli e commi, testo barrato in rosso e inserimenti in blu come nelle revisioni di un documento, commenti a margine del team, timbro finale.

## Pubblicazione

Funziona su qualsiasi hosting statico. Il file `.nojekyll` dice a GitHub Pages di servire i file così come sono.

Con GitHub Pages:

1. Apri *Settings → Pages* del repository.
2. In *Build and deployment* scegli *Source: Deploy from a branch*.
3. Seleziona il branch con il sito e la cartella `/ (root)`, poi *Save*.

Dopo uno o due minuti il sito è online su `https://mikpozzo93.github.io/sitoweb2/`. Se colleghi un dominio tuo (per esempio `legalproductstudio.tech`), aggiorna anche `og:url` e `og:image` in `index.html`.
