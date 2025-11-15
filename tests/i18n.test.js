const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const LANGS = ["fr", "en", "de", "lb"];
const i18nDir = path.resolve(__dirname, "../assets/i18n");

const context = {
  window: {}
};
context.global = context;

for (const lang of LANGS) {
  const filePath = path.join(i18nDir, `${lang}.js`);
  const code = fs.readFileSync(filePath, "utf8");
  try {
    vm.runInNewContext(code, context, { filename: filePath });
  } catch (err) {
    console.error(`Failed to evaluate ${filePath}:`, err);
    process.exit(1);
  }
}

const dicts = context.window.I18N || {};
const base = dicts.fr;
if (!base) {
  console.error("Missing base French translations.");
  process.exit(1);
}

const baseKeys = Object.keys(base);
const errors = [];

for (const lang of LANGS) {
  const dict = dicts[lang];
  if (!dict) {
    errors.push(`Missing dictionary for language ${lang}.`);
    continue;
  }
  for (const key of baseKeys) {
    if (!Object.prototype.hasOwnProperty.call(dict, key)) {
      errors.push(`Lang "${lang}" missing key "${key}".`);
      continue;
    }
    const value = dict[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push(`Lang "${lang}" has empty value for key "${key}".`);
    }
  }
}

if (errors.length) {
  console.error("i18n consistency test failed:");
  for (const err of errors) {
    console.error(" -", err);
  }
  process.exit(1);
}

console.log("i18n dictionaries are consistent across languages.");
