# EDGE / Trading Intelligence — version locale 1.0

La version web dispose désormais d’un mode cloud Supabase et d’une configuration Vercel. Les instructions locales ci-dessous restent disponibles pour SQLite. Voir [le déploiement et les sauvegardes](docs/deployment-vercel.md) pour la version hébergée.

Journal de trading en français, web Next.js + application native Expo, avec logique métier TypeScript partagée. Le but : rendre visibles les contextes coûteux, la discipline et une action concrète pour la prochaine séance.

## Démarrer sous Windows

Prérequis : Node.js 22 LTS, version 22.12 ou supérieure. Ouvre un terminal dans le dossier extrait `edge-cockpit` :

```sh
npm ci
npm run setup
npm run dev
```

Ouvre **http://localhost:3000**. Ces commandes fonctionnent dans PowerShell, CMD et Git Bash. Aucune commande `Copy-Item` n’est nécessaire : le setup crée le fichier d’environnement et applique les migrations SQLite. Le fichier `DEMARRER-WINDOWS.cmd` effectue également ces trois étapes par double-clic. Garde le terminal ouvert pour utiliser le serveur.

Crée ton compte local avec ton email et un mot de passe d’au moins 10 caractères. Ce n’est pas une inscription à un service externe. Tu peux d’abord explorer la démo de 180 trades dans un espace isolé ; exporte-la avant de te déconnecter si tu veux la conserver. Un compte démo généré automatiquement n’a pas de mot de passe connu de l’utilisateur.

Le journal personnel commence vide. **Paramètres → Charger les 180 trades de démo** et **Commencer un journal vide** proposent une sauvegarde avant remplacement. Aucune donnée de trading réelle n’est fournie dans le projet.

## Utilisation courante

1. Configure les comptes et les limites de ton contrat dans **Comptes**. Les valeurs initiales sont des exemples, pas les règles officielles d’une prop firm.
2. Vérifie les instruments et leurs valeurs de tick dans **Paramètres**. XAUUSD suppose 100 oz par lot au départ ; adapte cette valeur à ton courtier.
3. Documente les règles de tes setups dans **Playbook**.
4. Prépare la date de séance dans **Plan & revue** et valide les six points obligatoires.
5. Saisis un trade avec les prix, le stop initial, la sortie, la taille et les frais. Complète ensuite émotions, confluences, notes et captures si nécessaire.
6. Consulte le calendrier, les analyses et les fuites. Termine la séance par une revue et une action pour demain.
7. Exporte régulièrement une sauvegarde JSON complète, y compris les captures et annotations.

## Fonctionnalités web

- Connexion/inscription locale : mot de passe hashé avec scrypt, sessions aléatoires hachées en base, cookie HttpOnly/SameSite, contrôle d’origine sur les mutations et isolation par utilisateur.
- Saisie, modification et retrait de trades ; sauvegarde téléchargée avant retrait. Calcul du risque, RR prévu, résultat brut/net et R réalisé. Horodatage UTC, saisie dans quatre fuseaux dont New York et Antananarivo ; les heures ambiguës ou inexistantes sont refusées.
- Instruments personnalisables ; les spécifications de tick sont figées par trade. Émotions avant/après, sommeil, énergie, stress, qualité, confluences, tags, notes, bonnes/mauvaises décisions et leçons.
- Galerie avant/après, zoom et annotations flèches/texte. Images réduites à 1600 px et compressées. Maximum 10 captures par trade ; journal synchronisé limité à environ 31,5 Mo.
- Import CSV/TSV/XLSX assisté : colonnes adaptatives, choix du fuseau et du format de date, aperçu, erreurs par ligne et dédoublonnage. Le modèle CSV est téléchargeable.
- Dashboard en R, dollars, win rate, profit factor, espérance, drawdown de clôture, gain/perte moyens, extrêmes, séries et courbe d’équité.
- Filtres de clôture ET, compte, instrument, setup, session et timeframe ; recherche et tri du journal.
- Calendrier mensuel avec jours sans trade, synthèses des semaines, résultat mensuel et détail journalier.
- Analyses par jour/semaine/mois, instrument, session, timeframe, setup et combinaison exacte de confluences ; radar de discipline.
- Leak Finder par état, instrument, session, setup, heure ET, jour, taille, rang du trade, après deux pertes, hausse de taille après perte et après gain ≥ 2R. Matrice émotion × résultat précédent, effectif minimal configurable.
- Analyse d’entrée/sortie sur les données effectivement renseignées : meilleur prix, MFE, MAE et continuation après stop. Pas de déduction inventée du parcours du prix.
- Comptes multiples : objectif, drawdown statique, trailing sur clôtures ou fin de journée, plafond optionnel du seuil, consistance, jours minimum, contrats maximum, budgets restants et simulateur de perte.
- Lock Guard : perte quotidienne, nombre de trades, pertes consécutives et heure de coupure ET. Pause avec compte à rebours ; note obligatoire avant une dérogation temporaire tracée.
- Plans et revues datés ; playbook éditable avec exemples ; objectifs R/USD/discipline et série de séances revues disciplinées.
- Revue automatique des filtres actifs, top trois fuites/forces, action suivante et rapport PDF stylé.
- Coach local sans réseau et coach via API optionnelle, avec clé côté serveur et consentement à l’envoi des agrégats.
- Rejeu **documentaire** : contexte, émotions, entrée, gestion, sortie et captures ; ce n’est pas un moteur de replay des bougies ou du carnet.
- JSON complet sauvegardable/restaurable, CSV filtré ou complet, migration des JSON de la fondation v1, historique des imports et dérogations.

