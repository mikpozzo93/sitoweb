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
        const link = byId.get(entry.target.id);
        if (!link) return;
        navLinks.forEach((a) => { if (a.getAttribute('aria-current') !== 'page') a.removeAttribute('aria-current'); });
        link.setAttribute('aria-current', 'true');
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

  /* ---------- Tabs: each tablist is its own group ---------- */
  const selectTab = (tab, focus) => {
    const group = $$('[role="tab"]', tab.closest('[role="tablist"]'));
    group.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  $$('[role="tablist"]').forEach((list) => {
    const group = $$('[role="tab"]', list);
    group.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(tab, false));
      tab.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: group.length - 1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        selectTab(group[(keys[e.key] + group.length) % group.length], true);
      });
    });
  });

  // A link to something inside a closed tab or fold opens it first, then scrolls there.
  const reveal = (id) => {
    const target = id && /^[A-Za-z][\w-]*$/.test(id) ? document.getElementById(id) : null;
    if (!target) return false;
    let opened = false;
    for (let panel = target.closest('[role="tabpanel"][hidden]'); panel; panel = panel.parentElement && panel.parentElement.closest('[role="tabpanel"][hidden]')) {
      const tab = document.querySelector(`[role="tab"][aria-controls="${panel.id}"]`);
      if (tab) { selectTab(tab, false); opened = true; }
    }
    const fold = target.closest('details:not([open])');
    if (fold) { fold.open = true; opened = true; }
    if (opened) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    return opened;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && reveal(a.getAttribute('href').slice(1))) e.preventDefault();
  });
  reveal(location.hash.slice(1));
  window.addEventListener('hashchange', () => reveal(location.hash.slice(1)));

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
    const wanted = location.hash.slice(1);
    if (/^[a-z0-9]+$/.test(wanted)) {
      const box = form.querySelector(`input[type="checkbox"][data-service="${wanted}"]`);
      if (box) box.checked = true;
    }
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

  /* ---------- Workshop: register interest ---------- */
  const wsForm = $('#ws-form');
  if (wsForm) {
    const wsStatus = $('#ws-status');
    const wsEmail = wsForm.dataset.email;
    const say = (msg) => { wsStatus.textContent = msg; wsStatus.hidden = false; };

    wsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = [$('#w-name'), $('#w-email')];
      let firstInvalid = null;
      fields.forEach((f) => {
        const ok = f.value.trim() !== '' && f.checkValidity();
        f.setAttribute('aria-invalid', String(!ok));
        if (ok) f.removeAttribute('aria-describedby'); else f.setAttribute('aria-describedby', 'ws-status');
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        say(firstInvalid.id === 'w-email' && firstInvalid.value.trim()
          ? "Controlla l'email: sembra incompleta, per esempio manca la @."
          : 'Inserisci nome ed email di lavoro, così posso avvisarti.');
        firstInvalid.focus();
        return;
      }

      if (isPreview) {
        say("Questa è un'anteprima: il modulo non invia dati. Sul sito pubblicato l'iscrizione arriva direttamente allo studio.");
        return;
      }

      const data = new FormData(wsForm);
      const endpoint = wsForm.dataset.endpoint;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(String(res.status));
          wsForm.reset();
          say('Fatto: sei nella lista. Ti scrivo appena sono fissati data e luogo.');
          return;
        } catch (err) {
          say(`Non sono riuscito a registrare la richiesta. Riprova tra poco oppure scrivi a ${wsEmail}.`);
          return;
        }
      }

      const temi = data.getAll('temi');
      const body = [
        `Nome: ${data.get('nome')}`,
        `Email: ${data.get('email')}`,
        `Azienda: ${data.get('azienda') || '-'}`,
        `Ruolo: ${data.get('ruolo') || '-'}`,
        `Persone dal team: ${data.get('persone') || '-'}`,
        `Temi di interesse: ${temi.length ? temi.join(', ') : '-'}`
      ].join('\n');
      const subject = `Workshop · ${data.get('azienda') || data.get('nome')}`;
      window.location.href = `mailto:${wsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      say(`Ho preparato l'email nel tuo programma di posta: inviala per completare l'iscrizione. Se non si è aperto, scrivi a ${wsEmail}.`);
    });

    $$('#w-name, #w-email').forEach((f) => f.addEventListener('input', () => {
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
    const top = $('#top') || $('main h1');
    const contact = $('#contatti');
    const seen = { top: true, contact: false };
    const sync = () => mobileCta.classList.toggle('is-visible', !seen.top && !seen.contact);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === top) seen.top = entry.isIntersecting;
        if (entry.target === contact) seen.contact = entry.isIntersecting;
      });
      sync();
    });
    if (top) io.observe(top);
    if (contact) io.observe(contact);
  }

  /* ---------- Motion: reveals, count-ups, lit statement, slider pass ----------
     Runs only when the inline bootstrap added "motion" (no reduced-motion request). */
  if (document.documentElement.classList.contains('motion')) {
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

    const countUp = (dt) => {
      const final = dt.textContent.trim();
      const m = final.match(/^(\d+)(.*)$/);
      if (!m) return;
      const target = Number(m[1]);
      const suffix = m[2];
      dt.textContent = '';
      const shown = document.createElement('span');
      shown.setAttribute('aria-hidden', 'true');
      const spoken = document.createElement('span');
      spoken.className = 'sr-only';
      spoken.textContent = final;
      dt.append(shown, spoken);
      const t0 = performance.now() + 250;
      const tick = (t) => {
        const k = Math.min(1, Math.max(0, (t - t0) / 1400));
        shown.textContent = `${Math.round(target * (1 - Math.pow(1 - k, 3)))}${suffix}`;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    // The before/after slider sweeps once into place, unless the visitor got there first.
    let touched = false;
    if (range) ['pointerdown', 'keydown'].forEach((ev) => range.addEventListener(ev, () => { touched = true; }));
    const sweep = () => {
      if (!range || touched) return;
      const end = Number(range.value);
      const start = Math.min(96, end + 40);
      const t0 = performance.now() + 450;
      const set = (v) => { range.value = String(Math.round(v)); range.dispatchEvent(new Event('input')); };
      const step = (t) => {
        if (touched) return;
        const k = Math.min(1, Math.max(0, (t - t0) / 1500));
        set(start + (end - start) * ease(k));
        if (k < 1) requestAnimationFrame(step);
      };
      set(start);
      requestAnimationFrame(step);
    };

    const groups = [
      ['.article-head > div:first-child, .section-head, .manifesto-copy, .value-copy, .checkup-intro, .band-copy, .lab-intro, .service-strip, .compare-table-wrap, .footer-mark, .formulas-head, .workshop-copy, .about-copy, .about-not > .h3', 'single'],
      ['.margin-notes .comment, .pain, .stake, .comma, .service, .step, .value, .q, .faq, .formula, .topic', 'stagger'],
      ['.cost-chart, .team, .compare, .pattern, .story, .contact, .about-card', 'scale'],
    ];
    const targets = [];
    groups.forEach(([sel, kind]) => $$(sel).forEach((el) => {
      if (el.closest('.hero') || el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', kind === 'scale' ? 'scale' : '');
      if (kind === 'stagger') {
        const i = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.setProperty('--d', `${Math.min(i, 6) * 0.09}s`);
      }
      targets.push(el);
    }));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-in');
        if (el.classList.contains('stake')) countUp(el.querySelector('dt'));
        if (el === compare) sweep();
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach((el) => io.observe(el));

    // Manifesto statement: words light up as it travels up the screen.
    const statement = $('#statement');
    if (statement) {
      const words = statement.textContent.trim().split(/\s+/);
      statement.textContent = '';
      words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = w;
        statement.append(span);
        if (i < words.length - 1) statement.append(' ');
      });
      const spans = $$('.w', statement);
      let lit = -1;
      let ticking = false;
      const update = () => {
        ticking = false;
        const r = statement.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const n = Math.round(p * spans.length);
        if (n === lit) return;
        spans.forEach((s, i) => s.classList.toggle('is-lit', i < n));
        lit = n;
      };
      const onScrollLit = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScrollLit, { passive: true });
      window.addEventListener('resize', onScrollLit);
      update();
    }
  }

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
