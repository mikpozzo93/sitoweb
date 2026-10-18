(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPreview = document.documentElement.dataset.preview === 'true';

  /* ---------- Header: scrolled state, mobile menu, current section ---------- */
  const header = $('#site-header');
  const nav = $('#main-nav');
  const navToggle = $('#nav-toggle');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.querySelector('.nav-toggle-label').textContent = open ? 'Chiudi' : 'Menu';
  };
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); navToggle.focus(); }
  });

  const navLinks = $$('.main-nav ul a');
  if ('IntersectionObserver' in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute('aria-current'));
        const link = byId.get(entry.target.id);
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- Readability: Gulpease index for Italian text ----------
     G = 89 + (300 × frasi − 10 × lettere) / parole. 0–100, higher is easier. */
  const readability = (text) => {
    const words = text.match(/[A-Za-zÀ-ÿ0-9’']+/g) || [];
    const letters = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    const sentences = Math.max(1, (text.match(/[.!?]+(?=\s+[A-ZÀ-Ý«"]|\s*$)/g) || []).length);
    const gulpease = Math.round(89 + (300 * sentences - 10 * letters) / Math.max(1, words.length));
    const seconds = Math.max(1, Math.round((words.length / 200) * 60));
    return { words: words.length, gulpease: Math.min(100, Math.max(0, gulpease)), seconds };
  };

  /* ---------- Hero: legalese redlined into plain Italian ---------- */
  const examples = [
    {
      file: 'informativa_privacy_v7.docx',
      before: "Il Titolare del trattamento, ai sensi e per gli effetti dell'art. 13 del Regolamento (UE) 2016/679, informa l'Interessato che i dati personali dal medesimo conferiti saranno oggetto di trattamento, con modalità prevalentemente informatizzate, per le finalità connesse all'esecuzione degli obblighi contrattuali di cui al successivo punto 3.2, lett. b), nonché per l'adempimento degli obblighi di legge cui il Titolare è soggetto.",
      after: 'Usiamo i tuoi dati per gestire il tuo ordine. Li usiamo anche per rispettare la legge, per esempio sulle fatture. Lo facciamo soprattutto con strumenti digitali.',
      comment: "Stesse informazioni richieste dall'art. 13 GDPR, in meno della metà delle parole. Il dettaglio resta disponibile al secondo livello."
    },
    {
      file: 'consensi_marketing_v3.docx',
      before: 'Il consenso al trattamento per finalità di marketing diretto ha natura facoltativa e potrà essere revocato in qualsiasi momento mediante comunicazione scritta da inoltrarsi a mezzo raccomandata con avviso di ricevimento presso la sede legale del Titolare, fermo restando la liceità del trattamento effettuato anteriormente alla revoca.',
      after: 'Le email promozionali sono facoltative. Puoi disattivarle quando vuoi da Impostazioni, con un tap. La scelta vale da quel momento in poi.',
      comment: "Revocare il consenso deve essere facile quanto darlo (art. 7, par. 3 GDPR). Una raccomandata A/R non lo è."
    },
    {
      file: 'condizioni_generali_v12.docx',
      before: "Il Fornitore si riserva la facoltà di modificare, integrare o aggiornare unilateralmente, in tutto o in parte, le presenti Condizioni Generali in qualsiasi momento e senza obbligo di preavviso, restando inteso che l'utilizzo del Servizio successivamente a tali modifiche costituirà accettazione delle stesse da parte dell'Utente.",
      after: "Se cambiamo queste condizioni, ti avvisiamo via email 30 giorni prima. Ti spieghiamo cosa cambia. Se non sei d'accordo, puoi chiudere l'account senza costi.",
      comment: 'Cambiare le condizioni senza preavviso né motivo è una clausola presunta vessatoria (art. 33 Codice del Consumo). Riscritta, è più chiara e più solida.'
    }
  ];

  const revision = $('#revision');
  if (revision) {
    const el = {
      file: $('#rev-file'), before: $('#rev-old'), after: $('#rev-new'), comment: $('#rev-comment'),
      gOld: $('#rev-g-old'), gNew: $('#rev-g-new'), wOld: $('#rev-w-old'), wNew: $('#rev-w-new'),
      tOld: $('#rev-t-old'), tNew: $('#rev-t-new'), count: $('#rev-count'),
      prev: $('#rev-prev'), next: $('#rev-next'), play: $('#rev-play')
    };
    let index = 0;
    let timer = null;
    let userPaused = reduceMotion;
    let hoverPaused = false;

    const render = (i, animate) => {
      const ex = examples[i];
      const a = readability(ex.before);
      const b = readability(ex.after);
      el.file.textContent = ex.file;
      el.before.textContent = ex.before;
      el.after.textContent = ex.after;
      el.comment.textContent = ex.comment;
      el.gOld.textContent = a.gulpease;
      el.gNew.textContent = b.gulpease;
      el.wOld.textContent = a.words;
      el.wNew.textContent = b.words;
      el.tOld.textContent = `${a.seconds} s`;
      el.tNew.textContent = `${b.seconds} s`;
      el.count.textContent = `${i + 1} / ${examples.length}`;
      if (animate && !reduceMotion) {
        revision.classList.remove('is-swapping');
        void revision.offsetWidth;
        revision.classList.add('is-swapping');
      }
    };
    const go = (step) => {
      index = (index + step + examples.length) % examples.length;
      render(index, true);
    };
    const body = $('#rev-body');
    // Announce changes only when the visitor asked for them, never on auto-rotation.
    const announce = (on) => body.setAttribute('aria-live', on ? 'polite' : 'off');
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      if (!userPaused && !hoverPaused) timer = setInterval(() => { announce(false); go(1); }, 8000);
    };
    const syncPlayButton = () => {
      el.play.setAttribute('aria-pressed', String(userPaused));
      el.play.setAttribute('aria-label', userPaused ? 'Avvia la rotazione automatica' : 'Metti in pausa la rotazione automatica');
      el.play.querySelector('use').setAttribute('href', userPaused ? '#i-play' : '#i-pause');
    };

    el.prev.addEventListener('click', () => { announce(true); go(-1); start(); });
    el.next.addEventListener('click', () => { announce(true); go(1); start(); });
    el.play.addEventListener('click', () => { userPaused = !userPaused; syncPlayButton(); start(); });
    revision.addEventListener('mouseenter', () => { hoverPaused = true; stop(); });
    revision.addEventListener('mouseleave', () => { hoverPaused = false; start(); });
    revision.addEventListener('focusin', () => { hoverPaused = true; stop(); });
    revision.addEventListener('focusout', (e) => {
      if (!revision.contains(e.relatedTarget)) { hoverPaused = false; start(); }
    });

    render(0, false);
    syncPlayButton();
    start();
  }

  /* ---------- Manifesto: who gets what from the team ---------- */
  const roles = {
    legal: ['Giurista designer', "Si immedesima nell'utente finale e traduce le norme in scelte di prodotto. Siede al tavolo dal primo giorno, non alla fine."],
    po: ['Product owner', 'Requisiti legali chiari prima della stima, già scritti come user story e pronti per la prioritizzazione.'],
    ux: ['UX/UI designer', "Vincoli trasformati in pattern d'interfaccia, invece di muri da aggirare a fine progetto."],
    dev: ['Sviluppatori', 'Acceptance criteria verificabili al posto di pareri da interpretare. Meno rework, più codice che resta.'],
    biz: ['Business', 'Time-to-market protetto, rischio ridotto e un brand di cui le persone si fidano.']
  };
  const teamNodes = $$('.team-node');
  teamNodes.forEach((btn) => {
    btn.addEventListener('click', () => {
      const [role, text] = roles[btn.dataset.role];
      teamNodes.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      $('#team-role').textContent = role;
      $('#team-text').textContent = text;
    });
  });

  /* ---------- Lab 4.1: before / after slider ---------- */
  const compare = $('#compare');
  const range = $('#compare-range');
  if (compare && range) {
    const update = () => {
      compare.style.setProperty('--pos', `${range.value}%`);
      range.setAttribute('aria-valuetext', `Informativa tradizionale ${range.value}%, informativa progettata ${100 - range.value}%`);
    };
    // On phones the halves are too narrow to read side by side: open on the "before"
    // page with a sliver of the "after", so the drag tells the story.
    if (window.matchMedia('(max-width: 699px)').matches) range.value = '82';
    range.addEventListener('input', update);
    update();
  }

  /* ---------- Lab 4.2: dark vs fair pattern ---------- */
  const pattern = $('#pattern');
  const bannerAlt = {
    dark: 'Banner cookie con dark pattern: un grande pulsante Accetta e continua, caselle già spuntate e un piccolo link altre opzioni al posto del pulsante Rifiuta.',
    fair: 'Banner cookie con fair pattern: pulsanti Rifiuta tutto e Accetta tutto della stessa dimensione, interruttori spenti con lo scopo di ogni cookie e un pulsante Chiudi e rifiuta.'
  };
  $$('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.pattern;
      $$('.seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      pattern.dataset.mode = mode;
      $('#browser').setAttribute('aria-label', bannerAlt[mode]);
      $('#cookie-dark').hidden = mode !== 'dark';
      $('#notes-dark').hidden = mode !== 'dark';
      $('#cookie-fair').hidden = mode !== 'fair';
      $('#notes-fair').hidden = mode !== 'fair';
    });
  });

  /* ---------- Lab 4.3: tabs ---------- */
  const tabs = $$('[role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab, false));
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      selectTab(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- Self-assessment: compliant or virtuoso ---------- */
  const quiz = $('#quiz');
  if (quiz) {
    const total = 5;
    const stamp = $('#stamp');
    const out = {
      word: $('#stamp-word'), score: $('#stamp-score'), title: $('#stamp-title'),
      text: $('#stamp-text'), cta: $('#stamp-cta')
    };
    const results = {
      virtuoso: ['Virtuoso', 'Siete avanti.', 'Avete già messo le persone al centro. Possiamo aiutarvi a trasformare questo vantaggio in un tratto distintivo del brand.'],
      compliant: ['Compliant', 'Compliant, per ora.', 'Le basi ci sono, ma i rischi si nascondono nei dettagli dei flussi. In una Discovery Call li troviamo insieme.'],
      rischio: ['A rischio', 'Meglio parlarne adesso.', 'Alcuni vincoli rischiano di emergere tardi, quando costano di più. Affrontiamoli prima del prossimo sprint.']
    };
    let lastState = 'empty';

    const evaluate = () => {
      const data = new FormData(quiz);
      let answered = 0;
      let score = 0;
      for (let q = 1; q <= total; q += 1) {
        const v = data.get(`q${q}`);
        if (v !== null) { answered += 1; score += Number(v); }
      }
      if (answered < total) {
        stamp.dataset.state = 'empty';
        out.word.textContent = 'In attesa';
        out.score.textContent = `${answered} / ${total} risposte`;
        out.title.textContent = answered === 0 ? 'Rispondi alle cinque domande.' : `Ancora ${total - answered} ${total - answered === 1 ? 'domanda' : 'domande'}.`;
        out.text.textContent = 'Il risultato compare qui appena hai finito.';
        out.cta.hidden = true;
        lastState = 'empty';
        return;
      }
      const state = score >= 8 ? 'virtuoso' : score >= 4 ? 'compliant' : 'rischio';
      const [word, title, text] = results[state];
      stamp.dataset.state = state;
      out.word.textContent = word;
      out.score.textContent = `${score} / ${total * 2} punti`;
      out.title.textContent = title;
      out.text.textContent = text;
      out.cta.hidden = false;
      if (state !== lastState && !reduceMotion) {
        stamp.classList.remove('is-stamping');
        void stamp.offsetWidth;
        stamp.classList.add('is-stamping');
      }
      lastState = state;
    };
    quiz.addEventListener('change', evaluate);
    quiz.addEventListener('reset', () => setTimeout(evaluate, 0));
    quiz.addEventListener('submit', (e) => e.preventDefault());
    evaluate();
  }

  /* ---------- Contact: preselect service, validate, send ---------- */
  const form = $('#contact-form');
  $$('.service-cta[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const box = form && form.querySelector(`input[type="checkbox"][data-service="${link.dataset.service}"]`);
      if (box) box.checked = true;
    });
  });

  if (form) {
    const status = $('#form-status');
    const email = form.dataset.email;
    const showStatus = (msg) => { status.textContent = msg; status.hidden = false; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = [$('#f-name'), $('#f-email')];
      let firstInvalid = null;
      fields.forEach((f) => {
        const ok = f.value.trim() !== '' && f.checkValidity();
        f.setAttribute('aria-invalid', String(!ok));
        if (ok) f.removeAttribute('aria-describedby'); else f.setAttribute('aria-describedby', 'form-status');
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        showStatus(firstInvalid.id === 'f-email' && firstInvalid.value.trim()
          ? "Controlla l'email: sembra incompleta, per esempio manca la @."
          : 'Inserisci nome ed email di lavoro, così possiamo risponderti.');
        firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      const services = data.getAll('servizi');

      if (isPreview) {
        showStatus("Questa è un'anteprima: il modulo non invia dati. Sul sito pubblicato la richiesta arriva direttamente allo studio.");
        return;
      }

      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          showStatus('Richiesta ricevuta. Ti rispondiamo entro due giorni lavorativi per fissare la call.');
          return;
        } catch (err) {
          showStatus(`Non siamo riusciti a inviare la richiesta. Riprova tra poco oppure scrivici a ${email}.`);
          return;
        }
      }

      const body = [
        `Nome: ${data.get('nome')}`,
        `Email: ${data.get('email')}`,
        `Azienda e prodotto: ${data.get('azienda') || '-'}`,
        `Servizi di interesse: ${services.length ? services.join(', ') : '-'}`,
        '',
        String(data.get('messaggio') || '')
      ].join('\n');
      const subject = `Discovery Call · ${data.get('azienda') || data.get('nome')}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showStatus(`Abbiamo preparato l'email nel tuo programma di posta. Se non si è aperto, scrivici a ${email}.`);
    });

    $$('#f-name, #f-email').forEach((f) => f.addEventListener('input', () => {
      if (f.getAttribute('aria-invalid') === 'true' && f.value.trim() && f.checkValidity()) {
        f.setAttribute('aria-invalid', 'false');
        f.removeAttribute('aria-describedby');
      }
    }));
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $('#copy-email');
  if (copyBtn) {
    const label = copyBtn.querySelector('span');
    const target = $('#contact-email');
    copyBtn.addEventListener('click', () => {
      const done = (msg) => { label.textContent = msg; setTimeout(() => { label.textContent = 'Copia'; }, 2200); };
      const selectText = () => {
        const range = document.createRange();
        range.selectNodeContents(target);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        done('Selezionata');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(target.textContent.trim()).then(() => done('Copiata'), selectText);
      } else {
        selectText();
      }
    });
  }

  /* ---------- Privacy dialog ---------- */
  const dialog = $('#privacy-dialog');
  $$('[data-open-privacy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });
  if (dialog) {
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  }

  /* ---------- Mobile sticky CTA ---------- */
  const mobileCta = $('#mobile-cta');
  if (mobileCta && 'IntersectionObserver' in window) {
    const seen = { hero: true, contact: false };
    const sync = () => mobileCta.classList.toggle('is-visible', !seen.hero && !seen.contact);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === 'top') seen.hero = entry.isIntersecting;
        if (entry.target.id === 'contatti') seen.contact = entry.isIntersecting;
      });
      sync();
    });
    io.observe($('#top'));
    io.observe($('#contatti'));
  }

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
