/* ============================================================
   RUNGG VASTU — Choreography
   Everything here moves like breath. Nothing fast.
   ============================================================ */

import "./style.css";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (p) => p * p * (3 - 2 * p);

/* ---------- word-mask headings ---------- */

document.querySelectorAll("[data-split]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((w) => `<span class="w"><span class="wi">${w}</span></span>`)
    .join(" ");
});

/* ---------- the hero plan — a house that draws itself ---------- */

const hero = document.querySelector(".hero");
const heroPlan = hero?.querySelector(".hero__day");

if (heroPlan && !reduceMotion) {
  const draws = heroPlan.querySelectorAll(".plan-draw");
  draws.forEach((g) => {
    g.querySelectorAll("path, line, rect, circle, polygon").forEach((el) => {
      el.setAttribute("pathLength", "1");
      el.setAttribute("stroke-dasharray", "1");
      el.style.strokeDashoffset = "1";
    });
    const delay = parseFloat(g.dataset.delay || 0);
    setTimeout(() => {
      g.querySelectorAll("path, line, rect, circle, polygon").forEach((el) => {
        el.style.transition = "stroke-dashoffset 1.9s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.strokeDashoffset = "0";
      });
    }, 400 + delay * 620);
  });
  setTimeout(() => hero.classList.add("is-ready"), 3300);
} else {
  hero?.classList.add("is-ready");
}

/* ---------- reveal on entering a room ---------- */

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (el.matches("[data-split]")) {
        el.querySelectorAll(".w").forEach((w, i) => {
          w.style.setProperty("--wd", `${0.15 + i * 0.09}s`);
          requestAnimationFrame(() => w.classList.add("in"));
        });
      } else {
        el.classList.add("in");
      }
      revealObserver.unobserve(el);
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll("[data-reveal], [data-split]").forEach((el) => revealObserver.observe(el));

/* ---------- scroll-drawn geometry ---------- */

const drawGroups = [...document.querySelectorAll("[data-draw]")];
drawGroups.forEach((g) => {
  g.querySelectorAll("path, line, rect, circle").forEach((el) => el.setAttribute("pathLength", "1"));
  g.style.setProperty("--dp", reduceMotion ? 1 : 0);
});

/* ---------- the gesture · alignment stage ---------- */

const stage = document.getElementById("alignment-stage");
const degreesEl = document.getElementById("alg-degrees");
const statusEl = document.getElementById("alg-status");
const START_DEG = 8.4;

function tickAlignment() {
  const rect = stage.getBoundingClientRect();
  const vh = window.innerHeight;
  const p = clamp((vh - rect.top) / (rect.height + vh * 0.45), 0, 1);
  const e = smoothstep(p);
  stage.style.setProperty("--e", e);
  stage.style.setProperty("--tx", `${(1 - e) * 64}px`);
  stage.style.setProperty("--ty", `${(1 - e) * 44}px`);
  stage.style.setProperty("--rot", `${(1 - e) * 6}deg`);
  degreesEl.textContent = `${(START_DEG * (1 - e)).toFixed(1)}°`;
  const aligned = e > 0.985;
  statusEl.textContent = aligned ? "in alignment" : "out of order";
  statusEl.style.color = aligned ? "var(--emerald)" : "";
}

if (!reduceMotion) {
  stage.style.setProperty("--e", 0);
  tickAlignment();
} else {
  stage.style.setProperty("--e", 1);
  stage.style.setProperty("--tx", "0px");
  stage.style.setProperty("--ty", "0px");
  stage.style.setProperty("--rot", "0deg");
  degreesEl.textContent = "0.0°";
  statusEl.textContent = "in alignment";
}

/* ---------- one scroll loop, calm and single ---------- */

const heroFigure = document.querySelector(".hero__figure");
const nav = document.getElementById("nav");
const navLinks = [...document.querySelectorAll(".nav__links a")];

const sectionMap = new Map(
  navLinks
    .map((a) => {
      const sec = document.querySelector(a.getAttribute("href"));
      return sec ? [sec, a] : null;
    })
    .filter(Boolean)
);

let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  nav.classList.toggle("is-scrolled", y > 48);

  if (!reduceMotion && heroFigure) {
    heroFigure.style.setProperty("--par", `${y * 0.08}px`);
  }

  if (!reduceMotion) {
    let current = null;
    for (const [sec, link] of sectionMap) {
      const r = sec.getBoundingClientRect();
      if (r.top < vh * 0.5) current = link;
    }
    sectionMap.forEach((link) => link.classList.toggle("is-active", link === current));

    drawGroups.forEach((g) => {
      const r = g.getBoundingClientRect();
      const p = clamp((vh - r.top) / (r.height + vh * 0.6), 0, 1);
      g.style.setProperty("--dp", p);
    });

    tickAlignment();
  }

  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(onScroll);
  }
});
onScroll();

/* ---------- compass readings ---------- */

const dirs = ["N", "S", "W", "E", "NE", "SE", "SW", "NW"];
const tickEls = document.querySelectorAll(".compass__ticks line");
const labelEls = document.querySelectorAll(".compass__labels text");
const infoItems = [...document.querySelectorAll(".directions__info-item")];
const infoDefault = document.querySelector(".directions__info-default");

function setInfo(dir) {
  infoItems.forEach((el) => el.classList.toggle("is-active", el.dataset.dir === dir));
  infoDefault.classList.remove("is-active");
}
function clearInfo() {
  infoItems.forEach((el) => el.classList.remove("is-active"));
  infoDefault.classList.add("is-active");
}

const wire = (el, dir) => {
  el.setAttribute("tabindex", "0");
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", dir);
  el.addEventListener("mouseenter", () => setInfo(dir));
  el.addEventListener("mouseleave", clearInfo);
  el.addEventListener("focus", () => setInfo(dir));
  el.addEventListener("blur", clearInfo);
  el.addEventListener("click", () => setInfo(dir));
};
tickEls.forEach((el, i) => wire(el, dirs[i]));
labelEls.forEach((el) => wire(el, el.textContent));
document.addEventListener("click", (e) => {
  if (!e.target.closest(".compass")) clearInfo();
});

/* ---------- the cursor — a quiet companion ---------- */

const cursor = document.querySelector(".cursor");
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  let on = false;
  let scale = 1;

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!on) {
      on = true;
      cx = tx;
      cy = ty;
      cursor.classList.add("is-on");
    }
  });

  (function drift() {
    cx += (tx - cx) * 0.16;
    cy += (ty - cy) * 0.16;
    cursor.style.transform = `translate(${cx}px, ${cy}px) scale(${scale})`;
    requestAnimationFrame(drift);
  })();

  document.addEventListener("mouseover", (e) => {
    scale = e.target.closest("a, button, [role='button']") ? 1.8 : 1;
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a, button, [role='button']")) scale = 1;
  });
  document.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  document.addEventListener("mouseenter", () => {
    on = false;
    cursor.classList.add("is-on");
  });
}
