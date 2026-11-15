# EDGE — refonte dans Stitch

## Projet

- Projet privé : https://stitch.withgoogle.com/projects/14742357534657157802
- Identifiant MCP : `14742357534657157802`.
- Direction choisie : sombre, sobre et professionnelle, en conservant l’identité EDGE.
- Livrable : maquettes de conception dans Stitch. L’intégration dans Next.js et Expo constitue une étape distincte.

## Sources

Inventaire établi depuis `apps/web/app/ui/navigation.tsx`, `workspace.tsx`, `management.tsx`, `import-settings.tsx`, `trade-editor.tsx`, `trade-detail.tsx`, `coach.tsx`, le README et `docs/design-refresh-v4.md`. Référence visuelle existante : `tmp/studio-review-v4/cockpit-first-screen.png`.

L’utilisateur a ensuite fourni quatre références, conservées dans `docs/stitch-references/`. Elles orientent la proposition finale : panneaux analytiques compacts, graphiques d’équité et de drawdown lisibles, ratios visuels sobres, calendrier mensuel avec résultats et totaux hebdomadaires, puis détail de séance avec accès au journal. La quatrième référence guide la composition générale ; les trois premières précisent le calendrier et la consultation d’une séance. Les marques, scores propriétaires et fonctionnalités absentes d’EDGE ne sont pas repris.

## Système commun

Fond graphite `#0D1117`, navigation `#0B0F14`, surfaces `#151B23` et `#1E2833`, accent cyan `#92D6E0`, gain `#6BD6A9`, perte `#F29396`, texte `#EDF2F7`, texte secondaire `#9CAAB9`. À la demande de l’utilisateur, la typographie est renouvelée : **Barlow Condensed** pour les titres et la marque, **IBM Plex Sans** pour l’interface, les libellés et les valeurs financières avec chiffres tabulaires. Space Grotesk, Inter et JetBrains Mono sont exclus de la nouvelle direction. Grille de 8 px, panneaux arrondis à 12 px, contrôles à 7 px, bordures fines, focus visible et zones tactiles généreuses.

Les cinq espaces de navigation sont conservés : Vue d’ensemble, Journal, Analyses, Préparation, Comptes. Paramètres reste en bas. Les écrans secondaires utilisent des onglets de section. Sur mobile, l’architecture reste la même, avec une navigation adaptée à l’espace disponible.

Les exemples portent le badge « Données de démonstration ». Les résultats sont clôturés, les fuseaux sont explicites et chaque indicateur conserve ses unités et son périmètre. Pas de cotations en direct, de passage d’ordres, de connexion au courtier ou de prévisions ajoutés au produit.

## Écrans à couvrir

| Écran existant | Contenu à préserver dans la maquette |
| --- | --- |
| Vue d’ensemble | KPI, équité, dernières exécutions, risque de la séance, préparation, prochaine action |
| Journal | Recherche, filtres, tri, colonnes, groupes jour/semaine, sélection et inspecteur, export CSV |
| Calendrier | Mois, semaines, résultat R/USD, jours sans trade, détail de la séance sélectionnée |
| Import | CSV/TSV/XLSX, mapping, dates/fuseau, aperçu, erreurs et doublons, historique |
| Performance | Dimensions, résultat et espérance par contexte, effectifs, discipline, MFE/MAE renseignés |
| Leak Finder | Fuites et forces, effectifs minimaux, matrice comportementale, liens vers les trades |
| Coach | Mode local, sélection filtrée, questions suggérées, conversation, API facultative et consentement |
| Rapports | Synthèse, trois forces/fuites, prochaine action, export PDF |
| Plan & revue | Date New York, contexte, setups autorisés, six vérifications, revue et action du lendemain |
| Playbook | Setups, conditions d’entrée, invalidation, confluences et exemples |
| Objectifs | Cibles R/USD/discipline, période, progression, séances revues disciplinées |
| Calculateur | Instrument/compte, risque, entrée/stop, frais, taille et arrondi |
| Comptes | Capital, objectif, drawdown, consistance, limites, simulation de perte, Lock Guard |
| Paramètres | Sauvegarde/restauration, environnement démo, préférences, instruments et dérogations |
| Connexion / inscription | Compte local, email, mot de passe, exploration de la démonstration |
| Fiche trade | Captures annotées avant/après, niveaux, métriques, exécution, notes et retour au contexte |
| Nouveau / modifier un trade | Prix, taille, dates/fuseau, risque calculé, émotions, plan, notes et captures |

Variantes mobiles prioritaires : cockpit, journal et fiche trade. Les autres écrans doivent suivre les mêmes règles d’adaptation : colonnes empilées, actions accessibles, formulaires lisibles et tableaux prioritaires ou défilants avec indication.

## Vérification des livrables

Les **20 maquettes retenues** sont créées et organisées dans le projet privé Stitch : **17 écrans web** (14 pages principales, connexion, fiche trade et éditeur) et **3 variantes mobiles** présentées à 390 px. Les brouillons remplacés sont masqués sur le canevas.

- Aperçu local : [ouvrir les 20 maquettes](stitch-export/apercu.html).
- Identifiants, fichiers et contrôle des polices : [stitch-screens.json](stitch-screens.json).
- Briefs détaillés : [stitch-briefs.json](stitch-briefs.json).
- Descriptions produites par Stitch : [stitch-notes.md](stitch-notes.md).

Vérifications : présence des 20 versions retenues sur le canevas, 20 exports HTML et 20 liens locaux disponibles ; Barlow Condensed et IBM Plex Sans présents dans les 20 exports, sans import des anciennes familles. Inspection visuelle du cockpit, du journal, du calendrier et de vues mobiles. La marge vide de l’aperçu de la fiche mobile a été retirée pour sa présentation à 390 px ; son HTML reste celui de la maquette mobile. L’API Stitch conserve une étiquette technique DESKTOP pour cet écran, consignée dans le manifeste.

Une maquette ne remplace pas une vérification du fonctionnement du produit ni une recette d’accessibilité de son implémentation. L’intégration dans Next.js et Expo reste à réaliser. Les styles et les polices externes des exports peuvent nécessiter Internet ; les aperçus hébergés sont consultables dans Stitch.
