# Architecture Cartographique : Création des 9 Figurés, Organisation de la Légende et Duplication Multi-Instances

Ce document technique et fonctionnel détaille l'intégralité du cycle de vie cartographique au sein de la suite Croquis (`fpaysage`, `fportrait`, `fpromethean`) :
1. **La création et l'encodage des 9 types de figurés** (ponctuels, linéaires, surfaciques).
2. **La structure hiérarchique et la manipulation dynamique de la légende** (parties, sous-parties, glisser-déposer tactile et souris).
3. **La duplication multi-instances par tampon continu** (multiplicité sur la carte, unicité en légende et synchronisation absolue).

---

## 1. Typologie et Cycle de Création des 9 Figurés

L'application prend en charge 9 types distincts de figurés cartographiques conventionnels, répartis en 3 familles géométriques :

```
                                  ┌── Cercle (Circle / Marker_circle)
                                  ├── Carré (Marker_square)
            ┌── 1. PONCTUELS ─────┼── Triangle (Marker_triangle)
            │                     └── Hexagone (Marker_hexagon)
            │
            │                     ┌── Ligne simple (Polyline)
FIGURES ────┼── 2. LINÉAIRES ─────┼── Ligne fléchée simple (Polyline + Arrowhead)
            │                     └── Ligne double flèche (Polyline + Double Arrowhead)
            │
            │                     ┌── Polygone libre (Polygon via Leaflet-Geoman)
            └── 3. SURFACIQUES ───┴── Rectangle (Polygon 4 sommets via Leaflet-Geoman)
```

---

### A. Les Figurés Ponctuels (4 types)
- **Types supportés** :
  1. `Marker_circle` (cercle ponctuel)
  2. `Marker_square` (carré)
  3. `Marker_triangle` (triangle équilatéral)
  4. `Marker_hexagon` (hexagone régulier)
- **Composants moteurs** :
  - `MarkerControlManager.js` (`fpaysage/js/modules/mapping/markers/MarkerControlManager.js`)
  - `SVGUtils.js` & `MarkerSVGFactory.js` (`fpaysage/js/modules/utils/svg_parts/MarkerSVGFactory.js`)
- **Mécanisme d'instanciation** :
  1. L'utilisateur clique sur l'un des boutons de marqueur dans la barre de contrôle supérieure gauche.
  2. `MarkerControlManager` arme son écouteur `map.on('click', _handleMapClick)`.
  3. Au clic sur la carte, `MarkerSVGFactory.createMarkerSVG(markerType, latlng, options)` génère dynamiquement un `L.DivIcon` renfermant une balise `<svg>` vectorielle personnalisée (`viewBox="0 0 24 24"`), avec les propriétés de remplissage (`color`), contour (`lineColor`), opacité (`opacity`), épaisseur (`lineWeight`) et dimensions (`markerSize`).
  4. Le marqueur Leaflet `L.marker` ainsi créé est ajouté à la carte, puis encapsulé par `GeometryHandler.createGeometryObject(marker)`.
  5. `StateManager.addGeometry(geom)` enregistre le nouvel objet et déclenche l'actualisation globale de l'interface.

---

### B. Les Figurés Linéaires (3 types)
- **Types supportés** :
  5. `Polyline` simple (ligne standard, pointillés ou tirets)
  6. `Polyline` à flèche unique orientée (sens de progression cartographique)
  7. `Polyline` à double flèche (flux bidirectionnel)
- **Composants moteurs** :
  - `LineControlManager.js` (`fpaysage/js/modules/mapping/lines/LineControlManager.js`)
  - `SVGUtils.js` & `ArrowRenderer.js` (`fpaysage/js/modules/utils/svg_parts/ArrowRenderer.js`)
- **Mécanisme d'instanciation** :
  1. L'utilisateur sélectionne le type de ligne (`line`, `arrow`, `doubleArrow`) dans la barre Leaflet.
  2. Le mode dessin de polyligne Leaflet-Geoman (`map.pm.enableDraw('Line')`) est initialisé avec capture de fin de tracé sur l'événement `pm:create`.
  3. Dès création du calque `L.polyline`, `ArrowRenderer` calcule l'angle d'orientation des segments finaux :
     - Pour `arrow` : un marqueur SVG orienté est fixé sur le dernier sommet via `SVGUtils.addArrowheadsToPolylineSVG(layer, 'arrow')`.
     - Pour `doubleArrow` : deux marqueurs SVG sont calculés et positionnés sur le premier et le dernier sommet.
  4. Les écouteurs de déformation (`pm:vertex:dragend`, `pm:dragend`) réajustent dynamiquement la rotation et les coordonnées des flèches SVG.

