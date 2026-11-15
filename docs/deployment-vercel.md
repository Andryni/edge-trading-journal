# EDGE — déploiement web

Adresse publiée : **https://edge-tradingjournal.vercel.app**. Le nom `edge-trading-journal.vercel.app` est déjà utilisé par un autre projet. Le domaine gratuit retenu est vérifié dans Vercel et pointe sur le déploiement de production testé `dpl_CrW4rvQ91ZhSGyCbEuRxPSCXV7BK`.

La protection Vercel existante est conservée : une connexion au compte Vercel autorisé peut être demandée avant l’écran de connexion EDGE. Les API du journal et des captures demandent ensuite une session EDGE personnelle.

Dépôt des sources : **https://github.com/Andryni/edge-trading-journal** (privé).

Le web utilise Supabase Auth, un journal privé versionné et le bucket privé `edge-captures`. Le mode SQLite reste disponible lorsque les variables Supabase sont absentes. L’application Expo conserve son stockage autonome.

## Configuration Vercel

- Projet : `edge-cockpit`, équipe `andrys-projects-10d15f93`.
- Root Directory : `apps/web`, avec les sources hors de ce répertoire activées.
- Node.js : `24.x`.
- Les commandes d’installation et de build sont dans `apps/web/vercel.json`. L’installation inclut explicitement la racine du monorepo pour disposer de Prisma.
- Variables serveur, en production et preview : `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`. Ne jamais fournir de clé Supabase service-role au navigateur. Le client Prisma est généré pour conserver le mode local ; le journal hébergé utilise Supabase.
- Le build télécharge les polices et les héberge avec le site.
- Les sources peuvent être envoyées par Git ou par `scripts/package-vercel.cjs`, qui utilise une liste explicite de dossiers et exclut les données, secrets et caches.

## Publication

Construire une version de production sans lui affecter les domaines, la tester à son URL unique, puis promouvoir ce même déploiement. Conserver les protections Vercel ; les liens temporaires de recette doivent être révoqués après usage.

## Compte et historique

Créer un compte Supabase avec l’adresse utilisée pour le journal personnel local, confirmer l’email, puis se connecter. Le mot de passe local n’est pas transféré. Le journal personnel préparé est récupéré uniquement pour cette adresse confirmée, si le journal cloud n’existe pas déjà. Le journal de démonstration reste distinct.

Dans Supabase, vérifier **Authentication → URL Configuration** : Site URL et Redirect URLs doivent correspondre à l’adresse publiée. Le connecteur Supabase de cette session ne permet pas de lire ni modifier ce réglage ; la validation de la redirection du mail reste à effectuer dans le tableau de bord. Après confirmation de l’adresse, revenir sur le site et se connecter.

La copie SQLite d’origine et ses sauvegardes restent sur le PC et ne doivent jamais être envoyées à GitHub. Conserver également des exports JSON réguliers du journal cloud. Les 20 révisions précédentes sont accessibles depuis les paramètres.

## Contrôles

Les tests couvrent les calculs métier, TypeScript, l’intégration SQLite sur une base temporaire, l’isolation SQL Supabase et la recette du déploiement. Le rapport hébergé est enregistré dans `docs/deployment-verification.json` lorsqu’une recette complète a réussi.

Le conflit de révision cloud renvoie SQLSTATE `PT409`, mappé en HTTP 409, pour éviter les retries infinis de PostgREST sur le code `40001`. Voir [l’avis Supabase](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

## Logo

Le logo vectoriel est dans `apps/web/public/brand/edge-logo.svg`, le monogramme dans `edge-mark.svg`. Le favicon SVG et les icônes PNG 180/192/512 px utilisent le même dessin. Ces fichiers sont autonomes et ne nécessitent aucune police externe.
