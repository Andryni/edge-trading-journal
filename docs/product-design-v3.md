# EDGE — système produit et parcours de revue

Ordre autorisé : cockpit, journal, fiche trade, puis déclinaison sur les autres écrans.

La signature reste le risque, les résultats en R et le respect du plan. Fond #0A0A12, panneaux #12121C, accent violet/indigo, gains verts et pertes corail signés. Les chiffres restent en JetBrains Mono ; le texte utilise les polices du poste. Les bordures, espacements, onglets, filtres, statuts et états vides deviennent des composants partagés.

1. Cockpit : séance en pleine largeur ; quatre KPI ; équité dominante et prochaine action ; graphiques de répartition et de rythme comme analyses secondaires. Les points/jours/segments mènent à une sélection explicite du journal, avec une alternative au clavier.
2. Journal : vues exécutions, séances et semaines ; recherche, filtres de résultat et de respect du plan ; résumé de la sélection ; colonnes choisies ; exports de la sélection affichée. Le retour conserve les filtres, la recherche et le défilement de l’origine.
3. Fiche trade : navigation précédente/suivante dans la sélection ; exécution, contexte/notes et captures ; niveaux de prix réellement renseignés ; actions de modification et suppression existantes conservées. Aucun faux graphique de marché ni fausse série de prix.
4. Autres écrans : mêmes entêtes, statistiques, tableaux, formulaires et actions ; ouverture d’une analyse dans le journal quand sa sélection est définie par les données existantes.

La navigation et les préférences d’affichage restent dans l’état de l’interface. Les calculs utilisent les fonctions existantes de @edge/core. Les API, schémas, règles de risque et données persistées ne changent pas. Les vérifications navigateur comparent la révision et le contenu du journal avant et après.

Sources de conception déjà consultées : frontend-design (Anthropic), règles générales UI UX Pro Max, Web Interface Guidelines (Vercel). Aucun skill supplémentaire installé ; 21st.dev reste non connecté. Les réglages réseau du terminal n’autorisent pas leur installation automatique.

## Reprise et validation du 14 novembre 2026

La passe interrompue a été reprise sur les sources déjà présentes. Les retouches finales rendent l’action « Plan et revue » accessible sur mobile, alignent les séparateurs des statistiques de la fiche et passent les statistiques du journal sur deux colonnes dès la largeur tablette. Le tableau du journal défile dans son propre cadre : ses marges et le contexte de positionnement des libellés réservés aux lecteurs d’écran n’agrandissent plus la page.

Vérifications effectuées sous Windows, avec Node.js 26.13.1 :

- 53 tests métier et de sélection d’interface réussis ; TypeScript et build Next.js de production réussis.
- Scénario SQLite existant réussi sur une base temporaire : création, modification, captures, routines, objectifs, suppression, isolation des utilisateurs et conflit de révision. Le lancement direct par `tsx` échoue dans ce terminal restreint sur `os.userInfo()` (`uv_os_get_passwd`, ENOMEM) ; le même scénario a été exécuté avec un lanceur Vitest temporaire, supprimé après vérification.
- Sept parcours navigateur réussis : sélection exacte depuis un setup ou une barre de pertes, période et compte conservés au retour, recherche et tri, choix des colonnes, regroupements jour/semaine, navigation de fiche et annulation de l’éditeur ou du retrait, export CSV.
- Le contrôle CSV compare les 60 trades NQ filtrés, leur ordre, dates et notes, même lorsque seuls 50 trades sont initialement rendus. La pagination est vérifiée séparément. Le CSV est analysé comme CSV, sans compter arbitrairement les retours à la ligne.
- Les 14 écrans ont été ouverts à 1440, 768, 390 et 360 px : aucun débordement horizontal de page. Les onglets de fiche, les actions visibles et l’état de recherche vide ont été vérifiés à chaque largeur. Des captures du cockpit, du journal, des analyses, du calendrier et de la fiche ont été produites ; les rendus du cockpit et de la fiche ont été inspectés visuellement.
- Aucun appel de mutation de `/api/journal` ni erreur JavaScript pendant ces parcours. Le document complet et sa révision ont été comparés avant et après : identiques. Les connexions de recette utilisent uniquement le compte démo existant.

Rapports et captures de travail : `tmp/product-review-v3/flows.json`, `tmp/product-review-v3/responsive.json`, `tmp/product-review-v3/*.png`. Les scripts de navigateur dans `tmp/` utilisent le Playwright déjà installé dans `D:/Documents/GEX` ; ils ne constituent pas une nouvelle dépendance du projet. Ces contrôles ne remplacent pas une recette exhaustive de tous les formulaires ni des essais sur téléphone physique. Le périmètre de cette reprise reste local, sans publication.
