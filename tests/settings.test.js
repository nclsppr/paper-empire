const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert");

const scriptPath = path.resolve(__dirname, "../assets/js/accessibility.js");
const code = fs.readFileSync(scriptPath, "utf8");

function createClassList() {
  const classes = new Set();
  return {
    add(token) {
      classes.add(token);
    },
    remove(token) {
      classes.delete(token);
    },
    toggle(token, force) {
      if (force === undefined) {
        if (classes.has(token)) {
          classes.delete(token);
          return false;
        }
        classes.add(token);
        return true;
      }
      if (force) {
        classes.add(token);
        return true;
      }
      classes.delete(token);
      return false;
    },
    contains(token) {
      return classes.has(token);
    }
  };
}

const documentElement = {
  classList: createClassList(),
  dataset: {}
};

const documentStub = {
  documentElement,
  body: { contains: () => false },
  getElementById: () => null,
  addEventListener: () => {},
  querySelectorAll: () => []
};

const windowStub = {
  localStorage: {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value;
    }
  },
  addEventListener: () => {}
};

const context = {
  window: windowStub,
  document: documentStub
};
context.global = context;
context.localStorage = windowStub.localStorage;

vm.runInNewContext(code, context, { filename: scriptPath });

const Settings = windowStub.Settings;
assert.ok(Settings, "Settings API should be exposed");

Settings.setPreference("highContrast", true);
assert.strictEqual(documentElement.classList.contains("pref-high-contrast"), true);
assert.strictEqual(Settings.getPreference("highContrast"), true);

Settings.setPreference("soundsEnabled", false);
assert.strictEqual(documentElement.dataset.soundsEnabled, "0");
Settings.setPreference("soundsEnabled", true);
assert.strictEqual(documentElement.dataset.soundsEnabled, "1");

Settings.setPreference("particlesEnabled", false);
assert.strictEqual(documentElement.dataset.particlesEnabled, "0");

const prefsCopy = Settings.getPrefs();
prefsCopy.highContrast = false;
assert.strictEqual(Settings.getPreference("highContrast"), true, "Copies must be detached");

console.log("Settings preferences respond to toggles correctly.");
