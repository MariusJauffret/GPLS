const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const treatmentsMenu = document.querySelector("[data-treatments-menu]");
const treatmentsToggle = document.querySelector("[data-treatments-toggle]");

function setMenu(open) {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector(".sr-only").textContent = open ? "Fermer le menu" : "Ouvrir le menu";
  mobileMenu.hidden = !open;
  document.body.classList.toggle("menu-open", open);
}

menuToggle?.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

function setTreatmentsMenu(open) {
  if (!treatmentsMenu || !treatmentsToggle) return;

  treatmentsMenu.toggleAttribute("data-open", open);
  treatmentsToggle.setAttribute("aria-expanded", String(open));
}

treatmentsToggle?.addEventListener("click", () => {
  setTreatmentsMenu(treatmentsToggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("click", (event) => {
  if (treatmentsMenu && !treatmentsMenu.contains(event.target)) setTreatmentsMenu(false);
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && treatmentsToggle?.getAttribute("aria-expanded") === "true") {
    setTreatmentsMenu(false);
    treatmentsToggle.focus();
  }

  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 767) setMenu(false);
});

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
    image: "assets/images/specialty-respiratory.png",
    alt: "Séance de rééducation post-traumatique",
  },
  {
    title: "Rhumatologie",
    description: "Une prise en charge ciblée pour réduire les douleurs articulaires, entretenir la mobilité et faciliter les gestes du quotidien.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Prise en charge en rhumatologie",
  },
  {
    title: "Neurologie",
    description: "Un travail individualisé sur la mobilité, l’équilibre et la coordination afin de préserver les capacités fonctionnelles et l’autonomie.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Prise en charge en neurologie",
  },
  {
    title: "Périnatalité",
    description: "Une prise en charge douce et adaptée aux changements du corps avant et après la naissance, selon les besoins et les indications de chacune.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Prise en charge en périnatalité",
  },
  {
    title: "Oncologie",
    description: "Un suivi individualisé pour soutenir la mobilité, limiter le déconditionnement et accompagner les besoins fonctionnels pendant ou après les traitements.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Accompagnement physiothérapeutique en oncologie",
  },
  {
    title: "Sophrologie",
    description: "Une approche complémentaire fondée sur la respiration et la détente pour mieux vivre les tensions et retrouver un rapport plus serein au corps.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Accompagnement centré sur la respiration",
  },
  {
    title: "Drainage lymphatique manuel",
    description: "Des techniques manuelles douces destinées à favoriser la circulation lymphatique et à accompagner la prise en charge des œdèmes.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Soin de drainage lymphatique manuel",
  },
  {
    title: "Gériatrie",
    description: "Des exercices adaptés pour préserver l’autonomie, l’équilibre et la mobilité, en tenant compte du rythme et des objectifs de chaque personne.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Accompagnement physiothérapeutique en gériatrie",
  },
  {
    title: "Physiothérapie respiratoire",
    description: "Une prise en charge personnalisée pour améliorer la capacité respiratoire, faciliter le désencombrement et retrouver plus d’aisance dans les activités quotidiennes.",
    image: "assets/images/specialty-respiratory.png",
    alt: "Prise en charge en physiothérapie respiratoire",
  },
];

const specialtyTabs = [...document.querySelectorAll("[data-specialty]")];
const specialtyTitle = document.querySelector("[data-specialty-title]");
const specialtyDescription = document.querySelector("[data-specialty-description]");
const specialtyImage = document.querySelector("[data-specialty-image]");
const specialtyCount = document.querySelector("[data-specialty-count]");
let activeSpecialty = 0;

function showSpecialty(index, moveFocus = false) {
  activeSpecialty = (index + specialties.length) % specialties.length;
  const specialty = specialties[activeSpecialty];

  specialtyTabs.forEach((tab, tabIndex) => {
    const active = tabIndex === activeSpecialty;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  if (specialtyTitle) specialtyTitle.textContent = specialty.title;
  if (specialtyDescription) specialtyDescription.textContent = specialty.description;
  if (specialtyCount) specialtyCount.textContent = `${String(activeSpecialty + 1).padStart(2, "0")} / ${String(specialties.length).padStart(2, "0")}`;

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
    setTreatmentsMenu(false);
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
