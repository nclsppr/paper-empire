(function () {
  const definitions = [
    {
      id: "firstDoc",
      nameKey: "ach.firstDoc.name",
      descKey: "ach.firstDoc.desc",
      condition: state => state.resources.docTotal >= 1
    },
    {
      id: "hundredDocs",
      nameKey: "ach.hundredDocs.name",
      descKey: "ach.hundredDocs.desc",
      condition: state => state.resources.docTotal >= 100
    },
    {
      id: "thousandDocs",
      nameKey: "ach.thousandDocs.name",
      descKey: "ach.thousandDocs.desc",
      condition: state => state.resources.docTotal >= 1000
    },
    {
      id: "firstBuilding",
      nameKey: "ach.firstBuilding.name",
      descKey: "ach.firstBuilding.desc",
      condition: state => state.buildings.some(b => b.quantity > 0)
    },
    {
      id: "firstPrestige",
      nameKey: "ach.firstPrestige.name",
      descKey: "ach.firstPrestige.desc",
      condition: state => state.resources.culturePoints > 0
    }
  ];

  function evaluate(state, unlockedMap) {
    const newlyUnlocked = [];
    for (const def of definitions) {
      if (unlockedMap[def.id]) continue;
      try {
        if (def.condition(state)) {
          newlyUnlocked.push(def.id);
        }
      } catch {
        // ignore faulty condition
      }
    }
    return newlyUnlocked;
  }

  window.Achievements = {
    definitions,
    evaluate
  };
})();
