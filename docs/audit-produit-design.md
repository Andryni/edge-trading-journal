# EDGE — audit produit, design et fonctionnalités

Date : 15 novembre 2026. Périmètre : application web, cœur métier partagé, sources Expo et 20 maquettes exportées de Stitch.

## 1. Diagnostic

La priorité est de fiabiliser le parcours **documenter un trade → comprendre sa sortie → joindre ses captures → faire sa revue → retrouver ces informations dans les analyses**.

Le formulaire comporte déjà beaucoup de champs, mais il omet le motif de sortie et cache les captures avec les informations avancées. Des valeurs de qualification sont enregistrées sans avoir été choisies. Les maquettes améliorent la composition, mais plusieurs textes décrivent des capacités qui ne sont pas implémentées. Une intégration directe de ces maquettes reproduirait ces défauts.

Les améliorations se répartissent en trois niveaux :

- **P0 — fiabilité des chiffres** : ordre des clôtures, journée du garde-fou, spécifications d’instrument lors d’une modification.
- **P1 — parcours quotidien et qualité des données** : motif de sortie, captures visibles, brouillon, champs inconnus, validation et cohérence des écrans.
- **P2 — approfondissement** : sorties partielles, gestion des pièces jointes à grande échelle, vues enregistrées et meilleure continuité web/mobile.

Les niveaux indiquent l’ordre de traitement recommandé. Ils ne signifient pas que le journal passe des ordres chez le courtier.

## 2. Méthode et résultats de vérification

| Contrôle | Résultat |
| --- | --- |
| Tests existants du cœur et des sélections d’interface | **53 tests réussis**, 4 fichiers |
| TypeScript web, sans émission ni écriture incrémentale | **Réussi** |
| Reproductions synthétiques ciblées | **11 cas documentés**, dont des défauts confirmés et des capacités métier manquantes |
| Vrai composant React TradeEditor, compilé avec ses composants et son cœur métier | **7 contrôles navigateur**, sans erreur JavaScript dans le scénario final |
| Import réel de deux fichiers image dans ce composant | Phases **Avant** et **Après** conservées à l’enregistrement |
| Largeur du formulaire isolé à 390 px | Pas de débordement horizontal de la page dans le scénario testé |
| Sources des maquettes | Revue structurelle des **20 exports HTML**, recherche des écarts de contenu et inspection de captures représentatives |
| TypeScript mobile | Validation actuelle **bloquée par les dépendances Expo absentes**, notamment `expo/tsconfig.base` ; les nombreuses erreurs en cascade ne sont pas un décompte de bugs produit |

Le serveur applicatif sur le port 3000 n’était pas démarré. Le test du formulaire utilise le composant réel dans un environnement navigateur isolé, avec données synthétiques et requêtes interceptées. Les polices système de remplacement de ce contrôle ne constituent pas une recette typographique du rendu final. Aucun journal réel n’a été lu ou modifié par ces scénarios. La synchronisation SQLite complète, le coach distant et les interactions sur téléphone physique n’ont pas été revalidés pendant cet audit.

Éléments reproductibles :

- [Cas métier et résultats observés](audit-reproductions.json) ; lanceur [audit-reproduce.cjs](audit-reproduce.cjs).
- [Contrôles du formulaire React](audit-form-browser.json) ; lanceur [audit-form-browser.cjs](audit-form-browser.cjs) et [composant de test](audit-form-harness.tsx).
- [Capture du formulaire sur ordinateur](audit-form-desktop.png) et [vue mobile](audit-form-mobile.png).
- [Inventaire des maquettes et mentions à contrôler](audit-maquettes.json).

Les scripts navigateur réutilisent l’installation Playwright déjà présente dans `D:/Documents/GEX`. Ils n’ajoutent aucune dépendance au projet.

## 3. Ce qui existe et doit être conservé

- Cinq espaces principaux regroupent les 14 écrans web : la navigation a déjà une structure exploitable.
- Saisie et modification d’exécutions clôturées, calculs du risque initial, du RR et du résultat net.
- **Deux imports d’images distincts Avant / Après**, miniatures, zoom et annotations web. Cette capacité est fonctionnelle ; sa visibilité est insuffisante.
- Journal filtrable, regroupements par séances et semaines, calendrier et consultation d’une fiche en conservant le contexte de la sélection.
- Plans et revues datés, playbook, objectifs, comptes, simulateur de perte et dérogations tracées du Lock Guard.
- Import avec mapping, fuseaux horaires, aperçu, erreurs, doublons et avertissements sur les hypothèses de risque.
- Sauvegarde JSON complète, copie IndexedDB, serveur SQLite et traitement explicite des conflits de révision.
- Mode de démonstration identifié et coach local distinct du fournisseur distant facultatif.
- Présence de labels, gestion du focus des dialogues et respect de la préférence de réduction des animations dans plusieurs composants.

