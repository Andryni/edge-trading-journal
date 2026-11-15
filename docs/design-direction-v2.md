# EDGE — direction de la deuxième passe

Direction choisie : cockpit de trading sobre et dense, données au premier plan.

## Système

- Fond : #0A0A12. Surface : #12121C. Texte : #F1F0F5. Texte secondaire : #AAA7B8. Accent : dégradé #8B5CF6 → #6366F1. Gains #34D399 et pertes #FB7185, signés.
- Texte : Segoe UI Variable / Segoe UI, sans téléchargement. Titres 24–28 px, sections 15–17 px, texte 13–14 px, minimum 12 px. JetBrains Mono pour chiffres et colonnes de résultats.
- Alignement à gauche, espacement 4/8/12/16/24. Les cartes principales conservent des coins de 20–24 px. Les contrôles restent plus compacts. Verre uniquement sur les actions, halos de fond discrets.

## Composition

```
Navigation | Cockpit                          Sauvegarde  + Trade
           | Séance : résultat | risque segmenté | préparation / guard
           | Filtres et sélection
           | Performance | Espérance | Réussite | Drawdown
           | Équité dominante                 | Répartition compacte
           | Gains / pertes                   | Prochaine action
           | Dernières exécutions, résultat près de l’instrument
           | Dernières séances                | Respect du plan
```

L’équité doit apparaître dans le premier écran en 1440×1000. Les filtres détaillés se déplient sur demande sur tous les écrans. Les calculs, données, classements et callbacks métier sont conservés.

## Critique avant réalisation

La première passe répétait les cartes, slogans, capitales et étiquettes numérotées sans séquence réelle. La deuxième réduit ces éléments, les notes pédagogiques répétitives des KPI et les surfaces lumineuses. La signature est la lecture du risque et des R, avec une courbe violette au centre de la composition. Aucune animation décorative permanente.

## Sources et statut des outils

Sources officielles consultées :
- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- https://github.com/21st-dev/magic-mcp/blob/main/llms-install.md

Les consignes de frontend-design et les règles générales d’UI UX Pro Max sont appliquées directement après lecture. L’installation par Skill Installer a échoué sur le réseau du terminal (WinError 10013) ; aucun skill n’a été installé globalement et aucune recherche dans la base locale d’UI UX Pro Max n’a été exécutée. 21st MCP n’est pas connecté ; sa configuration officielle nécessite une clé API. Aucun composant 21st n’a été généré ni intégré.

## Résultat de la deuxième passe

La séance occupe désormais environ 230 px en 1440×1000. Les KPI occupent environ 154 px. La courbe commence vers 655 px, contre environ 1042 px sur la capture de première passe. Le tableau des exécutions vient avant les panneaux de régularité et de discipline. Le résultat signé en R apparaît immédiatement après l’instrument, y compris dans la première partie visible des tables sur mobile.

Les filtres détaillés se déplient depuis la même barre sur les 14 écrans. Les intitulés du cockpit et des KPI analytiques sont plus courts ; les slogans et les numéros de section décoratifs ont été retirés. La typographie utilise les polices système du poste pour le texte et JetBrains Mono pour les chiffres. Les trois imports Space Grotesk ne sont plus nécessaires.

Contrôles effectués :

- 45 tests unitaires, TypeScript et intégration SQLite réussis avec `npm run check`. L’intégration utilise le même préchargement temporaire de compatibilité `os.userInfo` pour le sandbox Windows que la première passe ; aucun changement des scripts applicatifs.
- Navigation dans les 14 écrans à 1440, 1024 et 390 px, plus cockpit en 320 px : aucun débordement horizontal de la page, aucune erreur JavaScript, aucun texte visible inférieur à 12 px.
- Comparaison de période, regroupement jour/semaine, répartition setup/instrument, infobulle d’équité, navigation vers la préparation et ouverture/fermeture de l’éditeur vérifiés.
- Le journal réel du compte démo a été comparé avant/après : révision et contenu identiques, aucune écriture dans `/api/journal` pendant le contrôle.
- Contraste du texte blanc des boutons primaires : environ 4,8:1 à 5,05:1 aux extrémités du dégradé, état de survol compris. Contrôle ciblé, pas certification exhaustive d’accessibilité.

Les captures et le rapport de navigateur sont dans `tmp/visual-review-v2/`. Les fichiers de première passe sont conservés dans `tmp/design-before-v2/` pour comparaison ; ces répertoires sont déjà ignorés par Git.

Compilation de production : `npm run build` réussie (Next.js / Turbopack, TypeScript, génération des pages). Le serveur de développement a été relancé sur http://127.0.0.1:3000 après compilation.

Contrôle final après relance : HTTP 200, courbe à environ 655 px, réduction des animations respectée, répartition alignée à la largeur mobile, journal vide lisible sans débordement et aucune erreur JavaScript. Rapport complémentaire : `tmp/visual-review-v2/final-checks.json`.
