# EDGE — descriptions des maquettes Stitch

Descriptions produites par Stitch pour des exemples de démonstration. Elles décrivent des maquettes et ne constituent pas une validation fonctionnelle du logiciel. Les versions retenues et leurs identifiants figurent dans `stitch-screens.json`.

## Vue d’ensemble

Voici l'écran canonique et complet **« Vue d’ensemble / Cockpit »** pour **EDGE / Trading Intelligence**, réalisé en pleine conformité avec la direction visuelle éditoriale graphite inspirée de Vela et TraderWaves :

### Synthèse des choix de conception & raffinements apportés :
1. **Identité sobre & Direction typographique éditoriale :**
   - **Marque :** Signature minimale `EDGE /` seule (sans descripteur « TERMINAL » ou « PRO » superflu) accompagnée de son contexte discret *« Espace personnel · Démonstration »*.
   - **Polices & Casse :** Remplacement des majuscules agressives par des en-têtes apaisés en casse normale avec **Barlow Condensed 600** (32 px pour le titre de page, 20–22 px pour les panneaux). Tous les corps de texte, étiquettes, contrôles et métriques chiffrées utilisent les chiffres tabulaires précis d’**IBM Plex Sans** avec virgule décimale française.
   - Suppression totale de toute esthétique monospace de type terminal au profit d’un alignement tabulaire financier strict.

2. **Palette & Contraste graphite :**
   - Fond graphite profond (`#0D1117`), barre latérale (`#0B0F14`), panneaux surélevés ardoise (`#151B23`) délimités par des filets subtils de 1 px (`#1E2833`) et un rayon de courbure sobre (12 px).
   - Accents interactifs en cyan retenu (`#92D6E0`), vert net pour les gains (`#6BD6A9`) et corail d'invalidation pour les pertes (`#F29396`).

3. **Bandeau KPI compact (hauteur contenue < 120 px) :**
   - **Performance nette :** `+106,78 R` (`+21 356,00 $`) avec sparkline continue en cyan.
   - **Espérance mathématique :** `+0,59 R` par trade clôturé.
   - **Taux de réussite :** `52,8 %` avec anneau de proportion calibré (95 gains / 85 pertes sur 180 trades).
   - **Facteur de profit & Moyennes :** `2,23` avec barre split horizontale comparative (+2,04 R / -1,02 R à ratio 2:1), nettoyée de toute mention de seuil critique inventé.
   - **Drawdown maximal historique :** `-1 858 $` (-3,7 % de l'équité crête).

4. **Agencement central 2/3 + 1/3 :**
   - **Courbe d’équité cumulée :** Évolution nette sur 180 trades clôturés avec ligne de repère zéro R et bascule R-Multiple / Devise ($).
   - **Radar de discipline par setup :** Évaluation sur 10 basée sur les exécutions effectives du journal (Pullback VWAP 9,2/10, Breakout 8,8/10, Sweep 8,5/10, Rejet 7,8/10, Fakeout 7,4/10).

5. **Histogramme des résultats journaliers & Drawdown :**
   - Histogramme des 20 dernières séances clôturées en R avec séparation claire des séances positives et négatives.
   - Graphique continu de profondeur sous l'eau affichant le creux historique (-3,7 %) et le retour au sommet.

6. **Calendrier de novembre 2026 & Rigueur mathématique :**
   - Grille complète en 8 colonnes (Lundi à Dimanche + Total sem.), débutant avec le dimanche 1er novembre et incluant le lundi 30 novembre.
   - **Semaine 45 :** 2 nov. (+1,40 R, 2 tr.), 3 nov. (+2,10 R, 3 tr.), 4 nov. (-0,80 R, 1 tr.), 5 nov. (+0,60 R, 2 tr.), 6 nov. (+1,80 R, 3 tr.) $\rightarrow$ **+5,10 R (11 trades)**.
   - **Semaine 46 :** 9 nov. (+3,10 R, 4 tr.), 10 nov. (-1,20 R, 2 tr.), 11 nov. (+2,40 R, 3 tr.), 12 nov. (-0,30 R, 1 tr.), 13 nov. (+2,88 R, 3 tr.) $\rightarrow$ **+6,88 R (13 trades)**.
   - **Bandeau de synthèse :** Total exact de `+11,98 R (+2 396 $)` pour `24 trades` et `10 sessions actives`.
   - La case du 13 novembre comporte un badge sobre **« Sélection »** et la valeur `+2,88 R` sur une seule ligne.

7. **Séance sélectionnée & Télémétrie de risque :**
   - Cadre distinct identifié **« Compte démo 50K · 13 nov. 2026 »** : P&L net `+2,88 R (+576,00 $)`, 3 exécutions réelles détaillées (ES +1,82 R / +364 $, NQ -1,00 R / -200 $, CL +2,06 R / +412 $) et bouton **« Ouvrir dans le journal → »**.
   - Télémétrie de risque : Budget restant `1 576 $` (1 000 $ autorisés + 576 $ de gains), marge de drawdown `1 860 $`, 2 trades restants sur 5, préparation 6/6 validée.
   - Statut **Lock Guard** explicité comme verrou de saisie dans le journal (pause obligatoire de 15 min après 2 pertes consécutives), sans aucune interaction courtier ni exécution d'ordres.
   - Pied de page neutre : *« Résultats clôturés · Données de démonstration · EDGE Trading Intelligence »*.

## Journal

Voici la refonte de l'écran **Journal** pour **EDGE / Trading Intelligence**, conçue dans la direction visuelle éditoriale graphite avec la typographie **Barlow Condensed** pour les titres et **IBM Plex Sans** pour l'ensemble des données tabulaires et contrôles :

### Caractéristiques de l'écran :
1. **Structure de navigation & App Shell (1440px)** :
   - Barre latérale fixe (216px) reprenant l'identité « EDGE / », le contexte d'espace démonstration, les 5 destinations principales avec l'onglet **Journal** actif, et le statut de synchronisation locale en pied de page.
   - En-tête avec fil d'Ariane *EDGE / Journal / Journal*, badge de données de démonstration, heure des clôtures New York et sous-onglets de section (*Journal*, *Calendrier*, *Import*).

2. **Barre d'outils et filtres d'échantillon** :
   - Sélectionneur de compte, filtre de période (« Tout (180 trades) »), barre de recherche contextuelle, filtres de résultat et respect du plan, et bascule de regroupement (*Trades*, *Jours*, *Semaines*).
   - Bandeau récapitulatif compact : 180 trades clôturés, P&L net (+106,78 R / +21 356 $), taux de réussite 52,8 % (95W / 85L) et Profit Factor (2,23).

3. **Tableau des exécutions (ratio 2/3)** :
   - Grille dense et lisible avec en-têtes triables : Horodatage (ET), Instrument & Direction (ex. NQ Long, ES Short), Setup, Séance, P&L (R), P&L ($) et Note de plan sur 10.
   - Ligne active mise en exergue correspondant au trade NQ Long du 13/11/2026 (+1,82 R / +364 $, 9/10).
   - Alternance réaliste de trades gagnants et perdants signés avec pagination complète en bas de tableau.

4. **Inspecteur de trade contextuel (ratio 1/3)** :
   - En-tête d'exécution avec référence (#TR-180) et statut clôturé.
   - Aperçu miniature du graphique d'exécution (M5) avec matérialisation des niveaux d'entrée, stop et sortie (TP).
   - Bloc de métriques d'exécution détaillées (cours d'entrée/sortie, stop initial en points et en R, risque engagé, durée, frais).
   - Section psychologie et conformité au plan (score 9/10, état émotionnel « Calme & discipliné », biais pré-séance) et actions d'ouverture de fiche complète.

## Calendrier

