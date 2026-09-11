# 🗺️ Projet Croquis – Documentation Technique et Architecture Remaniée

Ce document sert de point d'entrée pour toute intelligence artificielle ou développeur souhaitant comprendre, planifier et exécuter des modifications sur le projet **Croquis**.

> 📚 **Documentation Wiki Exhaustive :**  
> Une documentation complète, modulaire et interconnectée couvrant l'intégralité des répertoires et fichiers du projet est accessible dans le **[Wiki Central](wiki/index.md)**.  
> Chaque fichier source dispose de sa propre fiche descriptive interconnectée à son dossier parent et au présent document.

---

## 1. Vue d'ensemble du Dépôt
Le projet **Croquis** est une application web de cartographie interactive à but pédagogique. Elle permet de dessiner des formes géométriques (lignes, polygones, flèches, marqueurs) sur une carte, de les styliser, de construire une légende dynamique et d'exporter le travail.

Le dépôt est structuré autour de **trois versions spécialisées** :
- `fpromethean/` : Version optimisée pour les **tableaux interactifs (TBI)**. Elle intègre une gestion avancée des entrées (stylet vs doigt) et un rejet de paume.
- `fportrait/` : Version optimisée pour le format **Portrait (Mobile/Tablette)**, avec une ergonomie tactile et une navigation par panneaux superposés.
- `fpaysage/` : Version classique optimisée pour le format **Paysage (Desktop)**.

---

## 2. Architecture Remaniée & Modularisation (< 200 Lignes)

Pour garantir une maintenabilité optimale et respecter le principe de responsabilité unique (SRP), **l'ensemble des fichiers JS et CSS du projet a été modélisé pour ne jamais excéder 200 lignes**. L'architecture repose sur des **façades d'orchestration** déléguant à des sous-modules spécialisés :

```text
Croquis/
├── projet.md                         # Architecture globale de référence
├── wiki/                             # Wiki complet interconnecté (233+ pages)
├── fpaysage/ | fportrait/ | fpromethean/
│   ├── index.html                    # Point d'entrée de l'édition
│   ├── css/                          # Feuilles modulaires composées via @import
│   │   ├── base/                     # variables, base
│   │   ├── components/
│   │   │   ├── editor.css            # Maître (< 20 lignes) -> editor_modules/
│   │   │   ├── legend.css            # Maître (< 20 lignes) -> legend_modules/
│   │   │   ├── context-menu.css      # Maître (< 20 lignes) -> context-menu_modules/
│   │   │   ├── buttons.css, map.css, sidebar.css
│   │   ├── layout/ & utils/
│   │   └── vendors/leaflet.css       # Maître -> leaflet_modules/
│   └── js/
│       ├── main.js                   # Point d'entrée (< 60 lignes)
│       └── modules/
│           ├── StateManager.js       # Façade d'état réactif (< 140 lignes)
│           ├── state_parts/          # LegendStateStore.js, GeometryListRenderer.js
│           ├── MapManager.js         # Façade carte Leaflet (< 90 lignes)
│           ├── map_parts/            # TileSources.js, MapEditingEvents.js
│           ├── UIManager.js          # Façade interface (< 60 lignes)
│           ├── ui_parts/             # ContextMenuHandler.js, UIActionsHandler.js
│           ├── ContextMenuDragger.js # Contrôleur drag menu contextuel
│           ├── ContextMenuPositionManager.js # Stockage et calibration coordonnées
│           ├── mapping/
│           │   ├── geometry/         # GeometryHandler.js, GeometryObjectFactory.js
│           │   ├── lines/            # CurveControlManager.js, BezierMath.js, LineControlManager.js
│           │   ├── legend/           # LegendManager.js, LegendOrganizer.js, LegendTouchDragHandler.js
│           │   │   └── legend_parts/ # LegendSymbolBuilder.js, LegendDomBuilder.js
│           │   ├── io/               # ExportImportManager.js, PDFExporter.js
│           │   │   ├── io_parts/     # StateSerializer.js, StateDeserializer.js
│           │   │   └── pdf_parts/    # SmartCropEngine.js, PdfCanvasComposer.js
│           │   └── layers/ & controls/
│           ├── ui/
│           │   ├── SymbolPaletteManager.js # Façade palette (< 70 lignes)
│           │   └── palette_parts/    # PaletteDropZones.js, PalettePreviewRenderer.js
│           └── utils/
│               ├── SVGUtils.js       # Façade vectorielle (< 90 lignes)
│               ├── svg_parts/        # ArrowRenderer.js, MarkerSVGFactory.js
│               ├── ZoomManager.js    # Détection zoom viewport & DPR
│               ├── DiagnosticsManager.js # Outils d'inspection console
│               └── TextEditorController.js # Éditeur WYSIWYG
```

---

## 3. Détail des Modules Remaniés

### A. Cœur d'État & Orchestration
- **`StateManager.js`** : Coordonne les flux d'état entre carte, légende et UI. Délègue la persistance des parties de légende à `LegendStateStore` et l'affichage de la liste à `GeometryListRenderer`.
- **`MapManager.js`** : Pilote l'instance Leaflet, les contrôles Geoman, les couches et sources de tuiles (`TileSources`).
- **`UIManager.js`** : Orchestre les interactions du DOM, avec `ContextMenuHandler` (styles des objets) et `UIActionsHandler` (exports, imports, titres).

### B. Moteur Vectoriel & Cartographique
- **`SVGUtils.js`** : Façade statique pour les flèches dynamiques (`ArrowRenderer`) et la génération de marqueurs personnalisés (`MarkerSVGFactory`).
- **`CurveControlManager.js`** : Gestion des poignées de courbure interactives avec interpolation mathématique (`BezierMath`).
- **`LegendOrganizer.js`** : Glisser-déposer hiérarchique avec support tactile complet (`LegendTouchDragHandler`).

### C. Import / Export & Rendu PDF
- **`ExportImportManager.js`** : Sérialisation (`StateSerializer`) et reconstruction d'état (`StateDeserializer`) au format JSON.
- **`PDFExporter.js`** : Capture haute définition avec cadrage intelligent (`SmartCropEngine`) et composition vectorielle (`PdfCanvasComposer`).

---

## 4. Guide de Développement et Débogage

### Commandes de Diagnostic en Console
- `checkZoom()` : Détection et affichage du zoom visuel estimé.
- `diagnoseVisualArrows()` : Diagnostic des dimensions et visibilité des flèches SVG.
- `diagnoseDuplicationIssue()` : Vérification de l'unicité des chemins SVG dans le DOM.
- `forceArrowRefresh()` : Redessin forcé des flèches vectorielles sur la carte.

### Dépendances Externes
- **Leaflet.js** (v1.9.4) : Moteur cartographique.
- **Leaflet-Geoman** : Outils de création et édition vectorielle.
- **html2canvas / jsPDF** : Moteur de rendu graphique et écriture PDF A4.
