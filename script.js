const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const navDropdowns = [...document.querySelectorAll("[data-nav-dropdown]")];

function setMenu(open) {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector(".sr-only").textContent = open ? "Fermer le menu" : "Ouvrir le menu";
  mobileMenu.hidden = !open;
  document.body.classList.toggle("menu-open", open);

  const heroVideo = document.querySelector(".hero__media video");
  if (!heroVideo) return;
  if (open) heroVideo.pause();
  else if (heroSection?.getBoundingClientRect().bottom > 0) heroVideo.play().catch(() => {});
}

menuToggle?.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

function setNavDropdown(wrapper, open) {
  const toggle = wrapper.querySelector("[data-nav-toggle]");
  if (!toggle) return;

  wrapper.toggleAttribute("data-open", open);
  toggle.setAttribute("aria-expanded", String(open));
}

function closeNavDropdowns(except) {
  navDropdowns.forEach((wrapper) => {
    if (wrapper !== except) setNavDropdown(wrapper, false);
  });
}

navDropdowns.forEach((wrapper) => {
  const toggle = wrapper.querySelector("[data-nav-toggle]");
  toggle?.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    closeNavDropdowns();
    setNavDropdown(wrapper, willOpen);
  });
});

document.addEventListener("click", (event) => {
  navDropdowns.forEach((wrapper) => {
    if (!wrapper.contains(event.target)) setNavDropdown(wrapper, false);
  });
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.querySelectorAll("[data-collapsible-toggle]").forEach((toggle) => {
  const panel = document.getElementById(toggle.getAttribute("aria-controls"));
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    if (panel) panel.hidden = open;
  });
});

document.querySelectorAll("[data-expertise-toggle]").forEach((toggle) => {
  const panel = document.getElementById(toggle.getAttribute("aria-controls"));
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("is-open", open);
    panel?.classList.toggle("is-collapsed", !open);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const openDropdown = navDropdowns.find((wrapper) => wrapper.hasAttribute("data-open"));
  if (openDropdown) {
    setNavDropdown(openDropdown, false);
    openDropdown.querySelector("[data-nav-toggle]")?.focus();
  }

  if (menuToggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 767) setMenu(false);
});

const siteHeader = document.querySelector("[data-header]");
const heroSection = document.getElementById("accueil");
const HEADER_SCROLL_THRESHOLD = 220;

if (siteHeader) {
  let ticking = false;

  const updateHeaderScrolled = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > HEADER_SCROLL_THRESHOLD);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateHeaderScrolled);
    },
    { passive: true }
  );

  updateHeaderScrolled();
}

const heroVideo = document.querySelector(".hero__media video");

if (heroVideo && "IntersectionObserver" in window) {
  const heroVideoObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) heroVideo.play().catch(() => {});
      else heroVideo.pause();
    },
    { threshold: 0 }
  );
  heroVideoObserver.observe(heroVideo);
}

const processSteps = [
  "Nous évaluons votre état physique, vos douleurs et vos limitations pour comprendre précisément vos besoins.",
  "Nous définissons avec vous des objectifs réalistes et un plan de traitement adapté à votre quotidien.",
  "Nous ajustons les techniques, les exercices et la progression au fil des séances selon votre évolution.",
];

const processTabs = [...document.querySelectorAll("[data-process-tab]")];
const processDescription = document.querySelector("[data-process-description]");

processTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    processTabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
    if (processDescription) processDescription.textContent = processSteps[index];
  });
});

