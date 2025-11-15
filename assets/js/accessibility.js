(function(){
  const PREF_KEY = "pe-accessibility";
  const defaultPrefs = {
    highContrast: false,
    largeText: false,
    reduceMotion: false
  };

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : { ...defaultPrefs };
    } catch {
      return { ...defaultPrefs };
    }
  }

  function savePrefs(prefs) {
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota errors
    }
  }

  function applyPrefs(prefs) {
    const root = document.documentElement;
    root.classList.toggle("pref-high-contrast", !!prefs.highContrast);
    root.classList.toggle("pref-large-text", !!prefs.largeText);
    root.classList.toggle("pref-reduce-motion", !!prefs.reduceMotion);
  }

  function init(prefs) {
    const highContrast = document.getElementById("toggleHighContrast");
    const largeText = document.getElementById("toggleLargeText");
    const reduceMotion = document.getElementById("toggleReduceMotion");

    if (highContrast) {
      highContrast.checked = prefs.highContrast;
      highContrast.addEventListener("change", () => {
        prefs.highContrast = highContrast.checked;
        applyPrefs(prefs);
        savePrefs(prefs);
      });
    }
    if (largeText) {
      largeText.checked = prefs.largeText;
      largeText.addEventListener("change", () => {
        prefs.largeText = largeText.checked;
        applyPrefs(prefs);
        savePrefs(prefs);
      });
    }
    if (reduceMotion) {
      reduceMotion.checked = prefs.reduceMotion;
      reduceMotion.addEventListener("change", () => {
        prefs.reduceMotion = reduceMotion.checked;
        applyPrefs(prefs);
        savePrefs(prefs);
      });
    }
  }

  const initialPrefs = loadPrefs();
  applyPrefs(initialPrefs);
  window.addEventListener("DOMContentLoaded", () => init(initialPrefs));
})();