## Persistance et fonctionnement hors ligne

Le serveur stocke un document SQLite versionné et maintient les tables relationnelles dans une même transaction. Une écriture basée sur une ancienne révision est refusée. En cas de conflit entre deux onglets, tu choisis explicitement la copie à conserver, avec export de la copie remplacée.

Le navigateur conserve son journal par utilisateur dans **IndexedDB**. Les changements sont immédiatement enregistrés localement, puis synchronisés vers SQLite quand le serveur est disponible. Le statut indique l’état réel. Les API privées ne sont jamais mises en cache par le service worker.

L’installation initiale nécessite Internet. Ensuite, avec le serveur local ouvert, l’utilisation normale ne demande aucune connexion Internet. Pour disposer du cache de navigation après arrêt du serveur, utilise le **build de production** et visite préalablement les écrans :

```sh
npm run build
npm start
```

Le service worker est activé uniquement en production. Son cache est rempli au fil des visites : les fonctions ou assets jamais chargés ne sont pas garantis disponibles hors ligne. La première connexion d’un nouvel utilisateur nécessite le serveur local. L’accès hors ligne réutilise la dernière copie autorisée sur cet appareil ; le mot de passe ne chiffre pas IndexedDB. Protège ton compte Windows et ton appareil. Les bases et sauvegardes ne sont pas chiffrées automatiquement.

Les deux comptes d’une même installation sont isolés côté serveur. Le projet est destiné à un usage personnel local, pas à un hébergement Internet multi-tenant audité. Le serveur écoute sur `127.0.0.1` par défaut. Aucune synchronisation cloud ni connexion au courtier n’est configurée.

## Importer tes exports réels

Dans **Import**, choisis un export de **positions clôturées**, puis vérifie le mapping. Les profils MT5, TradingView, NinjaTrader, Tradovate/Rithmic et ATAS reposent sur les noms de colonnes courants ; ils ne constituent pas une certification de tous leurs formats. Ces exports varient selon version, langue et compte.

Champs indispensables : date/heure d’entrée, instrument, direction, prix d’entrée/sortie et quantité. Les ticks doivent être configurés. Les symboles de contrats futures courants (ex. NQZ6) sont rapprochés du contrat de base.

Un export de fills, d’ordres ouverts ou de sorties partielles doit d’abord être agrégé en trades ; l’application ne reconstruit pas arbitrairement des positions. Un P&L fourni seul ne permet pas de retrouver les prix. Les frais de la colonne choisie doivent contenir tous les frais pertinents ; combine commission, frais et swap en amont si le fichier les sépare.

Si les stops sont absents, tu peux saisir une **hypothèse explicite** de distance. Ces trades reçoivent le tag `R hypothétique` et peuvent être exclus des analyses. Les objectifs et dates de sortie manquants génèrent également un avertissement. Les émotions et scores non fournis sont marqués à qualifier ; le score de discipline du cockpit exclut ces scores non renseignés jusqu’à édition.

## Coach distant facultatif

Le coach local fonctionne sans clé. Pour l’API distante, crée `apps/web/.env.local` à partir de `apps/web/.env.example`, puis renseigne :

```dotenv
COACH_API_KEY="ta_cle"
COACH_MODEL="identifiant_du_modele_disponible_chez_ton_fournisseur"
COACH_API_URL="https://api.openai.com/v1/chat/completions"
```

Relance Next.js. Le format attendu est compatible avec **Chat Completions** (`model`, `messages`, `choices[0].message.content`). Le fournisseur et le modèle doivent être disponibles pour ta clé. Aucun appel payant réel n’a été effectué lors des tests, faute de clé fournie. Le mode local n’est pas présenté comme un LLM.

