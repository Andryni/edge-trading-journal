# EDGE — refonte de l’espace de travail

La demande porte sur une refonte visible de la composition et des parcours. La direction « Performance » sert de base au cockpit et la direction « Revue de séance » au journal. Les propositions exploratoires restent dans `output/design-directions-edge.html` ; l’interface réelle utilise exclusivement les données du journal connecté.

## Changements réalisés dans l’ordre demandé

1. **Navigation.** Cinq espaces : Vue d’ensemble, Journal, Analyses, Préparation et Comptes. Les écrans secondaires sont regroupés dans une barre de section : calendrier/import, fuites/coach/rapports et playbook/objectifs/calculateur. Paramètres reste accessible en bas de navigation. Les quatorze écrans existants restent disponibles. Le menu mobile possède un fond de fermeture, la gestion d’Échap et de la tabulation, et devient inerte lorsqu’il est fermé.
2. **Cockpit.** La performance, l’espérance, le taux de réussite et le drawdown forment une bande de statistiques. La courbe et les dernières exécutions occupent la colonne principale. Le risque, la préparation et la prochaine action forment la colonne latérale. Sur petit écran, la séance suit la courbe et précède les dernières exécutions. Les graphiques secondaires viennent ensuite. La sélection depuis les graphiques et le retour au contexte restent disponibles.
3. **Journal.** Un clic sur l’instrument sélectionne une ligne et affiche son aperçu à côté du tableau. La flèche de ligne ou « Ouvrir la fiche » ouvre la revue complète. La nouvelle vue Calendrier sélectionne une séance selon sa date de clôture New York. Les statistiques, le tableau et le CSV portent alors sur cette séance ; le résumé mensuel conserve son périmètre explicite. Les regroupements par jour et semaine, les filtres, le tri et les colonnes restent disponibles. Sur mobile, le choix d’une exécution conduit au panneau de détail.
4. **Fiche trade.** La revue occupe une page dans l’espace de travail. Les captures et leurs annotations sont prioritaires ; les niveaux, événements d’exécution, métriques et notes restent consultables. La sélection avant/après et le zoom sont disponibles lorsqu’une capture existe. Sans image, l’état vide permet d’ouvrir l’éditeur. Le tableau d’origine reste monté pour conserver son défilement et sa pagination. La fermeture de l’éditeur ou du zoom ramène à la fiche, puis le retour à la sélection conserve le contexte. Le retrait conserve sa confirmation et sa sauvegarde préalable.
5. **Système visuel.** Fond graphite, accent cyan, gains verts et pertes corail, surfaces opaques, angles de 7 à 12 px, séparateurs fins et disparition des halos sur la courbe. Les titres utilisent Space Grotesk et les chiffres JetBrains Mono ; les polices sont installées localement. Boutons, formulaires, tableaux, calendriers et fenêtres reprennent ce système sur tous les écrans.

## Périmètre

Les changements concernent les composants de présentation, les sélections de navigation et les styles web. Aucune modification des API, des schémas Prisma, de l’authentification, des règles de risque ou des fonctions de calcul métier. Aucune dépendance ajoutée. Les préférences d’interface restent dans l’état React. Le serveur demeure local.

## Références de conception

- [TradeStream — Hexagon Agency](https://dribbble.com/shots/18165747-TradeStream-Dashboard) : organisation modulaire du suivi de performance.
- [Trading Journal Dashboard — Giga Ananidze](https://dribbble.com/shots/27223766-Trading-Journal-Dashboard) : articulation entre statistiques et historique des séances.
- [Trading & Investing Journal — Jordi Plaza](https://dribbble.com/shots/23047893-Trading-Investing-Journal) : tableaux et détails d’exécution.
- [Trading Journal — Jakob](https://dribbble.com/shots/26294580-Trading-Journal-Dashboard-UI-for-Web-App) : suivi des habitudes et lecture Plan/P&L.

Ces références orientent la composition ; leurs visuels et leurs données ne sont pas intégrés à l’application.

## Validation

- 53 tests métier et de sélection d’interface réussis, plus le scénario SQLite existant sur une base temporaire. Ce dernier a été lancé via un test Vitest temporaire pour contourner l’échec `os.userInfo()` du lanceur `tsx` dans ce terminal restreint ; ce test temporaire a ensuite été supprimé.
- Build Next.js de production, incluant la vérification TypeScript.
- Parcours navigateur : cinq espaces principaux, composition du cockpit, sélection depuis les graphiques et retour avec compte/période, panneau de détail, recherche/résultat/plan/tri/colonnes/CSV, revue précédente/suivante, onglets, annulation d’édition/retrait, regroupements jour/semaine, calendrier et mois bissextile, recherche vide.
- Les quatorze écrans et la fiche complète sont contrôlés à 1440, 1024, 768, 390 et 360 px. Captures représentatives sur ordinateur et mobile ; inspection visuelle du cockpit, du journal et de la fiche.
- Fixtures interceptées uniquement dans le navigateur, sans écriture serveur : journal sans compte/trade, captures avant/après annotées, zoom et note CSV contenant virgule, guillemets et retour à la ligne. L’alignement image/annotations est vérifié à 390 et 320 px.
- Les scénarios vérifient l’absence d’erreur JavaScript et d’appel de mutation du journal, puis comparent le document complet et sa révision avant/après.

Les rapports et captures se trouvent dans `tmp/studio-review-v4/`. Les scripts de recette utilisent les installations Playwright et Prettier déjà présentes dans `D:/Documents/GEX`, sans modifier les dépendances d’EDGE. Ces contrôles ne constituent pas une recette exhaustive de tous les formulaires ou un essai sur téléphone physique.
