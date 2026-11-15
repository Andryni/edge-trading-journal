# Architecture finale locale

## Web

Next.js App Router, TypeScript, Tailwind 4, CSS à variables, Framer Motion, Recharts et Zustand. Les assets typographiques Space Grotesk et JetBrains Mono sont intégrés localement. Aucune API de marché ni CDN n’est nécessaire.

Zustand contient l’état actif. Chaque mutation clone et valide le document avec Zod, enregistre la copie IndexedDB par utilisateur, puis signale une écriture en attente. Une boucle et le retour du réseau tentent la synchronisation. Une mutation pendant un envoi n’est pas effacée : la séquence locale permet de conserver son état pending avec la nouvelle révision serveur.

`PUT /api/journal` valide l’origine, la session et le document complet, puis vérifie la révision dans une transaction. `JournalDocument` est la source canonique, notamment pour les annotations, paramètres et dérogations. Les tables relationnelles sont des projections atomiques consultables avec Prisma Studio. Les trades inchangés ne sont pas réécrits. L’approche snapshot est volontaire pour cette version personnelle ; ce n’est pas un protocole de réplication cloud par opérations.

`User` possède `AuthSession` et `JournalDocument`, ainsi que les comptes, setups, confluences, routines, objectifs et messages. Les identifiants des projections sont préfixés par l’utilisateur pour éviter les collisions entre deux sauvegardes importées. Les clés d’import et de confluence sont uniques dans leur périmètre.

Tables : User, AuthSession, JournalDocument, Account, Trade, TradeTag, Setup, Confluence, TradeConfluence, Screenshot, MentalState, SessionPlan, SessionReview, Goal, LockRule, ImportBatch, CoachMessage.

Les images compressées sont stockées en data URL dans le document et la projection Screenshot. Les annotations sont des primitives JSON rendues par SVG ; aucun HTML arbitraire n’est exécuté. Le budget total du journal est borné pour garder les snapshots et sauvegardes transportables. Une future bibliothèque de médias séparée sera préférable pour des centaines de captures haute résolution.

Les captures et les messages ne sont jamais placés dans le cache du service worker. IndexedDB est la copie privée de l’utilisateur sur cet appareil ; elle n’est pas chiffrée par le mot de passe.

## API et authentification

- POST /api/auth : création/connexion locale, scrypt avec sel aléatoire ; sessions de 30 jours.
- GET /api/auth : identité non secrète de la session.
- DELETE /api/auth : révocation du jeton de session et suppression du cookie.
- GET /api/journal : snapshot autorisé de l’utilisateur connecté.
- PUT /api/journal : snapshot validé et contrôle optimiste de révision, réponse 409 sur conflit.
- GET /api/health : disponibilité SQLite sans compte ni statistique personnelle.
- GET /api/coach : état de configuration et nom du fournisseur, sans clé.
- POST /api/coach : question et agrégats bornés, appel HTTPS côté serveur.

Les mutations utilisent un contrôle Origin/Sec-Fetch-Site. Le cookie est HttpOnly, SameSite Strict et Secure sous HTTPS. Les routes privées ne prennent pas de userId fourni par le navigateur : elles utilisent la session. L’anti-bruteforce est local et en mémoire, adapté à une installation personnelle locale, pas une infrastructure publique distribuée.

## Modèle partagé

`packages/core` contient les schémas validés et les fonctions pures de calcul. Le temps est stocké en ISO UTC canonique avec millisecondes. Les saisies locales sont converties avec Temporal ; les transitions DST ambiguës sont refusées. Les analyses de P&L sont regroupées sur la clôture en heure de New York. Les comparaisons de trades après pertes utilisent uniquement des trades déjà clôturés lors de l’entrée.

Les regroupements comportementaux préindexent le compte et les clôtures pour éviter un scan quadratique du journal à chaque trade. Les calculs coûteux du cockpit sont mémorisés et ne dépendent pas du rafraîchissement de l’horloge.

Le modèle garde les réglages d’instrument actuels et les valeurs de tick de chaque trade. Les changements futurs de contrat ne recalculent pas arbitrairement l’historique.

## Expo

Le même modèle et les mêmes calculs sont utilisés dans une interface React Native/Expo Router. Le mobile persiste le document dans sa SQLite WAL, avec requêtes préparées et file d’écritures. Aucun serveur n’est nécessaire pour sa saisie et ses analyses. Les images sont intégrées aux sauvegardes. Le transfert PC/mobile est un export/import JSON volontaire, pas une synchronisation automatique.

Les modules web avancés et les limites mobiles sont détaillés dans le README ; le mobile n’utilise pas Recharts ni le runtime DOM. Son graphique est natif via SVG.

## PostgreSQL et cloud

Le cœur ne dépend pas du provider SQLite. Un passage PostgreSQL demandera une nouvelle histoire de migrations et un transfert validé des données, pas seulement le changement d’une chaîne provider. La synchronisation distante future devra définir les conflits par enregistrement, les médias, la suppression et la rotation des clés ; elle n’est pas activée dans cette livraison locale.
