import { reviewSummary, breakdown, type Trade } from "./index";
const formatR = (n: number) => (n > 0 ? "+" : "") + n.toFixed(2) + "R";
export function coachReply(question: string, trades: Trade[], minimum: number) {
  let chosen = trades;
  const upper = question.toUpperCase();
  const symbol = [...new Set(trades.map(t => String(t.instrument)))].sort((a,b)=>b.length-a.length).find(symbol => upper.split(/[^A-Z0-9._/-]+/).includes(symbol.toUpperCase()));
  if (symbol) chosen = chosen.filter((t) => t.instrument === symbol);
  const summary = reviewSummary(chosen, minimum);
  const setups = breakdown(chosen, (t) => t.setup, minimum).sort(
    (a, b) => b.expectancy - a.expectancy,
  );
  if (!chosen.length)
    return "Aucun trade ne correspond à cette question dans les filtres actifs. Élargis la période ou renseigne tes exécutions.";
  if (/meilleur|setup|configuration/i.test(question)) {
    const best = setups.find((g) => g.reliable);
    return best
      ? `${symbol ?? "Sélection"} : « ${best.label} » affiche la meilleure espérance parmi les setups avec au moins ${minimum} observations : ${formatR(best.expectancy)} par trade sur ${best.count} trades. C’est un constat historique. Prochaine séance : n’entre que si ses règles d’entrée sont présentes et note les cas refusés.`
      : `Il faut au moins ${minimum} observations par setup pour ce classement. Continue à documenter les confirmations et conserve une taille stable.`;
  }
  return `Sur ${chosen.length} trades${symbol ? " " + symbol : ""}, le résultat est ${formatR(summary.stats.r)} et l’espérance ${formatR(summary.stats.expectancy)} par trade. ${summary.leaks[0] ? `Le contexte « ${summary.leaks[0].label} » totalise ${formatR(summary.leaks[0].r)} sur ${summary.leaks[0].count} observations. Cela ne prouve pas une causalité.` : "Aucun groupe négatif n’atteint le seuil d’effectif configuré."} ${summary.action}`;
}