const specialties = [
  {
    title: "Rééducation post-traumatique",
    description: "Un accompagnement progressif après une blessure ou une opération pour récupérer mobilité, force et confiance dans le mouvement.",
    image: "assets/images/specialties/posttrauma.png",
    alt: "Séance de rééducation post-traumatique",
  },
  {
    title: "Rhumatologie",
    description: "Une prise en charge ciblée pour réduire les douleurs articulaires, entretenir la mobilité et faciliter les gestes du quotidien.",
    image: "assets/images/specialties/rhumatologie.png",
    alt: "Prise en charge en rhumatologie",
  },
  {
    title: "Neurologie",
    description: "Un travail individualisé sur la mobilité, l’équilibre et la coordination afin de préserver les capacités fonctionnelles et l’autonomie.",
    image: "assets/images/specialties/neurologie.png",
    alt: "Prise en charge en neurologie",
  },
  {
    title: "Périnatalité",
    description: "Une prise en charge douce et adaptée aux changements du corps avant et après la naissance, selon les besoins et les indications de chacune.",
    image: "assets/images/specialties/perinatalitlé.png",
    alt: "Prise en charge en périnatalité",
  },
  {
    title: "Oncologie",
    description: "Un suivi individualisé pour soutenir la mobilité, limiter le déconditionnement et accompagner les besoins fonctionnels pendant ou après les traitements.",
    image: "assets/images/specialties/oncologie.png",
    alt: "Accompagnement physiothérapeutique en oncologie",
  },
  {
    title: "Sophrologie",
    description: "Une approche complémentaire fondée sur la respiration et la détente pour mieux vivre les tensions et retrouver un rapport plus serein au corps.",
    image: "assets/images/specialties/sofrologie.png",
    alt: "Accompagnement centré sur la respiration",
  },
  {
    title: "Drainage lymphatique manuel",
    description: "Des techniques manuelles douces destinées à favoriser la circulation lymphatique et à accompagner la prise en charge des œdèmes.",
    image: "assets/images/specialties/drainagelymphatique.png",
    alt: "Soin de drainage lymphatique manuel",
  },
  {
    title: "Gériatrie",
    description: "Des exercices adaptés pour préserver l’autonomie, l’équilibre et la mobilité, en tenant compte du rythme et des objectifs de chaque personne.",
    image: "assets/images/specialties/geriatrie.png",
    alt: "Accompagnement physiothérapeutique en gériatrie",
  },
  {
    title: "Physiothérapie respiratoire",
    description: "Une prise en charge personnalisée pour améliorer la capacité respiratoire, faciliter le désencombrement et retrouver plus d’aisance dans les activités quotidiennes.",
    image: "assets/images/specialties/physioresp.png",
    alt: "Prise en charge en physiothérapie respiratoire",
  },
];

const specialtyTabsContainer = document.querySelector("[data-specialty-tabs]");
const specialtyTabs = [...document.querySelectorAll("[data-specialty]")];
const specialtyTitle = document.querySelector("[data-specialty-title]");
const specialtyDescription = document.querySelector("[data-specialty-description]");
const specialtyImage = document.querySelector("[data-specialty-image]");
const specialtyCount = document.querySelector("[data-specialty-count]");
let activeSpecialty = 0;

const SPECIALTY_TRANSITION_MS = 260;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Ghost layer for the reflow animation: a detached copy of ".specialty-tabs" so cloned buttons
// keep their normal styling (colors, icon, padding) via the same CSS selectors, but positioned
// with `position: fixed`, entirely outside the real grid. Real grid children are never
// transformed directly — doing so confuses the grid's own auto-placement pass and can leave it
// laid out incorrectly, so instead the real grid updates instantly (hidden under its ghost)
// while only this free-floating clone animates from the old rect to the new one.
const specialtyGhostLayer = document.createElement("div");
specialtyGhostLayer.className = "specialty-tabs specialty-tabs__ghost-layer";
document.body.appendChild(specialtyGhostLayer);
const specialtyPendingCleanup = new Map();

function getSpecialtyColumns() {
  if (window.innerWidth <= 767) return 2;
  if (window.innerWidth <= 1024) return 3;
  return 5;
}

