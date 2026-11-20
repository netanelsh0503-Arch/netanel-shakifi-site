/* Text-size control (accessibility) — floating button on the left.
   The saved size is applied early by the inline script in <head>; this file builds the UI. */
(function () {
  "use strict";
  const KEY = "textSize";
  const SIZES = [
    { v: "100", label: "רגיל" },
    { v: "115", label: "גדול" },
    { v: "130", label: "גדול מאוד" },
  ];
  const root = document.documentElement;
  const current = () => root.getAttribute("data-text-size") || "100";

  function apply(v) {
    if (v === "100") root.removeAttribute("data-text-size");
    else root.setAttribute("data-text-size", v);
    try { if (v === "100") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: size still applies for this page */ }
  }

  const wrap = document.createElement("div");
  wrap.className = "a11y-widget";
  wrap.innerHTML = `
    <div class="a11y-panel" id="a11yPanel" role="group" aria-labelledby="a11yPanelTitle" hidden>
      <p class="a11y-panel-title" id="a11yPanelTitle">גודל טקסט</p>
      <div class="a11y-sizes">
        ${SIZES.map((s) => `<button type="button" class="a11y-size" data-size="${s.v}" aria-pressed="false"><span class="a11y-glyph a11y-glyph-${s.v}" aria-hidden="true">א</span>${s.label}</button>`).join("")}
      </div>
      <a class="a11y-statement" href="accessibility.html">הצהרת נגישות</a>
    </div>
    <button type="button" class="a11y-fab" aria-expanded="false" aria-controls="a11yPanel" aria-label="נגישות: שינוי גודל טקסט">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <circle cx="12" cy="4.2" r="2.2"/>
        <path d="M4.2 7.6c-.5-.1-1 .2-1.1.7-.1.5.2 1 .7 1.1 1.9.5 3.8.8 5.7.9v3.1l-1.9 6.3c-.2.5.1 1.1.7 1.3.5.2 1.1-.1 1.3-.7L12 14.4l2.4 5.9c.2.5.8.8 1.3.7.5-.2.8-.8.7-1.3l-1.9-6.3v-3.1c1.9-.1 3.8-.4 5.7-.9.5-.1.8-.6.7-1.1-.1-.5-.6-.8-1.1-.7-2.6.6-5.2.9-7.8.9s-5.2-.3-7.8-.9z"/>
      </svg>
    </button>`;
  document.body.appendChild(wrap);

  const fab = wrap.querySelector(".a11y-fab");
  const panel = wrap.querySelector(".a11y-panel");
  const buttons = [...wrap.querySelectorAll(".a11y-size")];

  const sync = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.size === current())));
  sync();

  const open = () => { panel.hidden = false; fab.setAttribute("aria-expanded", "true"); (buttons.find((b) => b.getAttribute("aria-pressed") === "true") || buttons[0]).focus(); };
  const close = (refocus) => { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); if (refocus) fab.focus(); };

  fab.addEventListener("click", () => (panel.hidden ? open() : close(false)));
  buttons.forEach((b) => b.addEventListener("click", () => { apply(b.dataset.size); sync(); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(true); });
  document.addEventListener("click", (e) => { if (!panel.hidden && !wrap.contains(e.target)) close(false); });
  wrap.addEventListener("focusout", (e) => { if (!panel.hidden && e.relatedTarget && !wrap.contains(e.relatedTarget)) close(false); });
})();