---

### C. Les Figurés Surfaciques (2 types)
- **Types supportés** :
  8. `Polygon` (tracé polygonal libre multipoints)
  9. `Rectangle` (emprise surfacique à 4 sommets orthogonaux)
- **Composants moteurs** :
  - `MapEditingEvents.js` (`fpaysage/js/modules/map_parts/MapEditingEvents.js`)
  - Bibliothèque `Leaflet-Geoman` (`pm:create`)
- **Mécanisme d'instanciation et transparence des calques** :
  1. Activés directement via les boutons d'édition surfacique de Geoman (`drawPolygon` ou `drawRectangle`).
  2. Lors de l'événement `pm:create`, si la forme est un `Rectangle`, `MapEditingEvents` le convertit immédiatement en `L.polygon` fermé standard pour unifier le modèle géométrique.
  3. **Superposition et clics descendants** : La propriété Leaflet `bubblingMouseEvents: true` est systématiquement activée sur tous les polygones et surfaces. Ceci permet aux marqueurs ponctuels et polylignes situés à l'intérieur d'un polygone de recevoir les événements de clic sans être bloqués par le panneau de surface.

---

## 2. La Légende et son Organisation par l'Utilisateur

La légende cartographique est dynamique, synchronisée avec l'état unique de l'application et entièrement réorganisable par l'utilisateur.

```
┌──────────────────────────────────────────────────────────┐
│ LÉGENDE                                  [+ Partie]      │
├──────────────────────────────────────────────────────────┤
│ ▼ I. Dynamiques spatiales          [✏️] [➕ Sous-partie]  │
│   ┌── Drop Zone (Partie I) ──────────────────────────┐   │
│   │ [ ● ] Pôles urbains majeurs                      │   │
│   └──────────────────────────────────────────────────┘   │
│   ▼ A. Espaces transfrontaliers                 [✏️]     │
│     ┌── Drop Zone (Sous-partie A) ─────────────────┐     │
│     │ [ ──► ] Flux d'échanges                      │     │
│     └──────────────────────────────────────────────┘     │
│                                                          │
│ ▼ II. Contraintes et milieux                             │
│   ┌── Drop Zone (Partie II) ─────────────────────────┐   │
│   │ [ ■ ] Zones inondables                           │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### A. Modèle de Données Hiérarchique (`LegendStateStore.js`)
L'état de la légende est découplé dans `state_parts/LegendStateStore.js` :
- **Parties principales** : `legendParts = [ { id: 'part_1', title: 'I. Titre', subParts: [...] } ]`.
- **Sous-parties** : `subParts = [ { id: 'subpart_1_1', title: 'A. Titre' } ]`.
- **Assignation des figurés** : `geometryToPart = { [geomIndex]: targetId }`, où `targetId` peut être l'identifiant d'une partie (`part_xxx`) ou d'une sous-partie (`subpart_xxx`).

### B. Cycle de Vie DOM et Rendu (`LegendDomBuilder.js` & `LegendSymbolBuilder.js`)
- `LegendManager.updateLegend()` délègue la construction du DOM à `LegendDomBuilder`.
- Pour chaque figuré, `LegendSymbolBuilder.createSymbol(geom)` produit un aperçu vectoriel SVG miniature (symbole ponctuel avec sa couleur et sa forme, segment avec ses tirets et flèches, ou pavé de couleur surfacique).
- Les boutons d'action permettent de :
  - **Créer une partie** (`+ Partie`).
  - **Créer une sous-partie** (`➕`).
  - **Renommer en ligne** (`✏️`).
  - **Supprimer** une partie ou sous-partie (`🗑️`) avec réassignation automatique des éléments orphelins.

### C. Glisser-Déposer / Drag-and-Drop (`LegendOrganizer.js` & `LegendTouchDragHandler.js`)
L'utilisateur organise ses figurés par glisser-déposer intuitif :
- **Sur PC (Souris / HTML5 Drag & Drop)** :
  - Les éléments `.legend-item` portent l'attribut `draggable="true"` et l'index `data-geometry-index`.
  - Lors du survol des zones `.legend-drop-zone`, la classe visuelle `.drag-over` guide l'utilisateur.
  - Au `drop`, l'index du figuré et l'identifiant cible sont transmis à `stateManager.assignGeometryToPart(geomIdx, targetPartId)`.
- **Sur Tableau Blanc Interactif (TBI) / Écran Tactile** :
  - `LegendTouchDragHandler.js` intercepte `touchstart`, `touchmove`, `touchend`.
  - Une image fantôme semi-transparente de l'élément suit le doigt sur l'écran (`touch-drag-clone`).
  - `document.elementFromPoint(x, y)` détermine la drop zone survolée sous le doigt de l'utilisateur.

---

## 3. Duplication Multi-Instances par Tampon Continu

La duplication cartographique résout un paradoxe pédagogique clé : **multiplier la présence géographique d'un symbole sur la carte sans jamais polluer ni multiplier son entrée en légende ni dans le traitement de texte**.

```
  ┌────────────────────────────────────────────────────────┐
  │                    CARTE LEAFLET                       │
  │                                                        │
  │     [Layer 1]            [Layer 2]           [Layer 3] │
  │    (latlng 1)           (latlng 2)          (latlng 3) │
  │         ▲                    ▲                   ▲     │
  └─────────┼────────────────────┼───────────────────┼─────┘
            │                    │                   │
            └────────────┬───────┴───────────────────┘
                         │
         geom.layers = [ L1, L2, L3 ]
                         │
                         ▼
             ┌───────────────────────┐
             │ StateManager.geometries│  <── UN SEUL OBJET LOGIQUE
             └───────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   LÉGENDE    │ │ LISTE ÉDITEUR│ │PALETTE TEXTE │
