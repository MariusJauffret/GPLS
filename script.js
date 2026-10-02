const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileMenuNav = mobileMenu?.querySelector("nav");
const navDropdowns = [...document.querySelectorAll("[data-nav-dropdown]")];
let menuScrollPosition = 0;
let mobileMenuScrollBuffer = 0;
let mobileMenuScrollFrame = 0;
let mobileMenuScrollLocked = false;
let mobileMenuScrollAnimationFrame = 0;
let mobileMenuScrollRevision = 0;

function setMobileMenuScrollBuffer(height) {
  mobileMenuScrollBuffer = Math.max(0, height);
  mobileMenu?.style.setProperty("--mobile-menu-scroll-buffer", `${mobileMenuScrollBuffer}px`);
}

function trimMobileMenuScrollBuffer() {
  if (!mobileMenu || !mobileMenuScrollBuffer) return;

  const requiredBuffer = Math.max(0, mobileMenu.scrollTop - getMobileMenuNaturalScrollLimit());

  if (requiredBuffer < mobileMenuScrollBuffer) setMobileMenuScrollBuffer(requiredBuffer);
}

function getMobileMenuNaturalScrollLimit() {
  if (!mobileMenu || !mobileMenuNav) return 0;
  const styles = getComputedStyle(mobileMenu);
  // scrollHeight is at least clientHeight, so measure the content itself when it fits.
  const contentHeight = mobileMenuNav.getBoundingClientRect().height - mobileMenuScrollBuffer;
  return Math.max(0, contentHeight + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) - mobileMenu.clientHeight);
}

function cancelMobileMenuScrollAdjustment() {
  mobileMenuScrollRevision += 1;
  cancelAnimationFrame(mobileMenuScrollAnimationFrame);
  mobileMenuScrollAnimationFrame = 0;
  mobileMenuScrollLocked = false;
}

async function settleMobileMenuScroll() {
  const revision = mobileMenuScrollRevision;
  // Keep enough space through every active collapse, including rapid successive taps.
  const transitions = [...mobileMenu.querySelectorAll(".mobile-menu__treatments")]
    .flatMap((panel) => panel.getAnimations());
  await Promise.all(transitions.map((transition) => transition.finished.catch(() => {})));
  if (revision !== mobileMenuScrollRevision || mobileMenu.hidden) return;

  const startTop = mobileMenu.scrollTop;
  const targetTop = Math.min(startTop, getMobileMenuNaturalScrollLimit());
  if (startTop - targetTop < 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    mobileMenu.scrollTop = targetTop;
    setMobileMenuScrollBuffer(0);
    mobileMenuScrollLocked = false;
    return;
  }

  // Ease back only after the item has folded; release the spacer once the scroll fits.
  const startTime = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / 360);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    mobileMenu.scrollTop = startTop + (targetTop - startTop) * eased;
    if (progress < 1) mobileMenuScrollAnimationFrame = requestAnimationFrame(step);
    else {
      mobileMenuScrollAnimationFrame = 0;
      mobileMenuScrollLocked = false;
      setMobileMenuScrollBuffer(0);
    }
  };
  mobileMenuScrollAnimationFrame = requestAnimationFrame(step);
}

// A deliberate scroll takes over immediately from the automatic adjustment.
["wheel", "touchstart", "keydown"].forEach((eventName) => {
  mobileMenu?.addEventListener(eventName, cancelMobileMenuScrollAdjustment, { passive: true });
});

mobileMenu?.addEventListener(
  "scroll",
  () => {
    if (mobileMenuScrollLocked || !mobileMenuScrollBuffer || mobileMenuScrollFrame) return;
    mobileMenuScrollFrame = requestAnimationFrame(() => {
      mobileMenuScrollFrame = 0;
      trimMobileMenuScrollBuffer();
    });
  },
  { passive: true },
);

function setMenu(open) {
  if (!menuToggle || !mobileMenu) return;

  const wasOpen = document.body.classList.contains("menu-open");

  if (open && !wasOpen) {
    menuScrollPosition = window.scrollY;
    document.body.style.setProperty("--menu-scroll-offset", `${-menuScrollPosition}px`);
  }

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector(".sr-only").textContent = open ? "Fermer le menu" : "Ouvrir le menu";
  if (!open && wasOpen) {
    cancelMobileMenuScrollAdjustment();
    setMobileMenuScrollBuffer(0);
  }
  mobileMenu.hidden = !open;
  document.documentElement.classList.toggle("menu-open", open);
  document.body.classList.toggle("menu-open", open);

  if (!open && wasOpen) {
    document.body.style.removeProperty("--menu-scroll-offset");
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, menuScrollPosition);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }

  if (open) {
    refreshDisclosureSizes();
    requestAnimationFrame(() => mobileMenu.querySelector("[data-menu-close]")?.focus());
  } else {
    closeMobileMenuAccordions();
  }

  syncSpecialtyVideos();

  const heroVideo = document.querySelector(".hero__media video");
  if (!heroVideo) return;
  if (open) heroVideo.pause();
  else if (heroSection?.getBoundingClientRect().bottom > 0) heroVideo.play().catch(() => {});
}

