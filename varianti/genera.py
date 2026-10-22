"""Build the two site variants from the current one-page site (run: python3 varianti/genera.py).

A: several pages (home + Approccio, Servizi, Laboratorio, Workshop, Chi sono, Contatti)
B: one compact page (tabs for services and lab, folds for detail)

Content is cut from index.html verbatim; only structure and links change.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = (ROOT / 'index.html').read_text()


def between(text, start, end, keep_end=False):
    i = text.index(start)
    j = text.index(end, i + len(start))
    return text[i:j + (len(end) if keep_end else 0)]


# ---------- pieces of the current page ----------
HEAD = SRC[:SRC.index('<body>')]
BODY_START = between(SRC, '<!-- BODY:START -->', '<header class="site-header"')
FOOTER = between(SRC, '<footer class="site-footer">', '</footer>\n', keep_end=True)
DIALOG = between(SRC, '<!-- Replace the bracketed', '</dialog>\n', keep_end=True)
SECTIONS = {m.group(2): m.group(1) for m in re.finditer(
    r'(  <!-- [^\n]+ -->\n  <section [^>]*?id="([\w-]+)"[\s\S]*?\n  </section>\n)', SRC)}
assert set(SECTIONS) >= {'top', 'problema', 'manifesto', 'servizi', 'workshop', 'laboratorio', 'metodo',
                         'valore', 'chi-sono', 'checkup', 'faq', 'contatti'}, SECTIONS.keys()

ARROW = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>'


def head(title, desc, prefix='../../'):
    h = HEAD.replace('<title>Legal Product Studio · Law, by design.</title>', f'<title>{title}</title>')
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', h)
    h = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{title}">', h)
    h = h.replace('href="assets/', f'href="{prefix}assets/')
    h = h.replace('  <meta name="theme-color"', '  <meta name="robots" content="noindex">\n  <meta name="theme-color"')
    return h


def promote_h1(section):
    """The first section title of an inner page becomes the page's h1; the headings under it move up a level."""
    section = re.sub(r'<(/?)h([34])\b', lambda m: f'<{m.group(1)}h{int(m.group(2)) - 1}', section)
    return re.sub(r'<h2 class="(h2[^"]*)" id="([\w-]+)">(.*?)</h2>', r'<h1 class="\1" id="\2">\3</h1>', section, count=1)


def page(title, desc, header, main, footer, cta=True, prefix='../../', compact=False):
    if not cta:
        footer = re.sub(r'  <a class="mobile-cta"[^\n]*\n', '', footer)
    return (head(title, desc, prefix) + '<body>\n' + BODY_START + header + '\n<main id="contenuto"' + (' class="compact"' if compact else '') + '>\n\n' + main
            + '</main>\n\n' + footer + '\n' + DIALOG + '<!-- BODY:END -->\n\n'
            + f'<script src="{prefix}assets/js/main.js" defer></script>\n</body>\n</html>\n')


# ======================================================================
# Variant A: several pages
# ======================================================================
PAGE_OF = {
    'top': 'index.html', 'problema': 'approccio.html', 'manifesto': 'approccio.html', 'metodo': 'approccio.html',
    'valore': 'approccio.html', 'servizi': 'servizi.html', 'formule': 'servizi.html', 'workshop': 'workshop.html',
    'ws-form': 'workshop.html', 'laboratorio': 'laboratorio.html', 'lab-compare': 'laboratorio.html',
    'lab-pattern': 'laboratorio.html', 'lab-story': 'laboratorio.html', 'checkup': 'laboratorio.html',
    'chi-sono': 'chi-sono.html', 'faq': 'contatti.html', 'contatti': 'contatti.html',
}
PAGE_ROOTS = {'top', 'servizi', 'workshop', 'laboratorio', 'chi-sono', 'contatti'}


