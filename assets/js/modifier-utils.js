(function (rootFactory) {
  const factory = () => {
    function numberOrZero(value) {
      return typeof value === "number" && !Number.isNaN(value) ? value : 0;
    }

    function getBuildingImpact(building, quantityOverride) {
      if (!building) {
        return {
          docMultiplierBonus: 0,
          ccMultiplierBonus: 0,
          qualityBonus: 0,
          footprintBonus: 0,
          imageBonus: 0
        };
      }

      const quantity =
        typeof quantityOverride === "number"
          ? quantityOverride
          : numberOrZero(building.quantity);

      const impactPerUnit = {
        docMultiplierBonus: numberOrZero(building.docMultiplierPerUnit),
        ccMultiplierBonus: numberOrZero(building.ccMultiplierPerUnit),
        qualityBonus: numberOrZero(building.qualityBonusPerUnit),
        footprintBonus: numberOrZero(building.footprintBonusPerUnit),
        imageBonus: numberOrZero(building.imageBonusPerUnit)
      };

      return {
        docMultiplierBonus: impactPerUnit.docMultiplierBonus * quantity,
        ccMultiplierBonus: impactPerUnit.ccMultiplierBonus * quantity,
        qualityBonus: impactPerUnit.qualityBonus * quantity,
        footprintBonus: impactPerUnit.footprintBonus * quantity,
        imageBonus: impactPerUnit.imageBonus * quantity
      };
    }

    function computeBuildingEffects(buildings = []) {
      return buildings.reduce(
        (acc, building) => {
          const impact = getBuildingImpact(building);

          if (impact.docMultiplierBonus) {
            acc.docMult *= 1 + impact.docMultiplierBonus;
          }
          if (impact.ccMultiplierBonus) {
            acc.ccMult *= 1 + impact.ccMultiplierBonus;
          }

          acc.qualityBonus += impact.qualityBonus;
          acc.footprintBonus += impact.footprintBonus;
          acc.imageBonus += impact.imageBonus;

          return acc;
        },
        {
          docMult: 1,
          ccMult: 1,
          qualityBonus: 0,
          footprintBonus: 0,
          imageBonus: 0
        }
      );
    }

    return {
      getBuildingImpact,
      computeBuildingEffects
    };
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    const globalObject =
      typeof self !== "undefined"
        ? self
        : typeof window !== "undefined"
        ? window
        : globalThis;
    globalObject.ModifierUtils = factory();
  }
})();