Il faut faire évoluer cette base et ses composants partagés, plutôt que réécrire séparément chaque écran.

## 4. Constats prioritaires avec preuves

### F01 — P0 : drawdown et séries calculés dans l’ordre d’entrée

`summarize()` trie les trades par `enteredAt`. Des positions peuvent se chevaucher et sortir dans un ordre différent. La courbe interne, le drawdown et les séries de gains/pertes ne décrivent alors pas correctement l’équité clôturée.

**Reproduction AUD-01** : trois trades donnent **100 $ de drawdown et une perte consécutive maximale**, contre **200 $ et deux pertes consécutives** avec l’ordre des clôtures.

La courbe principale web regroupe déjà les résultats par journée de clôture, tandis que le PDF et le mobile utilisent la courbe issue du résumé. Cette divergence peut donc être visible entre supports. Le calcul du plancher trailing dans `accountStatus()` possède sa propre boucle sur les clôtures : il ne faut pas lui attribuer automatiquement le même défaut.

**À faire** : définir clairement les mesures « par clôture de trade » et « fin de journée », utiliser les horodatages correspondants, harmoniser les supports et ajouter le cas des positions chevauchantes aux tests.

Preuves : [résumé métier](../packages/core/src/index.ts), ligne 113 ; [courbe web](../apps/web/app/ui/workspace.tsx), fonction `Equity` ; [courbe PDF](../apps/web/lib/files.ts), fonction `monthlyPdf`.

### F02 — P0 : journée du P&L différente entre comptes et Lock Guard

`accountStatus()` utilise les résultats clôturés aujourd’hui. `guardStatus()` sélectionne les trades entrés aujourd’hui, y compris pour son résultat quotidien.

**Reproduction AUD-02** : une position entrée la veille et clôturée aujourd’hui à −100 $ épuise un budget quotidien de 100 $ dans l’écran Comptes. Le garde-fou voit pourtant un résultat de 0 $ et reste déverrouillé.

**À faire** : séparer les bases temporelles. Le nombre de prises de position et leur rang peuvent rester fondés sur l’entrée ; le P&L réalisé quotidien doit suivre la convention de clôture annoncée. Afficher la convention New York au même endroit dans les écrans concernés.

Preuve : [journal.ts](../packages/core/src/journal.ts), fonctions `accountStatus` et `guardStatus`, notamment ligne 367.

### F03 — P0 : changement d’instrument conservant le mauvais multiplicateur

Lors de la modification d’un trade, l’éditeur conserve ses `tickSize` et `tickValue` figés, même si l’utilisateur change l’instrument. Le sélecteur permet pourtant ce changement. La même construction existe dans le formulaire natif.

**Reproduction AUD-03** : changer ES vers NQ tout en conservant le multiplicateur ES produit **500 $ de risque et de gain brut**, au lieu de **200 $** avec les spécifications NQ pour les prix du scénario.

**À faire** : soit verrouiller ce changement pour une exécution existante, soit le traiter comme une correction explicite avec remplacement cohérent des spécifications et aperçu des nouveaux montants. Conserver la protection actuelle des historiques lorsque les paramètres généraux d’un instrument changent.

Preuves : [éditeur web](../apps/web/app/ui/trade-editor.tsx), ligne 77 ; [formulaire natif](../apps/mobile/app/index.tsx), fonction `TradeForm`.

### F04 — P1 : motif de sortie absent du modèle

Le stop et l’objectif initiaux existent. Ils ne répondent pas à la question **« Pourquoi ai-je clôturé ? »**. Aucun champ structuré ne stocke TP, SL, BE ou clôture manuelle.

**Reproduction AUD-08** : une propriété `exitReason: 'TP'` ajoutée seule à un objet est retirée par la validation actuelle. Ajouter un sélecteur uniquement dans la maquette ou le formulaire ne suffira donc pas.

**À faire** : ajouter le champ au modèle portable, à la validation, à la persistance, aux sauvegardes, aux imports/exports et aux deux interfaces. Prévoir `Non renseigné` pour les historiques. Ne pas inventer le motif à partir du signe du P&L.

Preuves : [type Trade](../packages/core/src/index.ts), [tradeSchema](../packages/core/src/journal.ts), ligne 84 ; [colonnes CSV](../apps/web/lib/files.ts).

### F05 — P1 : captures présentes mais enfouies

