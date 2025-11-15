(() => {
  "use strict";

  /**
   * Cache of frequently accessed DOM nodes to avoid repeated lookups.
   * Filled once during initialization.
   */
  const DOM = {};

  const { computeBuildingEffects, getBuildingImpact } = ModifierUtils;
  const { sanitizeTimeScale, updateCheatProgress } = GodModeUtils;

  // -------------------------------
  // Internationalisation + état UI
  // -------------------------------

  const I18N = {
    fr: {
      "app.browserTitle": "Victor Buck Tycoon",
      "app.title": "Victor Buck Tycoon",
      "app.tagline": "Transforme ton imprimerie en usine 4.0 omnicanale.",
      "stats.docBank": "Documents disponibles 📄",
      "stats.docTotal": "Total documents 📈",
      "stats.ccTotal": "Confiance client ⭐",
      "stats.docPs": "Production actuelle",
      "stats.docPsValue": "{{amount}} DOC/s",
      "actions.printDocument": "Imprimer un document",
      "actions.buy": "Acheter",
      "actions.tooExpensive": "Trop cher",
      "gauges.quality": "Qualité ✅",
      "gauges.footprint": "Empreinte papier 🌳",
      "gauges.image": "Image VBS 🏅",
      "chips.culture": "Culture d'entreprise ✨",
      "chips.prestige": "Prestige global x",
      "sections.buildingsTitle": "Bâtiments de production 🏭",
      "sections.buildingsHint": "Achète des paliers pour automatiser tes documents traités.",
      "sections.upgradesTitle": "Améliorations et prestige 🚀",
      "sections.upgradesHint": "Upgrades globales de base (MVP). Tu pourras en rajouter.",
      "sections.prestigeTitle": "Réorg stratégique 🔁",
      "sections.logTitle": "Journal d'activité 📰",
      "sections.godModeTitle": "God mode 🦊",
      "label.costDoc": "Coût : {{amount}} DOC",
      "label.quantity": "Quantité : {{count}}",
      "label.productionPerUnit": "Prod : {{amount}} DOC/s par unité",
      "label.totalProduction": "Total : {{amount}} DOC/s",
      "label.totalProductionNA": "Total : -",
      "label.modifierOnly": "Modificateur",
      "label.modifierPerUnit": "Impact/unité : {{impact}}",
      "label.modifierTotal": "Impact total : {{impact}}",
      "label.modifierImpactNA": "Impact total : -",
      "label.modifierPerUnitNA": "Impact/unité : -",
      "impact.doc": "DOC",
      "impact.cc": "Confiance",
      "impact.quality": "Qualité",
      "impact.footprint": "Empreinte",
      "impact.image": "Image",
      "label.noUpgrade": "Pas d'amélioration disponible pour le moment.",
      "buildings.noneAffordable": "Accumule davantage de documents pour débloquer de nouveaux bâtiments.",
      "godMode.hint": "Tape « renard » pour dévoiler les contrôles. Ajuste la vitesse du temps avec prudence.",
      "godMode.status": "Vitesse actuelle : x{{scale}}",
      "prestige.infoLocked": "Réinitialise l'usine pour gagner de la culture d'entreprise. Minimum requis : {{min}} points de confiance cumulés.",
      "prestige.infoAvailable": "Tu peux lancer une réorganisation stratégique. Tu perdras tes bâtiments et DOC, mais tu gagneras {{gain}} point(s) de culture d'entreprise.",
      "prestige.buttonLocked": "Réorg stratégique indisponible",
      "prestige.buttonAvailable": "Réorganiser maintenant (+{{gain}} culture)",
      "prestige.confirm": "Lancer une réorganisation stratégique et tout réinitialiser pour gagner {{gain}} point(s) de culture d'entreprise ?",
      "log.welcome": "Bienvenue chez Victor Buck Tycoon. Commence à cliquer pour imprimer tes premiers documents. 📄",
      "log.incident": "Petit incident de production. La qualité baisse légèrement.",
      "log.optimization": "Optimisation imprévue : tu réduis un peu ton empreinte papier.",
      "log.buyBuilding": "Tu achètes {{name}} (total : {{total}}).",
      "log.buyUpgrade": "Upgrade achetée : {{name}}.",
      "log.prestige": "Réorganisation stratégique : +{{amount}} point(s) de culture d'entreprise.",
      "building.reproOperator.name": "Opérateur repro",
      "building.reproOperator.desc": "Surveille les copieurs, recharge le papier, relance les impressions.",
      "building.reproWorkshop.name": "Atelier reprographie",
      "building.reproWorkshop.desc": "Plusieurs copieurs alignés, plastifieuse, relieuse.",
      "building.digitalPress.name": "Presse numérique",
      "building.digitalPress.desc": "Les premières grosses machines industrielles.",
      "building.offsetPress.name": "Presse offset",
      "building.offsetPress.desc": "Pour les très grands tirages.",
      "building.finishingWorkshop.name": "Atelier de finition",
      "building.finishingWorkshop.desc": "Massicots, plieuses, agrafeuses pour finaliser les lots.",
      "building.insertingLine.name": "Ligne de mise sous pli",
      "building.insertingLine.desc": "Met les documents dans les enveloppes, timbre et prépare l'envoi.",
      "building.logistics.name": "Logistique et tri postal",
      "building.logistics.desc": "Bacs, palettes, camions postaux pour fiabiliser les expéditions.",
      "building.vbsPortal.name": "VPlatform / VBS Portal",
      "building.vbsPortal.desc": "Les clients envoient leurs flux via la plateforme sécurisée.",
      "building.comBridge.name": "ComBridge omnicanal",
      "building.comBridge.desc": "Courrier, email, SMS, portail : tout dans le même flux.",
      "building.factory40.name": "Usine Victor Buck 4.0",
      "building.factory40.desc": "Capteurs, robots logistiques et monitoring temps réel.",
      "building.pampyAI.name": "IA Pampy Print",
      "building.pampyAI.desc": "Prédit les pics, optimise les jobs, réduit le gâchis papier.",
      "upgrade.upg_click_power_1.name": "Imprimeur motivé 💪",
      "upgrade.upg_click_power_1.desc": "Le clic manuel produit 2 fois plus de documents.",
      "upgrade.upg_global_prod_1.name": "Organisation du flux 📦",
      "upgrade.upg_global_prod_1.desc": "Production globale de tous les bâtiments +20 %. ",
      "upgrade.upg_quality_boost_1.name": "Contrôle qualité renforcé 🔍",
      "upgrade.upg_quality_boost_1.desc": "Qualité de base +10 points."
    },
    en: {
      "app.browserTitle": "Victor Buck Tycoon",
      "app.title": "Victor Buck Tycoon",
      "app.tagline": "Turn your print shop into a 4.0 omnichannel factory.",
      "stats.docBank": "Documents available 📄",
      "stats.docTotal": "Documents total 📈",
      "stats.ccTotal": "Customer trust ⭐",
      "stats.docPs": "Current production",
      "stats.docPsValue": "{{amount}} DOC/s",
      "actions.printDocument": "Print a document",
      "actions.buy": "Buy",
      "actions.tooExpensive": "Too expensive",
      "gauges.quality": "Quality ✅",
      "gauges.footprint": "Paper footprint 🌳",
      "gauges.image": "VBS image 🏅",
      "chips.culture": "Company culture ✨",
      "chips.prestige": "Global prestige x",
      "sections.buildingsTitle": "Production buildings 🏭",
      "sections.buildingsHint": "Buy tiers to automate your processed documents.",
      "sections.upgradesTitle": "Upgrades & prestige 🚀",
      "sections.upgradesHint": "Core MVP upgrades. Add more as you grow.",
      "sections.prestigeTitle": "Strategic reorg 🔁",
      "sections.logTitle": "Activity log 📰",
      "sections.godModeTitle": "God mode 🦊",
      "label.costDoc": "Cost: {{amount}} DOC",
      "label.quantity": "Quantity: {{count}}",
      "label.productionPerUnit": "Prod: {{amount}} DOC/s per unit",
      "label.totalProduction": "Total: {{amount}} DOC/s",
      "label.totalProductionNA": "Total: -",
      "label.modifierOnly": "Modifier",
      "label.modifierPerUnit": "Impact/unit: {{impact}}",
      "label.modifierTotal": "Total impact: {{impact}}",
      "label.modifierImpactNA": "Total impact: -",
      "label.modifierPerUnitNA": "Impact/unit: -",
      "impact.doc": "DOC",
      "impact.cc": "Trust",
      "impact.quality": "Quality",
      "impact.footprint": "Footprint",
      "impact.image": "Image",
      "label.noUpgrade": "No upgrade available right now.",
      "buildings.noneAffordable": "Print more documents to unlock the next building tier.",
      "godMode.hint": "Type “renard” while focused on the window to reveal the controls. Handle time with care.",
      "godMode.status": "Current speed: x{{scale}}",
      "prestige.infoLocked": "Reset the factory to gain company culture. Minimum required: {{min}} cumulative trust points.",
      "prestige.infoAvailable": "You can trigger a strategic reorg. You'll lose your buildings and DOC but gain {{gain}} company culture point(s).",
      "prestige.buttonLocked": "Strategic reorg unavailable",
      "prestige.buttonAvailable": "Reorganize now (+{{gain}} culture)",
      "prestige.confirm": "Launch a strategic reorganisation and reset everything to gain {{gain}} culture point(s)?",
      "log.welcome": "Welcome to Victor Buck Tycoon. Start clicking to print your first documents. 📄",
      "log.incident": "Minor production incident. Quality drops slightly.",
      "log.optimization": "Unexpected optimization: you shrink your paper footprint a bit.",
      "log.buyBuilding": "You buy {{name}} (total: {{total}}).",
      "log.buyUpgrade": "Upgrade purchased: {{name}}.",
      "log.prestige": "Strategic reorg: +{{amount}} company culture point(s).",
      "building.reproOperator.name": "Copy room operator",
      "building.reproOperator.desc": "Keeps copiers running, refills paper, restarts jobs.",
      "building.reproWorkshop.name": "Reprography workshop",
      "building.reproWorkshop.desc": "Several copiers in row plus laminators and binders.",
      "building.digitalPress.name": "Digital press",
      "building.digitalPress.desc": "First industrial-scale machines.",
      "building.offsetPress.name": "Offset press",
      "building.offsetPress.desc": "Handles the very large print runs.",
      "building.finishingWorkshop.name": "Finishing workshop",
      "building.finishingWorkshop.desc": "Cutters, folders and staplers to finish the lots.",
      "building.insertingLine.name": "Mail inserting line",
      "building.insertingLine.desc": "Stuff documents into envelopes, stamp them and prep shipping.",
      "building.logistics.name": "Logistics & postal sorting",
      "building.logistics.desc": "Trays, pallets and postal trucks to secure shipments.",
      "building.vbsPortal.name": "VPlatform / VBS Portal",
      "building.vbsPortal.desc": "Clients send their data flows through the secure portal.",
      "building.comBridge.name": "ComBridge omnichannel",
      "building.comBridge.desc": "Mail, email, SMS and portal in the same workflow.",
      "building.factory40.name": "Victor Buck Factory 4.0",
      "building.factory40.desc": "Sensors everywhere, logistics bots, real-time monitoring.",
      "building.pampyAI.name": "Pampy Print AI",
      "building.pampyAI.desc": "Predicts peaks, optimises jobs and reduces paper waste.",
      "upgrade.upg_click_power_1.name": "Motivated printer 💪",
      "upgrade.upg_click_power_1.desc": "Manual clicks produce twice as many documents.",
      "upgrade.upg_global_prod_1.name": "Flow organisation 📦",
      "upgrade.upg_global_prod_1.desc": "Global production +20% for every building.",
      "upgrade.upg_quality_boost_1.name": "Boosted quality control 🔍",
      "upgrade.upg_quality_boost_1.desc": "Base quality +10 percentage points."
    }
  };

  let currentLang = (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";

  /** Tracks which sections need a render refresh. */
  const uiState = {
    buildingsDirty: true,
    upgradesDirty: true
  };

  /** Global model of the player progression. */
  const gameState = {
    resources: {
      docBank: 0,
      docTotal: 0,
      ccTotal: 0,
      culturePoints: 0
    },
    stats: {
      quality: 0.5,
      footprint: 0.5,
      imageVbs: 0.5
    },
    config: {
      docPerClickBase: 1,
      globalProductionMultiplierBase: 1,
      qualityRecoveryRate: 0.02,
      imageRecoveryRate: 0.01,
      footprintDriftBase: 0.00001,
      prestigeCcDivisor: 1000,
      prestigeRequirement: 10000
    },
    time: {
      lastUpdate: performance.now()
    },
    buildings: [],
    upgrades: [],
    log: []
  };

  /** Static blueprint for every building available in the MVP. */
  const BUILDING_DEFS = [
    {
      id: "reproOperator",
      emoji: "👷",
      nameKey: "building.reproOperator.name",
      descKey: "building.reproOperator.desc",
      baseProduction: 0.5,
      baseCost: 15,
      costMultiplier: 1.15,
      role: "producer",
      qualityBonusPerUnit: 0.0,
      footprintBonusPerUnit: 0.0,
      imageBonusPerUnit: 0.0
    },
    {
      id: "reproWorkshop",
      emoji: "🛠️",
      nameKey: "building.reproWorkshop.name",
      descKey: "building.reproWorkshop.desc",
      baseProduction: 3,
      baseCost: 100,
      costMultiplier: 1.15,
      role: "producer",
      qualityBonusPerUnit: 0.005,
      footprintBonusPerUnit: -0.002,
      imageBonusPerUnit: 0.0
    },
    {
      id: "digitalPress",
      emoji: "🖨️",
      nameKey: "building.digitalPress.name",
      descKey: "building.digitalPress.desc",
      baseProduction: 20,
      baseCost: 1000,
      costMultiplier: 1.15,
      role: "producer",
      qualityBonusPerUnit: 0.01,
      footprintBonusPerUnit: 0.003,
      imageBonusPerUnit: 0.005
    },
    {
      id: "offsetPress",
      emoji: "🗞️",
      nameKey: "building.offsetPress.name",
      descKey: "building.offsetPress.desc",
      baseProduction: 120,
      baseCost: 10000,
      costMultiplier: 1.15,
      role: "producer",
      qualityBonusPerUnit: 0.015,
      footprintBonusPerUnit: 0.01,
      imageBonusPerUnit: 0.01
    },
    {
      id: "finishingWorkshop",
      emoji: "✂️",
      nameKey: "building.finishingWorkshop.name",
      descKey: "building.finishingWorkshop.desc",
      baseProduction: 0,
      baseCost: 1500,
      costMultiplier: 1.15,
      role: "multiplier",
      docMultiplierPerUnit: 0.03,
      qualityBonusPerUnit: 0.01,
      footprintBonusPerUnit: -0.004,
      imageBonusPerUnit: 0.0
    },
    {
      id: "insertingLine",
      emoji: "📬",
      nameKey: "building.insertingLine.name",
      descKey: "building.insertingLine.desc",
      baseProduction: 0,
      baseCost: 3000,
      costMultiplier: 1.15,
      role: "multiplier",
      docMultiplierPerUnit: 0.02,
      ccMultiplierPerUnit: 0.05,
      qualityBonusPerUnit: 0.01,
      footprintBonusPerUnit: -0.002,
      imageBonusPerUnit: 0.01
    },
    {
      id: "logistics",
      emoji: "🚚",
      nameKey: "building.logistics.name",
      descKey: "building.logistics.desc",
      baseProduction: 0,
      baseCost: 5000,
      costMultiplier: 1.15,
      role: "multiplier",
      docMultiplierPerUnit: 0.01,
      ccMultiplierPerUnit: 0.08,
      qualityBonusPerUnit: 0.0,
      footprintBonusPerUnit: -0.005,
      imageBonusPerUnit: 0.02
    },
    {
      id: "vbsPortal",
      emoji: "🌐",
      nameKey: "building.vbsPortal.name",
      descKey: "building.vbsPortal.desc",
      baseProduction: 5,
      baseCost: 8000,
      costMultiplier: 1.15,
      role: "producer",
      qualityBonusPerUnit: 0.015,
      footprintBonusPerUnit: -0.01,
      imageBonusPerUnit: 0.02
    },
    {
      id: "comBridge",
      emoji: "📡",
      nameKey: "building.comBridge.name",
      descKey: "building.comBridge.desc",
      baseProduction: 0,
      baseCost: 20000,
      costMultiplier: 1.2,
      role: "ccMultiplier",
      ccMultiplierPerUnit: 0.12,
      qualityBonusPerUnit: 0.02,
      footprintBonusPerUnit: -0.015,
      imageBonusPerUnit: 0.04
    },
    {
      id: "factory40",
      emoji: "🤖",
      nameKey: "building.factory40.name",
      descKey: "building.factory40.desc",
      baseProduction: 0,
      baseCost: 50000,
      costMultiplier: 1.2,
      role: "multiplier",
      docMultiplierPerUnit: 0.08,
      ccMultiplierPerUnit: 0.08,
      qualityBonusPerUnit: 0.02,
      footprintBonusPerUnit: -0.02,
      imageBonusPerUnit: 0.05
    },
    {
      id: "pampyAI",
      emoji: "🧠",
      nameKey: "building.pampyAI.name",
      descKey: "building.pampyAI.desc",
      baseProduction: 0,
      baseCost: 100000,
      costMultiplier: 1.25,
      role: "multiplier",
      docMultiplierPerUnit: 0.05,
      ccMultiplierPerUnit: 0.1,
      qualityBonusPerUnit: 0.03,
      footprintBonusPerUnit: -0.04,
      imageBonusPerUnit: 0.06
    }
  ];

  const GOD_MODE_SCALES = [1, 10, 100, 1000];
  const godModeState = {
    unlocked: false,
    buffer: "",
    timeScale: 1,
    codeWord: "renard",
    dirty: false
  };

  document.addEventListener("DOMContentLoaded", initApp);

  /** Entry point that wires DOM, localisation and gameplay. */
  function initApp() {
    cacheDomReferences();
    bindUIEvents();
    initLocalization();
    initGame();
    initGodModeControls();
  }

  /** Stores every frequently used DOM node locally for fast access. */
  function cacheDomReferences() {
    DOM.langSelect = document.getElementById("langSelect");
    DOM.docBank = document.getElementById("docBank");
    DOM.docTotal = document.getElementById("docTotal");
    DOM.ccTotal = document.getElementById("ccTotal");
    DOM.docPs = document.getElementById("docPs");
    DOM.qualityLabel = document.getElementById("qualityLabel");
    DOM.footprintLabel = document.getElementById("footprintLabel");
    DOM.imageLabel = document.getElementById("imageLabel");
    DOM.qualityFill = document.getElementById("qualityFill");
    DOM.footprintFill = document.getElementById("footprintFill");
    DOM.imageFill = document.getElementById("imageFill");
    DOM.culturePoints = document.getElementById("culturePoints");
    DOM.prestigeMult = document.getElementById("prestigeMult");
    DOM.clickButton = document.getElementById("clickButton");
    DOM.prestigeButton = document.getElementById("prestigeButton");
    DOM.prestigeInfo = document.getElementById("prestigeInfo");
    DOM.buildingsList = document.getElementById("buildingsList");
    DOM.upgradesList = document.getElementById("upgradesList");
    DOM.logPanel = document.getElementById("logPanel");
    DOM.godModeCard = document.getElementById("godModeCard");
    DOM.godModeStatus = document.getElementById("godModeStatus");
  }

  /** Hooks click events to the main CTAs. */
  function bindUIEvents() {
    if (DOM.clickButton) {
      DOM.clickButton.addEventListener("click", handleClick);
    }
    if (DOM.prestigeButton) {
      DOM.prestigeButton.addEventListener("click", () => {
        if (!canPrestige()) return;
        const gain = computePotentialCultureGain();
        if (gain <= 0) return;
        if (confirm(t("prestige.confirm", { gain }))) {
          doPrestige();
        }
      });
    }

    document.addEventListener("click", event => {
      if (!event.target.closest(".building-name-button") && !event.target.closest(".building-tooltip")) {
        hideAllTooltips();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        hideAllTooltips();
      }
    });
  }

  /** Simple translation helper that handles string interpolation. */
  function t(key, params = {}) {
    const dict = I18N[currentLang] || I18N.fr;
    const fallback = I18N.fr[key] || key;
    const template = dict[key] || fallback;
    return template.replace(/\{\{(\w+)\}\}/g, (_, token) => {
      return params[token] !== undefined ? params[token] : "";
    });
  }

  /** Applies text labels to every DOM node declaring data-i18n. */
  function applyStaticTranslations() {
    document.title = t("app.browserTitle");
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    renderGodModePanel(true);
  }

  /** Updates the current language and re-renders the UI. */
  function setLanguage(lang) {
    if (!I18N[lang]) {
      lang = "fr";
    }
    currentLang = lang;
    if (DOM.langSelect && DOM.langSelect.value !== lang) {
      DOM.langSelect.value = lang;
    }
    applyStaticTranslations();
    uiState.buildingsDirty = true;
    uiState.upgradesDirty = true;
    renderAll(true);
  }

  /** Configures the language selector and runs the initial translation pass. */
  function initLocalization() {
    if (DOM.langSelect) {
      DOM.langSelect.value = currentLang;
      DOM.langSelect.addEventListener("change", event => {
        setLanguage(event.target.value);
      });
    }
    applyStaticTranslations();
  }

  /** Initialises the building deck, upgrades and kicks off the loop. */
  function initGame() {
    gameState.buildings = BUILDING_DEFS.map(def => ({
      ...def,
      quantity: 0,
      isVisible: false
    }));

    gameState.upgrades = [
      {
        id: "upg_click_power_1",
        nameKey: "upgrade.upg_click_power_1.name",
        descKey: "upgrade.upg_click_power_1.desc",
        purchased: false,
        cost: 200,
        type: "clickMult",
        value: 2,
        unlockDocTotal: 150,
        unlocked: false
      },
      {
        id: "upg_global_prod_1",
        nameKey: "upgrade.upg_global_prod_1.name",
        descKey: "upgrade.upg_global_prod_1.desc",
        purchased: false,
        cost: 1000,
        type: "globalProdMult",
        value: 1.2,
        unlockDocTotal: 1500,
        unlocked: false
      },
      {
        id: "upg_quality_boost_1",
        nameKey: "upgrade.upg_quality_boost_1.name",
        descKey: "upgrade.upg_quality_boost_1.desc",
        purchased: false,
        cost: 1800,
        type: "qualityFlat",
        value: 0.1,
        unlockDocTotal: 2000,
        unlocked: false
      }
    ];

    uiState.buildingsDirty = true;
    uiState.upgradesDirty = true;
    refreshUpgradeUnlocks(true);
    logMessage("log.welcome");
    renderAll(true);
    gameState.time.lastUpdate = performance.now();
    requestAnimationFrame(gameLoop);
  }

  /** Formats numbers following simple thresholds for readability. */
  function formatNumber(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " Md";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + " M";
    if (n >= 10_000) return (n / 1_000).toFixed(1) + " k";
    if (n >= 1000) return (n / 1_000).toFixed(2) + " k";
    if (n === 0) return "0";
    if (n < 1) return n.toFixed(3);
    return n.toFixed(1);
  }

  /** Pretty-prints a multiplier or stat impact as a percentage string. */
  function formatPercent(value) {
    if (value === 0) return "0 %";
    const scaled = value * 100;
    const precision = Math.abs(scaled) >= 10 ? 1 : 2;
    const formatted = scaled.toFixed(precision);
    const sign = value > 0 ? "+" : "";
    return sign + formatted + " %";
  }

  /** Returns the current god mode multiplier (defaults to 1). */
  function currentTimeScale() {
    return godModeState.timeScale || 1;
  }

  /**
   * Builds a string describing the modifier impact for one unit or N units.
   */
  function formatBuildingImpactText(building, quantityOverride) {
    const EPSILON = 1e-6;
    const impact = getBuildingImpact(
      building,
      typeof quantityOverride === "number" ? quantityOverride : undefined
    );
    const parts = [];

    if (Math.abs(impact.docMultiplierBonus) > EPSILON) {
      parts.push("⚙️ " + t("impact.doc") + " " + formatPercent(impact.docMultiplierBonus));
    }
    if (Math.abs(impact.ccMultiplierBonus) > EPSILON) {
      parts.push("⭐ " + t("impact.cc") + " " + formatPercent(impact.ccMultiplierBonus));
    }
    if (Math.abs(impact.qualityBonus) > EPSILON) {
      parts.push("✅ " + t("impact.quality") + " " + formatPercent(impact.qualityBonus));
    }
    if (Math.abs(impact.footprintBonus) > EPSILON) {
      parts.push("🌳 " + t("impact.footprint") + " " + formatPercent(impact.footprintBonus));
    }
    if (Math.abs(impact.imageBonus) > EPSILON) {
      parts.push("🏅 " + t("impact.image") + " " + formatPercent(impact.imageBonus));
    }

    return parts.join(" • ");
  }

  /** Hides every currently open building tooltip. */
  function hideAllTooltips() {
    document.querySelectorAll(".building-tooltip").forEach(el => {
      if (!el.classList.contains("hidden")) {
        el.classList.add("hidden");
      }
    });
  }

  /** Unlocks buildings once the player holds enough DOC to buy the next unit. */
  function syncBuildingUnlocks() {
    let unlockedAny = false;
    const bank = gameState.resources.docBank;
    for (const b of gameState.buildings) {
      if (!b.isUnlocked && bank >= buildingCost(b)) {
        b.isUnlocked = true;
        unlockedAny = true;
      }
    }
    if (unlockedAny) {
      uiState.buildingsDirty = true;
    }
  }

  /** Returns the current cost of buying the next unit of a building. */
  function buildingCost(building) {
    return Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.quantity));
  }

  /** Localises the display name for a building. */
  function getBuildingName(building) {
    return building.nameKey ? t(building.nameKey) : building.name;
  }

  /** Localises the flavour description for a building. */
  function getBuildingDesc(building) {
    return building.descKey ? t(building.descKey) : building.desc || "";
  }

  /** Localises an upgrade name. */
  function getUpgradeName(upgrade) {
    return upgrade.nameKey ? t(upgrade.nameKey) : upgrade.name;
  }

  /** Localises an upgrade description. */
  function getUpgradeDesc(upgrade) {
    return upgrade.descKey ? t(upgrade.descKey) : upgrade.desc || "";
  }

  /** Adds an entry to the activity log and keeps the log bounded. */
  function logMessage(key, params = {}) {
    const entry = { time: new Date(), key, params };
    gameState.log.unshift(entry);
    if (gameState.log.length > 50) {
      gameState.log.pop();
    }
    renderLog();
  }

  /** Aggregates all multiplicative bonuses currently active. */
  function computeMultipliers() {
    const buildingEffects = computeBuildingEffects(gameState.buildings);
    let docMult = buildingEffects.docMult;
    let ccMult = buildingEffects.ccMult;
    let clickMult = 1;
    let baseQualityOffset = 0;

    // Passive stat nudge from infrastructure.
    gameState.stats.quality += buildingEffects.qualityBonus * 0.0001;
    gameState.stats.footprint -= buildingEffects.footprintBonus * 0.0001;
    gameState.stats.imageVbs += buildingEffects.imageBonus * 0.0001;

    for (const upg of gameState.upgrades) {
      if (!upg.purchased) continue;
      if (upg.type === "clickMult") {
        clickMult *= upg.value;
      }
      if (upg.type === "globalProdMult") {
        docMult *= upg.value;
      }
      if (upg.type === "qualityFlat") {
        baseQualityOffset += upg.value;
      }
    }

    return {
      docMult,
      ccMult,
      clickMult,
      baseQualityOffset
    };
  }

  /** Computes automatic production per second. */
  function computeDocPerSecond() {
    const mults = computeMultipliers();
    let DOCps = 0;

    for (const b of gameState.buildings) {
      if (!b.baseProduction) continue;
      DOCps += b.baseProduction * b.quantity;
    }

    DOCps *= mults.docMult;
    DOCps *= prestigeMultiplier();

    return DOCps;
  }

  /** Main game loop executed roughly every frame. */
  function gameLoop(timestamp) {
    const dt = (timestamp - gameState.time.lastUpdate) / 1000;
    if (dt <= 0) {
      gameState.time.lastUpdate = timestamp;
      requestAnimationFrame(gameLoop);
      return;
    }

    const scaledDt = dt * currentTimeScale();
    update(scaledDt);
    renderAll();
    gameState.time.lastUpdate = timestamp;
    requestAnimationFrame(gameLoop);
  }

  /** Applies resource gains, drifts and unlock checks for a time delta. */
  function update(dt) {
    const DOCps = computeDocPerSecond();
    const mults = computeMultipliers();

    const docGain = DOCps * dt;
    gameState.resources.docBank += docGain;
    gameState.resources.docTotal += docGain;

    const ccGainPerSec =
      DOCps *
      (0.1 + clamp01(gameState.stats.quality) * 0.9) *
      (0.5 + clamp01(gameState.stats.imageVbs) * 0.5) *
      mults.ccMult;

    const ccGain = ccGainPerSec * dt;
    gameState.resources.ccTotal += ccGain;

    const targetQualityBase = 0.3 + mults.baseQualityOffset + gameState.resources.culturePoints * 0.02;
    const targetQuality = clamp01(targetQualityBase);
    gameState.stats.quality += (targetQuality - gameState.stats.quality) * gameState.config.qualityRecoveryRate * dt;

    const targetImage = clamp01(0.4 + gameState.resources.culturePoints * 0.03);
    gameState.stats.imageVbs += (targetImage - gameState.stats.imageVbs) * gameState.config.imageRecoveryRate * dt;

    gameState.stats.footprint += gameState.config.footprintDriftBase * DOCps * dt;
    gameState.stats.footprint = clamp01(gameState.stats.footprint);

    refreshUpgradeUnlocks();
    maybeSpawnSmallEvents(dt);
  }

  /** introduces occasional incidents/optimisations to keep gauges dynamic. */
  function maybeSpawnSmallEvents(dt) {
    const DOCps = computeDocPerSecond();
    const risk = Math.min(0.0005 * DOCps, 0.05);
    if (Math.random() < risk * dt) {
      const r = Math.random();
      if (r < 0.5) {
        gameState.stats.quality -= 0.03;
        gameState.stats.footprint += 0.02;
        logMessage("log.incident");
      } else {
        gameState.stats.footprint -= 0.03;
        gameState.stats.imageVbs += 0.01;
        logMessage("log.optimization");
      }
      gameState.stats.quality = clamp01(gameState.stats.quality);
      gameState.stats.footprint = clamp01(gameState.stats.footprint);
      gameState.stats.imageVbs = clamp01(gameState.stats.imageVbs);
    }
  }

  /** Handles manual clicks to print documents immediately. */
  function handleClick() {
    const mults = computeMultipliers();
    const base = gameState.config.docPerClickBase;
    const docGain = base * mults.clickMult * prestigeMultiplier();
    gameState.resources.docBank += docGain;
    gameState.resources.docTotal += docGain;
    refreshUpgradeUnlocks();
    renderAll();
  }

  /** Purchases a building if the player can afford it. */
  function buyBuilding(id) {
    const b = gameState.buildings.find(x => x.id === id);
    if (!b) return;
    const cost = buildingCost(b);
    if (gameState.resources.docBank < cost) return;

    gameState.resources.docBank -= cost;
    b.quantity += 1;
    uiState.buildingsDirty = true;
    logMessage("log.buyBuilding", { name: getBuildingName(b), total: b.quantity });
    refreshUpgradeUnlocks();
    renderAll();
  }

  /** Purchases an upgrade if affordable and unlocked. */
  function buyUpgrade(id) {
    const upg = gameState.upgrades.find(x => x.id === id);
    if (!upg || upg.purchased) return;
    if (gameState.resources.docBank < upg.cost) return;
    if (gameState.resources.docTotal < (upg.unlockDocTotal || 0)) return;

    gameState.resources.docBank -= upg.cost;
    upg.purchased = true;
    uiState.upgradesDirty = true;
    logMessage("log.buyUpgrade", { name: getUpgradeName(upg) });
    renderAll();
  }

  /** Whether the prestige reset is currently available. */
  function canPrestige() {
    return gameState.resources.ccTotal >= gameState.config.prestigeRequirement;
  }

  /** How much culture would be earned by prestiging right now. */
  function computePotentialCultureGain() {
    return Math.floor(Math.sqrt(gameState.resources.ccTotal / gameState.config.prestigeCcDivisor));
  }

  /** Executes the prestige reset flow and reinitialises the run. */
  function doPrestige() {
    if (!canPrestige()) return;
    const gain = computePotentialCultureGain();
    if (gain <= 0) return;

    gameState.resources.culturePoints += gain;
    gameState.resources.docBank = 0;
    gameState.resources.docTotal = 0;
    gameState.resources.ccTotal = 0;

    for (const b of gameState.buildings) {
      b.quantity = 0;
      b.isUnlocked = false;
    }

    for (const upg of gameState.upgrades) {
      upg.purchased = false;
    }

    gameState.stats.quality = 0.5;
    gameState.stats.footprint = 0.5;
    gameState.stats.imageVbs = 0.5;

    uiState.buildingsDirty = true;
    uiState.upgradesDirty = true;
    logMessage("log.prestige", { amount: gain });
    renderAll(true);
  }

  /** Renders the live stats ribbons and gauges. */
  function renderStats() {
    const DOCps = computeDocPerSecond();
    if (DOM.docBank) DOM.docBank.textContent = formatNumber(gameState.resources.docBank);
    if (DOM.docTotal) DOM.docTotal.textContent = formatNumber(gameState.resources.docTotal);
    if (DOM.ccTotal) DOM.ccTotal.textContent = formatNumber(gameState.resources.ccTotal);
    if (DOM.docPs) DOM.docPs.textContent = t("stats.docPsValue", { amount: formatNumber(DOCps) });

    const q = clamp01(gameState.stats.quality);
    const f = clamp01(gameState.stats.footprint);
    const img = clamp01(gameState.stats.imageVbs);

    if (DOM.qualityLabel) DOM.qualityLabel.textContent = Math.round(q * 100) + " %";
    if (DOM.footprintLabel) DOM.footprintLabel.textContent = Math.round(f * 100) + " %";
    if (DOM.imageLabel) DOM.imageLabel.textContent = Math.round(img * 100) + " %";

    if (DOM.qualityFill) DOM.qualityFill.style.width = (q * 100).toFixed(1) + "%";
    if (DOM.footprintFill) DOM.footprintFill.style.width = (f * 100).toFixed(1) + "%";
    if (DOM.imageFill) DOM.imageFill.style.width = (img * 100).toFixed(1) + "%";

    if (DOM.culturePoints) DOM.culturePoints.textContent = gameState.resources.culturePoints;
    if (DOM.prestigeMult) DOM.prestigeMult.textContent = prestigeMultiplier().toFixed(2);
  }

  /** Updates the prestige card state and CTA messaging. */
  function renderPrestige() {
    if (!DOM.prestigeButton || !DOM.prestigeInfo) return;
    const can = canPrestige();
    const gain = computePotentialCultureGain();
    const locale = currentLang === "en" ? "en-US" : "fr-FR";
    const minValue = gameState.config.prestigeRequirement.toLocaleString(locale);

    if (!can || gain <= 0) {
      DOM.prestigeButton.classList.add("disabled");
      DOM.prestigeButton.textContent = t("prestige.buttonLocked");
      DOM.prestigeInfo.textContent = t("prestige.infoLocked", { min: minValue });
    } else {
      DOM.prestigeButton.classList.remove("disabled");
      DOM.prestigeButton.textContent = t("prestige.buttonAvailable", { gain });
      DOM.prestigeInfo.textContent = t("prestige.infoAvailable", { gain });
    }
  }

  /** Shows the latest entries in the activity log. */
  function renderLog() {
    if (!DOM.logPanel) return;
    DOM.logPanel.innerHTML = "";
    const locale = currentLang === "en" ? "en-US" : "fr-FR";
    for (const entry of gameState.log) {
      const div = document.createElement("div");
      div.className = "log-entry";
      const timeLabel = entry.time instanceof Date ? entry.time.toLocaleTimeString(locale, { hour12: false }) : entry.time;
      const text = entry.key ? t(entry.key, entry.params || {}) : entry.text;
      div.textContent = "[" + timeLabel + "] " + text;
      DOM.logPanel.appendChild(div);
    }
  }

  /** Toggles the affordability state for each building action button. */
  function updateBuildingButtons() {
    const container = DOM.buildingsList;
    if (!container) return;
    const bank = gameState.resources.docBank;
    container.querySelectorAll("[data-building-id]").forEach(row => {
      const id = row.getAttribute("data-building-id");
      const building = gameState.buildings.find(x => x.id === id);
      if (!building) return;
      const cost = buildingCost(building);
      const canAfford = bank >= cost;
      const btn = row.querySelector(`[data-building-btn="${id}"]`);
      if (btn) {
        btn.classList.toggle("disabled", !canAfford);
        btn.textContent = t(canAfford ? "actions.buy" : "actions.tooExpensive");
      }
      const costEl = row.querySelector(`[data-building-cost="${id}"]`);
      if (costEl) {
        costEl.textContent = t("label.costDoc", { amount: formatNumber(cost) });
      }
    });
  }

  /** Toggles the affordability state for each upgrade action button. */
  function updateUpgradeButtons() {
    const container = DOM.upgradesList;
    if (!container) return;
    const bank = gameState.resources.docBank;
    container.querySelectorAll("[data-upgrade-btn]").forEach(btn => {
      const id = btn.getAttribute("data-upgrade-btn");
      const upgrade = gameState.upgrades.find(x => x.id === id);
      if (!upgrade) return;
      const canAfford = bank >= upgrade.cost;
      btn.classList.toggle("disabled", !canAfford);
      btn.textContent = t(canAfford ? "actions.buy" : "actions.tooExpensive");
    });
    container.querySelectorAll("[data-upgrade-cost]").forEach(costEl => {
      const id = costEl.getAttribute("data-upgrade-cost");
      const upgrade = gameState.upgrades.find(x => x.id === id);
      if (!upgrade) return;
      costEl.textContent = t("label.costDoc", { amount: formatNumber(upgrade.cost) });
    });
  }

  /** Renders the list of available buildings, descriptions and stats. */
  function renderBuildings() {
    const container = DOM.buildingsList;
    if (!container) return;
    hideAllTooltips();
    container.innerHTML = "";
    let hasVisible = false;

    for (const b of gameState.buildings) {
      if (!b.isUnlocked) continue;
      hasVisible = true;
      const cost = buildingCost(b);
      const totalProd = b.baseProduction * b.quantity;
      const perUnitImpact = formatBuildingImpactText(b, 1);
      const totalImpactText = b.quantity > 0 ? formatBuildingImpactText(b) : "";

      const row = document.createElement("div");
      row.className = "building-row";
      row.dataset.buildingId = b.id;

      const info = document.createElement("div");
      info.className = "building-info";

      const nameButton = document.createElement("button");
      nameButton.type = "button";
      nameButton.className = "building-name-button";
      const emoji = b.emoji || "🏗️";
      nameButton.textContent = `${emoji} ${getBuildingName(b)}`;

      const tooltip = document.createElement("div");
      tooltip.className = "building-tooltip hidden";
      const tooltipLines = [];
      if (perUnitImpact) {
        tooltipLines.push(t("label.modifierPerUnit", { impact: perUnitImpact }));
      } else {
        tooltipLines.push(t("label.modifierPerUnitNA"));
      }
      if (totalImpactText) {
        tooltipLines.push(t("label.modifierTotal", { impact: totalImpactText }));
      } else {
        tooltipLines.push(t("label.modifierImpactNA"));
      }
      tooltip.innerHTML = tooltipLines.join("<br>");

      nameButton.addEventListener("click", event => {
        event.stopPropagation();
        const wasHidden = tooltip.classList.contains("hidden");
        hideAllTooltips();
        if (wasHidden) {
          tooltip.classList.remove("hidden");
        } else {
          tooltip.classList.add("hidden");
        }
      });

      info.appendChild(nameButton);
      const qty = document.createElement("div");
      qty.className = "building-qty";
      qty.textContent = t("label.quantity", { count: b.quantity });
      info.appendChild(qty);

      const metaDesc = document.createElement("div");
      metaDesc.className = "building-meta";
      metaDesc.textContent = getBuildingDesc(b);
      info.appendChild(metaDesc);

      const productionMeta = document.createElement("div");
      productionMeta.className = "building-meta";
      const prodLines = [];
      prodLines.push(
        b.baseProduction
          ? t("label.productionPerUnit", { amount: formatNumber(b.baseProduction) })
          : t("label.modifierOnly")
      );
      prodLines.push(
        b.baseProduction && totalProd
          ? t("label.totalProduction", { amount: formatNumber(totalProd) })
          : t("label.totalProductionNA")
      );
      productionMeta.innerHTML = prodLines.join("<br>");
      info.appendChild(productionMeta);
      info.appendChild(tooltip);

      const buy = document.createElement("div");
      buy.className = "building-buy";

      const costEl = document.createElement("div");
      costEl.className = "small";
      costEl.dataset.buildingCost = b.id;
      costEl.textContent = t("label.costDoc", { amount: formatNumber(cost) });

      const btn = document.createElement("button");
      btn.className = "btn-buy";
      btn.dataset.buildingBtn = b.id;
      btn.textContent = t("actions.buy");
      btn.addEventListener("click", () => buyBuilding(b.id));

      buy.appendChild(costEl);
      buy.appendChild(btn);

      row.appendChild(info);
      row.appendChild(buy);
      container.appendChild(row);
    }

    if (!hasVisible) {
      container.innerHTML = `<div class="building-placeholder">${t("buildings.noneAffordable")}</div>`;
    }
  }

  /** Renders unlocked upgrades or a placeholder when none are ready. */
  function renderUpgrades() {
    const container = DOM.upgradesList;
    if (!container) return;
    container.innerHTML = "";
    let hasUpgrade = false;

    for (const u of gameState.upgrades) {
      if (u.purchased || !u.unlocked) continue;
      hasUpgrade = true;

      const div = document.createElement("div");
      div.className = "upgrade-item";

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="upgrade-title">${getUpgradeName(u)}</div>
        <div>${getUpgradeDesc(u)}</div>
        <div class="small" data-upgrade-cost="${u.id}">${t("label.costDoc", { amount: formatNumber(u.cost) })}</div>
      `;

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";

      const btn = document.createElement("button");
      btn.className = "btn-upgrade";
      btn.dataset.upgradeBtn = u.id;
      btn.textContent = t("actions.buy");
      btn.addEventListener("click", () => buyUpgrade(u.id));

      right.appendChild(btn);
      div.appendChild(left);
      div.appendChild(right);
      container.appendChild(div);
    }

    if (!hasUpgrade) {
      container.innerHTML = `<div class="small">${t("label.noUpgrade")}</div>`;
    }
  }

  /** Ensures upgrades become visible once their docTotal threshold is met. */
  function refreshUpgradeUnlocks(forceRender = false) {
    let unlockedSomething = false;
    for (const upg of gameState.upgrades) {
      const threshold = upg.unlockDocTotal || 0;
      if (!upg.unlocked && gameState.resources.docTotal >= threshold) {
        upg.unlocked = true;
        unlockedSomething = true;
      }
    }
    if (unlockedSomething || forceRender) {
      uiState.upgradesDirty = true;
    }
  }

  /** Draws all UI sections, honouring the dirty flags for heavy lists. */
  function renderAll(forceFull = false) {
    renderStats();
    renderPrestige();
    renderLog();
    renderGodModePanel();
    syncBuildingUnlocks();

    if (forceFull || uiState.buildingsDirty) {
      renderBuildings();
      uiState.buildingsDirty = false;
    }
    updateBuildingButtons();

    if (forceFull || uiState.upgradesDirty) {
      renderUpgrades();
      uiState.upgradesDirty = false;
    }
    updateUpgradeButtons();
  }

  /** Adds listeners to god mode controls and the hidden key sequence. */
  function initGodModeControls() {
    if (DOM.godModeCard) {
      DOM.godModeCard.querySelectorAll("[data-god-scale]").forEach(btn => {
        btn.addEventListener("click", () => {
          const val = Number(btn.getAttribute("data-god-scale"));
          setGodModeTimeScale(val);
        });
      });
    }
    window.addEventListener("keydown", handleGodModeKey);
  }

  /** Updates the faux time multiplier when the player chooses a new speed. */
  function setGodModeTimeScale(scale) {
    if (!godModeState.unlocked) return;
    godModeState.timeScale = sanitizeTimeScale(scale, GOD_MODE_SCALES);
    godModeState.dirty = true;
    renderGodModePanel();
  }

  /** Reveals the hidden panel and resets state when the cheat code is typed. */
  function unlockGodMode() {
    if (godModeState.unlocked) return;
    godModeState.unlocked = true;
    godModeState.timeScale = GOD_MODE_SCALES[0];
    godModeState.dirty = true;
    renderGodModePanel(true);
  }

  /** Handles the secret key sequence logic needed to unlock the panel. */
  function handleGodModeKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }
    const result = updateCheatProgress(godModeState.buffer, event.key, godModeState.codeWord);
    godModeState.buffer = result.buffer;
    if (result.unlocked) {
      unlockGodMode();
    }
  }

  /** Shows or hides the god mode card depending on the unlock state. */
  function renderGodModePanel(force = false) {
    const card = DOM.godModeCard;
    if (!card) return;
    if (!godModeState.unlocked) {
      card.classList.add("hidden");
      card.setAttribute("aria-hidden", "true");
      return;
    }
    if (!force && !godModeState.dirty) {
      return;
    }

    card.classList.remove("hidden");
    card.setAttribute("aria-hidden", "false");
    if (DOM.godModeStatus) {
      DOM.godModeStatus.textContent = t("godMode.status", { scale: godModeState.timeScale });
    }
    card.querySelectorAll("[data-god-scale]").forEach(btn => {
      const val = Number(btn.getAttribute("data-god-scale"));
      btn.classList.toggle("active", val === godModeState.timeScale);
    });
    godModeState.dirty = false;
  }

  /** Returns the prestige multiplier contributed by culture points. */
  function prestigeMultiplier() {
    return 1 + gameState.resources.culturePoints * 0.05;
  }

  /** Basic clamp helper between 0 and 1. */
  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }
})();
