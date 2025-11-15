const assert = require("node:assert/strict");
const { getBuildingImpact, computeBuildingEffects } = require("../assets/js/modifier-utils.js");

function approxEqual(actual, expected, epsilon = 1e-10) {
  assert.ok(Math.abs(actual - expected) < epsilon, `Expected ${actual} ≈ ${expected}`);
}

(function testGetBuildingImpact() {
  const building = {
    docMultiplierPerUnit: 0.03,
    ccMultiplierPerUnit: 0.05,
    qualityBonusPerUnit: 0.01,
    footprintBonusPerUnit: -0.002,
    imageBonusPerUnit: 0.004,
    quantity: 4
  };

  const totalImpact = getBuildingImpact(building);
  assert.strictEqual(totalImpact.docMultiplierBonus, 0.12);
  assert.strictEqual(totalImpact.ccMultiplierBonus, 0.2);
  assert.strictEqual(totalImpact.qualityBonus, 0.04);
  assert.strictEqual(totalImpact.footprintBonus, -0.008);
  assert.strictEqual(totalImpact.imageBonus, 0.016);

  const perUnitImpact = getBuildingImpact(building, 1);
  assert.strictEqual(perUnitImpact.docMultiplierBonus, 0.03);
  assert.strictEqual(perUnitImpact.ccMultiplierBonus, 0.05);
})();

(function testComputeBuildingEffects() {
  const buildings = [
    { docMultiplierPerUnit: 0.02, ccMultiplierPerUnit: 0.03, quantity: 2 },
    { docMultiplierPerUnit: 0.01, quantity: 1 },
    { ccMultiplierPerUnit: 0.04, quantity: 1 }
  ];

  const effects = computeBuildingEffects(buildings);
  approxEqual(effects.docMult, (1 + 0.04) * (1 + 0.01));
  approxEqual(effects.ccMult, (1 + 0.06) * (1 + 0.04));
})();

(function testComputeBuildingEffectsEmpty() {
  const effects = computeBuildingEffects([]);
  assert.strictEqual(effects.docMult, 1);
  assert.strictEqual(effects.ccMult, 1);
  assert.strictEqual(effects.qualityBonus, 0);
})();

console.log("Modifier tests passed.");
