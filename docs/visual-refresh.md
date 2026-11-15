# Refonte visuelle violet / indigo

Le thème commun couvre la connexion et les 14 écrans du web. Le moteur partagé, les API, le stockage, les schémas, les imports et les données persistées restent inchangés. Aucune dépendance ajoutée.

- Fond #0A0A12 à halos radiaux, cartes #12121C, coins de 20–24 px, actions en verre et marque violette, y compris l’icône et le manifeste PWA.
- Bloc séance conservé en tête : risque journalier, barre segmentée, trades restants, préparation et Lock Guard.
- Quatre KPI : comparaison à la fenêtre calendaire précédente de même durée, avec les mêmes filtres. Les valeurs proviennent de `summarize`. En l’absence d’observations précédentes, la pastille indique « Sans comparaison » ; aucune variation n’est inventée.
- Courbe cumulée en R avec date complète au survol, gains et pertes séparés par jour ou semaine. L’affichage commence par semaine au-delà de 30 journées pour garder des barres lisibles.
- Répartition du nombre de trades par setup ou instrument, pourcentages, R net et nombre de setups. Les petits segments restent détaillés dans la légende.
- Statuts d’exécution : présentation du score déclaré, « Plan respecté » à partir de 8/10 et « Hors plan » en dessous ; le score reste visible. Les contextes manquants restent « Non renseigné ». Cette convention visuelle ne change aucune règle métier.
- Chiffres en monospace, résultats signés, texte d’au moins 12 px, animations désactivées avec `prefers-reduced-motion`. Sur mobile, le calendrier et les tables peuvent défiler horizontalement à l’intérieur des cartes.

## Validation

`npm run check` : 45 tests unitaires, vérification TypeScript et intégration SQLite réussis. L’intégration utilise une base temporaire, distincte du journal utilisateur.

Dans le sandbox Windows de cette intervention, `tsx` échouait avant le lancement des tests sur `os.userInfo` (`uv_os_get_passwd / ENOMEM`). La suite complète a été exécutée avec un préchargement temporaire fournissant uniquement le nom d’utilisateur utilisé par le canal IPC optionnel de `tsx`. Ce contournement n’a pas été ajouté à l’application ni aux scripts du projet.

`npm run build` : compilation de production réussie. Icône SVG et manifeste PWA également validés.

Contrôle Chromium des 14 écrans en 1440 px et 390 px : aucune erreur JavaScript, aucun débordement de page ; texte visible d’au moins 12 px sur ordinateur. Vérifications supplémentaires : cockpit en 320 px, journal vide, variations avec période sélectionnée, regroupement hebdomadaire, répartition par instrument, infobulle d’équité, préparation de séance, ouverture/fermeture de l’éditeur et réduction des animations.

Les API ont été simulées pour le contrôle navigateur : aucune écriture dans les données utilisateur. Captures et rapport dans `tmp/visual-review/`, déjà exclu du suivi par `.gitignore`.