Voici la version finalisée et complète de la page **« Journal / Calendrier »** (Journal / Calendrier — EDGE Trading Intelligence) pour **EDGE / Trading Intelligence**, conçue selon la direction de référence éditoriale graphite (Vela / TraderWaves) et les spécifications exactes :

### Décisions de design & agencement :

1. **Typographie & Système éditorial :**
   - Titre sobre en casse normale **« Calendrier »** et sous-titre **« Le résultat de chaque séance. Distribution des P&L et métriques de discipline journalière. »** en **Barlow Condensed** (poids 600) et **IBM Plex Sans**.
   - Remplacement de tout résidu de police terminal/monospacée artificielle par des **chiffres tabulaires IBM Plex Sans** (`tabular-nums`) garantissant un alignement vertical strict pour tous les montants et multiples R.
   - Formatage décimal français scrupuleux (`+2,88 R`, `+11,98 R`, `+576,00 $`, virgules décimales).

2. **Structure 2/3 + 1/3 parfaitement équilibrée :**
   - **Navigation & En-tête :** Barre latérale fixe 216 px avec l'onglet **Journal** actif, sous-onglets supérieurs (*Journal*, *Calendrier* actif avec soulignement cyan, *Import*), et badge clair *« Données de démonstration »*.
   - **Bandeau de synthèse mensuelle (Novembre 2026) :**
     - P&L Net Mois : **+11,98 R (+2 396,00 $)**
     - Volume : **24 exécutions**
     - Séances actives : **10 / 21 jours ouvrés**
     - Taux de gain : **62,5 %** (15W · 9L)
     - Discipline plan : **8,4 / 10 (Rigoureuse)**

