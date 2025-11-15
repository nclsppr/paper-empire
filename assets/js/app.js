(() => {
  "use strict";

  /**
   * Cache of frequently accessed DOM nodes to avoid repeated lookups.
   * Filled once during initialization.
   */
  const DOM = {};

  const GAME_TITLE = window.GAME_TITLE || "Papers Empire";
  const { computeBuildingEffects, getBuildingImpact } = ModifierUtils;
  const { sanitizeTimeScale, updateCheatProgress } = GodModeUtils;
  const Events = window.Events;

  // -------------------------------
  // Internationalisation + état UI
  // -------------------------------

  const SUPPORTED_LANGS = ["fr", "en", "de", "lb"];
  const DEFAULT_LANG = "fr";
  let currentLang = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
  if (!SUPPORTED_LANGS.includes(currentLang)) {
    currentLang = DEFAULT_LANG;
  }

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

  const achievementsState = {
    unlocked: {}
  };

  const eventState = {
    modalCanClose: false,
    bannerTone: "mixed",
    bannerKey: null
  };

  const contractsState = {
    available: [],
    rerollCount: 0,
    lastReroll: 0
  };

  let saveTimer = null;

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
    DOM.achievementsList = document.getElementById("achievementsList");
    DOM.exportSaveBtn = document.getElementById("exportSaveBtn");
    DOM.importSaveBtn = document.getElementById("importSaveBtn");
    DOM.resetSaveBtn = document.getElementById("resetSaveBtn");
    DOM.eventBanner = document.getElementById("eventBanner");
    DOM.eventBannerText = document.getElementById("eventBannerText");
    DOM.closeEventBanner = document.getElementById("closeEventBanner");
    DOM.eventModal = document.getElementById("eventModal");
    DOM.eventTitle = document.getElementById("eventTitle");
    DOM.eventDescription = document.getElementById("eventDescription");
    DOM.eventChoices = document.getElementById("eventChoices");
    DOM.eventResult = document.getElementById("eventResult");
    DOM.minigameContainer = document.getElementById("minigameContainer");
    DOM.minigamePrompt = document.getElementById("minigamePrompt");
    DOM.closeEventModal = document.getElementById("closeEventModal");
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

    if (DOM.exportSaveBtn) {
      DOM.exportSaveBtn.addEventListener("click", handleExportSave);
    }
    if (DOM.importSaveBtn) {
      DOM.importSaveBtn.addEventListener("click", handleImportSave);
    }
    if (DOM.resetSaveBtn) {
      DOM.resetSaveBtn.addEventListener("click", handleResetSave);
    }

    if (DOM.eventChoices) {
      DOM.eventChoices.addEventListener("click", handleEventChoiceClick);
    }
    if (DOM.minigameContainer) {
      DOM.minigameContainer.addEventListener("click", handleMinigameResponse);
    }
    if (DOM.closeEventModal) {
      DOM.closeEventModal.addEventListener("click", () => closeEventModal());
    }
    document.addEventListener("keydown", evt => {
      if (evt.key === "Escape") {
        closeEventModal(true);
      }
    });
    if (DOM.closeEventBanner) {
      DOM.closeEventBanner.addEventListener("click", hideEventBanner);
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
  function getI18nDict(lang) {
    const dicts = window.I18N || {};
    return dicts[lang] || dicts[DEFAULT_LANG] || {};
  }

  function t(key, params = {}) {
    const dict = getI18nDict(currentLang);
    const fallbackDict = getI18nDict(DEFAULT_LANG);
    const template = dict[key] || fallbackDict[key] || key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, token) => {
      return params[token] !== undefined ? params[token] : "";
    });
  }

  /** Applies text labels to every DOM node declaring data-i18n. */
  function applyStaticTranslations() {
    document.title = GAME_TITLE;
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    applyGameTitle();
    renderGodModePanel(true);
    renderAchievementsPanel();
  }

  function applyGameTitle() {
    document.querySelectorAll("[data-game-title]").forEach(el => {
      el.textContent = GAME_TITLE;
    });
  }

  function handleExportSave() {
    if (!Persistence.isAvailable || !Persistence.isAvailable()) {
      alert(t("actions.saveUnavailable"));
      return;
    }
    queueSave(true);
    const data = Persistence.exportData();
    if (!data) {
      alert(t("actions.exportError"));
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(data).then(
        () => alert(t("actions.exportSuccess")),
        () => prompt(t("actions.exportPrompt"), data)
      );
    } else {
      prompt(t("actions.exportPrompt"), data);
    }
  }

  function handleImportSave() {
    const raw = prompt(t("actions.importPrompt"));
    if (!raw) return;
    const ok = Persistence.importData ? Persistence.importData(raw) : false;
    if (!ok) {
      alert(t("actions.importError"));
      return;
    }
    location.reload();
  }

  function handleResetSave() {
    if (!confirm(t("actions.resetConfirm"))) return;
    Persistence.clear && Persistence.clear();
    location.reload();
  }

  /** Updates the current language and re-renders the UI. */
  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = DEFAULT_LANG;
    }
    currentLang = lang;
    if (DOM.langSelect && DOM.langSelect.value !== lang) {
      DOM.langSelect.value = lang;
    }
    applyStaticTranslations();
    renderContractsPanel();
    if (navigator.language && navigator.language.slice(0, 2).toLowerCase() !== lang) {
      document.documentElement.setAttribute("lang", lang);
    }
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

    applyPersistedState(Persistence.load ? Persistence.load() : null);

    if (window.EndgameModule) {
      window.EndgameModule.loadData().then(() => {
        renderContractsPanel();
      });
    }

    uiState.buildingsDirty = true;
    uiState.upgradesDirty = true;
    refreshUpgradeUnlocks(true);
    logMessage("log.welcome");
    renderAll(true);
    gameState.time.lastUpdate = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function buildPersistedState() {
    return {
      version: 1,
      resources: { ...gameState.resources },
      stats: { ...gameState.stats },
      buildings: gameState.buildings.map(b => ({ id: b.id, quantity: b.quantity })),
      upgrades: gameState.upgrades.map(u => ({ id: u.id, purchased: !!u.purchased })),
      achievements: achievementsState.unlocked
    };
  }

  function applyPersistedState(saved) {
    if (!saved) return;
    if (saved.resources) {
      Object.assign(gameState.resources, saved.resources);
    }
    if (saved.stats) {
      Object.assign(gameState.stats, saved.stats);
    }
    if (Array.isArray(saved.buildings)) {
      for (const entry of saved.buildings) {
        const target = gameState.buildings.find(b => b.id === entry.id);
        if (target && typeof entry.quantity === "number") {
          target.quantity = entry.quantity;
        }
      }
    }
    if (Array.isArray(saved.upgrades)) {
      for (const entry of saved.upgrades) {
        const target = gameState.upgrades.find(u => u.id === entry.id);
        if (target) {
          target.purchased = !!entry.purchased;
        }
      }
    }
    if (saved.achievements) {
      achievementsState.unlocked = { ...saved.achievements };
    }
  }

  function queueSave(force = false) {
    if (!Persistence.isAvailable || !Persistence.isAvailable()) return;
    if (force) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = null;
      Persistence.save(buildPersistedState());
      return;
    }
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      Persistence.save(buildPersistedState());
      saveTimer = null;
    }, 500);
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
    checkDynamicEvents(dt);
    checkAchievements();
    queueSave();
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
    checkAchievements();
    queueSave();
    renderAll();
    if (DOM.clickButton) {
      DOM.clickButton.classList.add("pulse");
      setTimeout(() => DOM.clickButton && DOM.clickButton.classList.remove("pulse"), 350);
    }
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
    checkAchievements();
    queueSave();
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
    checkAchievements();
    queueSave();
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
    checkAchievements();
    queueSave(true);
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

  function showEventBanner(key, tone = "mixed", params = {}) {
    if (!DOM.eventBanner) return;
    DOM.eventBanner.classList.remove("hidden", "banner-positive", "banner-mixed", "banner-negative");
    const cls = tone === "positive" ? "banner-positive" : tone === "negative" ? "banner-negative" : "banner-mixed";
    DOM.eventBanner.classList.add(cls);
    eventState.bannerTone = tone;
    eventState.bannerKey = key;
    DOM.eventBannerText.textContent = t(key, params);
  }

  function hideEventBanner() {
    if (!DOM.eventBanner) return;
    DOM.eventBanner.classList.add("hidden");
    DOM.eventBannerText.textContent = "";
    eventState.bannerKey = null;
  }

  function checkDynamicEvents(dt) {
    if (!window.Events) return;
    const newEvent = Events.tick(gameState, dt);
    if (newEvent) {
      logMessage("log.event", { name: t(newEvent.titleKey) });
      handleEventSpawn(newEvent);
    }
  }

  function handleEventSpawn(eventDef) {
    eventState.active = eventDef;
    eventState.modalCanClose = false;
    addNewsEntry(eventDef.titleKey);
    showEventModal(eventDef);
  }

  function showEventModal(eventDef) {
    if (!DOM.eventModal) return;
    DOM.eventModal.classList.remove("hidden");
    DOM.eventModal.setAttribute("aria-hidden", "false");
    DOM.eventTitle.textContent = t(eventDef.titleKey);
    DOM.eventDescription.textContent = t(eventDef.descriptionKey);
    DOM.eventResult.textContent = "";
    DOM.eventChoices.innerHTML = "";
    DOM.closeEventModal.disabled = true;
    DOM.closeEventModal.setAttribute("aria-disabled", "true");
    if (eventDef.type === "choice") {
      DOM.eventChoices.classList.remove("hidden");
      DOM.minigameContainer.classList.add("hidden");
      for (const choice of eventDef.choices) {
        const btn = document.createElement("button");
        btn.className = "event-choice-btn";
        btn.dataset.choice = choice.id;
        btn.textContent = t(choice.labelKey);
        DOM.eventChoices.appendChild(btn);
      }
      const first = DOM.eventChoices.querySelector("button");
      if (first) {
        first.focus();
      }
    } else {
      DOM.eventChoices.classList.add("hidden");
      DOM.minigameContainer.classList.remove("hidden");
      const info = Events.startMinigame();
      const code = info ? info.code : 1;
      DOM.minigamePrompt.textContent = t("events.calibration.prompt", { code });
      DOM.minigameContainer.querySelector("button").focus();
    }
  }

  function closeEventModal(force = false) {
    if (!DOM.eventModal || DOM.eventModal.classList.contains("hidden")) return;
    if (!eventState.modalCanClose && !force) return;
    DOM.eventModal.classList.add("hidden");
    DOM.eventModal.setAttribute("aria-hidden", "true");
  }

  function handleEventChoiceClick(event) {
    const btn = event.target.closest("[data-choice]");
    if (!btn) return;
    const choiceId = btn.dataset.choice;
    const result = Events.resolveChoice(choiceId, gameState);
    if (!result) return;
    DOM.eventResult.textContent = t(result.resultKey);
    logMessage("log.eventResult", { result: t(result.resultKey) });
    queueSave(true);
    eventState.active = null;
    eventState.modalCanClose = true;
    DOM.closeEventModal.disabled = false;
    DOM.closeEventModal.removeAttribute("aria-disabled");
    closeEventModal(true);
    showEventBanner(result.resultKey, result.tone || "mixed");
  }

  function renderContractsPanel() {
    if (!window.EndgameModule) return;
    if (!DOM.contractsList || !DOM.activeContractPanel) return;
    contractsState.available = window.EndgameModule.availableContracts(gameState);
    DOM.contractsList.innerHTML = "";
    if (!contractsState.available.length) {
      const empty = document.createElement("div");
      empty.className = "small";
      empty.textContent = t("contracts.noneAvailable");
      DOM.contractsList.appendChild(empty);
    } else {
      for (const contract of contractsState.available) {
        const card = document.createElement("div");
        card.className = "contract-card";
        card.innerHTML = `
          <strong>${t(contract.nameKey)}</strong>
          <div>${t(contract.descKey)}</div>
          <div class="contract-requirements">${t("contracts.requirements", {
            quality: Math.round((contract.requirements.quality || 0) * 100),
            image: Math.round((contract.requirements.image || 0) * 100),
            volume: formatNumber(contract.requirements.volume || 0)
          })}</div>
        `;
        const actions = document.createElement("div");
        actions.className = "contract-actions";
        const btn = document.createElement("button");
        btn.className = "btn-slim";
        btn.dataset.contract = contract.id;
        btn.textContent = t("contracts.start");
        actions.appendChild(btn);
        card.appendChild(actions);
        DOM.contractsList.appendChild(card);
      }
      DOM.contractsList.querySelectorAll("[data-contract]").forEach(btn => {
        btn.addEventListener("click", () => startContract(btn.dataset.contract));
      });
    }
    renderActiveContract();
  }

  function startContract(contractId) {
    if (!window.EndgameModule) return;
    const success = window.EndgameModule.startContract(contractId);
    if (!success) {
      alert(t("contracts.alreadyRunning"));
      return;
    }
    logMessage("log.contractStart", { name: t(window.EndgameModule.activeContract.current.nameKey) });
    renderActiveContract();
  }

  function renderActiveContract() {
    if (!window.EndgameModule || !DOM.activeContractPanel) return;
    const { activeContract } = window.EndgameModule;
    if (!activeContract.current) {
      DOM.activeContractPanel.classList.add("hidden");
      DOM.activeContractPanel.innerHTML = "";
      return;
    }
    DOM.activeContractPanel.classList.remove("hidden");
    DOM.activeContractPanel.innerHTML = `
      <div><strong>${t(activeContract.current.nameKey)}</strong></div>
      <div>${t("contracts.remaining", { seconds: Math.ceil(activeContract.timer) })}</div>
      <div>${t("contracts.reward", {
        doc: formatNumber(activeContract.current.reward.doc || 0),
        cc: formatNumber(activeContract.current.reward.cc || 0),
        cards: activeContract.current.reward.cards || 0
      })}</div>
    `;
  }

  function tickContracts(dt) {
    if (!window.EndgameModule) return;
    const result = window.EndgameModule.tickContract(dt, gameState);
    if (result) {
      logMessage("log.contractComplete", { name: t(result.nameKey) });
      showEventBanner("contracts.banner.completed", "positive", { name: t(result.nameKey) });
      renderActiveContract();
      queueSave(true);
    } else {
      renderActiveContract();
    }
  }

  function handleMinigameResponse(event) {
    const btn = event.target.closest("[data-minigame-response]");
    if (!btn) return;
    const answer = btn.getAttribute("data-minigame-response");
    const result = Events.resolveMinigame(answer, gameState);
    if (!result) return;
    DOM.eventResult.textContent = t(result.resultKey);
    logMessage("log.eventResult", { result: t(result.resultKey) });
    queueSave(true);
    eventState.active = null;
    eventState.modalCanClose = true;
    DOM.closeEventModal.disabled = false;
    DOM.closeEventModal.removeAttribute("aria-disabled");
    closeEventModal(true);
    showEventBanner(result.resultKey, result.tone || "mixed");
  }

  function renderAchievementsPanel() {
    const container = DOM.achievementsList;
    if (!container || !window.Achievements) return;
    container.innerHTML = "";
    if (!Achievements.definitions.length) {
      container.innerHTML = `<div class="small">${t("achievements.empty")}</div>`;
      return;
    }
    for (const def of Achievements.definitions) {
      const unlockedAt = achievementsState.unlocked[def.id];
      const item = document.createElement("div");
      item.className = "achievement-item" + (unlockedAt ? " unlocked" : "");
      const title = document.createElement("div");
      title.className = "achievement-title";
      title.innerHTML = `<span>${t(def.nameKey)}</span><span class="achievement-status">${t(unlockedAt ? "achievements.statusUnlocked" : "achievements.statusLocked")}</span>`;
      const desc = document.createElement("div");
      desc.textContent = t(def.descKey);
      item.appendChild(title);
      item.appendChild(desc);
      container.appendChild(item);
    }
  }

  function checkAchievements() {
    if (!window.Achievements) return;
    const unlockedMap = achievementsState.unlocked;
    const newly = Achievements.evaluate(gameState, unlockedMap);
    if (!newly.length) return;
    const now = Date.now();
    for (const id of newly) {
      unlockedMap[id] = now;
      const def = Achievements.definitions.find(d => d.id === id);
      if (def) {
        logMessage("log.achievement", { name: t(def.nameKey) });
      }
    }
    renderAchievementsPanel();
    queueSave(true);
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
    renderContractsPanel();
    renderAchievementsPanel();
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

  window.__PE_DEBUG = window.__PE_DEBUG || {};
  window.__PE_DEBUG.spawnEvent = id => {
    if (!window.Events) return;
    const ev = window.Events.debugForceEvent(id);
    if (ev) {
      handleEventSpawn(ev);
    }
  };
})();