À la création, « Contexte, émotions, notes et captures » est replié. Les boutons d’import Avant et Après se trouvent après le contexte, les confluences, quatre champs de notes et les mesures MFE/MAE.

**Contrôles UI-01 et UI-05** : les deux imports sont invisibles au premier affichage mais fonctionnent une fois atteints ; les images sont conservées avec leurs phases respectives.

**À faire** : créer deux zones distinctes et visibles **Image avant le trade** et **Image après le trade**, avec miniatures, compteur, remplacement et retrait. Ajouter ensuite glisser-déposer et collage depuis le presse-papiers. Garder l’ajout d’images facultatif.

Preuve : [trade-editor.tsx](../apps/web/app/ui/trade-editor.tsx), lignes 327 et 469.

### F06 — P1 : qualifications préremplies qui deviennent des observations

Un trade peut être enregistré sans ouvrir le contexte, avec « Calme », qualité A, énergie 4/5, stress 2/5 et sommeil 7 h. Le respect du plan commence à 8/10. La revue de séance utilise également une note par défaut.

**Contrôle UI-03** : ces valeurs ont été effectivement enregistrées sans choix de qualification dans le scénario testé. Cela affecte les analyses comportementales, le classement « Plan respecté » et les objectifs de discipline.

Un autre point doit être corrigé : le formulaire retire le tag `Contexte non renseigné` lors de toute sauvegarde d’un trade édité. Ajouter seulement une capture peut donc faire considérer le contexte importé comme qualifié.

**À faire** : états `Non renseigné` réellement distincts, indicateur explicite de qualification et exclusion cohérente des valeurs inconnues de ces moyennes. Réserver les valeurs par défaut aux préférences de saisie, pas aux observations psychologiques. Ne pas réinterpréter arbitrairement les anciennes notes réellement saisies.

Preuves : [éditeur](../apps/web/app/ui/trade-editor.tsx), lignes 150, 303, 350 et 366 ; [qualification cockpit](../apps/web/app/ui/workspace.tsx), ligne 513 ; [objectifs et radar](../apps/web/app/ui/management.tsx), fonction `Goals`, et `Analytics` dans le workspace.

### F07 — P1 : frais à zéro impossibles à saisir correctement

`value={price[key] || ''}` transforme zéro en champ vide. Le champ Frais est obligatoire, alors que le schéma métier autorise zéro.

**AUD-10 et UI-02** : défaut reproduit dans le contrôle HTML puis dans le vrai composant React. Il faut conserver zéro comme une valeur valide et distinguer zéro de l’absence de saisie.

Preuve : [trade-editor.tsx](../apps/web/app/ui/trade-editor.tsx), ligne 105.

### F08 — P1 : fermeture sans brouillon ni protection de la saisie

La fermeture appelle directement `onClose`. Les champs et les images temporaires ne sont pas conservés.

**UI-07** : fermer puis réouvrir efface les prix et les captures sans confirmation. Le test du zoom imbriqué n’a, en revanche, pas provoqué de sauvegarde intempestive : ce comportement a été contrôlé et n’est pas retenu comme anomalie.

**À faire** : brouillon local automatique, reprise explicite, statut d’enregistrement et confirmation de fermeture lorsqu’une saisie non sauvegardée serait perdue. Ne pas confondre sauvegarde du brouillon et validation d’un trade clôturé.

Preuves : [TradeEditor](../apps/web/app/ui/trade-editor.tsx) et son montage dans [Workspace](../apps/web/app/ui/workspace.tsx), ligne 1585.

### F09 — P1 : nouvelle saisie déconnectée du compte actif

Le formulaire choisit le premier compte du journal. Le compte sélectionné dans les filtres de l’espace de travail ne lui est pas transmis comme contexte initial.

**À faire** : reprendre le compte explicitement actif ou demander le choix lorsqu’on affiche tous les comptes. Garder son nom visible près des montants et au moment de la validation. Reprendre aussi les derniers instrument/setup choisis lorsque cela facilite la saisie.

Preuves : [éditeur](../apps/web/app/ui/trade-editor.tsx), ligne 71 ; [montage du formulaire](../apps/web/app/ui/workspace.tsx), ligne 1585.

### F10 — P1 : modification d’une heure précise en heure arrondie à la minute

`localDateTime()` tronque les secondes et millisecondes. L’éditeur repasse ensuite cette valeur dans `zonedToUtc()` à la sauvegarde.

**AUD-07** : `15:00:45.123Z` devient `15:00:00.000Z` sans modification volontaire de l’heure. Modifier seulement une note ou une image peut donc altérer l’horodatage et perturber la durée ou l’empreinte de dédoublonnage.