menuToggle?.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

// --- Mobile menu (direction 2C): single-open accordion, close button, focus trap ---
const mobileMenuAccordions = mobileMenu ? [...mobileMenu.querySelectorAll("[data-menu-accordion]")] : [];

function setMobileMenuAccordion(button, open) {
  button.setAttribute("aria-expanded", String(open));
  document.getElementById(button.getAttribute("aria-controls"))?.classList.toggle("is-open", open);
}

function closeMobileMenuAccordions() {
  mobileMenuAccordions.forEach((button) => setMobileMenuAccordion(button, false));
}

mobileMenuAccordions.forEach((button) => {
  button.addEventListener("click", () => {
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    mobileMenuAccordions.forEach((other) => {
      if (other !== button) setMobileMenuAccordion(other, false);
    });
    setMobileMenuAccordion(button, willOpen);
  });
});

mobileMenu?.querySelector("[data-menu-close]")?.addEventListener("click", () => {
  setMenu(false);
  menuToggle?.focus();
});

// Keep keyboard focus inside the sheet while it is open.
mobileMenu?.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusables = [...mobileMenu.querySelectorAll("a[href], button:not([disabled])")].filter((el) => {
    const styles = getComputedStyle(el);
    if (styles.visibility === "hidden" || styles.display === "none") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  });
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
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

document.querySelectorAll(".mobile-quick-actions a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.querySelector(".brand")?.addEventListener("click", () => setMenu(false));

const mobileMenuToggles = [...document.querySelectorAll("[data-mobile-menu] [data-collapsible-toggle]")];

// Measure the content so responsive text and loaded fonts cannot outgrow a panel.
const sizedDisclosureSelector = ".pricing-card__details, .mobile-menu__treatments, .about-accordion__panel, .accordion__panel";

function sizeDisclosure(panel) {
  if (!panel?.matches(sizedDisclosureSelector)) return;
  panel.style.setProperty("--disclosure-height", `${panel.scrollHeight}px`);
}

function refreshDisclosureSizes() {
  document.querySelectorAll(sizedDisclosureSelector).forEach(sizeDisclosure);
}

window.addEventListener("resize", refreshDisclosureSizes, { passive: true });
document.fonts?.ready.then(refreshDisclosureSizes);
refreshDisclosureSizes();

document.querySelectorAll("[data-collapsible-toggle]").forEach((toggle) => {
  const panel = document.getElementById(toggle.getAttribute("aria-controls"));
  const isMobileMenuToggle = mobileMenuToggles.includes(toggle);
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!open));
    if (isMobileMenuToggle) {
      cancelMobileMenuScrollAdjustment();
      if (!open) sizeDisclosure(panel);
      else if (panel && mobileMenu && mobileMenu.scrollTop > 0) {
        setMobileMenuScrollBuffer(mobileMenuScrollBuffer + panel.getBoundingClientRect().height);
      }
      mobileMenuScrollLocked = mobileMenuScrollBuffer > 0;
      panel?.classList.toggle("is-open", !open);
      if (panel && mobileMenuScrollBuffer) settleMobileMenuScroll();
    } else if (panel) panel.hidden = open;
  });
});

document.querySelectorAll("[data-expertise-toggle]").forEach((toggle) => {
  const panel = document.getElementById(toggle.getAttribute("aria-controls"));
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("is-open", open);
    if (open) sizeDisclosure(panel);
    panel?.classList.toggle("is-collapsed", !open);
  });
});

// Therapist card "Expertise / En savoir plus" three-state switch.
const expertiseSwitches = [...document.querySelectorAll("[data-expertise-switch]")];

function sizeExpertisePanel(sw, state = sw.dataset.state) {
  if (!state) return;
  const panel = sw.querySelector(".expertise-switch__panel");
  const content = sw.querySelector(`.expertise-switch__content[data-panel="${state}"]`);
  if (panel && content) panel.style.setProperty("--panel-height", `${content.scrollHeight}px`);
}

// Measure the "more" tab's natural width so its resting state hugs its own label
// (which varies per card), while keeping the width transition animatable.
function sizeMoreTab(sw) {
  const more = sw.querySelector(".expertise-switch__tab--more");
  if (!more) return;
  more.style.transition = "none";
  more.style.width = "max-content";
  const hug = Math.ceil(more.getBoundingClientRect().width);
  more.style.width = "";
  sw.style.setProperty("--xp-more-rest-width", `${hug}px`);
  more.getBoundingClientRect();
  more.style.transition = "";
}