def links_a(html, current):
    def swap(m):
        anchor = m.group(1)
        target = PAGE_OF.get(anchor)
        if anchor.startswith('i-') or target is None:
            return m.group(0)
        if target == current:
            return f'href="#{anchor}"'
        return f'href="{target}"' if anchor in PAGE_ROOTS else f'href="{target}#{anchor}"'
    html = re.sub(r'href="#([A-Za-z][\w-]*)"', swap, html)
    # a service's "Parliamone" preselects it on the contact page
    html = re.sub(r'href="contatti\.html" data-service="(\w+)"', r'href="contatti.html#\1" data-service="\1"', html)
    # links that now leave the page point sideways, not down
    html = re.sub(r'(href="[\w-]+\.html[^"]*">[^<]*)<svg aria-hidden="true"><use href="#i-down"/></svg>',
                  r'\1' + ARROW, html)
    return html


def renumber_a(html):
    """Articles follow the menu order across pages."""
    for old, new in [('Art. 5</span> Metodo', 'Art. 3</span> Metodo'),
                     ('Art. 6</span> Perché sceglierci', 'Art. 4</span> Perché sceglierci'),
                     ('Art. 3</span> Servizi', 'Art. 5</span> Servizi'),
                     ('Art. 4</span> Laboratorio', 'Art. 6</span> Laboratorio')]:
        html = html.replace(old, new)
    for n in ('1', '2', '3'):
        html = html.replace(f'<p class="lab-num">4.{n}</p>', f'<p class="lab-num">6.{n}</p>')
    return html


NAV_A = [('approccio.html', 'Approccio'), ('servizi.html', 'Servizi'), ('laboratorio.html', 'Laboratorio'),
         ('workshop.html', 'Workshop'), ('chi-sono.html', 'Chi sono')]


def header_a(current):
    items = '\n'.join(
        f'        <li><a href="{href}"{" aria-current=\"page\"" if href == current else ""}>{label}</a></li>'
        for href, label in NAV_A)
    return f'''<header class="site-header" id="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="index.html" aria-label="Legal Product Studio, vai alla home">
      <span class="brand-mark" aria-hidden="true">§</span>
      <span class="brand-name">Legal Product <span class="brand-studio">Studio</span></span>
    </a>
    <nav class="main-nav" id="main-nav" aria-label="Navigazione principale">
      <ul>
{items}
      </ul>
      <a class="btn btn-primary btn-small nav-cta" href="contatti.html">Prenota una call</a>
    </nav>
    <button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">
      <span class="nav-toggle-bars" aria-hidden="true"></span>
      <span class="nav-toggle-label">Menu</span>
    </button>
  </div>
</header>
'''


FOOTER_A = FOOTER.replace(between(FOOTER, '      <nav class="footer-nav" aria-label="Studio">', '    <div class="footer-bottom">'),
                          '''      <nav class="footer-nav" aria-label="Studio">
        <p class="footer-h">Studio</p>
        <ul>
          <li><a href="approccio.html">Approccio</a></li>
          <li><a href="servizi.html">Servizi</a></li>
          <li><a href="workshop.html">Workshop</a></li>
          <li><a href="chi-sono.html">Chi sono</a></li>
          <li><a href="contatti.html#faq">FAQ</a></li>
        </ul>
      </nav>
      <nav class="footer-nav" aria-label="Laboratorio">
        <p class="footer-h">Laboratorio</p>
        <ul>
          <li><a href="laboratorio.html#lab-compare">Prima e dopo</a></li>
          <li><a href="laboratorio.html#lab-pattern">Dark e fair pattern</a></li>
          <li><a href="laboratorio.html#lab-story">Dalla norma alla user story</a></li>
          <li><a href="laboratorio.html#checkup">Autovalutazione</a></li>
        </ul>
      </nav>
      <div class="footer-nav">
        <p class="footer-h">Contatti</p>
        <ul>
          <li><a href="workshop.html#ws-form">Iscriviti al workshop</a></li>
          <li><a href="contatti.html">Prenota una call</a></li>
          <li><span class="footer-email">info@legalproductstudio.tech</span></li>
          <li><button type="button" class="link-btn" data-open-privacy>Privacy in breve</button></li>
        </ul>
      </div>
    </div>
''')