**À faire** : conserver l’instant original si le champ n’a pas changé ; proposer la précision nécessaire pour les corrections explicites. Les fuseaux choisis et les secondes des imports doivent être préservés.

Preuves : [localDateTime](../packages/core/src/journal.ts), ligne 295 ; [champs d’entrée et sortie](../apps/web/app/ui/trade-editor.tsx), lignes 260 et 270.

### F11 — P1 : statistiques et rapports ne partagent pas tous les mêmes règles

Le cockpit transmet `settings.minSample`. L’écran Rapports et le PDF appellent `reviewSummary(trades)` sans ce paramètre, donc utilisent son défaut de 10. Certaines moyennes de discipline incluent également les trades importés non qualifiés, alors que le cockpit les exclut.

**AUD-06** : pour 12 observations et un réglage à 30, le cockpit ne conserve aucun groupe tandis que le rapport propose trois fuites de 12 observations.

**À faire** : une définition partagée du périmètre, du seuil et des données qualifiées. Afficher ces informations dans le PDF, le coach et les analyses. Harmoniser aussi les libellés /10 et /100.

Preuves : [reviewSummary](../packages/core/src/journal.ts), ligne 563 ; [Reports](../apps/web/app/ui/management.tsx), ligne 976 ; [monthlyPdf](../apps/web/lib/files.ts), ligne 113.

### F12 — P1 : Lock Guard peut empêcher la journalisation après séance

La création manuelle consulte l’heure actuelle du garde-fou, même lorsqu’on veut documenter un trade passé. Après la coupure, il faut une dérogation pour saisir cet historique. En l’absence de trade clos du jour, le début du délai est remplacé par l’heure de chaque lecture.

**AUD-09** : à 17 h puis 17 h 20 New York, le délai reste de **900 secondes** dans ce cas. Il ne s’écoule pas normalement.

**À faire** : fixer un véritable instant de début de pause. Définir séparément la préparation d’une nouvelle prise de position et l’enregistrement rétrospectif d’une exécution, y compris une exécution hors règles. Un journal doit permettre de documenter les écarts. Afficher clairement quelles règles sont des avertissements et lesquelles encadrent une action volontaire ; ne pas annoncer une protection des ordres courtier.

Preuves : [guardStatus](../packages/core/src/journal.ts), ligne 388 ; [submit de l’éditeur](../apps/web/app/ui/trade-editor.tsx).

### F13 — P1 : RR supposé incorrect dans un cas d’import

Avec un stop réel fourni mais une cible absente, la cible supposée est construite depuis `defaultStopPoints`, au lieu d’utiliser la distance du stop fourni.

**AUD-11** : entrée 6000, stop 5995 et RR supposé 2 donnent une cible 6004 et un RR prévu de **0,8**, au lieu d’une cible 6010 pour un RR de 2. Le risque initial et le P&L réalisés peuvent rester corrects ; le défaut porte ici sur l’objectif supposé et le RR planifié.

**À faire** : dériver l’hypothèse depuis la bonne distance et identifier sa provenance. À terme, autoriser une cible inconnue avec RR prévu indisponible, plutôt que forcer une information absente.

Preuve : [normalizeImport](../packages/core/src/imports.ts).

### F14 — P1 : précision des instruments et affichage monétaire à clarifier

La configuration stocke le tick et sa valeur, mais pas le type d’instrument, le pas de quantité, la quantité minimale ou le mode de prix moyen. La contrainte de contrats entiers repose sur une liste de six symboles.

**AUD-04 / AUD-05** : un instrument personnalisé nommé CL peut recevoir une demi-unité ; un prix ES hors grille est accepté. La correction doit tenir compte du cas légitime de prix moyens issus de plusieurs exécutions : il ne faut pas les rejeter comme un prix d’exécution unitaire.

L’utilitaire `money()` arrondit les dollars à l’unité. Des frais de 4,80 $ deviennent donc 5 $ dans les vues qui l’utilisent. Cette présentation convient à certains grands agrégats, mais pas à une fiche détaillée ou au contrôle des frais.

**À faire** : métadonnées d’instrument explicites, validation adaptée au type de saisie et centimes dans les montants détaillés.

Preuves : [tradeSchema](../packages/core/src/journal.ts), ligne 139 ; [types d’instruments](../packages/core/src/index.ts) ; [money](../apps/web/app/ui/kit.tsx).

### F15 — P1 : seuls les trades complètement clôturés sont représentables

Le modèle portable impose les dates et prix de sortie, ainsi que stop et cible positifs. Il ne représente pas un brouillon ni une position ouverte. Il force aussi des informations parfois inconnues dans un historique réel.