expertiseSwitches.forEach((sw) => {
  const bar = sw.querySelector(".expertise-switch__bar");
  const panel = sw.querySelector(".expertise-switch__panel");
  const tabs = [...sw.querySelectorAll("[data-expertise-tab]")];
  const contents = [...sw.querySelectorAll(".expertise-switch__content")];

  const setState = (state) => {
    if (state) {
      // Read geometry before changing state. Hidden content is independently sized.
      const panelIsVisible = panel.getBoundingClientRect().height > 0;
      sizeExpertisePanel(sw, state);
      // Start with the selected color when closed; crossfade if interrupted or open.
      sw.toggleAttribute("data-animate-panel-color", panelIsVisible);
      sw.dataset.panelTone = state;
    }
    // Retain the current tone on close, including any crossfade already in flight.
    if (state) sw.dataset.state = state;
    else delete sw.dataset.state;
    tabs.forEach((tab) => tab.setAttribute("aria-expanded", String(tab.dataset.expertiseTab === state)));
    contents.forEach((content) => {
      const active = content.dataset.panel === state;
      content.inert = !active;
      content.setAttribute("aria-hidden", String(!active));
    });
  };

  setState(null);
  sizeMoreTab(sw);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const next = tab.dataset.expertiseTab;
      setState(sw.dataset.state === next ? null : next);
    });
  });

  // A tap outside the bar collapses the switch back to its resting state.
  document.addEventListener("click", (event) => {
    if (sw.dataset.state && !bar.contains(event.target)) setState(null);
  });
});

window.addEventListener(
  "resize",
  () => expertiseSwitches.forEach((sw) => {
    sizeExpertisePanel(sw);
    sizeMoreTab(sw);
  }),
  { passive: true },
);
document.fonts?.ready.then(() =>
  expertiseSwitches.forEach((sw) => {
    sizeExpertisePanel(sw);
    sizeMoreTab(sw);
  }),
);

const aboutToggles = [...document.querySelectorAll("[data-about-toggle]")];

aboutToggles.forEach((toggle) => {
  const panel = document.getElementById(toggle.getAttribute("aria-controls"));

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("is-open", open);
    if (open) sizeDisclosure(panel);
    panel?.classList.toggle("is-collapsed", !open);
  });
});

document.querySelector("[data-access-link]")?.addEventListener("click", (event) => {
  event.preventDefault();
  const card = document.getElementById("acces-transport");
  const toggle = card?.querySelector("[data-expertise-toggle]");
  if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  if (card) {
    const targetY = window.scrollY + card.getBoundingClientRect().top - 165;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }
});

document.querySelectorAll("[data-team-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const card = document.getElementById(link.getAttribute("href").slice(1));
    if (card) {
      const targetY = window.scrollY + card.getBoundingClientRect().top - 50;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
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
const heroActions = document.querySelector(".hero__actions");
const HEADER_SCROLL_THRESHOLD = 220;
const HEADER_COMPACT_THRESHOLD = 200;
const QUICK_ACTIONS_SCROLL_THRESHOLD = 6;

if (siteHeader) {
  let ticking = false;
  let lastScrollY = window.scrollY;
  let scrollLocked = false;
  let justUnlocked = false;
  let scrollEndTimer = null;

  const updateHeaderScrolled = () => {
    // Locking the page for the menu resets scrollY to zero. Preserve the header's
    // state so restoring that position on close isn't mistaken for scrolling down.
    if (document.body.classList.contains("menu-open")) {
      ticking = false;
      return;
    }
    const currentScrollY = window.scrollY;
    const pastHero = (heroSection?.getBoundingClientRect().bottom ?? Infinity) <= 0;
    siteHeader.classList.toggle("is-scrolled", currentScrollY > HEADER_SCROLL_THRESHOLD);
    siteHeader.classList.toggle("is-compact", currentScrollY > HEADER_COMPACT_THRESHOLD);
    siteHeader.classList.toggle("is-past-hero", pastHero);
    if (heroActions && menuToggle) {
      const docked = heroActions.getBoundingClientRect().top <= menuToggle.getBoundingClientRect().bottom;
      siteHeader.classList.toggle("is-actions-docked", docked);
    }

    if (scrollLocked) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        scrollLocked = false;
        justUnlocked = true;
        lastScrollY = window.scrollY;
      }, 150);
    } else if (justUnlocked) {
      // First scroll after a link-triggered jump settles always brings the
      // stack back, regardless of direction; normal show/hide resumes after.
      siteHeader.classList.remove("is-quick-actions-hidden");
      lastScrollY = currentScrollY;
      justUnlocked = false;
    } else {
      const delta = currentScrollY - lastScrollY;
      if (Math.abs(delta) > QUICK_ACTIONS_SCROLL_THRESHOLD) {
        siteHeader.classList.toggle("is-quick-actions-hidden", delta > 0);
        lastScrollY = currentScrollY;
      }
    }

    ticking = false;
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      scrollLocked = true;
      justUnlocked = false;
      siteHeader.classList.add("is-quick-actions-hidden");
      clearTimeout(scrollEndTimer);
    });
  });

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
    photo: "assets/images/specialties/posttrauma_real.png",
    alt: "Séance de rééducation post-traumatique",
  },
  {
    title: "Physiothérapie respiratoire",
    description: "Une prise en charge personnalisée pour améliorer la capacité respiratoire, faciliter le désencombrement et retrouver plus d’aisance dans les activités quotidiennes.",
    image: "assets/images/specialties/physioresp.png",
    video: "assets/images/physioresp-center.mp4",
    poster: "assets/images/specialties/physioresp-center-poster.webp",
    alt: "Prise en charge en physiothérapie respiratoire",
  },
  {
    title: "Neurologie",
    description: "Un travail individualisé sur la mobilité, l’équilibre et la coordination afin de préserver les capacités fonctionnelles et l’autonomie.",
    image: "assets/images/specialties/neurologie.png",
    photo: "assets/images/specialties/neuro_real.png",
    video: "assets/images/neuro-gpls.mp4",
    poster: "assets/images/specialties/neuro-gpls-poster.webp",
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
    photo: "assets/images/specialties/Sofrologie_real.png",
    alt: "Accompagnement centré sur la respiration",
  },
  {
    title: "Gériatrie",
    description: "Des exercices adaptés pour préserver l’autonomie, l’équilibre et la mobilité, en tenant compte du rythme et des objectifs de chaque personne.",
    image: "assets/images/specialties/geriatrie.png",
    alt: "Accompagnement physiothérapeutique en gériatrie",
  },
  {
    title: "Rhumatologie",
    description: "Une prise en charge ciblée pour réduire les douleurs articulaires, entretenir la mobilité et faciliter les gestes du quotidien.",
    image: "assets/images/specialties/rhumatologie.png",
    photo: "assets/images/specialties/rhumatologie_real.png",
    alt: "Prise en charge en rhumatologie",
  },
  {
    title: "Drainage lymphatique manuel",
    description: "Des techniques manuelles douces destinées à favoriser la circulation lymphatique et à accompagner la prise en charge des œdèmes.",
    image: "assets/images/specialties/drainagelymphatique.png",
    alt: "Soin de drainage lymphatique manuel",
  },
];