def page_a(name, title, desc, main, cta=True):
    html = page(title, desc, header_a(name), renumber_a(main), FOOTER_A, cta=cta, compact=(name == 'index.html'))
    return links_a(html, name)


# ---- home: short summaries that lead to the inner pages ----
S = SECTIONS
problem_lead = re.search(r'<p class="lead">.*?</p>', S['problema']).group(0)
stakes = between(S['problema'], '<dl class="stakes">', '</dl>', keep_end=True).replace(
    '<dl class="stakes">', '<dl class="stakes stakes-row">')
statement = re.search(r'<p class="statement" id="statement">.*?</p>', S['manifesto']).group(0)
services = re.findall(r'<article class="service">[\s\S]*?</article>', S['servizi'])
SVC_KEYS = ['copilot', 'design', 'vsd', 'a11y']
assert len(services) == 4


def teaser_from_service(article, key):
    tag = re.search(r'<p class="service-tag">.*?</p>', article).group(0)
    title = re.search(r'<h3 class="service-title"( lang="en")?>(.*?)</h3>', article)
    desc = re.search(r'<p class="service-desc">(.*?)</p>', article).group(1)
    return f'''        <article class="teaser">
          {tag}
          <h3{title.group(1) or ""}>{title.group(2)}</h3>
          <p>{desc}</p>
          <a href="servizi.html#svc-{key}">Scopri il servizio<span class="sr-only">: {re.sub("<.*?>", "", title.group(2))}</span> {ARROW}</a>
        </article>
'''


lab = S['laboratorio']
lab_intro = {k: re.search(rf'<div class="lab-block" id="{k}">\s*<div class="lab-intro">\s*<p class="lab-num">.*?</p>\s*<h3 class="h3">(.*?)</h3>\s*<p>(.*?)</p>', lab, re.S)
             for k in ('lab-compare', 'lab-pattern', 'lab-story')}
checkup_title = re.search(r'<h2 class="h2" id="checkup-title">(.*?)</h2>', S['checkup']).group(1)
checkup_lead = re.search(r'<p class="lead">(.*?)</p>', S['checkup']).group(1)
ws = S['workshop']
ws_eyebrow = re.search(r'<p class="eyebrow">.*?</p>', ws).group(0)
ws_title = re.search(r'<h2 class="h2" id="workshop-title">(.*?)</h2>', ws).group(1)
ws_lead = re.search(r'<p class="lead">(.*?)</p>', ws).group(1)
ws_facts = between(ws, '<dl class="ws-facts">', '</dl>', keep_end=True)
band = S['contatti']
band_eyebrow = re.search(r'<p class="eyebrow eyebrow-band">.*?</p>', band).group(0)
band_title = re.search(r'<h2 class="h2 band-title" id="contatti-title">(.*?)</h2>', band).group(1)
band_lead = re.search(r'<p class="band-lead">.*?</p>', band).group(0)
direct = between(band, '<div class="direct">', '        </div>\n      </div>', keep_end=False) + '        </div>\n'


def lab_teaser(title, text, href, label):
    return f'''        <article class="teaser">
          <h3>{title}</h3>
          <p>{text}</p>
          <a href="{href}">{label} {ARROW}</a>
        </article>
'''


