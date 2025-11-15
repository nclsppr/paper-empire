# Balance & Metrics

Ce document recense les hypothèses de calcul actuelles et propose des métriques à surveiller avant de modifier les règles.

## 1. Hypothèses actuelles
- **Production** : `DOCps = Σ(baseProduction * quantity) * docMult * prestigeMult`.
- **Click** : `docPerClick = docPerClickBase * clickMult * prestigeMult`.
- **CC** : dépend de la qualité (0–1) et de l'image.
- **Prestige** : `culture += √(ccTotal / prestigeCcDivisor)`.

Points faibles actuels :
1. Croissance quasi-exponentielle dès 3–4 bâtiments, peu de frein.
2. Footprint/qualité impactent peu la boucle (margins ±0.05).
3. Pas de simulation simple pour savoir si la progression est raisonnable.

## 2. Métriques proposées
| Métrique | Description | Objectif |
| --- | --- | --- |
| `timeToLastBuilding` | Estimation (en secondes) pour acheter le bâtiment le plus cher à partir des stats actuelles (DOCps + click) | < 2h pour un run complet |
| `docPerPrestige` | DOC produits sur une session prestige | Analyser la progression |
| `qualityPenaltyRatio` | Variation CC en fonction de la qualité | Mesurer impact réel |

### Formule pour `timeToLastBuilding`
- On suppose `docBank` actuel et `DOCps` constant.
- Temps ≈ `(cost_last - docBank) / (DOCps + clickContribution)`.
- `clickContribution` peut être estimé si on suppose un rythme d'utilisateur (ex: 5 clics/s pendant 30s toutes les 5min).
- Cela reste un indicateur pour comparer builds.

## 3. Processus proposé
1. **Script de diagnostic** : ajouter une fonction dans `window.__PE_DEBUG` qui calcule et loggue les métriques ci-dessus (sans changer le gameplay). Exemple pseudo-code :
   ```js
   const lastBuilding = gameState.buildings[gameState.buildings.length - 1];
   const docps = computeDocPerSecond();
   const needed = Math.max(0, buildingCost(lastBuilding) - gameState.resources.docBank);
   const time = needed / Math.max(1, docps);
   console.table({ docps, needed, time });
   ```
   On peut y intégrer un paramètre pour simuler `clickAdds`.
2. **Tableur / doc** : consigner les résultats pour différentes runs (early/mid/late) avant et après modifications.
3. **Validation** : présenter les résultats ici (dans `docs/balance.md`) + table comparatives avant de modifier `BUILDING_DEFS` ou les formules.

## 4. Idées d'amélioration futures (après validation)
- Paliers de coût plus agressifs + bonus unlocks.
- Faire dépendre DOCps de la qualité (ex: `productionEfficiency = 0.8 + 0.4 * quality`).
- Footprint en tant que frein (ex: si footprint > 0.8, DOCps plafonne).
- Introduire “maintenance cost” qui retire une fraction de DOC/s si on ignore les événements.

## 5. TODO
- [ ] Implémenter `window.__PE_DEBUG.metrics()`.
- [ ] Documenter les résultats sous forme de tableaux (ex: temps pour acheter `pampyAI` avec settings actuels).
- [ ] Ajouter un test automatique (Node) qui calcule les métriques sur un mock `gameState` pour alerter si `timeToLastBuilding` < seuil ou > seuil.

_Note : aucune règle n'a été modifiée pour l'instant. Attendre validation de ce plan avant de toucher aux formules._