│ (1 seule     │ │ (1 seule     │ │ (1 seul      │
│  entrée)     │ │  ligne)      │ │  symbole)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

### A. Principes Fondamentaux
1. **Unicité logique** :
   - `stateManager.geometries[]` conserve **strictement un seul objet** pour le figuré.
   - La légende (`LegendDomBuilder`) itère sur `geometries[]` : le figuré n'apparaît donc qu'**une seule et unique fois**.
   - Le panneau latéral de gestion des formes (`GeometryListRenderer`) et la palette de symboles d'insertion du traitement de texte (`SymbolPaletteManager`) n'affichent qu'**une seule occurrence**.
2. **Multiplicité physique sur la carte** :
   - L'objet géométrique référence tous ses calques instanciés sur la carte via `geom.layers = [layer1, layer2, ...]`.
   - `geom.coordinatesList = [coords1, coords2, ...]` archive les positions de chaque occurrence.
   - `geom.layer` pointe sur le premier calque pour garantir une totale rétrocompatibilité avec les outils d'édition.

---

### B. Fonctionnement du Tampon Continu (`GeometryStampManager.js`)
1. **Activation** :
   - L'utilisateur sélectionne un figuré et clique sur **« 📋 Tamponner sur la carte »** (dans le menu contextuel ou le bouton `📋` du panneau latéral).
   - `GeometryStampManager.startStamping(index)` est appelée :
     - La classe CSS `.cursor-stamp` est posée sur la carte, passant le curseur en croix (`crosshair`).
     - Le bouton bascule en surbrillance rose/rouge avec l'intitulé **« 🛑 Arrêter le tampon »**.
     - Le menu contextuel se referme pour libérer l'espace cartographique.
2. **Pose en continu** :
   - Chaque clic sur la carte déclenche `_onMapClick(e)`.
   - `GeometryDuplicator.createLayerInstance(geom, e.latlng, map, onClick)` fabrique un nouveau calque Leaflet :
     - Pour un ponctuel : génération d'un `SVGUtils.createMarkerSVG` à l'emplacement cliqué, reprenant la taille, la couleur et le type exacts.
     - Pour un cercle/surface : translation et positionnement du calque vectoriel.
   - Le nouveau calque est inséré dans `geom.layers` et ses coordonnées dans `geom.coordinatesList`.
   - **Le mode reste actif** : l'utilisateur peut enchaîner 5, 10 ou 20 clics pour placer son figuré partout où nécessaire.
