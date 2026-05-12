# 🗺️ Projet Croquis – Documentation technique et Architecture

Ce document sert de point d'entrée pour toute intelligence artificielle ou développeur souhaitant comprendre, planifier et exécuter des modifications sur le projet **Croquis**.

## 1. Vue d'ensemble du Dépôt
Le projet **Croquis** est une application web de cartographie interactive à but pédagogique. Elle permet de dessiner des formes géométriques (lignes, polygones, flèches, marqueurs) sur une carte, de les styliser, de construire une légende dynamique et d'exporter le travail.

Le dépôt est structuré autour de **trois versions spécialisées** :
- `fpromethean/` : Version optimisée pour les **tableaux interactifs (TBI)**. Elle intègre une gestion avancée des entrées (stylet vs doigt) et un rejet de paume.
- `fportrait/` : Version optimisée pour le format **Portrait (Mobile/Tablette)**, avec une ergonomie tactile et une navigation par panneaux superposés.
- `fpaysage/` : Version classique optimisée pour le format **Paysage (Desktop)**.

## 2. Arborescence et Structure du Code

L'architecture a évolué vers une structure hautement modulaire et hiérarchique pour gérer la complexité croissante des outils de dessin et d'export.

```text
Croquis/
├── fpromethean/ | fportrait/ | fpaysage/
│   ├── index.html             # Point d'entrée spécifique
│   ├── css/                   # Styles modulaires (layout, components, etc.)
│   └── js/
│       ├── main.js            # Initialisation
│       └── modules/           # Architecture hiérarchique
│           ├── mapping/       # Logique métier cartographique
│           │   ├── controls/  # Contrôles UI de la carte (Sélecteur de fonds)
│           │   ├── geometry/  # Création et gestion des formes
│           │   ├── io/        # Import/Export (JSON, PDF)
│           │   ├── legend/    # Gestion de la légende (Manager, Organizer)
│           │   └── layers/    # Gestion des couches Leaflet
│           ├── ui/            # Composants d'interface (Palettes, Menus)
│           ├── utils/         # Utilitaires (Maths, SVG, Helpers)
│           ├── StateManager.js    # Source de vérité unique
│           ├── MapManager.js      # Orchestrateur Leaflet
│           └── UIManager.js       # Orchestrateur d'interface
```

## 3. Architecture Logicielle (js/modules/)

### Cœur du Système
- **`StateManager.js`** : Gère l'état global. C'est l'unique source de vérité pour les géométries et la légende.
- **`MapManager.js`** : Pilote Leaflet et Leaflet-Geoman. Gère l'initialisation de la carte et les modes de dessin.
- **`UIManager.js`** : Gère les interactions globales, la navigation entre panneaux et la réactivité de l'interface.

### Modules Spécialisés (sous `mapping/`)
- **`legend/LegendManager.js`** : Rendu dynamique de la légende avec support des parties et sous-parties.
- **`legend/LegendOrganizer.js`** : Logique de Drag & Drop pour organiser les figurés.
- **`io/PDFExporter.js`** : Export PDF haute définition. Intègre le **"Smart Crop"** pour préserver l'aspect ratio sans distorsion en mode paysage.
- **`io/ExportImportManager.js`** : Sérialisation complète du projet au format JSON.

### Modules Spécialisés (sous `utils/`)
- **`utils/SVGUtils.js`** : Moteur de rendu mathématique pour les flèches polygonales et les marqueurs géométriques complexes.

### Modules Spécifiques (Promethean)
- **`PointerRouter.js`** : Analyse les événements `pointer` pour différencier l'usage du stylet (dessin précis), du doigt (navigation) et de la paume (rejet).

## 4. Fonctionnalités Clés et Innovations

- **Smart Crop PDF Export** : Algorithme intelligent qui ajuste le cadrage lors de l'export paysage pour inclure la légende et le titre sans écraser la géométrie de la carte.
- **Navigation "Smart Overlay"** : Système de gestion des panneaux (Dessin, Légende, Save) qui assure une visibilité optimale, particulièrement sur mobile où les panneaux s'excluent mutuellement.
- **Légende Hiérarchique** : Capacité à créer des structures complexes (Parties > Sous-parties > Figurés) pour répondre aux exigences académiques des croquis de géographie.
- **Menu Contextuel Flottant** : Interface d'édition directe (`ContextMenuDragger.js`) permettant de modifier les propriétés d'un objet (couleur, opacité, épaisseur) sans quitter la carte des yeux.

## 5. Guide de Développement et Débogage

### Flux de données
1. L'utilisateur interagit avec la carte (Leaflet-Geoman).
2. Le `GeometryManager` capte l'événement et met à jour le `StateManager`.
3. Le `StateManager` notifie les abonnés (Légende, UI).
4. L'interface se met à jour.

### Débogage en Console
Des outils de diagnostic sont intégrés pour vérifier l'intégrité du système :
- `checkInterfaceState()` : Rapport sur la visibilité des panneaux.
- `diagnoseVisualArrows()` : Analyse du rendu SVG des flèches.
- `diagnoseDuplicationIssue()` : Vérification des doublons de IDs ou d'éléments.

## 6. Dépendances Critiques
- **Leaflet.js** : Moteur cartographique.
- **Leaflet-Geoman** : Outils d'édition de géométrie.
- **html2canvas / jsPDF** : Moteur de rendu et génération PDF.