home_main = S['top'].replace('href="#laboratorio">Guarda il prima e dopo', 'href="#lab-compare">Guarda il prima e dopo') + f'''
  <!-- IL PROBLEMA IN BREVE -->
  <section class="section" id="problema" aria-labelledby="problema-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow"><span class="art">Art. 1</span> Il problema</p>
        <h2 class="h2" id="problema-title">Quando il legale arriva alla fine, ogni <em>no</em> costa caro.</h2>
        {problem_lead}
      </div>
      {stakes}
      <a class="more-link" href="approccio.html">Perché conviene cambiare approccio {ARROW}</a>
    </div>
  </section>

  <!-- MANIFESTO IN BREVE -->
  <section class="section section-alt" id="manifesto" aria-labelledby="manifesto-title">
    <div class="wrap">
      <p class="eyebrow"><span class="art">Art. 2</span> Manifesto</p>
      <h2 class="sr-only" id="manifesto-title">Il giurista nel prodotto</h2>
      {statement}
      <a class="more-link" href="approccio.html#manifesto">Leggi il manifesto e i cinque principi {ARROW}</a>
    </div>
  </section>

  <!-- SERVIZI IN BREVE -->
  <section class="section" id="servizi" aria-labelledby="servizi-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow"><span class="art">Art. 3</span> Servizi</p>
        <h2 class="h2" id="servizi-title">Quattro modi per portare il diritto <em>dentro</em> il tuo prodotto.</h2>
      </div>
      <div class="teasers">
{"".join(teaser_from_service(a, k) for a, k in zip(services, SVC_KEYS))}      </div>
      <a class="more-link" href="servizi.html#formule">Le tre formule di collaborazione {ARROW}</a>
    </div>
  </section>

  <!-- LABORATORIO IN BREVE -->
  <section class="section section-alt" id="laboratorio" aria-labelledby="lab-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow"><span class="art">Art. 4</span> Laboratorio</p>
        <h2 class="h2" id="lab-title">Guarda il diritto diventare <em>design</em>.</h2>
        <p class="lead">Tre esempi interattivi e un'autovalutazione da 60 secondi.</p>
      </div>
      <div class="teasers">
{lab_teaser(lab_intro['lab-compare'].group(1), lab_intro['lab-compare'].group(2), 'laboratorio.html#lab-compare', 'Prova lo slider')}{lab_teaser(lab_intro['lab-pattern'].group(1), lab_intro['lab-pattern'].group(2), 'laboratorio.html#lab-pattern', 'Confronta i banner')}{lab_teaser(lab_intro['lab-story'].group(1), lab_intro['lab-story'].group(2), 'laboratorio.html#lab-story', 'Leggi le user story')}{lab_teaser(re.sub('<.*?>', '', checkup_title), checkup_lead, 'laboratorio.html#checkup', 'Fai il test')}      </div>
    </div>
  </section>

  <!-- WORKSHOP IN BREVE -->
  <section class="section section-ws" id="workshop" aria-labelledby="workshop-title">
    <div class="wrap ws-banner">
      <div>
        {ws_eyebrow}
        <h2 class="h2" id="workshop-title">{ws_title}</h2>
        <p class="lead">{ws_lead}</p>
        <div class="cta-actions">
          <a class="btn btn-primary btn-lg" href="workshop.html#ws-form">Tienimi un posto {ARROW}</a>
          <a class="btn btn-ghost btn-lg" href="workshop.html">Il programma</a>
        </div>
      </div>
      {ws_facts}
    </div>
  </section>

  <!-- CONTATTI IN BREVE -->
  <section class="band" id="contatti" aria-labelledby="contatti-title">
    <div class="wrap band-grid">
      <div class="band-copy">
        {band_eyebrow}
        <h2 class="h2 band-title" id="contatti-title">{band_title}</h2>
        {band_lead}
        <div class="cta-actions">
          <a class="btn btn-primary btn-lg" href="contatti.html">Prenota la Discovery Call {ARROW}</a>
        </div>
      </div>
      <div>
{direct}      </div>
    </div>
  </section>
'''

# the home is an index of pages, not the statute: no article numbers on its summaries
home_main = re.sub(r'<p class="eyebrow"><span class="art">Art\. \d</span> ', '<p class="eyebrow">', home_main)

page_hero = lambda eyebrow, title, lead, chips: f'''  <!-- INTESTAZIONE -->
  <section class="page-hero" aria-labelledby="page-title">
    <div class="wrap">
      <p class="eyebrow">{eyebrow}</p>
      <h1 class="h2" id="page-title">{title}</h1>
      <p class="lead">{lead}</p>
      <nav class="page-chips" aria-label="In questa pagina">{"".join(f'<a href="#{a}">{t}</a>' for a, t in chips)}</nav>
    </div>
  </section>

'''

