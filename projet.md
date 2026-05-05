# 🗺️ Projet Croquis – Documentation technique et Architecture

Ce document sert de point d'entrée pour toute intelligence artificielle ou développeur souhaitant comprendre, planifier et exécuter des modifications sur le projet **Croquis**.

## 1. Vue d'ensemble du Dépôt
Le projet **Croquis** est une application web de cartographie interactive à but pédagogique. Elle permet de dessiner des formes géométriques (lignes, polygones, flèches, marqueurs) sur une carte, de les styliser, de construire une légende dynamique et d'exporter le travail.

Le dépôt est structuré autour de **deux versions principales** de l'application :
- `fpaysage/` : La version de l'application optimisée pour un affichage au format **Paysage** (Landscape), idéale pour les tableaux interactifs (Promethean) et ordinateurs.
- `fportrait/` : La version de l'application optimisée pour un affichage au format **Portrait** (Mobile/Tablette), avec une ergonomie repensée pour le tactile et le format vertical.

Les deux dossiers partagent une architecture logicielle et applicative robuste, basée sur du Vanilla JavaScript (ES6 modules), HTML5, et CSS3. L'application utilise un système de navigation "Smart Overlay" pour garantir une interface claire sur tous les supports.

## 2. Arborescence Globale

```text
Croquis/
│
├── projet.md                  # Ce fichier (documentation technique de référence).
│
├── fpaysage/                  # Application - Format Paysage
│   ├── README.md              # Documentation spécifique à cette version.
│   ├── index.html             # Point d'entrée de l'application Paysage.
│   ├── assets/                # Images, icônes, ressources statiques.
│   ├── css/                   # Styles modulaires (base, components, layout, utils, vendors).
│   └── js/                    # Logique applicative Vanilla JS
│       ├── main.js            # Fichier principal d'initialisation.
│       └── modules/           # Architecture modulaire détaillée (voir section 3).
│
└── fportrait/                 # Application - Format Portrait
    ├── README.md              # Documentation spécifique à cette version.
    ├── index.html             # Point d'entrée de l'application Portrait.
    ├── assets/                # Images, icônes, ressources statiques.
    ├── css/                   # Styles modulaires.
    └── js/                    # Logique applicative Vanilla JS.
```

## 3. Architecture Logicielle Modulaire (js/modules/)

L'application est découpée de manière stricte (Séparation des Préoccupations) via des modules ES6. Toute modification de logique doit se faire dans le module approprié :

- **`StateManager.js`** : La **source de vérité unique**. Il gère l'état global (state) de toutes les géométries, leurs styles, et la structure de la légende. Aucune modification de donnée ne se fait sans passer par lui.
- **`MapManager.js`** : Gère l'instance de la carte Leaflet, l'intégration des fonds de carte, et les outils de dessin fournis par *Leaflet-PM / Leaflet-Geoman*.
- **`GeometryManager.js`** : Orchestrateur central. Il fait le pont entre la carte (`MapManager`), les données (`StateManager`) et l'interface utilisateur.
- **`LegendManager.js`** et **`LegendOrganizer.js`** : Gèrent l'affichage dynamique de la légende dans le DOM, la création de parties/sous-parties et la logique complexe de glisser-déposer (Drag & Drop).
- **`GeometryHandler.js`** : Classe utilitaire pour normaliser les données issues des couches Leaflet avant de les envoyer au `StateManager`.
- **`SVGUtils.js`** : Logique de rendu mathématique et vectoriel complexe (notamment pour générer des flèches SVG personnalisées et paramétrables).
- **`ExportImportManager.js`** : Gère la sauvegarde et restauration de session au format JSON.
- **`PDFExporter.js`** : Logique d'export PDF haute qualité utilisant `html2canvas` et `jsPDF`. Elle inclut des mécanismes de capture avancés pour inclure les éléments masqués (légende, échelle) et contourner les restrictions CORS des tuiles.
- **`UIManager.js`** : Gestion des événements de l'interface. En mode portrait, il orchestre la navigation via la `bottom-nav` et assure la fermeture automatique des panneaux concurrents (Légende, Dessin, Éditeur) pour optimiser l'espace visuel.

## 4. Dépendances Externes Critiques
Les bibliothèques suivantes sont injectées côté client :
- **Leaflet.js** : Moteur cartographique de base.
- **Leaflet-Geoman (Leaflet-PM)** : Plugin puissant pour les outils de dessin et d'édition de polygones/lignes sur la carte.
- **html2canvas** & **jsPDF** : Génération de l'export PDF.

## 5. Comment planifier une modification ? (Guide IA)

Pour intervenir efficacement sur l'application, suivez ce cheminement :

1. **Déterminer la version ciblée** : Est-ce une modification pour le format `fpaysage` ou `fportrait` ? (ou les deux simultanément ?).
2. **Pour un problème de données / d'état** : Vérifiez `StateManager.js`. C'est là que sont stockées les listes de figures.
3. **Pour un problème d'interaction carte / dessin** : Explorez `MapManager.js` (initialisation de Leaflet-Geoman) ou `SVGUtils.js` si le rendu visuel d'une flèche/marqueur est défaillant.
4. **Pour un problème d'interface UI / CSS** : L'interface est très modulaire. Regardez dans `UIManager.js` pour la logique de clic, et dans le dossier `css/` (sous-dossiers `components/` ou `layout/`) pour le style.
5. **Pour la légende** : Toute la logique est isolée dans `LegendManager.js` (DOM) et `LegendOrganizer.js` (glisser-déposer).

## 6. Outils de Débogage intégrés
Le projet intègre des fonctions de debug accessibles directement dans la console du navigateur, très utiles pour une analyse à froid :
- `diagnoseVisualArrows()`
- `diagnoseDuplicationIssue()`
- `checkInterfaceState()`
- `forceArrowRefresh()`

Utilisez-les pour identifier rapidement des incohérences de rendu SVG ou d'état d'interface.