const specialtyTabsContainer = document.querySelector("[data-specialty-tabs]");
const specialtyTabs = [...document.querySelectorAll("[data-specialty]")];
const specialtyTitle = document.querySelector("[data-specialty-title]");
const specialtyDescription = document.querySelector("[data-specialty-description]");
const specialtyImage = document.querySelector("[data-specialty-image]");
// Domain shown by default (keep the matching markup in index.html in sync).
let activeSpecialty = specialties.findIndex((specialty) => specialty.title === "Physiothérapie respiratoire");

const SPECIALTY_TRANSITION_MS = 260;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Tablet fallback for the reflow animation: a detached copy of ".specialty-tabs" so cloned buttons
// keep their normal styling (colors, icon, padding) via the same CSS selectors, but positioned
// with `position: fixed`, entirely outside the real grid. Real grid children are never
// transformed directly — doing so confuses the grid's own auto-placement pass and can leave it
// laid out incorrectly, so instead the real grid updates instantly (hidden under its ghost)
// while only this free-floating clone animates from the old rect to the new one.
const specialtyGhostLayer = document.createElement("div");
specialtyGhostLayer.className = "specialty-tabs specialty-tabs__ghost-layer";
document.body.appendChild(specialtyGhostLayer);
const specialtyPendingCleanup = new Map();
const specialtyDesktopQuery = window.matchMedia("(min-width: 1025px)");
let specialtyDesktopRows;
let specialtyDesktopActive = 0;
let specialtyDescriptionTimer;
let specialtyImageTimer;

function moveSpecialtyInRows(rows, previous, next, columns = 5) {
  const source = rows.find((row) => row.includes(previous));
  const target = rows.find((row) => row.includes(next));
  if (!source || !target || source === target) return;
  if (target.length + 1 > columns) {
    const index = target.indexOf(next);
    const [neighbor] = target.splice(index < target.length - 1 ? index + 1 : index - 1, 1);
    source.splice(source.indexOf(previous) + 1, 0, neighbor);
  }
}

function clearSpecialtyGhosts() {
  specialtyPendingCleanup.forEach(({ timer, ghost }, tab) => {
    window.clearTimeout(timer);
    ghost.remove();
    tab.style.visibility = "";
  });
  specialtyPendingCleanup.clear();
}