Dans le web, active le mode API et le consentement. Seuls ta question et les statistiques agrégées filtrées sont envoyées ; pas d’email, captures, notes brutes ni secrets. Les clés ne doivent jamais être nommées `NEXT_PUBLIC_*`.

## Mobile natif Expo

Depuis le dossier racine, installe d’abord le web/cœur avec `npm ci`, puis :

```sh
cd apps/mobile
npm ci
npm start
```

Lance sur un émulateur Android ou un appareil compatible Expo SDK 54. `npm run android` utilise un émulateur Android configuré. Aucun APK signé n’est livré : la livraison contient les sources Expo compilables.

Le mobile est **autonome**, avec sa propre SQLite : cockpit, saisie/édition/retrait, journal, filtres, courbe et analyses par contexte, calendrier des séances, fuites, règles de comptes et dérogations de discipline, plan/revue, setups, objectifs, coach local, calculateur, captures et traits d’annotation, sauvegarde/restauration JSON et import CSV reconnu automatiquement.

Différences assumées : l’édition avancée du mapping XLSX, le PDF, la matrice comportementale détaillée, les annotations texte et le coach API sont disponibles sur le web. Sur mobile, utilise un CSV avec stops/objectifs réels ou le JSON portable du web. La galerie native permet les traits d’annotation ; le web ajoute flèches et texte. La base du téléphone et celle du PC sont indépendantes, transférables par JSON ; pas de sync automatique. Le mobile utilise le verrouillage de l’appareil, pas le formulaire de connexion du serveur web.

Le TypeScript mobile et le bundle Android ont été vérifiés. Les interactions sur appareil et la compilation iOS n’ont pas pu être testées ici.

## Calculs et limites d’interprétation

- Risque initial hors frais = distance entrée-stop × valeur du point × taille.
- Résultat net = variation signée × valeur du point × taille − frais.
- R réalisé = résultat net / risque initial. Une perte peut dépasser −1R à cause des frais.
- RR prévu est hors frais ; le calculateur peut ajouter des frais estimés par contrat/lot.
- Le résultat journalier utilise le jour de **clôture New York**. Les rangs d’entrée et le nombre de saisies utilisent leur journée d’entrée.
- Le drawdown est calculé sur l’équité clôturée. Le trailing EOD ne remonte qu’à partir des journées ET terminées. Un trailing intratrade demande un flux externe et n’est pas simulé comme si les données existaient.
- Consistance = meilleur jour positif / profit total positif. Si le profit total ≤ 0, le ratio est non calculable.
- Les regroupements se chevauchent. Ne les additionne pas. Le seuil d’effectif aide la lecture mais n’établit pas une causalité, une significativité ou une rentabilité future.
- Le percentile de MAE est descriptif et exige au moins 30 gagnants renseignés. Il ne démontre pas un stop optimal. Valide toute modification hors échantillon.
- Lock Guard bloque la **saisie de nouvelles exécutions** dans EDGE, pas tes ordres chez le courtier. Les imports historiques et les corrections de trades existants restent possibles pour documenter les erreurs.
- Les prix utilisent des nombres flottants JavaScript ; la version ne constitue pas un moteur comptable certifié. Les données fournies sont synthétiques.

## Vérification et maintenance

```sh
npm run check
npm run build
npm run db:studio
```

`npm run check` exécute les tests métier, TypeScript web et les tests d’intégration sur une **base temporaire isolée**. `GET /api/health` vérifie la disponibilité SQLite sans révéler de données utilisateur.

Pour le mobile : `npm run typecheck` puis `npx expo export --platform android` depuis `apps/mobile`.

`npm run setup` applique les migrations existantes sans effacer les données. Pour modifier le schéma en développement : `npm run db:migrate -- --name nom_de_la_migration`. Sauvegarde toujours ton journal avant mise à jour du programme.

## Arborescence principale

```text
apps/web/app/ui/         écrans et composants du cockpit
apps/web/app/api/        auth, journal, santé et coach
apps/web/lib/           synchronisation IndexedDB, repository SQLite, fichiers
apps/web/public/        manifeste, icône et service worker
apps/mobile/app/        application native Expo Router
packages/core/src/      modèle validé, calculs, comptes, discipline, imports, coach
prisma/                 schéma, migrations et seed historique de démonstration
scripts/                setup, lancement et test d’intégration
examples/               exemples CSV/XLSX d’import synthétiques
docs/                   architecture, design et validation
```

Les dépendances lourdes, bases de travail, secrets et fichiers de session ne sont pas inclus dans l’archive. Les lockfiles web et mobile sont fournis. Prisma 6.19 reste épinglé ; une migration de version majeure ou PostgreSQL doit faire l’objet de migrations et d’une copie de données vérifiées.
