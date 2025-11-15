(function () {
  const STORAGE_KEY = "papersEmpireSave";

  function isAvailable() {
    try {
      const testKey = "__pe_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  function readRaw() {
    if (!isAvailable()) return null;
    return window.localStorage.getItem(STORAGE_KEY);
  }

  function load() {
    try {
      const raw = readRaw();
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save(payload) {
    if (!isAvailable()) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...payload, savedAt: Date.now() })
      );
    } catch {
      // ignore quota errors
    }
  }

  function clear() {
    if (!isAvailable()) return;
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function exportData() {
    const raw = readRaw();
    return raw || "";
  }

  function importData(raw) {
      if (!raw) return false;
      try {
        JSON.parse(raw);
        if (!isAvailable()) return false;
        window.localStorage.setItem(STORAGE_KEY, raw);
        return true;
      } catch {
        return false;
      }
  }

  window.Persistence = {
    isAvailable,
    load,
    save,
    clear,
    exportData,
    importData
  };
})();
