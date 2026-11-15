# EDGE — accès public et nouvelle page de connexion

La page d’accès utilise un lettrage EDGE incliné, une grille de chandeliers en perspective 3D et une courbe animée. Les mouvements sont réalisés en CSS sans moteur WebGL. Le visuel est marqué comme illustratif ; ses données ne représentent pas une cotation. Un contrôle pause/reprise et `prefers-reduced-motion` permettent de réduire les mouvements.

Les formulaires de connexion et d’inscription partagent la même carte : affichage du mot de passe, confirmation du mot de passe à l’inscription, retours d’erreur en français et écran de confirmation distinct. Une inscription en attente de vérification répond HTTP 202 et ne stocke aucun utilisateur ni session dans le navigateur. Le renvoi de confirmation utilise le domaine de production. Les mentions anciennes de serveur SQLite et de compte local ont été retirées des parcours cloud.

L’adresse publique est accessible aux visiteurs sans authentification Vercel. Les données privées restent protégées par la session EDGE et les règles Supabase. La configuration Supabase des URLs et du SMTP est décrite dans `deployment-vercel.md`.

Le test de transport email est simulé pour éviter d’envoyer des messages non sollicités. Les redirections de Supabase ont été vérifiées sur son endpoint réel et les sessions avec un compte synthétique temporaire. L’utilisateur a confirmé l’enregistrement des URLs et du SMTP dans son tableau de bord.
