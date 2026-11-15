# EDGE — mise en œuvre de l’audit et passage au cloud

Demande autorisée : appliquer l’ensemble de l’audit dans l’ordre, migrer la base sur Supabase puis déployer sur Vercel lorsque le produit est prêt.

## Ordre de travail

1. Fiabilité : ordre des clôtures, journée du garde-fou, multiplicateurs, horodatages, import, frais zéro, seuil commun et tests de non-régression.
2. Modèle et parcours : motifs de sortie, qualification inconnue, brouillons, états ouverts/clôturés, captures avant/après, sorties partielles et gestion.
3. Journal et analyses : qualification, filtres, calculateur prérempli, rapports cohérents, objectifs archivés, contexte du coach, vues enregistrées.
4. Design partagé : polices, composants, formulaires, navigation mobile et états d’interface ; retrait des promesses non implémentées des maquettes.
5. Supabase : authentification hébergée, isolation par utilisateur, stockage privé des captures, migrations et sauvegardes ; compatibilité des historiques.
6. Vercel : build de production, configuration d’environnement, recette de la version hébergée puis publication.

## État initial

- Code existant Next.js 16 / React 19, Prisma SQLite et cœur TypeScript ; 53 tests au dernier audit.
- Les maquettes Stitch ne sont pas encore intégrées.
- Le projet n’est pas un dépôt Git dans ce dossier.
- Les plugins Supabase et Vercel ont été trouvés, mais leurs connexions n’étaient pas installées au début du travail. Suggestions de connexion présentées ; le travail local continue indépendamment.
- Le schéma SQLite et les données locales seront conservés comme source de migration et de sauvegarde. Aucun effacement de données n’est autorisé implicitement.

## Validation

### Réalisé le 15 novembre

- 67 tests métier réussis ; TypeScript web réussi.
- Dates de clôture, journée du garde-fou, frais zéro, précision des horaires, multiplicateurs figés, cible d’import et seuil de rapport corrigés.
- Formulaire réécrit : TP/SL/BE/manuel/autre/inconnu, qualification facultative, captures visibles avec dépôt/collage/légendes, brouillons automatiques, positions ouvertes, sorties partielles réconciliées et événements de gestion.
- Journal : motifs, revues à compléter, brouillons, vues enregistrées ; calculateur vers formulaire ; objectifs archivés réactivables ; confluences par setup et versions des règles ; profils d’import ; contexte du coach et instruments reconnus dynamiquement.
- Typographie Barlow Condensed / IBM Plex Sans ; palette et composants communs ; build distant préparant les fichiers de police locaux.
- Recette isolée des 14 écrans web sans erreur JavaScript ; journal à 390 px sans débordement ; vrai formulaire vérifié avec deux images, fermeture/reprise, BE à frais zéro et inconnues. Rapports `implementation-*-browser.json` et captures dans ce dossier.
- Build Next de production local réussi dans `.next-verification` (répertoire séparé car permissions d’anciens caches `.next`).
- Supabase EDGE créé, projet `ufwgmxppqoqtnlrueklu`, organisation sevenkely, coût de création confirmé 0 $/mois. Deux migrations appliquées : journal privé, contrôle des révisions, captures privées immuables, 20 révisions précédentes et récupération d’un historique local après confirmation email.
- Test SQL d’isolation et conflits réussi dans une transaction entièrement annulée (`supabase/tests/isolation.sql`). Aucun utilisateur QA conservé.
- SQLite sauvegardé dans `backups/sqlite-2026-11-15T06-04-29-498Z`. Deux journaux : personnel (0 trade, 1 compte) et démo (180 trades). Journal personnel préparé dans la table privée de récupération Supabase. Le compte cloud reste à créer/confirmer avec la même adresse ; aucun mot de passe local transféré. Base SQLite inchangée.
- Configuration Supabase dans `apps/web/.env.local` et variables Vercel ; aucun secret ni export de données dans les sources de déploiement. Authentification et accès Storage utilisent les droits de l’utilisateur, sans clé service-role.
- Vercel autorisé pour `team_gbsWmSoRopbvnlI8FJXLFZfh`, nouveau projet `prj_sVjyu7Oxvy63wfrvvKemG1Ew5GPo` / edge-cockpit. Premier build distant échoué avant publication : CLI Prisma absent avec installation sans dépendances dev. Installation corrigée avec `--include=dev`. Les essais suivants ciblent explicitement `staging` ; l’API n’accepte pas la valeur `preview` et le premier envoi sans cible avait été traité comme production (jamais READY).

