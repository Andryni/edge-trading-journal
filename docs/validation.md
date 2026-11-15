# Validation de la version 1.0

Voir le README pour les commandes reproductibles. Les contrôles sont exécutés sur Linux ; Windows et appareils natifs ne sont pas disponibles ici.

## Contrôles automatisés

- 40 tests métier : conversion points/ticks et frais ; long/short ; risque ; statistiques et drawdown ; micros ; regroupements ; UTC/New York été/hiver ; rejet des heures ambiguës ; validation du document ; limites statiques/trailing/EOD ; consistance ; Lock Guard et expiration d’une dérogation ; dédoublonnage ; mapping d’import ; parcours MFE/MAE ; CSV portable ; migration de sauvegarde ; discipline avec séance non revue.
- TypeScript web et mobile.
- Build de production Next.js.
- Export Android Expo/Metro avec compilation du bundle Hermes et dépendances natives résolues.
- Intégration SQLite sur une base temporaire : migration, création de 180 trades normalisés, modification, captures, plan/revue/objectif, cascade lors du retrait, isolation de deux utilisateurs et conflit de révision refusé.

## Contrôles d’interface

La page de connexion et le cockpit connecté sont inspectés dans le navigateur. Un espace de démo isolé est créé via le bouton de l’application. Un trade manuel est ajouté, synchronisé, recherché dans le journal et retrouvé dans la table Trade SQLite.

Un CSV de contrôle produit deux lignes valides, un doublon et un rejet ; seules les deux lignes valides sont écrites. Le PDF est téléchargé, rendu puis inspecté visuellement après intégration de la police. Les routines sont vérifiées par la validation de données et les tests SQLite, sans recette exhaustive de leurs formulaires sur tous les appareils. Les captures d’écran de travail ne sont pas incluses dans le code.

## Limites des essais

- Aucun appel réel payant au coach API : clé non fournie. Le contrat HTTP, les états non configurés et le coach local sont implémentés ; le fournisseur choisi devra être validé avec une clé de l’utilisateur.
- Pas d’émulateur ni appareil Android/iOS : un bundle valide ne remplace pas une recette sur téléphone.
- Pas de compilation iOS, APK signé, audit de sécurité Internet ou validation comptable certifiée.
- Les exports des plateformes de trading ne sont pas fournis par l’utilisateur. Les adapters sont vérifiés sur des fixtures synthétiques de positions clôturées, pas sur tous les rapports propriétaires possibles.
- Le service worker est réservé au build de production et remplit son cache au fil des visites. Les assets non visités ne sont pas garantis hors ligne.

Les deux installations npm ci ont été vérifiées en mode dry-run avec leurs lockfiles. Le setup final applique les migrations sans effacer la base existante.