**À faire** : distinguer `Brouillon`, `Ouvert` et `Clôturé`, avec calculs disponibles selon les données connues. Une cible non définie doit laisser le RR prévu indisponible. Un risque initial inconnu peut laisser le résultat net disponible tout en excluant les R des statistiques vérifiées. Le suivi d’une position ouverte n’exige pas un flux de marché en direct.

Preuve : [tradeSchema](../packages/core/src/journal.ts), lignes 84 à 102. Les colonnes Prisma parfois nullables ne suffisent pas : le schéma portable utilisé par l’interface refuse actuellement ces états.

### F16 — P1 avant intégration : mentions inventées dans les maquettes

Les maquettes générées précédemment contiennent des textes incompatibles avec le produit actuel. Ils doivent être corrigés.

- Connexion : « Mot de passe de chiffrement », dérivation PBKDF2, partition OPFS et export JSON chiffré.
- Coach : « LLM chiffré » et « SQLite WASM / OPFS ».
- Objectifs, Comptes, fiche trade et éditeur : stockage ou base locale annoncés chiffrés.
- Éditeur : « aucun risque de breach ».
- Rapport : « validation du Edge » et « fenêtre […] optimale », formulation trop affirmative pour une synthèse descriptive.

L’application utilise une authentification locale avec mot de passe haché, SQLite côté serveur et IndexedDB dans le navigateur. Le téléchargement JSON est un JSON ordinaire. Ces mentions de chiffrement ne décrivent donc pas des fonctions existantes. Le fait qu’un compte possède une marge positive ne justifie pas « aucun risque ».

**À faire** : remplacer ces textes par les capacités exactes et les états réels. Conserver le consentement du coach distant et le badge de démonstration. Vérifier les exemples, unités et actions de toutes les maquettes avant de les transformer en composants.

Preuves : [connexion](stitch-export/15-connexion.html), lignes 238, 251 et 307 ; [coach](stitch-export/07-coach.html), lignes 272 et 506 ; [éditeur](stitch-export/17-editeur_trade.html), lignes 621 et 653 ; [inventaire des 20 exports](audit-maquettes.json).

### F17 — P1/P2 : les captures feront rapidement grossir le journal

Les images sont compressées puis stockées en base64 dans le document. Le client impose une limite globale d’environ 31,5 Mo. Chaque modification clone et valide le document ; la synchronisation transmet le document complet.

Exemple de dimensionnement, pas mesure des captures de l’utilisateur : 100 images de 250 ko représentent environ 33 Mo après encodage base64, avant les autres données du journal.

**À faire rapidement** : jauge de stockage, estimation avant ajout, compression explicitée et erreur exploitable sans perdre la saisie. **À faire pour la montée en charge** : pièces jointes séparées, identifiants stables, sauvegarde complète conservée et synchronisation des seuls éléments modifiés. Mesurer les performances sur un gros journal ; aucune latence chiffrée n’a été établie ici.

Preuves : [compression des captures](../apps/web/app/ui/screenshots.tsx), ligne 19 ; [clonage, limite et synchronisation](../apps/web/lib/client-store.ts), lignes 193, 198 et 226.

## 5. Formulaire d’ajout recommandé

### Organisation visuelle

**Sur ordinateur** : formulaire principal organisé en sections courtes et résumé de calculs dans une colonne latérale. La capture Avant et la capture Après doivent former un bloc clairement identifiable avant les champs d’analyse avancée.

**Sur mobile** : même ordre, champs de notes et images sur toute la largeur, résumé financier compact et action de sauvegarde accessible. Les calculs ne doivent pas repousser toutes les informations de sortie sous plusieurs écrans de contexte.

| Bloc | Champs et comportement attendus |
| --- | --- |
| Identité | Compte explicite, instrument, direction Achat/Vente, setup ; reprendre le contexte actif |
| État | Brouillon / Ouvert / Clôturé ; adapter les exigences aux informations réellement disponibles |
| Exécution | Entrée et sortie avec date, heure et fuseau ; quantité, prix et frais réels ou explicitement estimés |
| Plan initial | Stop initial et cible initiale ; « Non renseigné / Non défini » possibles selon le cas, R indisponible si le risque manque |
| Sortie | Sélecteur **TP / SL / BE / Clôture manuelle / Autre / Non renseigné**, indépendant du gain/perte |
| Résultat calculé | Brut, frais, net, résultat en R lorsque disponible, risque initial et RR prévu ; unités et centimes lisibles |
| Gestion | Stop déplacé, fermeture anticipée et motif ; conserver le stop initial comme référence du R |
| Capture avant | Zone dédiée, import, collage ou dépôt, miniature, légende, remplacement, retrait |
| Capture après | Même comportement, phase distincte et compteur visible |
| Revue | Émotions avant/après, qualité, respect du plan, confluences, bonne décision, erreur, leçon ; données inconnues identifiées |
| Avancé | MFE, MAE, continuation après stop et autres mesures ; facultatif, expliqué, sans valeurs inventées |
| Sauvegarde | Brouillon conservé, erreurs près du champ concerné, retour clair après enregistrement et protection de la saisie en cours |