### Encore à terminer / vérifier

- Attendre et vérifier le build Vercel staging, tester `/api/health`, `/api/auth`, la connexion, la synchronisation, les captures et la police réellement hébergées ; publier uniquement après recette.
- Recette finale du build après les derniers changements ; test d’intégration SQLite à lancer avec esbuild car `tsx` échoue dans cet environnement sur `os.userInfo`.
- Approfondissements de l’audit pas encore tous implémentés : limites réellement facultatives des comptes personnels, objectifs de processus/périmètre de compte et liaison des actions de revue, parité du formulaire Expo, simplification structurelle des quatre feuilles CSS, synchronisation différentielle des seules entités, personnalisation complète de la routine et liens directs partageables.
- Les vues enregistrées portent actuellement les filtres du tableau ; le périmètre global compte/dates reste distinct.
- Fonts du développement local : repli Google tant que le script de téléchargement n’a pas pu tourner (réseau shell interdit). Le build Vercel les rendra locales. Ne pas annoncer un fonctionnement hors ligne complet sans cette recette.

### Reprise et publication du 15 novembre

- Installation Vercel corrigée : inclusion explicite de la racine du monorepo, et commandes conservées dans `apps/web/vercel.json`.
- 67 tests métier réussis, TypeScript réussi et intégration SQLite réussie sur base temporaire isolée.
- Le test HTTP réel a révélé les retries PostgREST sur les conflits de révision SQLSTATE `40001`. Migration `journal_conflict_http409` appliquée : réponse `PT409` immédiate ; isolation et historique revérifiés par transaction annulée.
- Logo EDGE vectoriel intégré à la connexion, à la navigation et au chargement. Favicon, icône Apple et icônes PWA 192/512 px mis à jour ; cache du shell versionné.
- Recette complète du build de production avec un compte synthétique : authentification, refus des accès privés anonymes, journal, conflit, historique, capture privée, rechargement, 14 écrans, mobile à 390 px, déconnexion. Aucune erreur JavaScript. Polices réellement servies par Vercel, aucune requête Google Fonts.
- Déploiement `dpl_CrW4rvQ91ZhSGyCbEuRxPSCXV7BK` promu en production, puis affecté à `edge-tradingjournal.vercel.app`. Le nom initial avec deux traits d’union est indisponible. Rapport : `deployment-verification.json`.
- Dépôt GitHub privé `Andryni/edge-trading-journal` créé par l’utilisateur pour recevoir les sources vérifiées. Les secrets, journaux, sauvegardes et fichiers MCP sont exclus.
- Reste utilisateur : créer/confirmer le compte EDGE personnel avec la même adresse que l’ancien journal et vérifier la configuration des URLs de confirmation dans Supabase. Les approfondissements produit listés ci-dessus restent hors de cette recette de déploiement.

### Avis Supabase examinés

Le linter signale volontairement l’absence de politique sur la table privée de récupération : aucun accès client direct n’est autorisé ([détail](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Il signale aussi les deux RPC `SECURITY DEFINER` accessibles aux utilisateurs connectés : elles vérifient `auth.uid()`, n’acceptent aucun propriétaire arbitraire et fixent le `search_path`, avec tests d’isolation ([détail](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)).