// The grid's own auto-placement can't give us the layout we want here: the active tab spans
// two columns, and when it naturally sits in the last column of its row there is no room to
// its right, so the browser instead wraps it whole to the next row's first column. What we
// want is for it to grow left instead, staying put, while only the item that was directly
// before it gets pushed down to the next row. We compute that placement explicitly (instead
// of relying on grid-auto-flow) so every column/row assignment is deterministic.
function computeSpecialtyPlacement(active, columns) {
  const order = specialtyTabs.map((_, index) => index);

  const naturalCol = active % columns;
  const isEdge = naturalCol === columns - 1 && active > 0;
  if (isEdge) {
    // Process the active tab before its immediate predecessor, so the active tab claims the
    // row's last two columns and the predecessor is the one that overflows to the next row.
    [order[active - 1], order[active]] = [order[active], order[active - 1]];
  }

  const placement = new Array(specialtyTabs.length);
  let col = 0;
  let row = 1;
  order.forEach((itemIndex) => {
    const span = itemIndex === active ? 2 : 1;
    if (col + span > columns) {
      col = 0;
      row += 1;
    }
    placement[itemIndex] = `${col + 1} / span ${span}`;
    col += span;
    placement[itemIndex] = { column: placement[itemIndex], row };
  });

  return placement;
}

function applySpecialtyLayout() {
  const columns = getSpecialtyColumns();

  // Every breakpoint gets an explicit placement, mobile included: leaving mobile to the grid's
  // own auto-placement (relying on CSS alone for grid-column: 1 / -1) left it exposed to the
  // same auto-placement corruption as the 5/3-column grids — the browser's auto-placement pass
  // can end up in a bad, overlapping state when many tabs reflow at once, and unlike an explicit
  // placement it doesn't self-correct on repaint. Computing every line explicitly sidesteps
  // auto-placement entirely, at every breakpoint.
  const placement = computeSpecialtyPlacement(activeSpecialty, columns);
  specialtyTabs.forEach((tab, index) => {
    tab.style.gridColumn = placement[index].column;
    tab.style.gridRow = String(placement[index].row);
  });
}

function animateSpecialtyLayout(applyChanges) {
  if (reduceMotionQuery.matches || !specialtyTabsContainer) {
    applyChanges();
    return;
  }

  const beforeRects = specialtyTabs.map((tab) => tab.getBoundingClientRect());

  applyChanges();

  specialtyTabs.forEach((tab, index) => {
    const before = beforeRects[index];
    const after = tab.getBoundingClientRect();
    const moved =
      Math.round(before.left) !== Math.round(after.left) ||
      Math.round(before.top) !== Math.round(after.top) ||
      Math.round(before.width) !== Math.round(after.width) ||
      Math.round(before.height) !== Math.round(after.height);
    if (!moved) return;

    // If this tab is still finishing a previous reflow animation, drop it immediately so the
    // stale cleanup can't reveal the real tab mid-way through this new one.
    const pending = specialtyPendingCleanup.get(tab);
    if (pending) {
      window.clearTimeout(pending.timer);
      pending.ghost.remove();
    }

    const ghost = tab.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.tabIndex = -1;
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.position = "fixed";
    ghost.style.margin = "0";
    ghost.style.left = `${before.left}px`;
    ghost.style.top = `${before.top}px`;
    ghost.style.width = `${before.width}px`;
    ghost.style.height = `${before.height}px`;
    ghost.style.transition = "none";
    ghost.style.pointerEvents = "none";
    specialtyGhostLayer.appendChild(ghost);

    tab.style.visibility = "hidden";

    requestAnimationFrame(() => {
      ghost.style.transition = "left var(--ease), top var(--ease), width var(--ease), height var(--ease)";
      ghost.style.left = `${after.left}px`;
      ghost.style.top = `${after.top}px`;
      ghost.style.width = `${after.width}px`;
      ghost.style.height = `${after.height}px`;
    });

    const timer = window.setTimeout(() => {
      tab.style.visibility = "";
      ghost.remove();
      specialtyPendingCleanup.delete(tab);
    }, SPECIALTY_TRANSITION_MS);
    specialtyPendingCleanup.set(tab, { timer, ghost });
  });
}