servizi_a = promote_h1(S['servizi'])
for art, key in zip(services, SVC_KEYS):
    servizi_a = servizi_a.replace(art, art.replace('<article class="service">', f'<article class="service" id="svc-{key}">'), 1)

lab_a = promote_h1(S['laboratorio']).replace(
    '<p class="lead">Tre esempi del nostro lavoro. Trascinali, cambiali, mettili alla prova.</p>',
    '<p class="lead">Tre esempi del nostro lavoro. Trascinali, cambiali, mettili alla prova.</p>\n'
    '        <nav class="page-chips" aria-label="In questa pagina"><a href="#lab-compare">Prima e dopo</a>'
    '<a href="#lab-pattern">Dark e fair pattern</a><a href="#lab-story">Dalla norma alla user story</a>'
    '<a href="#checkup">Autovalutazione</a></nav>')
assert 'page-chips' in lab_a

PAGES_A = {
    'index.html': ('Legal Product Studio · Law, by design.',
                   'Legal Product Studio porta il giurista dentro il tuo team di prodotto dal primo giorno.',
                   home_main),
    'approccio.html': ('Approccio · Legal Product Studio',
                       'Perché il legale a fine progetto costa caro, il nostro manifesto, il metodo e il confronto con la consulenza tradizionale.',
                       page_hero('Approccio', 'Il diritto entra nel prodotto quando costa <em>poco</em>.',
                                 'Perché il legale a fine progetto costa caro, come lavoriamo dentro il team e cosa cambia per il tuo business.',
                                 [('problema', 'Il problema'), ('manifesto', 'Manifesto'), ('metodo', 'Metodo'), ('valore', 'Perché sceglierci')])
                       + S['problema'] + S['manifesto'] + S['metodo'] + S['valore']),
    'servizi.html': ('Servizi · Legal Product Studio',
                     'Legal Copilot, Legal Design, Value Sensitive Design e FRIA, accessibilità, Fair Pattern Audit e formule di collaborazione.',
                     servizi_a),
    'laboratorio.html': ('Laboratorio · Legal Product Studio',
                         "Prima e dopo di un'informativa, dark e fair pattern, dalla norma alla user story e autovalutazione.",
                         lab_a + S['checkup']),
    'workshop.html': ('Workshop · Legal Product Studio',
                      'Workshop per le aziende IT del territorio: perché avere un legale nel team di sviluppo di prodotto.',
                      promote_h1(S['workshop'])),
    'chi-sono.html': ('Chi sono · Legal Product Studio',
                      "Avv. Michele Pozzo: dieci anni dentro i team di prodotto digitali.",
                      promote_h1(S['chi-sono'])),
    'contatti.html': ('Contatti · Legal Product Studio',
                      'Prenota una Discovery Call di 30 minuti e leggi le domande frequenti.',
                      promote_h1(S['contatti']) + S['faq']),
}

out_a = ROOT / 'varianti' / 'a'
out_a.mkdir(parents=True, exist_ok=True)
for name, (title, desc, main) in PAGES_A.items():
    (out_a / name).write_text(page_a(name, title, desc, main, cta=(name != 'contatti.html')))

# ======================================================================
# Variant B: one compact page
# ======================================================================
HEADER_B = between(SRC, '<header class="site-header"', '</header>\n', keep_end=True).replace(
    '''        <li><a href="#manifesto">Manifesto</a></li>
        <li><a href="#servizi">Servizi</a></li>
        <li><a href="#workshop">Workshop</a></li>
        <li><a href="#laboratorio">Laboratorio</a></li>''',
    '''        <li><a href="#problema">Approccio</a></li>
        <li><a href="#servizi">Servizi</a></li>
        <li><a href="#laboratorio">Laboratorio</a></li>
        <li><a href="#workshop">Workshop</a></li>''')
assert 'Approccio' in HEADER_B


def fold(fid, title, hint, body):
    return f'''      <details class="fold" id="{fid}">
        <summary><span>{title}<span class="fold-hint">{hint}</span></span></summary>
        <div class="fold-body">
{body}
        </div>
      </details>
'''