function applyDesktopSpecialtyLayout() {
  if (!specialtyDesktopRows) {
    specialtyDesktopRows = [];
    specialtyTabs.forEach((_, index) => {
      const row = index < 4 ? 0 : 1 + Math.floor((index - 4) / 5);
      (specialtyDesktopRows[row] ||= []).push(index);
    });
    specialtyDesktopActive = 0;
  }
  moveSpecialtyInRows(specialtyDesktopRows, specialtyDesktopActive, activeSpecialty);
  specialtyDesktopActive = activeSpecialty;
  clearSpecialtyGhosts();
  specialtyTabsContainer.classList.add("specialty-tabs--moving");
  const style = getComputedStyle(specialtyTabsContainer);
  const gap = parseFloat(style.columnGap) || 5;
  const width = specialtyTabsContainer.clientWidth - parseFloat(style.paddingRight) - parseFloat(style.paddingLeft);
  const cellWidth = (width - gap * 4) / 5;
  // Stable wrapping throughout expansion/contraction, including long French titles.
  specialtyTabsContainer.style.setProperty("--specialty-label-width", `${Math.max(1, cellWidth - 40)}px`);
  specialtyTabs.forEach((tab, index) => {
    tab.style.width = `${cellWidth * (index === activeSpecialty ? 2 : 1) + (index === activeSpecialty ? gap : 0)}px`;
    tab.style.gridColumn = "";
    tab.style.gridRow = "";
  });
  // Read text heights together after setting widths: long titles stay inside their cards.
  const rowHeight = Math.max(120, ...specialtyTabs.map((tab) => tab.querySelector("span").scrollHeight + 40));
  specialtyTabsContainer.style.height = `${specialtyDesktopRows.length * rowHeight + (specialtyDesktopRows.length - 1) * gap}px`;
  specialtyDesktopRows.forEach((row, rowIndex) => {
    let column = 0;
    row.forEach((index) => {
      const tab = specialtyTabs[index];
      tab.style.height = `${rowHeight}px`;
      tab.style.transform = `translate(${column * (cellWidth + gap)}px, ${rowIndex * (rowHeight + gap)}px)`;
      column += index === activeSpecialty ? 2 : 1;
    });
  });
}

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
  if (!specialtyTabsContainer) return;
  if (specialtyDesktopQuery.matches) {
    applyDesktopSpecialtyLayout();
    return;
  }
  if (specialtyTabsContainer.classList.contains("specialty-tabs--moving")) {
    specialtyTabsContainer.classList.remove("specialty-tabs--moving");
    specialtyTabsContainer.style.height = "";
    specialtyTabsContainer.style.removeProperty("--specialty-label-width");
    specialtyDesktopRows = undefined;
    specialtyTabs.forEach((tab) => {
      tab.style.width = "";
      tab.style.height = "";
      tab.style.transform = "";
    });
  }
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
  if (specialtyDesktopQuery.matches || reduceMotionQuery.matches || !specialtyTabsContainer) {
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

function showSpecialty(index, moveFocus = false, fromCarousel = false) {
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
  specialtyMenuItems.forEach((item) => {
    item.classList.toggle("is-active", Number(item.dataset.specialtyIndex) === activeSpecialty);
  });

  if (specialtyDescription) {
    window.clearTimeout(specialtyDescriptionTimer);
    specialtyDescription.style.opacity = "0";
    specialtyDescriptionTimer = window.setTimeout(() => {
      specialtyDescription.textContent = specialty.description;
      // Clearing the inline value fades back to the stylesheet's opacity (1).
      specialtyDescription.style.opacity = "";
    }, reduceMotionQuery.matches ? 0 : 100);
  }
  // On phones the carousel slides carry the images; the single feature image is hidden.
  if (specialtyImage && !specialtyMobileQuery.matches) {
    window.clearTimeout(specialtyImageTimer);
    specialtyImage.style.opacity = "0";
    specialtyImageTimer = window.setTimeout(() => {
      specialtyImage.src = specialty.photo || specialty.image;
      specialtyImage.alt = specialty.alt;
      specialtyImage.style.opacity = "1";
    }, reduceMotionQuery.matches ? 0 : 80);
  }

  updateSpecialtyCarousel(!fromCarousel);

  if (moveFocus) specialtyTabs[activeSpecialty]?.focus();
}

// Phone-only carousel: a native scroll-snap track (no loop) whose slides are
// built from `specialties`. Scrolling the track drives showSpecialty();
// anything else that calls showSpecialty() scrolls the track.
const specialtyMobileQuery = window.matchMedia("(max-width: 767px)");
const specialtyTrack = document.querySelector("[data-specialty-track]");
const specialtySlides = [];
// Index a programmatic scroll is heading to; intermediate slides crossed on the
// way are ignored so the text doesn't flicker through every domain in between.
let specialtyScrollTarget = null;
let specialtyScrollIdleTimer;
let specialtyScrollFrame;

function scrollSpecialtyTrackTo(index, smooth = true) {
  const slide = specialtySlides[index];
  if (!slide) return;
  const left = slide.offsetLeft - specialtySlides[0].offsetLeft;
  if (Math.abs(specialtyTrack.scrollLeft - left) < 2) return;
  specialtyScrollTarget = index;
  specialtyTrack.scrollTo({ left, behavior: smooth && !reduceMotionQuery.matches ? "smooth" : "auto" });
}

function updateSpecialtyCarousel(scrollTrack) {
  specialtySlides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === activeSpecialty);
    slide.classList.toggle("is-before", index < activeSpecialty);
    slide.classList.toggle("is-after", index > activeSpecialty);
  });
  syncSpecialtyVideos();
  if (scrollTrack && specialtyMobileQuery.matches) scrollSpecialtyTrackTo(activeSpecialty);
}