function showSpecialty(index, moveFocus = false) {
  activeSpecialty = (index + specialties.length) % specialties.length;
  const specialty = specialties[activeSpecialty];

  animateSpecialtyLayout(() => {
    specialtyTabs.forEach((tab, tabIndex) => {
      const active = tabIndex === activeSpecialty;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    applySpecialtyLayout();
  });

  if (specialtyTitle) specialtyTitle.textContent = specialty.title;
  if (specialtyCount) specialtyCount.textContent = `${String(activeSpecialty + 1).padStart(2, "0")} / ${String(specialties.length).padStart(2, "0")}`;

  if (specialtyDescription) {
    specialtyDescription.style.opacity = "0";
    window.setTimeout(() => {
      specialtyDescription.textContent = specialty.description;
      specialtyDescription.style.opacity = "1";
    }, 180);
  }

  if (specialtyImage) {
    specialtyImage.style.opacity = "0";
    window.setTimeout(() => {
      specialtyImage.src = specialty.image;
      specialtyImage.alt = specialty.alt;
      specialtyImage.style.opacity = "1";
    }, 120);
  }

  if (moveFocus) specialtyTabs[activeSpecialty]?.focus();
}

applySpecialtyLayout();

let specialtyResizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(specialtyResizeTimer);
  specialtyResizeTimer = window.setTimeout(applySpecialtyLayout, 150);
});

specialtyTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showSpecialty(index));
  tab.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      showSpecialty(activeSpecialty + 1, true);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      showSpecialty(activeSpecialty - 1, true);
    }
    if (event.key === "Home") {
      event.preventDefault();
      showSpecialty(0, true);
    }
    if (event.key === "End") {
      event.preventDefault();
      showSpecialty(specialties.length - 1, true);
    }
  });
});

document.querySelector("[data-specialty-prev]")?.addEventListener("click", () => showSpecialty(activeSpecialty - 1));
document.querySelector("[data-specialty-next]")?.addEventListener("click", () => showSpecialty(activeSpecialty + 1));

const specialtyLinks = [...document.querySelectorAll("[data-specialty-link]")];
const specialtiesSection = document.querySelector("#expertises");

function activateSpecialtyFromHash() {
  if (!window.location.hash) return;
  const target = specialtyTabs.find((tab) => `#${tab.id}` === window.location.hash);
  if (target) showSpecialty(Number(target.dataset.specialty));
}

specialtyLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const index = Number(link.dataset.specialtyLink);
    showSpecialty(index);
    closeNavDropdowns();
    setMenu(false);
    window.history.pushState(null, "", link.hash);
    specialtiesSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

window.addEventListener("hashchange", activateSpecialtyFromHash);
activateSpecialtyFromHash();

document.querySelectorAll("[data-accordion] .accordion__item").forEach((item) => {
  const button = item.querySelector("button");
  const panel = item.querySelector(".accordion__panel");
  const symbol = button?.querySelector("span");

  button?.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";

    document.querySelectorAll("[data-accordion] .accordion__item").forEach((otherItem) => {
      const otherButton = otherItem.querySelector("button");
      const otherPanel = otherItem.querySelector(".accordion__panel");
      const otherSymbol = otherButton?.querySelector("span");
      otherButton?.setAttribute("aria-expanded", "false");
      if (otherPanel) otherPanel.hidden = true;
      if (otherSymbol) otherSymbol.textContent = "+";
    });

    if (!open) {
      button.setAttribute("aria-expanded", "true");
      if (panel) panel.hidden = false;
      if (symbol) symbol.textContent = "−";
    }
  });
});

const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const formData = new FormData(contactForm);
  const fullName = `${formData.get("firstName")} ${formData.get("lastName")}`.trim();
  const subject = encodeURIComponent(`Demande de rendez-vous — ${fullName}`);
  const body = encodeURIComponent(
    [
      `Nom : ${fullName}`,
      `Email : ${formData.get("email")}`,
      `Téléphone : ${formData.get("phone") || "Non renseigné"}`,
      `Motif : ${formData.get("reason")}`,
      "",
      String(formData.get("message")),
    ].join("\n"),
  );

  if (formStatus) formStatus.textContent = "Votre messagerie va s’ouvrir pour finaliser l’envoi.";
  window.location.href = `mailto:cabinet@genevephysio-lancysport.ch?subject=${subject}&body=${body}`;
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());
