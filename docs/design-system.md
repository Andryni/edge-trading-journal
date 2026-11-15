# EDGE / système visuel

Le système web actif est la [refonte de l’espace de travail](design-refresh-v4.md). Les variables finales sont dans `apps/web/app/studio.css` : fond graphite #0D1117, surface #151B23, accent cyan #92D6E0, gain #6BD6A9 et perte #F29396. Les titres utilisent Space Grotesk, les chiffres JetBrains Mono. Les composants partagés et les règles d’accessibilité restent applicables. Le mobile natif conserve sa présentation actuelle.

## Fondation historique

Palette centralisée dans `apps/web/app/globals.css` : fond #05070A, surface #0B1118, cyan dominant #46DEED, gain #67E5AB, perte #F17A9E, ambre #E9BD74 et violet #B3A1FB pour le coach. Space Grotesk compose l’interface et JetBrains Mono les chiffres.

Panel, Metric, Field, Modal, Pill et Empty sont réutilisés entre les écrans web. Le menu est replié sur les petites largeurs. Les formulaires ont des contrôles tactiles d’au moins 44 px, le focus clavier est visible et les dialogues piègent la tabulation/restaurent le focus. Les valeurs signées, libellés et effectifs complètent les couleurs.

Les graphiques Recharts n’utilisent pas d’animation bloquante. Framer Motion respecte reducedMotion=user et la CSS réduit animations/transitions selon la préférence système. Les modes sombre uniquement et les tableaux défilants privilégient la lisibilité de l’information.

Le mobile reprend les couleurs et les valeurs sémantiques en styles React Native, avec une courbe SVG indépendante du DOM. La couverture exacte des fonctionnalités par plateforme est dans le README.
