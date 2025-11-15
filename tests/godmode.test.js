const assert = require("node:assert/strict");
const { sanitizeTimeScale, updateCheatProgress } = require("../assets/js/godmode-utils.js");

(function testSanitizeTimeScale() {
  const allowed = [1, 10, 100, 1000];
  assert.strictEqual(sanitizeTimeScale(10, allowed), 10);
  assert.strictEqual(sanitizeTimeScale("100", allowed), 100);
  assert.strictEqual(sanitizeTimeScale(42, allowed), 1);
})();

(function testUpdateCheatProgressSequence() {
  let buffer = "";
  let unlocked = false;
  for (const letter of "RENard") {
    const result = updateCheatProgress(buffer, letter, "renard");
    buffer = result.buffer;
    unlocked = result.unlocked;
  }
  assert.strictEqual(buffer, "renard");
  assert.ok(unlocked, "Sequence renard should unlock god mode");
})();

(function testUpdateCheatProgressResetsOnInvalidChar() {
  let buffer = "";
  updateCheatProgress(buffer, "r", "renard");
  const result = updateCheatProgress("r", "1", "renard");
  assert.strictEqual(result.buffer, "");
  assert.strictEqual(result.unlocked, false);
})();

console.log("God mode tests passed.");
