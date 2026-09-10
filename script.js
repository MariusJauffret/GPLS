// Scroll-reveal. Deliberately the first thing in this file: the .js-reveal gate
// (which is what actually hides anything — see styles.css) and the observer that
// un-hides it are wired in the same tick, so an error anywhere later in this
// file can't strand content at opacity: 0. It also bails out before adding the
// gate at all when it can't deliver the animation, leaving content plainly
// visible rather than hidden.
(() => {
  const targets = [...document.querySelectorAll(".reveal")];
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.documentElement.classList.add("js-reveal");

  // Stagger elements that share a parent (card grids, accordion items) by the
  // order they appear in, capped so a long list doesn't end up with a
  // multi-second tail.
  targets.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((child) => child.classList.contains("reveal"));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );
  targets.forEach((el) => revealObserver.observe(el));
})();

const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const navDropdowns = [...document.querySelectorAll("[data-nav-dropdown]")];

function setMenu(open) {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector(".sr-only").textContent = open ? "Fermer le menu" : "Ouvrir le menu";
  mobileMenu.hidden = !open;
  document.body.classList.toggle("menu-open", open);
  if (open) refreshDisclosureSizes();

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

document.querySelector(".brand")?.addEventListener("click", () => setMenu(false));

const mobileMenuToggles = [...document.querySelectorAll("[data-mobile-menu] [data-collapsible-toggle]")];

// Measure the content so responsive text and loaded fonts cannot outgrow a panel.
const sizedDisclosureSelector = ".pricing-card__details, .therapist-card__expertise-panel, .mobile-menu__treatments";

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

    if (!open && isMobileMenuToggle) {
      mobileMenuToggles.forEach((other) => {
        if (other === toggle) return;
        other.setAttribute("aria-expanded", "false");
        document.getElementById(other.getAttribute("aria-controls"))?.classList.remove("is-open");
      });
    }

    toggle.setAttribute("aria-expanded", String(!open));
    if (isMobileMenuToggle) {
      if (!open) sizeDisclosure(panel);
      panel?.classList.toggle("is-open", !open);
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
        siteHeader.classList.toggle("is-quick-actions-hidden", delta < 0);
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
    title: "Rhumatologie",
    description: "Une prise en charge ciblée pour réduire les douleurs articulaires, entretenir la mobilité et faciliter les gestes du quotidien.",
    image: "assets/images/specialties/rhumatologie.png",
    photo: "assets/images/specialties/rhumatologie_real.png",
    alt: "Prise en charge en rhumatologie",
  },
  {
    title: "Neurologie",
    description: "Un travail individualisé sur la mobilité, l’équilibre et la coordination afin de préserver les capacités fonctionnelles et l’autonomie.",
    image: "assets/images/specialties/neurologie.png",
    photo: "assets/images/specialties/neuro_real.png",
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
let activeSpecialty = 0;

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
  specialtyMenuItems.forEach((item) => {
    item.classList.toggle("is-active", Number(item.dataset.specialtyIndex) === activeSpecialty);
  });

  if (specialtyDescription) {
    window.clearTimeout(specialtyDescriptionTimer);
    specialtyDescription.style.opacity = "0";
    specialtyDescriptionTimer = window.setTimeout(() => {
      specialtyDescription.textContent = specialty.description;
      specialtyDescription.style.opacity = "1";
    }, reduceMotionQuery.matches ? 0 : 180);
  }
  if (specialtyImage) {
    window.clearTimeout(specialtyImageTimer);
    specialtyImage.style.opacity = "0";
    specialtyImageTimer = window.setTimeout(() => {
      specialtyImage.src = specialty.photo || specialty.image;
      specialtyImage.alt = specialty.alt;
      specialtyImage.style.opacity = "1";
    }, reduceMotionQuery.matches ? 0 : 120);
  }

  if (moveFocus) specialtyTabs[activeSpecialty]?.focus();
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

// Display order for the 2-column grid (row-major): (0,0) Rééducation
// post-traumatique, (0,1) Drainage lymphatique manuel, (1,0) Physiothérapie
// respiratoire, then the rest in their natural order.
const specialtyMenuOrder = [0, 6, 8, 1, 2, 3, 4, 5, 7];

if (specialtyMenuList) {
  specialtyMenuOrder.forEach((index) => {
    const specialty = specialties[index];
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
