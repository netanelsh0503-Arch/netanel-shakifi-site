/* נתנאל שקיפי – אדריכלות נוף | Front-end logic */
(function () {
  "use strict";

  /* ---------- Header scroll ---------- */
  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
    });
    const closeNav = (refocus) => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      if (refocus) toggle.focus();
    };
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => closeNav(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && links.classList.contains("open")) closeNav(true);
    });
  }

  /* ---------- Dialog focus management (lightbox + about modal) ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), iframe, video[controls], input, textarea, select, [tabindex]:not([tabindex="-1"])';
  const HAS_INERT = "inert" in HTMLElement.prototype;
  let dialogState = null;
  function focusablesIn(el) {
    return [...el.querySelectorAll(FOCUSABLE)].filter((x) => {
      const s = getComputedStyle(x);
      return x.getClientRects().length && s.visibility !== "hidden";
    });
  }
  function openDialog(el, initial, opener) {
    if (dialogState) closeDialog(false);
    const others = [...document.body.children].filter((c) => c !== el && c.tagName !== "SCRIPT");
    others.forEach((c) => {
      c.dataset.prevInert = c.inert ? "1" : "";
      c.inert = true;
      if (!HAS_INERT && !c.hasAttribute("aria-hidden")) { c.setAttribute("aria-hidden", "true"); c.dataset.ariaSet = "1"; }
    });
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const f = focusablesIn(el);
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    dialogState = { opener: opener || document.activeElement, others, onKey };
    const target = initial || focusablesIn(el)[0];
    if (target) target.focus();
  }
  function closeDialog(restore = true) {
    if (!dialogState) return;
    const { opener, others, onKey } = dialogState;
    others.forEach((c) => {
      c.inert = c.dataset.prevInert === "1";
      delete c.dataset.prevInert;
      if (c.dataset.ariaSet) { c.removeAttribute("aria-hidden"); delete c.dataset.ariaSet; }
    });
    document.removeEventListener("keydown", onKey);
    dialogState = null;
    if (restore && opener && document.contains(opener)) opener.focus();
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Icons ---------- */
  const IC = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    imgs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  };

  /* ---------- Projects ---------- */
  const grid = document.getElementById("projectGrid");
  const filterWrap = document.getElementById("projectFilters");
  let PROJECTS = [];
  let activeFilter = "all";

  function projectCard(p, idx) {
    const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
    const meta = [
      p.location ? `<span>${IC.pin}${esc(p.location)}</span>` : "",
      p.year ? `<span>${IC.cal}${esc(p.year)}</span>` : "",
    ].join("");
    const count = (p.images || []).length;
    const coverSrc = nsrc(p.cover || (p.images || [])[0] || "");
    return `
      <article class="project-card reveal" data-idx="${idx}">
        <div class="project-media">
          ${coverSrc ? `<img src="${esc(coverSrc)}" alt="" loading="lazy">` : ""}
          ${p.video ? `<span class="project-play" aria-hidden="true">${IC.play}</span>` : ""}
          ${count > 1 ? `<span class="project-count"><span aria-hidden="true">${IC.imgs}</span>${count}<span class="sr-only"> תמונות</span></span>` : ""}
        </div>
        <div class="project-info">
          <h2><button type="button" class="project-open"><span class="sr-only">פתיחת פרויקט: </span>${esc(p.title)}</button></h2>
          ${meta ? `<div class="project-meta">${meta}</div>` : ""}
          <div class="project-tags">${tags}</div>
        </div>
      </article>`;
  }

  function renderProjects() {
    if (!grid) return;
    const list = PROJECTS.map((p, i) => ({ p, i })).filter(
      ({ p }) => activeFilter === "all" || (p.tags || []).includes(activeFilter)
    );
    grid.innerHTML = list.length
      ? list.map(({ p, i }) => projectCard(p, i)).join("")
      : `<p class="empty">אין פרויקטים בקטגוריה זו עדיין.</p>`;
    grid.querySelectorAll(".project-card").forEach((c) => {
      io.observe(c);
      const btn = c.querySelector(".project-open");
      btn.addEventListener("click", () => openLightbox(+c.dataset.idx, 0, btn));
    });
  }

  function renderFilters() {
    if (!filterWrap) return;
    const set = new Set();
    PROJECTS.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    const tags = ["all", ...Array.from(set)];
    filterWrap.innerHTML = tags
      .map(
        (t) =>
          `<button type="button" class="filter ${t === activeFilter ? "active" : ""}" data-f="${esc(t)}" aria-pressed="${t === activeFilter}">${
            t === "all" ? "הכל" : esc(t)
          }</button>`
      )
      .join("");
    filterWrap.querySelectorAll(".filter").forEach((b) =>
      b.addEventListener("click", () => {
        activeFilter = b.dataset.f;
        filterWrap.querySelectorAll(".filter").forEach((x) => { x.classList.remove("active"); x.setAttribute("aria-pressed", "false"); });
        b.classList.add("active");
        b.setAttribute("aria-pressed", "true");
        renderProjects();
      })
    );
  }

  /* ---------- Lightbox ---------- */
  let lb, lbMedia, lbThumbs, lbTitle, lbMeta, lbDesc, lbLinks;
  let curP = 0, curI = 0, curMedia = [];

  function videoEmbed(url) {
    url = String(url || "").trim();
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return { kind: "iframe", src: "https://www.youtube.com/embed/" + m[1] + "?rel=0", thumb: "https://img.youtube.com/vi/" + m[1] + "/hqdefault.jpg" };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: "iframe", src: "https://player.vimeo.com/video/" + m[1], thumb: "" };
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) return { kind: "video", src: url, thumb: "" };
    return { kind: "iframe", src: url, thumb: "" };
  }

  function projectMedia(p) {
    const media = [];
    if (p.video) {
      const v = videoEmbed(p.video);
      if (v) media.push({ type: "video", kind: v.kind, src: v.src, thumb: v.thumb || nsrc(p.cover || (p.images || [])[0] || "") });
    }
    (p.images || []).forEach((s) => media.push({ type: "img", src: nsrc(s), thumb: nsrc(s) }));
    return media;
  }

  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-labelledby", "lbTitle");
    lb.innerHTML = `
      <button class="lb-close" aria-label="סגירה">&times;</button>
      <div class="lb-inner">
        <div class="lb-head">
          <div><h3 id="lbTitle"></h3><p id="lbMeta"></p></div>
        </div>
        <div class="lb-stage">
          <button class="lb-nav lb-prev" aria-label="הקודם">${IC.prev}</button>
          <div class="lb-media" id="lbMedia"></div>
          <button class="lb-nav lb-next" aria-label="הבא">${IC.next}</button>
        </div>
        <div class="lb-thumbs" id="lbThumbs"></div>
        <p class="lb-desc" id="lbDesc"></p>
        <div class="lb-links" id="lbLinks"></div>
      </div>`;
    document.body.appendChild(lb);
    lbMedia = lb.querySelector("#lbMedia");
    lbThumbs = lb.querySelector("#lbThumbs");
    lbTitle = lb.querySelector("#lbTitle");
    lbMeta = lb.querySelector("#lbMeta");
    lbDesc = lb.querySelector("#lbDesc");
    lbLinks = lb.querySelector("#lbLinks");
    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-prev").addEventListener("click", () => step(-1));
    lb.querySelector(".lb-next").addEventListener("click", () => step(1));
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") step(-1); // RTL: right = previous
      if (e.key === "ArrowLeft") step(1);
    });
  }

  function openLightbox(pi, ii, opener) {
    if (!lb) buildLightbox();
    curP = pi; curI = ii || 0;
    const p = PROJECTS[pi];
    curMedia = projectMedia(p);
    lbTitle.textContent = p.title;
    lbMeta.textContent = [p.location, p.year].filter(Boolean).join(" · ");
    lbDesc.textContent = p.description || "";
    if (p.link) {
      const label = p.linkLabel || "לאתר הרשמי";
      const href = /^https?:\/\//i.test(p.link) ? p.link : "https://" + p.link;
      lbLinks.innerHTML =
        `<a href="${esc(href)}" target="_blank" rel="noopener">` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>` +
        `${esc(label)}</a>`;
    } else {
      lbLinks.innerHTML = "";
    }
    lbThumbs.innerHTML = curMedia.map((m, i) =>
      `<button class="lb-thumb${m.type === "video" ? " is-video" : ""}" data-i="${i}" aria-label="${m.type === "video" ? "סרטון וידאו" : "תמונה " + (i + 1)}">` +
        (m.thumb ? `<img src="${esc(m.thumb)}" alt="">` : `<span class="lb-thumb-blank"></span>`) +
        (m.type === "video" ? `<span class="lb-thumb-play">${IC.play}</span>` : "") +
      `</button>`
    ).join("");
    lbThumbs.querySelectorAll(".lb-thumb").forEach((t) =>
      t.addEventListener("click", () => { curI = +t.dataset.i; showMedia(); })
    );
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    showMedia();
    openDialog(lb, lb.querySelector(".lb-close"), opener);
  }

  function showMedia() {
    if (!curMedia.length) { lbMedia.innerHTML = ""; return; }
    const m = curMedia[curI] || curMedia[0];
    const p = PROJECTS[curP];
    if (m.type === "video") {
      lbMedia.innerHTML = m.kind === "video"
        ? `<video src="${esc(m.src)}" controls playsinline autoplay></video>`
        : `<iframe src="${esc(m.src)}" title="${esc(p.title)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
    } else {
      const imgs = curMedia.filter((x) => x.type === "img");
      const n = imgs.indexOf(m) + 1;
      const alt = imgs.length > 1 ? `${p.title} – תמונה ${n} מתוך ${imgs.length}` : p.title;
      lbMedia.innerHTML = `<img src="${esc(m.src)}" alt="${esc(alt)}">`;
    }
    lbThumbs.querySelectorAll(".lb-thumb").forEach((t, i) => t.classList.toggle("active", i === curI));
    const hide = curMedia.length < 2;
    lb.querySelector(".lb-prev").style.visibility = hide ? "hidden" : "";
    lb.querySelector(".lb-next").style.visibility = hide ? "hidden" : "";
    lbThumbs.style.display = hide ? "none" : "";
  }

  function step(d) {
    if (!curMedia.length) return;
    curI = (curI + d + curMedia.length) % curMedia.length;
    showMedia();
  }

  function closeLightbox() {
    lb.classList.remove("open");
    if (lbMedia) lbMedia.innerHTML = ""; // stop video/iframe playback
    document.body.style.overflow = "";
    closeDialog();
  }

  /* ---------- Contact form (Web3Forms) ---------- */
  const form = document.getElementById("contactForm");
  if (form) {
    const note = document.getElementById("formMsg");
    const RULES = {
      name: (v) => v.trim().length >= 2 || "נא למלא שם מלא.",
      phone: (v) => /^(?:\+?972|0)\d{8,9}$/.test(v.replace(/[\s\-().]/g, "")) || "נא למלא מספר טלפון תקין, לדוגמה 050-1234567\u200F.",
      email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "כתובת האימייל אינה תקינה.",
      message: (v) => v.trim().length >= 2 || "נא לכתוב כמה מילים על הפרויקט.",
    };
    const setFieldError = (input, msg) => {
      const id = input.id + "-err";
      let err = document.getElementById(id);
      if (msg) {
        if (!err) {
          err = document.createElement("p");
          err.className = "field-err";
          err.id = id;
          input.insertAdjacentElement("afterend", err);
        }
        err.textContent = msg;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id);
      } else {
        if (err) err.remove();
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    };
    const validate = () => {
      let firstBad = null;
      Object.keys(RULES).forEach((name) => {
        const input = form.elements[name];
        if (!input) return;
        const res = RULES[name](input.value || "");
        setFieldError(input, res === true ? "" : res);
        if (res !== true && !firstBad) firstBad = input;
      });
      return firstBad;
    };
    Object.keys(RULES).forEach((name) => {
      const input = form.elements[name];
      if (input) input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true" && RULES[name](input.value || "") === true) setFieldError(input, "");
      });
    });
    let sending = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      const btn = form.querySelector('button[type="submit"]');
      const originalLabel = btn ? btn.textContent : "";
      if (note) { note.classList.remove("ok", "err"); note.textContent = ""; }
      const firstBad = validate();
      if (firstBad) {
        if (note) { note.classList.add("err"); note.textContent = "לא ניתן לשלוח: יש לתקן את השדות המסומנים."; }
        firstBad.focus();
        return;
      }
      sending = true;
      if (btn) { btn.setAttribute("aria-disabled", "true"); btn.textContent = "שולח..."; }
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: new FormData(form)
        });
        const data = await res.json();
        if (data.success) {
          if (note) { note.classList.add("ok"); note.textContent = "תודה! הפנייה נשלחה בהצלחה, אחזור אליכם בהקדם."; }
          form.reset();
        } else {
          if (note) { note.classList.add("err"); note.textContent = "אירעה שגיאה בשליחה. נסו שוב, או התקשרו 050-589-1004\u200F."; }
        }
      } catch (err) {
        if (note) { note.classList.add("err"); note.textContent = "אירעה שגיאה בשליחה. נסו שוב, או התקשרו 050-589-1004\u200F."; }
      } finally {
        sending = false;
        if (btn) { btn.removeAttribute("aria-disabled"); btn.textContent = originalLabel; }
      }
    });
  }

  /* ---------- About (dynamic content + modal) ---------- */
  let aboutModal, ABOUT = null;

  function applyAbout(a) {
    if (!a) return;
    ABOUT = a;
    const set = (id, v) => { const e = document.getElementById(id); if (e && v != null) e.textContent = v; };
    set("aboutEyebrow", a.eyebrow);
    set("aboutTitle", a.title);
    if (a.image) { const im = document.getElementById("aboutImg"); if (im) im.src = nsrc(a.image); }
    const w = document.getElementById("aboutParas");
    if (w && Array.isArray(a.paragraphs)) w.innerHTML = a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
  }

  function buildAboutModal() {
    aboutModal = document.createElement("div");
    aboutModal.className = "cmodal";
    aboutModal.setAttribute("role", "dialog");
    aboutModal.setAttribute("aria-modal", "true");
    aboutModal.setAttribute("aria-labelledby", "amTitle");
    aboutModal.innerHTML =
      '<div class="cmodal-box">' +
        '<button class="cmodal-x" aria-label="סגירה">&times;</button>' +
        '<div class="cmodal-media"><img id="amImg" alt="נתנאל שקיפי"></div>' +
        '<div class="cmodal-content"><span class="eyebrow" id="amEyebrow"></span>' +
        '<h2 class="section-title" id="amTitle"></h2><div id="amBody"></div></div>' +
      "</div>";
    document.body.appendChild(aboutModal);
    aboutModal.querySelector(".cmodal-x").addEventListener("click", closeAbout);
    aboutModal.addEventListener("click", (e) => { if (e.target === aboutModal) closeAbout(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && aboutModal.classList.contains("open")) closeAbout(); });
  }

  function openAbout() {
    const a = ABOUT || {};
    if (!aboutModal) buildAboutModal();
    document.getElementById("amEyebrow").textContent = a.eyebrow || "";
    document.getElementById("amTitle").textContent = a.title || "אודות";
    const im = document.getElementById("amImg");
    if (a.image) { im.src = nsrc(a.image); im.parentElement.style.display = ""; } else { im.parentElement.style.display = "none"; }
    document.getElementById("amBody").innerHTML = (a.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("");
    aboutModal.classList.add("open");
    document.body.style.overflow = "hidden";
    openDialog(aboutModal, aboutModal.querySelector(".cmodal-x"));
  }
  function closeAbout() { aboutModal.classList.remove("open"); document.body.style.overflow = ""; closeDialog(); }

  document.querySelectorAll('a[href="#about"]').forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); openAbout(); })
  );
  const aboutMoreBtn = document.getElementById("aboutMoreBtn");
  if (aboutMoreBtn) aboutMoreBtn.addEventListener("click", openAbout);

  fetchJSON("data/about.json").then(applyAbout);

  /* ---------- Services / Publications / Innovations ---------- */
  const SERVICE_ICONS = {
    plant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12M12 12c0-4 2-7 5-8-1 4-2 6-5 8zM12 12C12 8 10 5 7 4c1 4 2 6 5 8z"/><path d="M5 22h14"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    tree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z"/><path d="M12 6v6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 019 6c4-2 8-2 11-3-1 3-1 7-3 11a7 7 0 01-6 6z"/><path d="M2 22c4-4 6-6 9-7"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 21v-1a6 6 0 0112 0v1"/><path d="M16 6a3 3 0 010 6M21 21v-1a5 5 0 00-3-4.5"/></svg>',
  };

  function renderServices(list) {
    const el = document.getElementById("servicesGrid");
    if (!el || !Array.isArray(list)) return;
    el.innerHTML = list.map((s) => `
      <div class="card reveal">
        <div class="card-ico">${SERVICE_ICONS[s.icon] || SERVICE_ICONS.plant}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </div>`).join("");
    el.querySelectorAll(".reveal").forEach((x) => io.observe(x));
  }

  function renderClients(list) {
    const el = document.getElementById("clientsGrid");
    if (!el || !Array.isArray(list)) return;
    if (!list.length) {
      el.innerHTML = `<p class="empty">בקרוב — לוגואים של לקוחות ושותפים.</p>`;
      return;
    }
    el.innerHTML = list.map((c) =>
      `<div class="client"><img src="${esc(nsrc(c.logo || ""))}" alt="${esc(c.name || "לקוח")}" loading="lazy"></div>`
    ).join("");
  }

  /* ---------- Data helpers ---------- */
  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  }
  function listOf(d) {
    if (d && Array.isArray(d.items)) return d.items;
    return Array.isArray(d) ? d : [];
  }
  // Normalize an image path: strip a leading "/" so CMS-stored absolute paths
  // resolve correctly under the GitHub Pages sub-path. External URLs (http...) are untouched.
  function nsrc(s) {
    s = String(s == null ? "" : s);
    if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
    return s.charAt(0) === "/" ? s.slice(1) : s;
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  /* ---------- Load data (from data/*.json — editable via CMS) ---------- */
  fetchJSON("data/projects.json").then((d) => {
    if (d) { PROJECTS = listOf(d); renderFilters(); renderProjects(); }
  });
  fetchJSON("data/services.json").then((d) => { if (d) renderServices(listOf(d)); });
  fetchJSON("data/clients.json").then((d) => { if (d) renderClients(listOf(d)); });

  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());
})();