### TP, SL, BE et clôture manuelle

Il faut afficher deux informations séparées :

1. **Le motif de sortie**, renseigné par le trader ou fourni par un import suffisamment explicite.
2. **Le résultat financier**, calculé depuis les prix, la taille et les frais.

Une clôture manuelle peut être gagnante ou perdante. Une sortie au prix d’entrée peut être BE sur le prix, avec un net négatif après frais. Un stop déplacé peut produire un gain. Ces cas ne doivent pas être recodés automatiquement en TP ou SL d’après le signe du résultat.

La terminologie BE doit préciser si elle signifie « sortie au prix d’entrée » ou « résultat net nul ». Conserver un motif `Non renseigné` pour l’historique ; une suggestion automatique ne doit devenir un fait qu’après confirmation.

### Captures

Afficher les deux phases côte à côte sur ordinateur et l’une après l’autre sur mobile. Indiquer nom, phase, statut d’ajout, miniature et nombre de captures. Permettre de changer une image de phase, de comparer Avant/Après et d’associer une note ou un timeframe.

La phase « Pendant » présente dans certaines maquettes n’est pas acceptée par le schéma actuel. La conserver dans le design suppose une évolution explicite du modèle. Les annotations texte du web ne sont pas toutes affichées par le natif aujourd’hui : préciser les capacités disponibles par support, en préservant les données lors des transferts.

### Complétude et qualification

Ne pas noter automatiquement le trader. Afficher par exemple : « Exécution renseignée · Motif de sortie manquant · Revue à compléter · Captures 1 avant / 0 après ». L’absence d’une image facultative ne doit pas transformer le résultat financier en donnée invalide.

La note de respect du plan doit avoir un critère compréhensible. « Plan respecté » est actuellement déduit d’un score déclaré au moins égal à 8/10 ; il ne s’agit pas d’une vérification automatique de chaque règle du playbook.

## 6. Fonctionnalités à ajouter ou approfondir

### Priorité P1

- Motif de sortie structuré et filtres associés dans le journal, la fiche, les analyses et les exports.
- Brouillon automatique, reprise de saisie et qualification explicite `à revoir / revu`.
- Deux zones de captures visibles et retours d’erreur/progression lisibles.
- Valeurs inconnues distinctes des scores zéro et des valeurs psychologiques par défaut.
- Cible et risque inconnus gérés sans inventer des prix ; disponibilité des indicateurs adaptée aux données.
- Passage du calculateur vers un formulaire prérempli, avec le bon compte et les bonnes spécifications.
- Règles communes d’échantillon et de périmètre dans le cockpit, les rapports, le coach et les objectifs.
- Vue « À compléter » : motifs manquants, revues en attente et données de risque hypothétiques.

### Priorité P2

- **Sorties partielles et entrées multiples** : liste d’exécutions liées à une position, quantités, frais et motifs par sortie ; synthèse éventuellement « TP puis SL ». Un prix moyen seul ne décrit pas ce parcours. Définir ce modèle avant de prendre en charge des exports de fills.
- **Journal de gestion** : déplacement du stop, passage à BE, réduction de taille et clôture anticipée, sans écraser les niveaux initiaux.
- **Vues enregistrées et liens partageables localement** : compte, période, filtres, colonnes et tri. Aujourd’hui l’état de navigation est essentiellement en mémoire React.
- **Confluences personnalisables par setup** : le web propose une liste fixe alors que les stratégies et le natif permettent d’autres descriptions.
- **Analyse par motif de sortie** et par respect du plan, avec effectifs, qualité des données et accès aux trades sources.
- **Actions issues des revues** : transformer une erreur récurrente en règle ou objectif de processus, puis suivre sa répétition sur les prochaines séances.
- **Profil d’import réutilisable** et identifiant d’exécution fourni par la source lorsqu’il existe, pour améliorer les imports successifs après corrections manuelles.
- **Gestion des pièces jointes**, archivage réel, historique de révision et restauration d’une modification.
- **Contexte des réponses du coach** : mémoriser compte, période, filtres et effectif analysés avec chaque réponse ; les anciens messages restent actuellement dans la même conversation lorsque les filtres changent. Le coach local doit reconnaître les instruments configurés, pas seulement sa liste codée en dur.