3. **Grille de calendrier de Novembre 2026 (2/3 de l'espace) :**
   - 8 colonnes ordonnées du **Lundi au Dimanche** plus **Total sem.**, avec cellules d'une largeur supérieure à 90 px sans débordement.
   - Le **1er novembre** commence un dimanche (*Sans clôture / Repos*).
   - **Semaine 45 :** Lun 2 (+1,40 R, 2 tr.), Mar 3 (+2,10 R, 3 tr.), Mer 4 (-0,80 R, 1 tr.), Jeu 5 (+0,60 R, 2 tr.), Ven 6 (+1,80 R, 3 tr.) $\rightarrow$ **Total S45 : +5,10 R (11 trades, 81 % win)**.
   - **Semaine 46 :** Lun 9 (+3,10 R, 4 tr.), Mar 10 (-1,20 R, 2 tr.), Mer 11 (+2,40 R, 3 tr.), Jeu 12 (-0,30 R, 1 tr.), Ven 13 (+2,88 R, 3 tr.) $\rightarrow$ **Total S46 : +6,88 R (13 trades, 69 % win)**.
   - **Jour 13 sélectionné :** Encadrement cyan fin distinctif avec badge intégré **« Sélection »** calibré à l'intérieur de la cellule et la valeur `+2,88 R` tenant sur une seule ligne.
   - Jours futurs (16 au 30 novembre, avec le 30 inclus) neutres et sans faux gains à zéro.
   - Légende explicative normalisée en pied de grille : séances positives (+R), négatives (-R) et rappel de l'unité $1R = 200,00\text{ USD}$.

4. **Panneau latéral de drilldown (1/3 de l'espace) :**
   - **Vendredi 13 nov. 2026** : P&L net **+576,00 $ (+2,88 R)**, Taux de réussite **66,7 %** (2W · 1L), Score plan **8,7 / 10**.
   - Liste détaillée des 3 exécutions réelles :
     1. **ES LONG** · Rejet VWAP 5m · **+1,82 R (+364,00 $)** · Plan : 9/10
     2. **NQ SHORT** · Cassure range pré-marché · **-1,00 R (-200,00 $)** · Plan : 8/10
     3. **CL LONG** · Rebond support majeur · **+2,06 R (+412,00 $)** · Plan : 9/10
   - Encadré de débriefing qualitatif et psychologique.
   - Bouton d'action principal cyan **« Ouvrir dans le journal → »**.
   - Mention de sécurité discrète : *« Données consolidées avec le journal · Lock Guard OK »*.

## Import

L’écran **« Journal / Importation des trades »** pour **EDGE / Trading Intelligence** a été généré conformément au cahier des charges et à la charte éditoriale graphite :

### Points clés de la réalisation :
1. **Shell & Navigation contextuelle :**
   - Barre latérale de 216 px (`#0B0F14`) avec le logo `EDGE /`, le contexte *Espace personnel · Démonstration*, et l'onglet actif **Journal**.
   - Sous-onglets de section : `Journal`, `Calendrier` et **`Import`** (actif avec pastille d'accent).
   - En-tête avec fil d'Ariane, statut *Synchronisé en local*, heure de New York et badge *Données de démonstration*.

2. **Progression du workflow d'importation (Stepper) :**
   - Étapes 1 (*Fichier*) et 2 (*Colonnes*) validées avec indicateurs discrets.
   - Étape 3 (**Vérification**) active, mise en exergue avec le cyan `#92D6E0`.

3. **Paramétrage source, compte & mapping :**
   - Fichier source identifié (`positions-cloturees.csv`, encodage UTF-8) avec bouton d'alternance compact *Changer*.
   - Compte de destination assigné (*Compte démo 50K USD*), fuseau `America/New_York` et format `JJ/MM/AAAA`.
   - Cartouche de mapping des 9 champs critiques (Entrée, Sortie, Instrument, Sens, Prix In/Out, Frais, Stop).
   - Encadré informatif sur les stops manquants, appliquant une hypothèse de distance ATR (1R théorique) avec marquage explicite `[R hypothétique]`, sans génération silencieuse de données.

4. **Tableau d'inspection & Validation en ligne :**
   - Barre de synthèse : **120 lignes analysées** · **112 valides** (vert `#6BD6A9`), **5 doublons détectés** (ambre), **3 erreurs bloquantes** (corail `#F29396`).
   - Onglets de filtrage rapide avec compteur : *Toutes (120)*, *Erreurs bloquantes (3)* (actif), *Doublons (5)*, *Valides (112)*.
   - Lignes d'erreurs avec cause explicite et action corrective ciblée :
     - *Ligne #14 :* « Date calendaire invalide (31 fév.) » → Action *Corriger*.
     - *Ligne #47 :* « Instrument non répertorié » (`MNQZ26`) → Action *Associer à NQ*.
     - *Ligne #88 :* « Quantité manquante ou nulle » → Action *Saisir qté*.
   - Gestion des doublons avec tickets d'exécution existants et case à cocher *Ignorer*.

5. **Actions d'engagement & Historique local :**
   - Boutons de pied de page : *Retour aux colonnes*, *Télécharger le rapport d'erreurs (.csv)* et action primaire cyan contrastée **« Importer les 112 trades valides → »**.
   - Module inférieur retraçant les 3 derniers imports sur le poste local (NinjaTrader, Tradovate, Interactive Brokers) sans dépendance cloud ni broker tiers.

6. **Typographie & Rendu éditorial :**
   - Respect strict du binôme **Barlow Condensed** (titres de panneaux, labels d'étapes) et **IBM Plex Sans** (chiffres tabulaires, textes d'interface et données de marché).

## Performance

L’écran **Analyses / Performance** d’EDGE Trading Intelligence a été conçu dans le strict respect de la charte graphite éditoriale et des spécifications fonctionnelles :

### Structure & Éléments clés de la réalisation :
1. **Navigation de section & Contexte :**
   - Onglet **« Performance »** actif, avec ses sous-sections adjacentes (*Leak Finder*, *Coach*, *Rapports*).
   - Barre de contexte avec le compte démo 50K (USD), filtre temporel calibré sur l'ensemble de l'historique clôturé (*Tout — 180 trades*), et mention du fuseau de clôture New York.
   - Badge discret *« Données de démonstration »* et bouton d’export de rapport.

2. **Bandeau de KPIs financiers (Chiffres tabulaires IBM Plex Sans) :**
   - **Drawdown maximal** : `-1 858 $` (-3,7 % de l'équité maximale).
   - **Gain / Perte moyens** : `+2,04 R / -1,02 R` avec jauge de ratio bicolore 2:1 réel.
   - **Extrêmes (R)** : `+4,20 R` (max win) / `-1,56 R` (max loss).
   - **Séries consécutives** : `7 gains` consécutifs / `4 pertes`.
   - **Espérance nette** : `+0,59 R` par trade sur 180 trades (+106,78 R cumulés).

3. **Commutateur de dimensions & Analyses visuelles :**
   - Sélecteur de granularité segmenté : `Setup` (actif), `Instrument`, `Session`, `Timeframe`, `Jour`, `Semaine`, `Mois`, `Confluences`.
   - **Histogramme horizontal bicolore** : répartition des gains (+R en vert `#6BD6A9`) et pertes (-R en corail `#F29396`) par configuration, avec effectifs et base 0R.
   - **Radar & notation de discipline par setup** : respect réel du plan d'exécution noté sur 10 (de 9,2/10 pour Pullback VWAP 5m à 7,4/10 pour Fakeout Resistance).

4. **Tableau exhaustif de contexte & espérance :**
   - Analyse par configuration : effectif, espérance en R/tr, taux de réussite W/L, facteur de profit, indice de lecture et action de drilldown `Voir les trades →`.
   - Signalement visuel rigoureux des tailles d’échantillon : avertissement *« Échantillon limité (< 20 trades) »* pour Continuation Trend (14 trades) et Rebond MM (8 trades), distingué des configurations à échantillon robuste.

5. **Section basse : Entrées, stops et sorties (MFE / MAE) :**
   - **Maximum Favorable Excursion (MFE)** : `+2,94 R` moyen, potentiel capturé à 69,4 %.
   - **Maximum Adverse Excursion (MAE)** : `-0,68 R` moyen avant reprise vers l'objectif.
   - **Continuation après stop** : `18,3 %` des stops touchés ayant ensuite rejoint le TP théorique (13 occurrences sur 71 pertes analysées).
   - **Qualité de saisie** : `38 trades sur 180 : Non renseigné` (absence de relevé intra-trade complet).
   - Note méthodologique descriptive rappelant l'absence totale d'interpolation prédictive.

6. **Typographie & Finitions :**
   - Titres et en-têtes en **Barlow Condensed** (poids 600, casse normale sobre).
   - Corps, tableaux et valeurs numériques en **IBM Plex Sans** avec alignement tabulaire rigoureux.
   - Respect absolu de la palette graphite (`#0D1117`, `#0B0F14`, `#151B23`, `#1E2833`) et des accents cyan (`#92D6E0`).

## Leak Finder

L'écran **Analyses / Leak Finder** pour **EDGE Trading Intelligence** est finalisé, conformément au cahier des charges éditorial et analytique :

### Éléments et structure de l'interface :
1. **Shell applicatif & Navigation :**
   - Barre latérale desktop 216 px respectant les 5 destinations primaires (*Vue d’ensemble*, *Journal*, *Analyses* [actif], *Préparation*, *Comptes*) avec contexte utilisateur « *Espace personnel · Démonstration* » et statut de synchronisation locale.
   - Sous-onglets de la section *Analyses* : *Performance*, *Leak Finder* (sélectionné), *Coach*, *Rapports*.
   - Barre de filtres contextuels partagés : Compte démo 50K (USD), échantillon exhaustif (180 trades), fuseau horaire New York (ET) et filtre de seuil statistique paramétrable (*Effectif minimum ≥ 20 trades*).

2. **Insight prioritaire (Top Leak Alert) :**
   - Encart proéminent identifiant la fuite comportementale #1 : *« Après deux pertes consécutives, ton espérance chute drastiquement »*.
   - Synthèse chiffrée directe : espérance à **-0,48 R/tr**, volume de **28 trades** (15,5 % du journal) pour un coût évitable estimé à **-13,44 R**, avec accès direct d'exploration (*« Revoir ces trades »*).

3. **Double colonne asymétrique (Fuites vs Forces) :**
   - **Fuites prioritaires classées** :
     - *Après deux pertes consécutives* (-0,48 R/tr · -13,44 R · 28 tr)
     - *État mental : Stress élevé à l'ouverture* (-0,34 R/tr · -8,20 R · 24 tr)
     - *Hausse de taille après perte (Martingale réflexe)* (-0,42 R/tr · -5,10 R · 12 tr) assorti du badge explicite d'échantillon limité (*< 20 trades*).
     - Liens contextuels *« Voir les exécutions »* pour chaque ligne.
   - **Points d'ancrage & Points forts** : mise en valeur sobre des contextes d'avantage statistique (*État d'esprit calme & discipliné* à **+0,82 R/tr** sur 64 trades, *Trade 1 de la séance*, *Session du matin NY*).

4. **Matrice comportementale croisée & Dimensions :**
   - Chips de dimensions d'analyse : *État mental × Résultat précédent*, *Instrument*, *Session*, *Setup*, etc.
   - Matrice multi-factorielle croisant l'état psychologique d'entrée (*Calme & Focus*, *Neutre*, *Frustration / FOMO*, *Stress élevé*) avec le résultat du trade précédent (*Après gain*, *Après 1 perte*, *Après 2+ pertes*). Chaque cellule affiche l'espérance mathématique en R et l'échantillon sous-jacent (*n*), avec teintes divergentes discrètes.

5. **Rigueur méthodologique :**
   - Note exploratoire explicite rappelant la nature descriptive des corrélations observées, sans extrapolation causale indue.
   - Typographie financière stricte combinant **Barlow Condensed** pour les titres et **IBM Plex Sans** avec chiffres tabulaires alignés.

## Coach

La vue **Analyses / Coach d’exécution** d’EDGE a été conçue en respectant rigoureusement la charte éditoriale graphite, les polices **Barlow Condensed** et **IBM Plex Sans**, ainsi que les spécifications fonctionnelles du journal :

### Caractéristiques de l'écran « Coach d’exécution » :
1. **Shell applicatif & Navigation :**
   - Barre latérale fixe de 216 px avec l'onglet **Analyses** actif.
   - Onglets secondaires sous *Analyses* : `Performance`, `Leak Finder`, `Coach` (actif) et `Rapports`.
   - Bandeau supérieur avec fil d'Ariane `EDGE / Analyses / Coach d'exécution`, statut local `Synchronisé en local`, horodatage `Clôtures · New York — 13 nov. 2026` et badge `Données de démonstration`.

2. **Espace de travail principal (2/3) :**
   - **Sélecteur de mode d'analyse :** bascule claire entre `Analyse locale (moteur hors-ligne)` actif et `API distante (optionnel)` avec mention explicite du moteur statistique local v2.4 (aucun transfert réseau).
   - **Pills de questions heuristiques rapides :** suggestions en français (*« Quel est mon meilleur setup sur le NQ ? »*, *« Pourquoi ai-je perdu sur mes séances négatives ? »*, *« Que changer demain pour respecter mon plan ? »*).
   - **Dialogue contextualisé :**
     - Question utilisateur sur les facteurs récurrents de ses séances perdantes.
     - Réponse structurée du coach avec accent violet sobre dédié à la source locale :
       - **Observation comportementale :** détection de la dégradation de discipline post-première perte sur la session matin NY (68 % des pertes concentrées sur ce biais).
       - **Chiffres clés du journal :** espérance post-perte (-0,48 R/tr vs +0,59 R nominal), chute du respect du plan à 6,1/10 et coût cumulé évitable (-13,44 R sur 28 trades).
       - **Plan d'action immédiat :** activation du délai Lock Guard (pause 15 min), exclusion du setup *Fakeout Resistance* en début de session.
   - **Compositeur de requête :** champ intitulé *« Ta question au coach »*, indication du contexte injecté (180 trades), raccourci clavier `⌘ + Entrée` et bouton d'action cyan *« Analyser (Local) »*.

3. **Volet latéral de périmètre & gouvernance (1/3) :**
   - **Périmètre de l'analyse :** résumé consolidé de l'échantillon (180 trades, +106,78 R, Profit Factor 2,23, Discipline moyenne 8,4/10).
   - **Confidentialité & Moteur local :** explicitation du calcul local sans connexion sortante (base sécurisée dans le navigateur).
   - **Fournisseur d'API distante :** statut inactif `Non configurée`, mention du consentement préalable *« Envoyer ma question et les statistiques agrégées »* et lien vers les Paramètres.

## Rapports

Voici l'écran **Analyses / Rapports** pour **EDGE / Trading Intelligence**, conçu dans la continuité exacte de la direction éditoriale graphite et des écrans déjà établis (Cockpit, Journal, Performance, Leak Finder, Coach) :

### Points clés de la réalisation :
1. **Système & Typographie :**
   - Titres et repères éditoriaux en **Barlow Condensed** (poids 600, casse naturelle, élégance financière sobre).
   - Corps, tableaux et chiffres financiers en **IBM Plex Sans** avec alignement tabulaire des unités et valeurs signées (+12,40 R / +2 480 $).

2. **Shell applicatif & Navigation :**
   - Sidebar 216 px respectant les 5 destinations fondamentales avec **Analyses** actif et indicateur de synchronisation locale.
   - Sous-navigation par onglets (*Performance*, *Leak Finder*, *Coach*, et **Rapports** sélectionné).
   - Topbar fine avec fil d'ariane, heure de New York, badge « Données de démonstration » et action cyan **« Exporter en PDF »**.

3. **Filtres partagés & Périmètre de sélection :**
   - Compte démo 50K (USD), filtre temporel réglé sur *Période personnalisée (1–13 nov. 2026)* et affichage précis de l'échantillon (24 trades clôturés).

4. **Prévisualisation centrale du rapport éditorial :**
   - **Bandeau de KPIs consolidés :** P&L Net (+12,40 R / +2 480 $ avec sparkline d'équité ascendante), Facteur de profit (1,85), Taux de réussite (62,5 % - 15W / 9L) et Discipline moyenne d'exécution (8,2 / 10).
   - **Synthèse factuelle :** paragraphe d'observation neutre sur la capture de volatilité en ouverture de New York.
   - **Double colonne d'analyse équilibrée :**
     - *Trois fuites à examiner :* précipitation post-perte (-0,48 R/tr), entrées anticipées hors carnet, et sorties prématurées avec liens drilldown vers le Leak Finder et le Journal.
     - *Trois forces observées :* configuration Pullback VWAP 5m (+1,08 R/tr), discipline de risque initial respectée à 100 %, et session matin profitable.
   - **Action concrète pour la séance suivante :** focus opérationnel sur la pause obligatoire Lock Guard de 15 minutes.
   - **Pied de page scannable & imprimable :** métadonnées d'intégrité locale SQLite et respect de la confidentialité.

## Plan & revue

L'écran **« Préparation / Plan & revue »** a été conçu pour l'environnement **EDGE / Trading Intelligence**, en respectant fidèlement le système visuel graphite éditorial et la rigueur d'exécution du journal :

### Architecture et éléments intégrés :
1. **En-tête & Métadonnées de session :**
   - Sélecteur de date (*Vendredi 13 novembre 2026 · Session New York*).
   - Badge d'avancement d'avant-séance (*5/6 points préparés · Revue à rédiger*) et action rapide *« Dupliquer le cadrage de la veille »*.
   - Sous-navigation de section alignée : *Plan & revue* (actif), *Playbook*, *Objectifs*, *Calculateur*.

2. **Colonne de gauche — « Avant la séance » :**
   - **Cadrage technique et options (saisie manuelle sans flux externe) :**
     - *Biais HTF & niveaux clés* (NQ 20 820 pivot, résistance 20 950, support S1).
     - *Option flow & Gamma* (Call wall 21 000, Put wall 20 600, Zero Gamma à 20 780).
     - *Volume Profile & Repères carnet* (POC veille 20 840, HVN 20 810).
     - *Calendrier économique & Catalyseurs* avec repère de blackout d'entrée.
   - **Cadre opérationnel & État mental :**
     - Sélecteur d'état d'esprit (*Calme & Focus* sélectionné).
     - Limites d'engagement : plafond de 5 trades autorisés (3 exécutés) et risque max calibré à 1,00 R (200,00 $).
     - Setups autorisés pour la journée (*Rejet VWAP*, *Pullback tendance* actifs).
   - **Checklist d'engagement pré-marché (6 points clés) :**
     - 5 critères cochés et validés.
     - 6ᵉ critère en attente (*Risque et setups définis*).
     - Bouton **« Valider la préparation »** désactivé avec explication explicite du verrouillage Lock Guard (6/6 requis).

3. **Colonne de droite — « Après la séance » :**
   - Récapitulatif automatique de la séance fermée (+2,88 R / +576 $, 3 trades, 66,7 % win rate).
   - **Respect du plan d'exécution** noté à **8,7 / 10** avec jauge et appréciation qualitative.
   - Sélection du meilleur trade (*#TR-180 NQ 100 E-mini · Rejet VWAP · +1,82 R*).
   - Identification de la pire erreur / biais émotionnel (*Entrée précipitée sur ES · Biais d'impatience*).
   - Champ prospectif obligatoire : **« Une action concrète pour demain »**.
   - Contrôle de clôture de fin de séance et bouton d'action principal cyan **« Enregistrer la revue »**.

4. **Historique inférieur — « Revues récentes » :**
   - Journal chronologique des 4 dernières séances (12, 11, 10 et 09 nov. 2026) avec scores de discipline sur 10, P&L en R, volume de trades, setup dominant et notes synthétiques d'exécution.

5. **Charte graphique & typographie :**
   - Palette graphite (#0D1117 fond, #0B0F14 sidebar, #151B23 surfaces, cyan #92D6E0).
   - Typographie rigoureuse : **Barlow Condensed** (600) pour les titres éditoriaux, **IBM Plex Sans** avec chiffres tabulaires pour le corps, les labels et les données chiffrées.

## Playbook

L'écran **Préparation / Playbook** a été conçu pour **EDGE Trading Intelligence** dans le strict respect de la charte éditoriale graphite, de la typographie Barlow Condensed & IBM Plex Sans et de l'architecture maître-détail :

### Architecture et décisions de conception :

1. **Navigation & Cohérence de gamme (Préparation) :**
   - Barre latérale desktop 216 px avec l'onglet **Préparation** actif (souligné par l'accent cyan `#92D6E0`).
   - Sous-navigation segmentée avec les 4 sous-sections officielles : **Plan & revue**, **Playbook** (actif avec badge de décompte), **Objectifs** et **Calculateur**.
   - Topbar intégrée avec fil d'Ariane, statut de synchronisation locale, horodatage New York et badge « Données de démonstration ».
   - Bouton d'action principal « **+ Nouveau setup** » bien visible en cyan contrasté.

2. **Panneau Maître (Colonne gauche - 360 px) :**
   - Champ de filtrage/recherche rapide des modèles et onglets de statut (*Tous*, *Actifs*, *En incubation*).
   - Liste des setups répertoriés avec indicateurs synthétiques tirés des clôtures réelles du journal :
     - **Rejet VWAP** (sélectionné, fond surélevé `#1E2833` et liseré cyan) : 28 trades, espérance +0,80 R/tr, taux de réussite 53,6 %, respect du plan 9,2/10.
     - **Pullback tendance** (45 trades, +1,08 R/tr, 64,4 % win).
     - **Cassure confirmée (Range)** (38 trades, +0,95 R/tr, 57,9 % win).
     - **Sweep Liquidité** (22 trades, +0,67 R/tr, 50,0 % win, en observation).

3. **Panneau Détail (Fiche complète du setup « Rejet VWAP ») :**
   - **En-tête & Thèse :** Instruments assignés (`ES`, `NQ`), créneau horaire (`Session New York 09:30–16:00`), horizon temporel (`M5 / M15`), type de configuration et bouton « Modifier le setup ».
   - **Statistiques secondaires de validation :** Échantillon issu du journal (28 trades clôturés, espérance nette, taux de réussite, discipline moyenne).
   - **Règles d’entrée :** Checklist numérotée rigoureuse (extension de prix 1,5 écart-type VWAP, mèche d'épuisement d'au moins 50 %, bougie de confirmation M5 et ratio R:R minimal de 2,0 R).
   - **Invalidation & Sortie de risque :** Mise en exergue des règles strictes en texte corail (`#F29396`) pour le stop technique (clôture 5m au-delà du rejet sans élargissement permis) et le stop temporel (time-stop à 3 bougies).
   - **Confluences requises :** Tags de validation (Volume HTF, niveaux pivots/High-Low, divergence CVD, confirmation M5, filtre macro).
   - **Exemples graphiques annotés :** Deux aperçus schématiques d'archives du trader :
     - *Exemple valide* : rebond sur S1 journalier avec entrée sur marteau 5m et TP VWAP (+2,10 R).
     - *Exemple à éviter* : tentative de short en plein piège haussier continu (-1,00 R).
   - **Pied de fiche & Continuité opérationnelle :** Lien direct « **Voir les 28 trades dans le journal →** » pour inspecter immédiatement les exécutions passées de cette stratégie.

## Objectifs

L'écran **Préparation / Objectifs** pour **EDGE / Trading Intelligence** a été généré avec succès en appliquant la direction visuelle graphite éditoriale (*Barlow Condensed* et *IBM Plex Sans* chiffres tabulaires) :

### Éléments clés de conception :
1. **Shell desktop & Navigation :**
   - Barre latérale de 216 px intégrant l'identité EDGE, le profil démonstration, et l'onglet actif **Préparation** souligné par l'accent cyan `#92D6E0`.
   - Topbar avec fil d'Ariane (`EDGE / Préparation / Objectifs`), indicateurs de synchronisation locale, fuseau horaire New York, et l'action principale `+ Nouvel objectif`.
   - Navigation secondaire de section : *Plan & revue*, *Playbook*, **Objectifs** (onglet actif mis en évidence), et *Calculateur*.

2. **Bandeau de régularité d'exécution :**
   - Tracker sobre de constance sur 7 séances consécutives (*« 4 séances revues et disciplinées de suite »*) avec le rappel des notes de plan réelles de chaque séance récente sans artifices de gamification.

3. **Panneaux d'objectifs actifs (Novembre 2026) :**
   - **Atteindre +20 R** : progression actuelle de +12,40 R (62 %), reste +7,60 R, portée sur les 180 trades clôturés.
   - **Résultat net +4 000 $** : progression actuelle de +2 480 $ (62 %), reste 1 520 $, portée sur le compte démo 50K.
   - **Respect du plan ≥ 8/10** : note moyenne actuelle de 8,2/10 avec statut sobre *Objectif atteint* (vert `#6BD6A9`) et repère visuel de seuil.

4. **Création & Historique des objectifs :**
   - **Formulaire compact de saisie** : libellé de l'objectif, sélection de l'unité de mesure (R-Multiple, Devise USD, Discipline /10), cible chiffrée, dates et compte concerné, accompagné d'une mention d'aide déterministe (aucun pronostic spéculatif).
   - **Tableau d'historique des cycles passés** (octobre et septembre 2026) avec suivi précis cible visée / résultat effectif et taux de complétion.

## Calculateur

L'écran **« Préparation / Calculateur de position »** pour **EDGE / Trading Intelligence** a été généré avec fidélité, en respectant rigoureusement la charte éditoriale graphite et la logique de calcul de risque au tick demandée :

### Éléments clés de l'écran conçu :

1. **Intégration au Shell & Navigation :**
   - **Barre latérale (216 px) :** Marque `EDGE /`, contexte `Espace personnel · Démonstration`, onglet **« Préparation »** actif, statuts locaux et déconnexion en bas de panneau.
   - **Sous-navigation Préparation :** Barre d'onglets secondaire avec *Plan & revue*, *Playbook*, *Objectifs* et **« Calculateur »** (actif avec indicateur cyan `#92D6E0`).
   - **En-tête de page :** Titre sobre *« Calculateur de position »* en Barlow Condensed 600 et sous-titre *« Dimensionne ton risque avant de documenter ton entrée. »*, accompagné des actions de tête de page **« Réinitialiser »** et **« Copier les paramètres »** (sans aucun bouton de passage d'ordre ni liaison broker).

2. **Formulaire d'entrée (Colonne gauche) :**
   - **Sélecteur d'instrument :** Contrat `ES — E-mini S&P 500` avec spécifications de tick visibles et explicites : `0,25 pt · 12,50 $ / tick · 50 $ / point`, avec sélecteurs rapides vers les autres contrats CME (NQ, CL, GC).
   - **Compte cible :** `Compte démo 50K (USD)` avec affichage du solde actuel (52 480,00 $) et plancher de perte.
   - **Budget de risque :** Paramétré à `200,00 $` (soit 0,40 % du capital initial), commutable en montant fixe ou pourcentage.
   - **Niveaux d'invalidation :** Entrée prévue à `6 020,00`, Stop-Loss technique à `6 018,00` (distance calculée automatique de `2,00 pts` / `8 ticks`), sens de position en `LONG (Achat)`.
   - **Frais de courtage estimés :** `4,00 $` A/R par contrat.
   - **Objectif de prise de profit (optionnel) :** `6 026,00` avec calcul direct du gain projeté (+6,00 pts = 24 ticks = +300,00 $ brut) et du ratio R:R théorique (3,0:1).
   - **Conformité Lock Guard :** Règle de plafond de taille respectée (1 contrat autorisé sur max 5).

3. **Panneau de résultat & Métriques (Colonne droite) :**
   - **Taille recommandée mise en valeur :** **`1 contrat ES`** avec badge de conformité vert `#6BD6A9` et jauge d'engagement du budget.
   - **Métriques d'engagement :**
     - Risque total estimé : **`104,00 $`** (0,21 % du compte).
     - Distance de stop : **`8 ticks`** (2,00 points).
     - Perte brute hors frais : **`100,00 $`** (1 × 8 ticks × 12,50 $).
     - Frais totaux estimés : **`4,00 $`**.
     - Budget non consommé : **`96,00 $`** (sur 200,00 $ autorisés).
     - Définition du R-Multiple normalisé : **`1,00 R = 104,00 $ net`**.
   - **Décomposition transparente de la formule :**
     - Formule affichée : `200,00 $ ÷ 104,00 $ = 1,92 contrat`.
     - Explication de l'arrondi conservateur à l'unité inférieure (1 contrat) pour interdire tout dépassement du budget alloué (`2 contrats = 208,00 $, soit +8,00 $ de dépassement interdit`).
   - **Simulation des paliers d'objectifs (R:R) :** Déclinaisons en R:R 1:1 (`6 022,08`), R:R 2:1 (`6 024,16`) et R:R 3:1 (`6 026,00`).
   - **Avertissement analytique :** Mention claire rappelant que l'outil est strictement préparatoire et ne réalise aucune télétransmission d'ordre marché.

4. **Typographie & Cohérence graphique :**
   - Titres et en-têtes en **Barlow Condensed** sobre en casse de phrase normale.
   - Chiffres financiers, contrôles, badges et tableaux en **IBM Plex Sans** avec alignement tabulaire des chiffres. Palette graphite sombre `#0D1117`, surfaces `#151B23`, bordures nettes 1px `#1E2833` et accent cyan `#92D6E0`.

## Comptes

L'écran **« Comptes & risque »** pour EDGE / Trading Intelligence a été conçu dans le strict respect de l'identité éditoriale graphite, de la charte de style (Barlow Condensed / IBM Plex Sans avec alignement tabulaire des chiffres financiers) et du périmètre fonctionnel réel de l'application :

### Structure & Modules conçus :

1. **Navigation & En-tête :**
   - Sidebar 216 px ancrée à gauche avec l'onglet **Comptes** actif, synchronisation locale et profil de démonstration.
   - Topbar avec fil d'Ariane, statut de synchronisation, repère de clôture New York et bouton d'action principale cyan **« + Ajouter un compte »**.
   - En-tête de section clair : *« Comptes & risque — Capital, limites et marge disponible »* avec action d'export d'audit.

2. **Sélecteur de comptes (Multi-comptes) :**
   - **Compte démo 50K (USD)** (sélectionné) : solde clôturé à 52 480,00 $ (+2 480,00 $ / +4,96 %), objectif de 3 000,00 $ complété à 82,7 %, échantillon de 180 trades clôturés.
   - **Compte personnel (EUR)** (secondaire) : solde clôturé 28 350,00 €, drawdown résiduel 2 450,00 €, 64 trades.

3. **Métriques fondamentales & Plancher de Drawdown :**
   - Décomposition rigoureuse : capital initial alloué (50 000 $), solde actuel clôturé (52 480 $), objectif restant (520 $).
   - Seuil de plancher statique à 49 000,00 $ dégageant une **marge résiduelle de drawdown de 3 480,00 $** (+6,96 % du capital).

4. **Conformité & Règles contractuelles d'évaluation :**
   - **Jours de trading validés** : 9 / 10 jours (jauge à 90 %).
   - **Règle de consistance des gains** : 28,0 % (meilleure journée : +695,00 $) pour un seuil max autorisé de 30,0 % (marge de sécurité de 2,0 %).
   - **Taille de position maximale** : 5 contrats e-mini (utilisation moyenne : 2,1 contrats).
   - **Perte journalière maximale** : plafond contractuel de -1 000,00 $ (pire journée observée : -360,00 $).

5. **Paramétrage du mode de calcul du Drawdown :**
   - Sélecteur de méthode : **Statique** (actif), **Trailing clôture**, **Fin de journée (EOD)**.
   - Note de transparence rappelant que le calcul s'effectue exclusivement sur les positions clôturées locales sans flux intra-trade tick-par-tick fictif.

6. **Simulateur d'impact de perte (Stress test de tolérance) :**
   - Test d'une perte supplémentaire simulée de **400,00 $**, recalculant en direct la marge résiduelle post-impact à **3 080,00 $** (soit +6,28 % au-dessus du plancher critique).

7. **Volet latéral Lock Guard (Garde-fou de saisie) :**
   - Rappel explicite qu'il s'agit d'un garde-fou local de saisie dans le journal (sans prétention de blocage de courtier ni d'ordres marché).
   - Télémétrie en temps réel des règles de session : budget de perte journalière (marge restante 1 576 $ avec le gain du jour), plafond de trades (3/5 exécutés, 2 restants), temporisation post-2 pertes (0/2 pertes), et heure de coupure cash (16h00 ET).
   - Bouton d'ajustement des seuils : *« Modifier les règles du garde-fou »*.

## Paramètres

L'écran **Paramètres** d'**EDGE / Trading Intelligence** a été généré avec fidélité à la charte graphique éditoriale graphite/cyan (Barlow Condensed + IBM Plex Sans tabulaire) :

### Éléments et fonctionnalités conçus :
1. **App Shell & Navigation :**
   - Barre latérale de 216 px avec l'élément **« Paramètres » actif en bas** (mise en avant cyan et indicateur latéral), statut local SQLite vérifié et déconnexion.
   - Fil d'ariane sobre `EDGE / Paramètres`, badge « Données de démonstration » et rappel de clôture horaire New York.
   - Navigation interne par onglets : **Sauvegarde** (actif), **Préférences**, **Instruments** et **Historique**.

2. **Sauvegarde et restauration locale :**
   - Horodatage et intégrité de la dernière sauvegarde (`Aujourd'hui à 18:45 · 180 trades clôturés · 42 captures annotées · 12 règles Lock Guard`).
   - Action principale en cyan **« Exporter JSON complet (Archive maîtresse) »** (incluant données d'exécutions et screenshots), action secondaire **« Restaurer JSON »** et export léger **« Exporter CSV »**.
   - Mention de confidentialité locale stricte (API Origin Private File System / SQLite WASM, zéro transfert cloud).

3. **Environnement de données & Précautions :**
   - État explicite de l'environnement actif avec badge **Données de démonstration**.
   - Commutateur sécurisé : bouton pour **recharger le jeu d'essai de 180 trades**, et action destructive isolée **« Commencer un journal vierge »** accompagnée d'une invitation préalable à sauvegarder l'état actuel.

4. **Préférences d'exécution & calculs :**
   - Fuseau horaire de référence (`America/New_York - RTH 09:30–16:00 ET`).
   - Seuil de représentativité statistique fixé à 20 trades clôturés minimum par contexte.
   - Unité de risque normalisée ($1,00\text{ R} = 200,00\text{ \$}$).
   - Règle de temporisation Lock Guard (verrouillage de saisie pendant 15 min après 2 pertes consécutives).

5. **Table des instruments & spécifications de tick :**
   - Tableau dense avec chiffres tabulaires alignés pour **ES** ($0,25\text{ pt} = 12,50\text{ \$}$), **NQ** ($0,25\text{ pt} = 5,00\text{ \$}$), **CL** ($0,01\text{ pt} = 10,00\text{ \$}$), **GC** ($0,10\text{ pt} = 10,00\text{ \$}$) et **XAUUSD** avec mention explicite *« Spécifique au courtier »*.
   - Bouton d'ajout d'instrument personnalisé et liens de modification.

6. **Journal d'audit & exceptions :**
   - Traçabilité locale des dernières archives, imports NinjaTrader et dérogations Lock Guard documentées.

## Connexion et inscription

L'écran d'authentification **« Connexion locale »** d'**EDGE / Trading Intelligence** a été conçu conformément à la charte graphite éditoriale et aux exigences fonctionnelles :

### Caractéristiques de la composition :
1. **Absence de barre latérale globale & Composition scindée :**
   - Mise en page autonome et aérée sans navigation applicative prématurée, optimisée pour un affichage desktop de 1440 px.
   - En-tête sobre avec le logo `EDGE /`, la mention `Trading Intelligence · v2.4.1`, et les indicateurs discrets de connectivité locale (*Stockage local actif · SQLite / OPFS* et *Mode autonome*).

2. **Colonne éditoriale de gauche :**
   - Titre fort en **Barlow Condensed** : *« Observe tes décisions. Améliore ton exécution. »*
   - Trois piliers de valeur sobres sans promesse marketing ni surenchère :
     - **Risque** : Calibrage précis en R-Multiple, drawdowns et Lock Guard.
     - **Discipline** : Évaluation du respect des setups du playbook (/10).
     - **Revue** : Graphiques M5 annotés et détection systématique des fuites de capital (Leak Finder).
   - Module d'illustration analytique miniature reprenant la trajectoire de référence (+106,78 R sur 180 trades clôturés) avec le badge explicite *Données de démonstration*.

3. **Panneau de formulaire à droite :**
   - Onglets mesurés **Connexion** (actif) et **Créer un compte local**.
   - Champ identifiant / e-mail avec placeholder `trader@exemple.fr`.
   - Champ mot de passe de chiffrement avec bascule visuelle afficher/masquer et rappel sous-jacent de dérivation de clé locale (PBKDF2).
   - Option cochée *« Conserver la session sur ce poste »*.
   - Bouton d'action principal en cyan retenu (`#92D6E0`) : **« Ouvrir mon journal → »**.
   - Encadré d'information sur la confidentialité locale (zéro transfert cloud, base de données SQLite locale).
   - Accès immédiat secondaire : **« Explorer les 180 trades de démonstration »** avec note d'accompagnement.

4. **Pied de page & Rigueur typographique :**
   - Ligne de réassurance technique sobre : *« Données strictement locales · Partition SQLite/OPFS sécurisée · Exportation JSON chiffrée disponible à tout moment »* et lien vers la documentation hors-ligne.
   - Respect strict du binôme **Barlow Condensed** pour les titres et **IBM Plex Sans** (avec chiffres tabulaires) pour les formulaires et données.

## Fiche trade

La **Fiche d’exécution détaillée pour le trade ES du 13 novembre 2026** a été conçue et intégrée dans l'écosystème **EDGE / Trading Intelligence** :

### Caractéristiques d'exécution et de design :

1. **Intégration au Shell & Navigation :**
   - **Navigation latérale (216 px) :** Onglet **Journal** mis en surbrillance avec liseré cyan et fond `#151B23`.
   - **Topbar & Fil d'Ariane :** Navigation rapide avec retour direct conservant la sélection du tableau (`← Retour au journal`), badge `Données de démonstration`, statut de synchronisation locale et pagination fluide (`Trade 14 / 180`).

2. **Bandeau de synthèse du trade (KPIs & Métadonnées) :**
   - **Identité du trade :** ES · Fiche d’exécution, badge vert `LONG`, setup `Rejet VWAP 5m`, séance New York Cash (09:42:15 → 10:08:30 ET).
   - **Métriques d'asymétrie :** Gain net **+1,82 R (+364,00 $)**, Risque initial alloué (1R) **200,00 $ (-2,00 pts)**, Ratio R:R planifié **2,00:1**, Respect du plan **9 / 10 (Exemplaire)**, Taille engagée **2 cts (100 $/pt)**.
   - **Actions d'en-tête :** Boutons d'édition rapide (`Modifier la fiche`), d'export analytique et de retrait sécurisé.

3. **Capture graphique d'exécution haute fidélité (User-supplied screenshot) :**
   - Graphique statique annoté avec bougies M5, ligne VWAP repère, niveaux d'entrée nets (`6 020,00`), de stop initial (`6 018,00`) et de prise de profit (`6 023,75`).
   - Commandes interactives de cadrage : bascule d'onglets temporels (*Pendant le trade M5*, *Avant le trade cadrage M15*, *Après clôture revue M5*), affichage des annotations réelles et zoom plein écran.
   - Mention d'intégrité de fichier local horodaté avec empreinte MD5.

4. **Télémétrie financière & Spécifications contractuelles ES (Colonne droite) :**
   - Spécification détaillée CME : tick de 0,25 pt (12,50 $), point entier à 50,00 $, marge intrajournalière engagée.
   - Décomposition mathématique exacte du P&L : Brut (+375,00 $) - Frais & commissions CME/courtier (11,00 $) = Net (+364,00 $ net / +1,82 R).
   - Validation des critères du Playbook (4/4 critères validés) et impact direct sur les règles de Lock Guard.

5. **Débriefing qualitatif & Psychologie (Onglets inférieurs) :**
   - Thèse d'entrée documentée (absorption sur niveau S1, balayage de l'open et divergence delta).
   - Décision clé, erreur évitée et leçon pour les prochaines séances.
   - Trajectoire émotionnelle phasée : *Calme & Focus* (Entrée) → *Discipliné* (Tenue) → *Satisfait* (Sortie), avec note de lucidité de 9/10.

## Nouveau trade

Voici l'écran **Journal / Nouveau trade** conçu pour **EDGE / Trading Intelligence**, parfaitement aligné sur la charte graphique éditoriale et dense (graphite sombre, typographies *Barlow Condensed* et *IBM Plex Sans* en chiffres tabulaires, accents cyan `#92D6E0`) :

### Structure & Fonctionnalités clés :
1. **Navigation en 3 étapes & Cadre de travail :**
   - Stepper d'avancement clair en en-tête : **1. Exécution** (actif en cyan), **2. Contexte & Stratégie**, **3. Revue & Captures**.
   - Intégration naturelle dans le shell de bureau de 1440 px avec l'onglet **Journal** actif et les sous-rubriques (*Saisie d'exécution*, *Calendrier*, *Import CSV/Broker*).

2. **Champs obligatoires d'exécution & Horodatage :**
   - Sélection du compte (`Compte démo 50K (USD)`), de l'instrument (`ES — E-mini S&P 500`), du sens d'intervention (`LONG / ACHAT`) et du fuseau horaire New York RTH.
   - Saisie précise des horodatages d'entrée (`09:42:15 ET`) et de sortie (`10:08:30 ET`), calculant une durée de rétention de 26 min 15 s.

3. **Prix, Niveaux d'invalidation & Dimensionnement :**
   - Entrée (`6 020,00 pts`), Stop d'invalidation (`6 018,00 pts` / 8 ticks), Objectif théorique (`6 024,00 pts`), Sortie réelle (`6 023,75 pts`).
   - Taille de position (`2 contrats ES`, soit 100 $/point) et frais CME institutionnels déduits (`11,00 $`).

4. **Colonne latérale persistante — Synthèse financière & Lock Guard :**
   - **Calculs asymétriques en direct :** Risque initial $1\text{R} = 200,00\ \$$ (2 pts $\times$ 50 \$ $\times$ 2 cts), Ratio R:R théorique planifié de **2,00 : 1**, P&L net réalisé de **+364,00 $**, et R-Multiple normalisé exact de **+1,82 R** avec décomposition analytique transparente.
   - **Télémétrie Lock Guard :** Vérification d'éligibilité (*Saisie autorisée*), suivi du plafond journalier (3/5 exécutés, 2 restants), marge de perte journalière (1 576 $ restants), et respect de la checklist matinale (6/6 validée).

5. **Contexte, Playbook, Discipline & Psychologie :**
   - Attribution du setup (`Rejet VWAP 5m`), note de respect du plan (`9 / 10`), qualité subjective `A+`.
   - Traçabilité psychologique avant/après séance (*Calme & Focus* $\rightarrow$ *Satisfait & Discipliné*), curseurs de disponibilité mentale et confluences validées.

6. **Section facultative MFE / MAE & Zone de dépôt des captures :**
   - Champs d'excursion favorable (+4,10 pts / +2,05 R) et adverse (-0,68 pts / -0,34 R).
   - Zone de téléversement sombre pour glisser jusqu'à 10 captures d'écran (cadrage M15, déclenchement M5, débouclage).

7. **Barre d'action inférieure :**
   - Boutons *Annuler* et *Enregistrer le trade (Entrée ⏎)* avec rappel de chiffrement local (OPFS/SQLite).

## Cockpit mobile

Voici l'adaptation mobile (390 px) de la **Vue d’ensemble (Cockpit)** pour **EDGE / Trading Intelligence**, conçue dans le respect rigoureux de la direction visuelle éditoriale graphite/cyan :

### Caractéristiques de l'adaptation mobile :
1. **En-tête & Contrôles mobiles :**
   - Marque sobre `EDGE /` avec badge `DÉMO`, sélecteur de compte compact `Compte 50K` et indicateurs d'état discrets (verrou Lock Guard et synchronisation locale active).
   - Déclencheur de filtre temporel `Tout (180 trades)` et fuseau horaire `Clôtures · NY`.

2. **Grille de KPIs 2×2 calibrée :**
   - **Performance nette** : `+106,78 R` (+21 356 $) avec sparkline SVG.
   - **Espérance / trade** : `+0,59 R` (+118,64 $ / trade).
   - **Taux de succès** : `52,8 %` (95W · 85L) avec mini-anneau proportionnel.
   - **Max Drawdown** : `-1 858,00 $` (-3,7 %).

3. **Courbe d’équité tactile & lisible :**
   - Commutateur `R-Multiple` / `Devise ($)` et graduation temporelle nette (15 oct. au 13 nov.) mettant en évidence le point haut de clôture `+106,78 R`.

4. **Fiche de séance active & Télémétrie de risque :**
   - Bilan de la séance du 13 nov. : `+2,88 R` (+576,00 $), Respect du plan `8,7 / 10`.
   - Jauge et chiffres du budget de risque restant (`1 576,00 $`), distance au plancher (`1 860,00 $`), trades autorisés restants (`2 restants / 5`), checklist (`6 / 6 validée`) et état Lock Guard (`0/2 pertes`).

5. **Cartes d’exécutions récentes :**
   - 3 cartes détaillées (NQ 100 E-mini `+1,82 R`, ES E-mini S&P `-1,00 R`, CL Crude Oil `+2,06 R`) avec sens d'intervention (LONG/SHORT), setup appliqué, P&L signé et note de plan sur 10.
   - Lien tactile d'accès rapide vers le journal complet.

6. **Ergonomie mobile & Navigation :**
   - Bouton d'action primaire `+ Nouveau trade` fixé au-dessus de la barre de navigation avec une zone tactile accessible (> 44 px).
   - Barre de navigation inférieure native à 5 onglets (`Cockpit`, `Journal`, `Analyses`, `Préparation`, `Comptes`) assurant une continuité ergonomique totale sans encombrer la lecture.

## Journal mobile

L'écran mobile du **Journal des exécutions** pour **EDGE / Trading Intelligence** a été généré au format smartphone strict de 390 px de large (portrait, défilement vertical complet, sans barre latérale ni composant de bureau).

### Principaux choix de conception & ergonomie mobile :
1. **Format & Cadre Mobile natif (390 px) :**
   - Mise en page 100 % verticale, calibrée pour une utilisation tactile au pouce avec des zones interactives d'au moins 44 px.
   - Suppression complète de la barre latérale desktop et du volet d'inspection latéral au profit d'une navigation mobile dédiée.

2. **Système de cartes d'exécutions tactiles :**
   - Regroupement chronologique par séance fermée (*Vendredi 13 nov. 2026*, *Jeudi 12 nov. 2026*, *Mercredi 11 nov. 2026*) avec P&L net journalier signé et aligné.
   - Fiche active mise en valeur avec bordure cyan subtile (Trade ES : *Rejet VWAP 5m*, +1,82 R / +364 $, Plan 9/10) intégrant un lien direct pour ouvrir la revue complète et le graphique M5.
   - Badges de sens clairs ([LONG] en vert émeraude, [SHORT] en corail) avec horodatage New York (ET).

3. **En-tête et filtres ergonomiques :**
   - En-tête compact avec sélecteur de compte (*50K USD*), statut de stockage local et badge discret *Données de démonstration*.
   - Titre *Journal (180 positions clôturées)* et bouton compact `+ Nouveau trade` en cyan interactif (#92D6E0).
   - Onglets horizontaux (*Journal (180)*, *Calendrier*, *Import*) avec champ de recherche rapide et bouton de filtres avec compteur actif `(2)`.
   - Synthèse de sélection concise : Performance consolidée (+106,78 R / +21 356 $), Taux de réussite (52,8 %) et Facteur de profit (2,23).

4. **Barre de navigation inférieure fixe (5 onglets) :**
   - Navigation standardifiée à 5 items : *Vue d'ensemble*, *Journal* (actif en cyan), *Analyses*, *Préparation*, et *Comptes*.
   - Marge basse de sécurité (`pb-24`) intégrée dans le conteneur défilant pour éviter tout chevauchement avec le dernier élément de la liste.

## Fiche trade mobile

Voici la fiche de trade mobile pour l'application **EDGE / Trading Intelligence**, conçue au format mobile (390 px) en scrolling vertical continu, reprenant rigoureusement la charte éditoriale graphite/cyan :

### Caractéristiques de l'écran :
1. **Format & En-tête mobile (390 px) :**
   - Barre supérieure compacte avec retour direct au **Journal**, pagination relative (`#14 / 180`), flèches de navigation de trade à trade et menu contextuel.
   - Contexte de compte clair avec mention des **Données de démonstration** et compte démo 50K CME Futures.

2. **Fiche documentaire & Métriques clés :**
   - Titre sobre en **Barlow Condensed** : `ES · Long` avec badge vert `LONG`, sous-titre `Rejet VWAP 5m · 13 nov. 2026 · 09:42 – 10:08 ET` et badge d'état clôturé.
   - Cartes KPIs concises : **P&L Net (+1,82 R / +364,00 $)** avec décomposition brut/frais, et note de **Respect du plan (9/10 Exemplaire)** avec jauge visuelle.

3. **Graphique d'exécution annoté pleine largeur :**
   - Onglets d'analyse temporelle : **Pendant (M5)** / **Avant (M15)** / **Après** avec loupe de zoom.
   - Graphique vectoriel annoté (ESZ26 M5 RTH) intégrant le sweep de 09:35, le marteau de confirmation, le passage du VWAP, l'entrée à 6 020,00 pts, l'invalidation à 6 018,00 pts (-2p) et la prise de profit à 6 023,75 pts.
   - Mention d'enregistrement locale (*Capture enregistrée 412 Ko · 13 nov. 2026*).

4. **Sous-navigation & Paramètres chiffrés :**
   - Onglets : **Exécution** (actif avec soulignement cyan), **Notes & Revue**, **Captures (3)**.
   - Synthèse chiffrée avec formatage décimal français (virgule) : 2 contrats ES, valeur du point 50 $, risque 200,00 $, ratio R:R ciblé 2,00:1 et résultat net réalisé de +364,00 $.

5. **Psychologie, Confluences & Leçon :**
   - Trajectoire émotionnelle (*Calme & Focus* $\rightarrow$ *Satisfait & Discipliné*).
   - Checklist des 3 confluences validées du playbook.
   - Bloc de débriefing et axes d'amélioration.

6. **Barres d'actions et navigation mobile :**
   - Bouton flottant persistant **« Modifier la fiche »** au-dessus de la barre de navigation.
   - Barre inférieure fixe à 5 onglets avec cibles tactiles de 44 px : **Vue d'ensemble**, **Journal** (actif en surbrillance cyan), **Analyses**, **Préparation**, **Comptes**.
