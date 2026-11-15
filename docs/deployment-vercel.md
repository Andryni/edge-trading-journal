# EDGE — déploiement web

Adresse publiée : **https://edge-tradingjournal.vercel.app**. Le nom `edge-trading-journal.vercel.app` est déjà utilisé par un autre projet. Le domaine gratuit retenu est vérifié dans Vercel et pointe sur le déploiement de production testé `dpl_Biq9auJk6VXuVQhAY2DaweBiYRrc`.

L’adresse de production est publique : aucun compte Vercel n’est demandé aux visiteurs. Les previews et les URLs uniques de déploiement restent protégées par Vercel (`prod_deployment_urls_and_all_previews`). Les API du journal et des captures demandent une session EDGE personnelle.

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

Dans Supabase, **Authentication → URL Configuration** : Site URL = `https://edge-tradingjournal.vercel.app`, Redirect URLs = `https://edge-tradingjournal.vercel.app/auth/confirm`. L’utilisateur a enregistré ces réglages ; les deux destinations ont été vérifiées via l’API de confirmation avec un jeton invalide, sans envoi d’email. Les inscriptions et les renvois de confirmation demandent explicitement l’URL publiée.

La page `/auth/confirm` efface le fragment de tokens et renvoie vers la connexion EDGE avec un état de confirmation ou de lien expiré. Le mot de passe reste nécessaire pour ouvrir une session du journal. Les anciens liens envoyés avant la correction peuvent contenir `localhost` : demander un nouveau message depuis l’écran de connexion.

Le SMTP personnalisé a été configuré par l’utilisateur dans Supabase avec Gmail, après activation d’un mot de passe d’application. Aucun identifiant SMTP n’est enregistré dans ce dépôt. Un service d’envoi dédié pourra remplacer Gmail pour un volume plus important. Garder la confirmation email activée. La livraison réelle en boîte de réception doit être vérifiée par une inscription à une adresse contrôlée par l’utilisateur.

La copie SQLite d’origine et ses sauvegardes restent sur le PC et ne doivent jamais être envoyées à GitHub. Conserver également des exports JSON réguliers du journal cloud. Les 20 révisions précédentes sont accessibles depuis les paramètres.

## Contrôles

Les tests couvrent les calculs métier, TypeScript, l’intégration SQLite sur une base temporaire, l’isolation SQL Supabase et la recette du déploiement. Le rapport hébergé est enregistré dans `docs/deployment-verification.json` lorsqu’une recette complète a réussi.

Le conflit de révision cloud renvoie SQLSTATE `PT409`, mappé en HTTP 409, pour éviter les retries infinis de PostgREST sur le code `40001`. Voir [l’avis Supabase](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

`node scripts/verify-cloud-auth.cjs` vérifie les réponses de connexion/inscription, l’absence de session avant confirmation et les URLs canoniques de retour, avec un transport simulé sans envoi d’email. `docs/auth-verification.json` décrit la recette navigateur : animation et pause, mouvement réduit, formulaires, session réelle, retour de confirmation et mobile.

## Logo

Le logo vectoriel est dans `apps/web/public/brand/edge-logo.svg`, le monogramme dans `edge-mark.svg`. Le favicon SVG et les icônes PNG 180/192/512 px utilisent le même dessin. Ces fichiers sont autonomes et ne nécessitent aucune police externe.