La connexion directe au courtier, le replay de marché, le partage communautaire et les signaux en direct n’apportent pas la même valeur immédiate que ces améliorations du journal. La synchronisation entre le PC et le téléphone reste un chantier distinct : les bases sont actuellement indépendantes et le transfert JSON est le mécanisme disponible.

## 7. Revue écran par écran

| Écran / parcours | Amélioration recommandée |
| --- | --- |
| Connexion et inscription | Présenter une authentification locale. Retirer les promesses de déchiffrement/OPFS. Ajouter un premier parcours de configuration compte, instrument, fuseau et sauvegarde ; conserver la démo isolée |
| Vue d’ensemble | Séparer clairement performance filtrée et séance d’un compte donné. Prioriser résultat, risque et prochaine action. Ajouter les revues à compléter et définir précisément le drawdown affiché |
| Journal | Ajouter motif de sortie, état de revue, compte et disponibilité des captures. Vues enregistrées, qualification rapide et accès direct aux informations manquantes. Sur mobile, alléger l’en-tête et regrouper les filtres pour faire apparaître les premières exécutions plus tôt |
| Calendrier | Mutualiser les deux présentations existantes, conserver les périmètres mois/séance, totaux hebdomadaires et jours sans trade. Vérifier les petites cases, unités et badges sur les largeurs intermédiaires |
| Fiche trade | Comparaison Avant/Après, motif de sortie à côté du net, niveaux initiaux distincts de la gestion, chronologie des exécutions et statut de revue. Conserver précédent/suivant et retour à la sélection |
| Ajout / modification | Appliquer la structure proposée, les captures visibles, les inconnues, les brouillons et les validations de précision. Ne plus modifier silencieusement des données historiques |
| Import | Corriger le RR supposé, ajouter mapping du motif de sortie, cible inconnue et profil réutilisable. Garder aperçu, doublons et hypothèses explicites ; distinguer positions clôturées et fills à consolider |
| Performance | Corriger l’ordre des résultats, harmoniser l’échantillon et la qualification, afficher la couverture des mesures MFE/MAE. Ajouter les dimensions de sortie lorsque les données existent |
| Leak Finder | Présenter observation, effectif, impact et trades concernés. Éviter les titres affirmatifs sur de petits échantillons ; suivre ensuite si l’action retenue améliore le comportement |
| Coach | Garder la différence local/API et le consentement. Retirer les mentions de chiffrement inventées. Afficher le contexte de chaque analyse et proposer des actions vers une revue, une règle ou un objectif |
| Rapports | Même seuil et même définition des chiffres que les autres vues. Exporter le périmètre et la qualité des données. Remplacer « validation du Edge » par une synthèse d’observations ; inclure des exemples seulement s’ils sont réellement disponibles |
| Plan & revue | Routine adaptable à la stratégie, notes non préjugées, action pour demain reliée à un objectif. Clarifier si le plan est commun aux comptes ou spécifique à un compte/instrument ; ne pas présenter sa validation comme une protection courtier |
| Playbook | Critères d’entrée/invalidation et confluences personnalisées, exemples annotés, accès aux trades et versions des règles. Le renommage propage déjà le nom aux trades et aux plans : cette continuité doit être préservée |
| Objectifs | Ajouter un périmètre de compte, une unité cohérente et des objectifs de processus. Le bouton « Archiver » retire actuellement l’objet après sauvegarde : prévoir un véritable historique d’objectifs archivés ou changer ce libellé |
| Calculateur | Envoyer ses paramètres vers un nouveau trade. Afficher multiplicateur, pas de quantité, frais et limites du compte. Proposer une taille compatible avec ces limites ; expliciter la référence du pourcentage de capital |
| Comptes | Distinguer les règles d’un compte personnel de celles d’un contrat d’évaluation, avec limites facultatives lorsque pertinentes. Avertissements sur taille et budgets, conventions temporelles cohérentes et simulateur compréhensible |
| Paramètres / sauvegardes | Jauge de stockage, rappels de sauvegarde et test de restauration. Préférence de fuseau et données d’instruments plus complètes. Expliquer clairement que « local » ne signifie pas « chiffré » |
| Mobile natif et web mobile | Même vocabulaire métier, mêmes motifs de sortie et mêmes règles de qualification. Saisie d’heure, nombres et choix de compte plus ergonomiques. Refaire la validation Expo et les essais sur appareil avant de déclarer la parité opérationnelle |

