# 🗺️ Croquis Interactif Pédagogique

Ce projet est une application web de cartographie interactive conçue pour la création de croquis et de schémas pédagogiques. Elle permet aux utilisateurs de dessiner diverses formes géométriques sur une carte Leaflet, de les styliser, de les organiser dans une légende dynamique et d'exporter le résultat final en format JSON ou PDF.

## ✨ Fonctionnalités Principales

- **Carte Interactive** : Basée sur [Leaflet.js](https://leafletjs.com/), offrant une navigation fluide et une interface réactive.
- **Fonds de Carte Multiples** : Sélecteur de fonds de carte incluant OpenStreetMap, CartoDB, Esri, IGN, et bien d'autres.
- **Outils de Dessin Complets** :
    - **Lignes** : Pleines, pointillées, tirets.
    - **Flèches** : Simples ou doubles, avec rendu SVG polygonal pour une qualité visuelle optimale.
    - **Marqueurs Personnalisés** : Cercles, carrés, triangles, hexagones avec styles personnalisables.
    - **Formes** : Polygones, rectangles, cercles.
    - **Courbes** : Lignes courbes avec poignées d'édition.
- **Édition Avancée** :
    - **Menu Contextuel** : Un menu flottant et déplaçable pour modifier finement les styles (couleur, opacité, épaisseur, etc.) de chaque géométrie.
    - **Édition Directe** : Propulsé par [Leaflet-Geoman](https://github.com/geoman-io/leaflet-geoman), permettant de déplacer et modifier les sommets des formes.
- **Légende Dynamique et Organisée** :
    - **Glisser-Déposer** : Organisez facilement les figurés dans des parties et sous-parties.
    - **Parties et Sous-Parties** : Créez une hiérarchie dans votre légende avec des titres éditables pour une clarté maximale.
    - **Synchronisation Automatique** : La légende se met à jour en temps réel avec les géométries présentes sur la carte.
- **Éditeur de Texte WYSIWYG** :
    - Un éditeur de texte riche intégré pour ajouter le texte à la base de la construction du croquis, dans l'esprit de l'épreuve initiale du Baccalauréat général en Histoire-Géographie, de type E3C (conversion texte vers croquis en s'appuyant et en développant les compétences "Construire une argumentation géographique" et "Utiliser le numérique").
    - **Synchronisation avec Symboles** : Alignez des symboles de la carte avec des lignes spécifiques de votre texte.
- **Export et Import** :
    - **Sauvegarde JSON** : Exportez l'intégralité de l'état de votre carte (géométries, styles, légende, titre) dans un fichier JSON.
    - **Restauration de Session** : Importez un fichier JSON pour retrouver votre travail exactement comme vous l'aviez laissé.
    - **Export PDF** : Générez un fichier PDF de haute qualité de votre carte, incluant le titre, la légende, l'échelle et la rose des vents.

## 🏗️ Architecture du Projet

L'application est construite sur une architecture modulaire en JavaScript ES6 pour garantir la séparation des préoccupations et la maintenabilité.

- **`GeometryManager.js`** : L'orchestrateur principal qui initialise et coordonne tous les autres modules.
- **`StateManager.js`** : La **source de vérité unique**. Il gère l'état de toutes les géométries, leurs styles, et la structure de la légende.
- **`MapManager.js`** : Gère l'instance de la carte Leaflet, les fonds de carte, les contrôles de dessin (Leaflet-PM) et les événements de la carte.
- **`LegendManager.js`** : Responsable de l'affichage de la légende dans le DOM à partir des données du `StateManager`.
- **`LegendOrganizer.js`** : Gère toute la logique de glisser-déposer pour la légende.
- **`GeometryHandler.js`** : Une classe utilitaire chargée de créer des objets de données standardisés à partir des couches Leaflet.
- **`SVGUtils.js`** : Contient toute la logique complexe pour le rendu des flèches SVG et des marqueurs personnalisés.
- **`ExportImportManager.js`** : Gère la sérialisation de l'état en JSON et la reconstruction des géométries lors de l'import.
- **`PDFExporter.js`** : Utilise `html2canvas` et `jsPDF` pour générer les exports PDF.
- **`UIManager.js`** : Gère les interactions de l'interface utilisateur principale (barres latérales, menu contextuel, etc.).

## 🚀 Démarrage Rapide

1.  **Prérequis** : Un serveur web local est recommandé pour éviter les problèmes de CORS avec les fonds de carte. Des outils comme Live Server pour VS Code sont parfaits.
2.  **Lancement** : Ouvrez le fichier `index.html` dans votre navigateur via le serveur local.

## 🛠️ Utilisation

1.  **Dessiner** : Utilisez les outils sur la barre de gauche pour dessiner des lignes, des flèches, des polygones ou des marqueurs.
2.  **Éditer les Styles** :
    - Cliquez sur un objet dans la liste des géométries (panneau de gauche) pour ouvrir le menu contextuel.
    - Modifiez les couleurs, l'opacité, l'épaisseur, etc.
    - Cliquez sur "Appliquer" pour voir les changements.
3.  **Organiser la Légende** :
    - Cliquez sur `+ Partie` pour créer une nouvelle section dans la légende.
    - Double-cliquez sur le titre d'une partie pour le renommer.
    - Faites glisser un figuré depuis la section "Non classés" vers la partie de votre choix.
    - Utilisez le bouton `+` dans une partie pour créer des sous-parties.
4.  **Sauvegarder et Exporter** :
    - Utilisez les boutons "Exporter" (JSON) et "Importer" pour sauvegarder et restaurer votre travail.
    - Utilisez "Exporter PDF" pour obtenir une version finale de votre carte.

## ⚙️ Commandes de Diagnostic (Console)

Pour faciliter le débogage, plusieurs fonctions sont disponibles dans la console du navigateur :

- `diagnoseDuplicationIssue()`: Vérifie s'il y a des duplications d'éléments SVG pour les flèches.
- `diagnoseVisualArrows()`: Fournit un rapport détaillé sur l'état visuel des flèches SVG dans le DOM.
- `forceArrowRefresh()`: Tente de forcer le redessin de toutes les flèches.
- `checkInterfaceState()`: Affiche l'état (visible/caché) des panneaux latéraux.
- `showAllPanes()` / `hideAllPanes()`: Fonctions utilitaires pour manipuler l'interface.

---

*Ce projet est développé dans un but pédagogique et illustre des techniques avancées de manipulation du DOM, de gestion d'état et d'interaction avec des bibliothèques de cartographie.*