# manifesto: statement stays in view, team and principles fold away
man = S['manifesto']
man_copy = between(man, '        <div class="manifesto-copy">', '        </div>\n\n        <div class="team"', keep_end=False)
man_copy = man_copy.replace('        <div class="manifesto-copy">', '      <div class="section-head">') + '      </div>\n'
team = between(man, '        <div class="team" id="team">', '\n      </div>\n\n      <p class="statement"', keep_end=False)
commi = between(man, '      <ol class="commi">', '      </ol>', keep_end=True)
manifesto_b = f'''  <!-- ART. 2 MANIFESTO -->
  <section class="section section-alt" id="manifesto" aria-labelledby="manifesto-title">
    <div class="wrap">
{man_copy}      {statement}
{fold('principi', 'Il team e i cinque principi', 'Chi siede al tavolo e le regole con cui lavoriamo', team + chr(10) + commi)}    </div>
  </section>
'''


def tabset(label, prefix, items, panel_class):
    """items: list of (key, tab label, panel html)."""
    tabs = '\n'.join(
        f'        <button type="button" role="tab" class="tab" id="tab-{prefix}-{k}" aria-controls="panel-{prefix}-{k}" '
        f'aria-selected="{"true" if i == 0 else "false"}"{"" if i == 0 else " tabindex=\"-1\""}>{t}</button>'
        for i, (k, t, _) in enumerate(items))
    panels = '\n'.join(
        f'      <div class="{panel_class}" role="tabpanel" id="panel-{prefix}-{k}" aria-labelledby="tab-{prefix}-{k}" tabindex="0"{"" if i == 0 else " hidden"}>\n{p}\n      </div>'
        for i, (k, _, p) in enumerate(items))
    return f'''      <div class="tabs tabs-major" role="tablist" aria-label="{label}">
{tabs}
      </div>
{panels}
'''


# services: one service at a time
svc = S['servizi']
svc_items = [(k, lbl, '        ' + a.replace('<article class="service">', f'<article class="service" id="svc-{k}">'))
             for a, k, lbl in zip(services, SVC_KEYS, ['Legal Copilot', 'Legal Design', 'VSD e FRIA', 'Accessibilità'])]
svc_block = between(svc, '      <div class="services">', '      <div class="service-strip">', keep_end=False)
servizi_b = svc.replace(svc_block, tabset('Servizi', 'svc', svc_items, 'svc-panel') + '\n')

# lab: one demo at a time, the self-assessment becomes the fourth
labsec = S['laboratorio']
parts = re.split(r'\n      <!-- 4\.\d [^\n]* -->\n', between(labsec, '      <!-- 4.1 Prima / dopo -->', '    </div>\n  </section>', keep_end=False))
lab_blocks = [p.strip('\n') for p in parts if p.strip()]
lab_blocks = [re.sub(r'^      <!-- 4\.1 Prima / dopo -->\n', '', b) for b in lab_blocks]
assert len(lab_blocks) == 3 and 'id="lab-compare"' in lab_blocks[0] and 'id="lab-story"' in lab_blocks[2], [b[:60] for b in lab_blocks]
check = between(S['checkup'], '      <div class="checkup">', '\n    </div>\n  </section>', keep_end=False)
check = check.replace('<div class="checkup">', '<div class="checkup" id="checkup">', 1)
check = re.sub(r'<h2 class="h2" id="checkup-title">(.*?)</h2>', r'<h3 class="h3" id="checkup-title">\1</h3>', check)
lab_head = between(labsec, '      <div class="section-head">', '      <!-- 4.1 Prima / dopo -->', keep_end=False)
lab_items = [('compare', 'Prima e dopo', lab_blocks[0]), ('pattern', 'Dark e fair pattern', lab_blocks[1]),
             ('story', 'Dalla norma alla user story', lab_blocks[2]), ('checkup', 'Autovalutazione', check)]
laboratorio_b = (labsec[:labsec.index('    <div class="wrap">\n') + len('    <div class="wrap">\n')]
                 + lab_head + '      <div class="lab-tabs">\n' + tabset('Esempi del laboratorio', 'lab', lab_items, 'lab-panel')
                 + '      </div>\n    </div>\n  </section>\n')