3. **Désactivation** :
   - Clic sur **« 🛑 Arrêter le tampon »**.
   - Pression de la touche **Échap (`Escape`)**.
   - Sélection d'un autre figuré ou d'un outil de tracé.

---

### C. Synchronisation Absolue & Cycle de Vie
- **Mise à jour du style en temps réel** :
  - Lorsque l'utilisateur modifie une propriété dans le menu contextuel (couleur de remplissage, couleur de trait, épaisseur, type de tiret, opacité, taille du marqueur) et valide, `stateManager.applyStyle()` parcourt l'intégralité du tableau `geom.layers` :
  ```javascript
  layers.forEach(layer => {
      if (typeof layer.setStyle === 'function') {
          layer.setStyle(styleOptions);
      } else if (layer.setIcon) {
          SVGUtils.updateMarkerStyle(layer, geom);
      }
  });
  ```
  **Toutes les instances réparties sur la carte adoptent instantanément le nouveau style sans exception.**
- **Suppression groupée** :
  - La suppression du figuré depuis la liste ou le menu contextuel (`deleteGeometry`) retire **tous les calques** enregistrés dans `geom.layers` de la carte Leaflet avant de retirer l'objet du state.
- **Sélection transparente** :
  - Un clic sur **n'importe quelle copie** du figuré sur la carte propage l'événement de sélection du figuré parent et ouvre le menu contextuel de celui-ci.

---

### D. Persistance et Sauvegarde (`StateSerializer.js` / `StateDeserializer.js`)
- Lors de l'export JSON du projet, `StateSerializer` sérialise `coordinatesList` :
  ```json
  {
    "id": "geom_1726157000",
    "type": "Marker_triangle",
    "name": "Aéroports régionaux",
    "coordinates": { "lat": 48.85, "lng": 2.35 },
    "coordinatesList": [
      { "lat": 48.85, "lng": 2.35 },
      { "lat": 45.76, "lng": 4.83 },
      { "lat": 43.60, "lng": 1.44 }
    ],
    "color": "#e74c3c",
    "lineColor": "#2c3e50",
    "markerSize": 28,
    "partId": "part_1"
  }
  ```
- Au réimport, `StateDeserializer` réinstancie chaque calque du tableau `coordinatesList`, les reconnecte dans `geom.layers`, et n'enregistre qu'une seule géométrie dans `stateManager.geometries[]`.

---

## 4. Tableau Récapitulatif de l'Architecture

| Domaine | Fichiers Clés | Rôle & Responsabilité |
|---|---|---|
| **Figurés Ponctuels** | `MarkerControlManager.js`, `MarkerSVGFactory.js` | Contrôles Leaflet, fabrication des icônes SVG (cercle, carré, triangle, hexagone) |
| **Figurés Linéaires** | `LineControlManager.js`, `ArrowRenderer.js` | Tracés Geoman, calcul trigonométrique et pose des têtes de flèches SVG |
| **Figurés Surfaciques** | `MapEditingEvents.js`, Leaflet-Geoman | Polygones et rectangles, gestion de la transparence aux clics (`bubblingMouseEvents`) |
| **Gestion de la Légende** | `LegendManager.js`, `LegendDomBuilder.js`, `LegendStateStore.js` | Hiérarchie en parties et sous-parties, génération des miniatures vectorielles |
| **Interactivité Légende** | `LegendOrganizer.js`, `LegendTouchDragHandler.js` | Glisser-déposer souris et tactile pour réorganiser les figurés |
| **Tampon Continu** | `GeometryStampManager.js`, `GeometryDuplicator.js` | Déploiement multi-instances, gestion du curseur crosshair et pose à la chaîne |
| **Synchronisation & État** | `StateManager.js`, `ContextMenuHandler.js` | Source unique de vérité, synchronisation collective du style et suppression globale |
| **Persistance** | `StateSerializer.js`, `StateDeserializer.js` | Sauvegarde et ré-instanciation exacte de toutes les répliques géographiques |