## 8. Système de design à stabiliser

Les quatre feuilles importées totalisent environ **8 955 lignes CSS** avant compilation. Elles superposent plusieurs générations de styles. Le code de l’application charge encore Space Grotesk et JetBrains Mono ; les nouvelles polices restent dans les maquettes.

À intégrer dans un système partagé :

- Barlow Condensed pour les titres mesurés, IBM Plex Sans pour l’interface et les chiffres tabulaires ; charger les fichiers localement pour le fonctionnement hors réseau.
- Tokens uniques pour couleurs, espacements, rayons, typographie et états. Réduire les surcharges successives des mêmes boutons, panneaux et dialogues.
- Montants détaillés précis, chiffres alignés, signes visibles et différenciation claire entre résultat R, dollars, points et ticks.
- Contrôles tactiles confortables, champs de notes pleine largeur sur mobile et focus visible.
- Labels courts, aide contextualisée sur risque initial, RR, MFE/MAE et unités ; erreurs placées près du champ avec une action de correction.
- États conçus pour chaque composant critique : vide, chargement, enregistrement, succès, invalide, fichier refusé, stockage saturé, conflit, hors ligne et verrouillage.

Plusieurs de ces états existent déjà dans l’application. Les maquettes doivent les représenter pour éviter une régression au moment de l’intégration. Une maquette remplie avec de bonnes statistiques ne suffit pas à spécifier un formulaire complet.

Preuves : [layout et imports](../apps/web/app/layout.tsx), [styles partagés](../apps/web/app/studio.css), [composants de base](../apps/web/app/ui/kit.tsx).

## 9. Modèle et intégration : changements à prévoir ensemble

La correction du formulaire doit traverser toute la chaîne :

`Interface → validation portable → calculs → document sauvegardé → miroir SQLite → JSON/CSV/imports → journal et analyses → mobile`.

Évolutions proposées à spécifier avant l’implémentation :

- Statut d’exécution et statut de revue séparés.
- Motif de sortie explicite, avec inconnu conservé pour les anciens trades.
- Champs de qualification réellement facultatifs et provenance de la donnée : saisie, import ou hypothèse.
- Stop initial conservé, événements de gestion distincts, puis exécutions partielles si cette capacité est retenue.
- Métadonnées d’instrument : catégorie, multiplicateur, précision, quantité minimale et pas.
- Références de pièces jointes et annotations structurées, tout en conservant la sauvegarde complète.
- Migrations et lecture des sauvegardes existantes : ne pas attribuer rétrospectivement des TP/SL, émotions ou niveaux non documentés.

## 10. Ordre d’amélioration recommandé

### Lot 1 — rétablir la fiabilité

Traiter F01 à F03, la conservation des horodatages, le RR d’import, les frais zéro et le seuil commun des analyses. Faire entrer les contre-exemples dans les tests de non-régression.

**Acceptation** : drawdown 200 $ sur le scénario chevauchant ; résultat quotidien identique entre compte et garde-fou ; changement d’instrument cohérent ; aucun instant modifié par une simple note ; RR supposé annoncé égal au RR réellement enregistré.

### Lot 2 — refaire le parcours d’ajout et de revue

Motif de sortie, inconnues explicites, deux zones d’images, bon compte, brouillon et protection de saisie. Définir les états ouverts/clôturés et la politique du Lock Guard pour les historiques.

**Acceptation** : ajouter et retrouver un BE avec frais, une sortie manuelle gagnante, un SL, deux captures distinctes et une revue encore incomplète ; fermer/réouvrir sans perte ; aucune émotion positive ou note de discipline inventée.

### Lot 3 — brancher le journal et les analyses sur ces données

Colonnes et filtres de sortie, file de revues, contexte du coach, exports cohérents et suivi des actions. Ajouter les sorties partielles après définition et validation de leur modèle.

**Acceptation** : les mêmes filtres, seuils et conventions produisent les mêmes chiffres dans le cockpit, le journal, le rapport et le mobile ; un trade non qualifié n’altère pas les moyennes de discipline.

### Lot 4 — intégrer la direction visuelle à tous les écrans

Corriger les textes de maquettes, intégrer les polices et composants communs, mutualiser les styles puis terminer les états et le responsive de chaque page.

**Acceptation** : aucun texte de capacité non implémentée ; formulaire utilisable au clavier et sur téléphone ; images, erreurs, conflits et données absentes traités proprement ; recette complète sur données de test isolées.

Les sorties partielles, la synchronisation multiappareil et l’archivage de grosses bibliothèques d’images doivent rester des chantiers identifiés, plutôt que des promesses implicites du nouveau design.