# workshop: programme folds away, the sign-up form stays visible
wsb = S['workshop']
topics = between(wsb, '        <div class="topics">', '\n        <p class="ws-after">', keep_end=False)
workshop_b = wsb.replace(topics, fold('programma', 'Il programma in cinque temi', 'Cosa vediamo insieme durante la mezza giornata', topics).replace('      <details', '        <details'))

# value: the comparison table folds away
val = S['valore']
table = between(val, '      <div class="compare-table-wrap">', '\n    </div>\n  </section>', keep_end=False)
valore_b = val.replace(table, fold('confronto', 'Confronto con la consulenza tradizionale', 'Sette differenze, riga per riga', table))

main_b = (S['top'] + '\n' + S['problema'] + '\n' + manifesto_b + '\n' + servizi_b + '\n' + laboratorio_b + '\n'
          + workshop_b + '\n' + S['metodo'] + '\n' + valore_b + '\n' + S['chi-sono'] + '\n' + S['faq'] + '\n' + S['contatti'])
html_b = (head('Legal Product Studio · Law, by design.', 'Legal Product Studio porta il giurista dentro il tuo team di prodotto dal primo giorno.')
          + '<body>\n' + BODY_START + HEADER_B + '\n<main id="contenuto" class="compact">\n\n' + main_b + '</main>\n\n' + FOOTER + '\n'
          + DIALOG + '<!-- BODY:END -->\n\n<script src="../../assets/js/main.js" defer></script>\n</body>\n</html>\n')
out_b = ROOT / 'varianti' / 'b'
out_b.mkdir(parents=True, exist_ok=True)
(out_b / 'index.html').write_text(html_b)

# ======================================================================
# Chooser
# ======================================================================
chooser_main = f'''  <section class="page-hero" aria-labelledby="page-title">
    <div class="wrap">
      <p class="eyebrow">Confronto</p>
      <h1 class="h2" id="page-title">Due modi di organizzare il sito.</h1>
      <p class="lead">Stessi contenuti, struttura diversa. Aprile tutte e due, prova a cercare un servizio, il workshop e il modulo di contatto, e scegli quella che ti fa arrivare prima.</p>
      <div class="variant-grid">
        <article class="teaser">
          <p class="service-tag">Variante A</p>
          <h2 class="h3">Più pagine</h2>
          <p>Una home breve che riassume tutto e porta a sei pagine: Approccio, Servizi, Laboratorio, Workshop, Chi sono, Contatti.</p>
          <a href="a/index.html">Apri la variante A {ARROW}</a>
        </article>
        <article class="teaser">
          <p class="service-tag">Variante B</p>
          <h2 class="h3">Una pagina compatta</h2>
          <p>Una sola pagina: servizi e laboratorio diventano schede, programma del workshop, principi e confronto si aprono a richiesta.</p>
          <a href="b/index.html">Apri la variante B {ARROW}</a>
        </article>
      </div>
      <a class="more-link" href="../index.html">Torna al sito attuale {ARROW}</a>
    </div>
  </section>
'''
chooser = (head('Varianti del sito · Legal Product Studio', 'Confronto tra due strutture del sito.', prefix='../')
           + '<body>\n' + BODY_START + header_a('').replace('href="index.html"', 'href="../index.html"').replace(
               between(header_a(''), '    <nav class="main-nav"', '    </nav>\n', keep_end=True), '')
           .replace('''    <button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">
      <span class="nav-toggle-bars" aria-hidden="true"></span>
      <span class="nav-toggle-label">Menu</span>
    </button>
''', '') + '\n<main id="contenuto">\n\n' + chooser_main + '</main>\n\n<!-- BODY:END -->\n</body>\n</html>\n')
(ROOT / 'varianti' / 'index.html').write_text(chooser)
print('A:', sorted(p.name for p in out_a.iterdir()), '| B: index.html | chooser: varianti/index.html')
