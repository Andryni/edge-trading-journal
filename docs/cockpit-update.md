# Cockpit web — mise à jour du 14 novembre 2026

Cette mise à jour concerne la présentation. Calculs, modèle de données, stockage, API et application mobile inchangés.

- Séance en pleine largeur : P&L du jour, risque segmenté, trades restants, préparation et accès Lock Guard.
- Accueil compact et filtres repliables ; compte « Tous » sans troncature.
- Courbe sur toute la carte, discipline conservée dans son anneau et KPI remplacé par le drawdown maximal existant.
- Montants français avec espaces et symbole $, accords singulier/pluriel.
- Calendriers maison JJ/MM/AAAA : saisie validée, navigation clavier, valeurs ISO conservées.
- Identité cyan : coins coupés, crochets, bordures dégradées, grille, halo, chiffres lumineux, courbe animée, compteurs et scanline.
- Animations désactivées selon prefers-reduced-motion ; textes secondaires de 12 px minimum et contrastes AA.

## Vérifications

`npm run check` : 40 tests réussis, TypeScript et intégration SQLite réussis.
`npm run build` : compilation de production réussie.
Empreintes des 15 fichiers protégés métier, stockage, migrations, tests et mobile identiques avant/après.
Dans le navigateur : dates invalides refusées, filtres de période appliqués puis réinitialisés, aucun champ date natif sur le Cockpit, aucun texte visible inférieur à 12 px.
Courbe : 10 px avant le pied de carte, aucun vide sous le pied ; barre latérale de hauteur viewport conservée au défilement.
Contrastes secondaires vérifiés : 9,71:1 sur carte, 7,26:1 sur surface éclaircie et 5,55:1 pour les libellés de navigation.

Les contrôles métier et les données de démonstration n’ont pas été modifiés.