// Slide videos: only the active one plays, and only while the carousel is on
// screen, the menu is closed and the visitor hasn't asked for reduced motion.
// Every other video stays paused on its poster (the video's first frame).
let specialtyCarouselOnScreen = false;
// True from about one screen before the carousel scrolls into view.
let specialtyCarouselNear = false;

// Warm-up: once the carousel is near, the active video and its two neighbours
// start buffering so they play straight away instead of stalling on swipe.
// preload="auto" covers most browsers; iOS Safari mostly ignores it, so a
// muted play() + immediate pause() is what actually gets it buffering there.
// Skipped when the visitor has turned on Data Saver.
function primeSpecialtyVideos() {
  if (!specialtyCarouselNear || !specialtyMobileQuery.matches || navigator.connection?.saveData) return;
  [activeSpecialty - 1, activeSpecialty, activeSpecialty + 1].forEach((index) => {
    const video = specialtySlides[index]?.querySelector("video");
    if (!video || video.dataset.primed) return;
    video.dataset.primed = "true";
    video.preload = "auto";
    if (reduceMotionQuery.matches) {
      video.load();
      return;
    }
    // Left to settle on its own: pausing before play() resolves would abort it.
    video.dataset.priming = "true";
    video.play().then(() => {
      if (!isSpecialtyVideoLive(index)) video.pause();
    }).catch(() => {}).finally(() => {
      delete video.dataset.priming;
    });
  });
}

function isSpecialtyVideoLive(index) {
  return index === activeSpecialty
    && specialtyCarouselOnScreen
    && specialtyMobileQuery.matches
    && !document.body.classList.contains("menu-open");
}

function syncSpecialtyVideos() {
  primeSpecialtyVideos();
  const visible = specialtyCarouselOnScreen
    && specialtyMobileQuery.matches
    && !document.body.classList.contains("menu-open");
  specialtySlides.forEach((slide, index) => {
    const video = slide.querySelector("video");
    if (!video) return;
    if (visible && index === activeSpecialty) {
      // With reduced motion nothing autoplays, but a video the visitor started
      // with the sound button is left alone.
      if (!reduceMotionQuery.matches) video.play().catch(() => {});
    } else {
      // Leaving a video always mutes it again, so coming back never surprises
      // anyone with sound.
      if (!video.dataset.priming) video.pause();
      video.muted = true;
    }
  });
}

const SPECIALTY_SOUND_ICONS = `
  <svg class="specialty-carousel__sound-off" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7.5h3L10 4v12l-4-3.5H3z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /><path d="M13.5 7.5l5 5M18.5 7.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
  <svg class="specialty-carousel__sound-on" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7.5h3L10 4v12l-4-3.5H3z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /><path d="M13.5 7a4 4 0 0 1 0 6M15.8 4.8a7 7 0 0 1 0 10.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>`;

// Sound toggle for a video slide. Browsers only allow unmuting from a tap, so
// the click handler is where the sound comes on; if the video wasn't playing
// (reduced motion, iOS Low Power Mode) the same tap starts it.
function createSpecialtySoundButton(video) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "specialty-carousel__sound";
  button.innerHTML = SPECIALTY_SOUND_ICONS;
  const render = () => {
    const soundOn = !video.muted;
    button.setAttribute("aria-pressed", String(soundOn));
    button.setAttribute("aria-label", soundOn ? "Couper le son" : "Activer le son");
  };
  button.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
  });
  video.addEventListener("volumechange", render);
  render();
  return button;
}

function syncSpecialtyFromTrack() {
  const step = specialtySlides[1].offsetLeft - specialtySlides[0].offsetLeft;
  // Outside the phone layout the track is display:none (step 0), and hiding it
  // resets its scroll, which still fires a scroll event — ignore that.
  if (!specialtyMobileQuery.matches || step <= 0) return;
  const index = Math.max(0, Math.min(specialtySlides.length - 1, Math.round(specialtyTrack.scrollLeft / step)));
  if (specialtyScrollTarget !== null && index !== specialtyScrollTarget) return;
  if (index === specialtyScrollTarget) specialtyScrollTarget = null;
  if (index !== activeSpecialty) showSpecialty(index, false, true);
}

