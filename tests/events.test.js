const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = { window: {} };
context.global = context;

const eventsPath = path.resolve(__dirname, "../assets/js/events.js");
vm.runInNewContext(fs.readFileSync(eventsPath, "utf8"), context, { filename: eventsPath });

const Events = context.window.Events;
if (!Events) {
  console.error("Events module not loaded");
  process.exit(1);
}

const defs = Events.definitions || [];
if (!defs.length) {
  console.error("No events defined.");
  process.exit(1);
}

const sampleState = {
  resources: {
    docBank: 200,
    docTotal: 500,
    ccTotal: 150,
    culturePoints: 0
  },
  stats: {
    quality: 0.5,
    footprint: 0.5,
    imageVbs: 0.5
  }
};

for (const def of defs) {
  if (!def.id || !def.titleKey) {
    console.error("Event missing id/title:", def);
    process.exit(1);
  }
  if (def.type === "choice" && (!def.choices || !def.choices.length)) {
    console.error(`Event ${def.id} missing choices`);
    process.exit(1);
  }
}

const forced = Events.debugForceEvent(defs[0].id);
if (!forced) {
  console.error("Unable to force event for testing.");
  process.exit(1);
}

if (forced.type === "choice") {
  const choiceId = forced.choices[0].id;
  const res = Events.resolveChoice(choiceId, sampleState);
  if (!res || !res.resultKey) {
    console.error("Choice resolution failed for event", forced.id);
    process.exit(1);
  }
} else {
  const info = Events.startMinigame();
  if (!info || typeof info.code === "undefined") {
    console.error("Minigame did not start");
    process.exit(1);
  }
  const res = Events.resolveMinigame(info.code, sampleState);
  if (!res || !res.resultKey) {
    console.error("Minigame resolution failed");
    process.exit(1);
  }
}

console.log("Events definitions validated.");