// Titles change length from one domain to the next; reserve the tallest one
// so the content below doesn't jump while swiping.
function reserveTallestText(element, texts) {
  if (!element) return;
  element.style.minHeight = "";
  if (!specialtyMobileQuery.matches) return;
  const probe = element.cloneNode(false);
  probe.removeAttribute("id");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${element.clientWidth}px;`;
  element.parentElement.appendChild(probe);
  const tallest = Math.max(...texts.map((text) => {
    probe.textContent = text;
    return probe.offsetHeight;
  }));
  probe.remove();
  element.style.minHeight = `${tallest}px`;
}

function reserveSpecialtyTextHeight() {
  reserveTallestText(specialtyTitle, specialties.map((specialty) => specialty.title));
}

if (specialtyTrack) {
  specialties.forEach((specialty, index) => {
    const slide = document.createElement("div");
    slide.className = "specialty-carousel__slide";
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "diapositive");
    slide.setAttribute("aria-label", `${index + 1} sur ${specialties.length} : ${specialty.title}`);
    let media;
    if (specialty.video) {
      // muted + playsinline (as attributes, for iOS) are what allow autoplay.
      media = document.createElement("video");
      media.muted = true;
      media.setAttribute("muted", "");
      media.setAttribute("playsinline", "");
      media.loop = true;
      media.preload = "none";
      media.poster = specialty.poster;
      media.src = specialty.video;
      media.setAttribute("aria-label", specialty.alt);
    } else {
      media = document.createElement("img");
      media.src = specialty.photo || specialty.image;
      media.alt = specialty.alt;
      media.loading = "lazy";
      media.decoding = "async";
    }
    // The depth effect (scale/opacity) lives on this inner card: Safari snaps
    // to the transformed box, so transforming the slide itself shifts where it stops.
    const card = document.createElement("div");
    card.className = "specialty-carousel__card";
    card.appendChild(media);
    if (specialty.video) card.appendChild(createSpecialtySoundButton(media));
    slide.appendChild(card);
    specialtyTrack.appendChild(slide);
    specialtySlides.push(slide);
  });

  specialtyTrack.addEventListener("scroll", () => {
    window.cancelAnimationFrame(specialtyScrollFrame);
    specialtyScrollFrame = window.requestAnimationFrame(syncSpecialtyFromTrack);
    // Safety net if a programmatic scroll is interrupted by the user before
    // reaching its target: once scrolling settles, follow wherever it stopped.
    window.clearTimeout(specialtyScrollIdleTimer);
    specialtyScrollIdleTimer = window.setTimeout(() => {
      specialtyScrollTarget = null;
      syncSpecialtyFromTrack();
    }, 150);
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      specialtyCarouselOnScreen = entry.isIntersecting;
      syncSpecialtyVideos();
    }, { threshold: 0.25 }).observe(specialtyTrack);
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      specialtyCarouselNear = true;
      primeSpecialtyVideos();
    }, { rootMargin: "0px 0px 100% 0px" }).observe(specialtyTrack);
  }
  reduceMotionQuery.addEventListener("change", syncSpecialtyVideos);

  updateSpecialtyCarousel(false);
  if (specialtyMobileQuery.matches) scrollSpecialtyTrackTo(activeSpecialty, false);
  reserveSpecialtyTextHeight();
  document.fonts?.ready.then(reserveSpecialtyTextHeight);
  let specialtyCarouselWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === specialtyCarouselWidth) return;
    specialtyCarouselWidth = window.innerWidth;
    reserveSpecialtyTextHeight();
    if (specialtyMobileQuery.matches) scrollSpecialtyTrackTo(activeSpecialty, false);
  });
  // Entering/leaving the phone layout: drop or restore the reserved heights,
  // and show the active domain's image in the single (non-phone) feature image.
  specialtyMobileQuery.addEventListener("change", () => {
    reserveSpecialtyTextHeight();
    syncSpecialtyVideos();
    if (specialtyMobileQuery.matches) {
      scrollSpecialtyTrackTo(activeSpecialty, false);
    } else if (specialtyImage) {
      specialtyImage.src = specialties[activeSpecialty].photo || specialties[activeSpecialty].image;
      specialtyImage.alt = specialties[activeSpecialty].alt;
    }
  });
}

applySpecialtyLayout();
specialtyTabs.forEach((tab, index) => { tab.tabIndex = index === activeSpecialty ? 0 : -1; });

// The tab thumbnails are marked loading="lazy" so a phone never downloads all
// nine (the tab grid is display:none below 768px, and only the active tab's
// thumbnail is ever shown above it). That alone would leave a visible gap the
// first time a desktop visitor switches tabs, so once the page is idle we warm
// the cache in the background — but only when the grid is actually rendered.
if (specialtyTabsContainer?.offsetParent !== null) {
  const warmSpecialtyThumbnails = () => {
    specialtyTabs.forEach((tab) => {
      const src = tab.querySelector("img")?.getAttribute("src");
      if (src) new Image().src = src;
    });
  };

  if ("requestIdleCallback" in window) window.requestIdleCallback(warmSpecialtyThumbnails, { timeout: 3000 });
  else window.setTimeout(warmSpecialtyThumbnails, 1200);
}

let specialtyResizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(specialtyResizeTimer);
  specialtyResizeTimer = window.setTimeout(applySpecialtyLayout, 150);
});
specialtyDesktopQuery.addEventListener("change", () => {
  clearSpecialtyGhosts();
  applySpecialtyLayout();
});
if (specialtyTabsContainer && "ResizeObserver" in window) {
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === lastWidth) return;
    lastWidth = entry.contentRect.width;
    if (specialtyDesktopQuery.matches) applySpecialtyLayout();
  }).observe(specialtyTabsContainer);
}
document.fonts?.ready.then(() => { if (specialtyDesktopQuery.matches) applySpecialtyLayout(); });

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

const specialtyMenuList = document.querySelector("[data-specialty-menu-list]");
const specialtyMenuItems = [];

// Listed in the same order as the carousel and tabs (2-column grid, row-major).
if (specialtyMenuList) {
  specialties.forEach((specialty, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = specialty.title;
    item.dataset.specialtyIndex = String(index);
    item.addEventListener("click", () => {
      showSpecialty(index);
      const toggle = document.querySelector('.specialty-feature__list-toggle');
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.classList.remove("is-open");
      specialtyMenuList.closest(".specialty-feature__list-panel")?.classList.add("is-collapsed");
      toggle?.focus({ preventScroll: true });
    });
    item.classList.toggle("is-active", index === activeSpecialty);
    specialtyMenuList.appendChild(item);
    specialtyMenuItems.push(item);
  });
}

const specialtySwipeArea = document.querySelector("[data-specialty-swipe]");
if (specialtySwipeArea) {
  const SWIPE_THRESHOLD = 40;
  let touchStartX = 0;
  let touchStartY = 0;

  specialtySwipeArea.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    },
    { passive: true }
  );

  specialtySwipeArea.addEventListener(
    "touchend",
    (event) => {
      // Phones swipe through the native carousel track instead.
      if (specialtyMobileQuery.matches) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;
      showSpecialty(activeSpecialty + (deltaX < 0 ? 1 : -1), true);
    },
    { passive: true }
  );
}

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
    if (specialtiesSection) {
      const targetY = window.scrollY + specialtiesSection.getBoundingClientRect().top + 200;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  });
});

window.addEventListener("hashchange", activateSpecialtyFromHash);
activateSpecialtyFromHash();

document.querySelectorAll("[data-accordion] .accordion__item").forEach((item) => {
  const button = item.querySelector("button");
  const panel = item.querySelector(".accordion__panel");

  button?.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.classList.toggle("is-open", open);
    if (open) sizeDisclosure(panel);
    panel?.classList.toggle("is-collapsed", !open);
  });
});

const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

function parseContactPhone(value) {
  const normalized = value.trim().replace(/^00/, "+");
  if (!normalized || !/^\+?[\d\s().-]+$/.test(normalized)) return null;
  return window.libphonenumber.parsePhoneNumberFromString(normalized, {
    defaultCountry: "CH",
    extract: false,
  }) || null;
}

const phoneField = contactForm?.querySelector('[name="phone"]');
const phoneBadge = contactForm?.querySelector("[data-phone-country]");
const phoneClear = contactForm?.querySelector(".form-grid__phone-clear");
let phoneTouched = false;

function validateContactPhone(showError = false) {
  if (!phoneField) return true;
  const hasValue = phoneField.value.trim() !== "";
  const parsed = parseContactPhone(phoneField.value);
  const valid = Boolean(parsed?.isValid());
  const invalid = hasValue && !valid;
  phoneField.setCustomValidity(invalid ? "Numéro invalide. Vérifiez le numéro et son indicatif (ex. +41 pour la Suisse)." : "");
  phoneField.classList.toggle("is-valid", hasValue && valid);
  phoneField.classList.toggle("is-invalid", invalid && showError);
  phoneField.setAttribute("aria-invalid", String(invalid && showError));
  if (phoneClear) phoneClear.hidden = !(invalid && showError);
  if (phoneBadge) {
    const country = valid ? parsed.country : null;
    phoneBadge.textContent = country || "";
    phoneBadge.title = country ? new Intl.DisplayNames(["fr"], { type: "region" }).of(country) : "";
  }
  return !invalid;
}

phoneField?.addEventListener("input", () => validateContactPhone(phoneTouched));
phoneField?.addEventListener("blur", () => {
  phoneTouched = true;
  validateContactPhone(true);
});
phoneField?.addEventListener("invalid", () => {
  phoneTouched = true;
  validateContactPhone(true);
});
phoneClear?.addEventListener("click", () => {
  phoneField.value = "";
  phoneTouched = false;
  phoneField.dispatchEvent(new Event("input", { bubbles: true }));
  phoneField.focus();
});

const emailField = contactForm?.querySelector('[name="email"]');
emailField?.addEventListener("blur", () => {
  const hasValue = emailField.value.trim() !== "";
  emailField.classList.toggle("is-valid", hasValue && emailField.checkValidity());
  emailField.classList.toggle("is-invalid", hasValue && !emailField.checkValidity());
});
emailField?.addEventListener("input", () => emailField.classList.remove("is-valid", "is-invalid"));
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  validateContactPhone(true);
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
      "",
      String(formData.get("message")),
    ].join("\n"),
  );

  if (formStatus) formStatus.textContent = "Votre messagerie va s’ouvrir pour finaliser l’envoi.";
  window.location.href = `mailto:cabinet@genevephysio-lancysport.ch?subject=${subject}&body=${body}`;
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());
