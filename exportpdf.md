# 📄 Solution Technique : Méthode d'Exportation d'un Croquis en PDF

## 1. Contexte et Problématiques Résolues

L'export d'une carte interactive et de ses composants (croquis vectoriel, flèches directionnelles, légende structurée, échelle, orientation et titre) vers un format imprimable PDF de haute qualité soulève plusieurs verrous techniques majeurs dans le navigateur :

1. **Restrictions CORS et Tainted Canvas** : Les tuiles de fond de carte (OpenStreetMap, CartoDB, etc.) proviennent de serveurs tiers. Sans gestion fine de `crossOrigin="anonymous"`, le canvas HTML5 devient "tainted", interdisant l'export des données en image.
2. **Déformation de l'aspect ratio (écrasement / étirement)** : Adapter une carte d'écran dynamique (avec ratio variable) et une légende dans une feuille normalisée A4 paysage sans distorsion géométrique.
3. **Flou et perte de qualité des figurés vectoriels** : Les moteurs comme `html2canvas` pixellisent ou ignorent certains éléments SVG complexes (notamment les flèches directionnelles, les pointes doubles, et les figurés de ponctualité).
4. **Disparition des contrôles et panneaux masqués** : Les éléments d'interface (légende dans un panneau latéral ou repliable, échelle Leaflet, orientation) ne sont pas toujours visibles ou bien placés au moment du clic d'export.
5. **Superposition et chevauchement** : Les contrôles Leaflet standard (boutons de zoom, géoman toolbar) polluent la capture s'ils ne sont pas temporairement masqués.

---

## 2. Architecture Globale de la Solution

La solution repose sur une classe dédiée [PDFExporter](file:///c:/Users/alano/OneDrive/Documents/GitHub/Croquis/fpromethean/js/modules/mapping/io/PDFExporter.js) (située dans `js/modules/mapping/io/PDFExporter.js`), orchestrée par le [UIManager](file:///c:/Users/alano/OneDrive/Documents/GitHub/Croquis/fpromethean/js/modules/UIManager.js) et connectée au [StateManager](file:///c:/Users/alano/OneDrive/Documents/GitHub/Croquis/fpromethean/js/modules/StateManager.js), au [MapManager](file:///c:/Users/alano/OneDrive/Documents/GitHub/Croquis/fpromethean/js/modules/MapManager.js) et au [LegendManager](file:///c:/Users/alano/OneDrive/Documents/GitHub/Croquis/fpromethean/js/modules/mapping/legend/LegendManager.js).

### Bibliothèques utilisées
- **`html2canvas`** (v1.4+) : Capture DOM haute définition (avec options `scale: 2` à `2.5`, `useCORS: true`).
- **`leaflet-image`** : Méthode rapide/alternative de composition de tuiles Leaflet.
- **`jsPDF`** : Assemblage et écriture du document vectoriel/raster A4 paysage final.

```
                  ┌───────────────────────────────┐
                  │      Bouton "Export PDF"      │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │    PDFExporter.exportPDF()     │
                 └───────────────┬────────────────┘
                                 │
            ┌────────────────────┴───────────────────┐
            │                                        │
    (Conditions optimales)                  (Cas standard / complexe)
            ▼                                        ▼
 ┌──────────────────────┐               ┌─────────────────────────────┐
 │  _useLeafletImage()  │               │   _manualLayerCapture()     │
 └──────────────────────┘               └────────────┬────────────────┘
                                                     │
        ┌────────────────────────────────────────────┼────────────────────────────────────────┐
        ▼                                            ▼                                        ▼
┌───────────────┐                          ┌──────────────────┐                     ┌──────────────────┐
│ 1. Pré-rendu  │                          │ 2. Séparation    │                     │ 3. Capture Base  │
│ Légende &     │                          │    Vecteurs      │                     │    (Fond de      │
│ Contrôles     │                          │ (retrait tempo)  │                     │    carte HTML)   │
└───────┬───────┘                          └─────────┬────────┘                     └────────┬─────────┘
        │                                            │                                       │
        └────────────────────────────────────────────┼───────────────────────────────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────────┐
                                        │  4. "Smart Crop" & Cadrage  │
                                        │  (Algorithme anti-déform.)  │
                                        └────────────┬────────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────────┐
                                        │ 5. Redessin Manuel Canvas   │
                                        │  - Tracés & polygones       │
                                        │  - Flèches géométriques     │
                                        │  - Symboles de légende      │
                                        │  - Échelle / Orientation    │
                                        │  - Titre de la carte        │
                                        └────────────┬────────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────────┐
                                        │    6. _generatePDF()        │
                                        │  Mise à l'échelle A4 mm     │
                                        │  et téléchargement jsPDF    │
                                        └─────────────────────────────┘
```

---

## 3. Détail des Étapes Techniques

### Étape 1 : Détection de la stratégie et gestion CORS
Le système vérifie si la couche de tuiles est compatible CORS (`_isCurrentTileCORSSafe`) et si des figurés complexes (flèches) sont présents.
- Si le fond est standard et sans flèches complexes, `leaflet-image` peut être tenté.
- Sinon, le moteur bascule sur la méthode **`_manualLayerCapture()`**, beaucoup plus robuste et précise.

### Étape 2 : Séparation des couches et masquage d'artefacts
Pour éviter que les tracés ne soient floutés par `html2canvas` ou que les flèches SVG ne disparaissent :
1. **Extraction des vecteurs** : Toutes les couches vectorielles (`L.Polyline`, `L.Polygon`, `L.Marker`, `L.CircleMarker`) sont temporairement recensées et retirées de Leaflet (`map.removeLayer(layer)`).
2. **Masquage des contrôles UI** : Les contrôles Leaflet (`.leaflet-control-container`) et conteneurs de flèches DOM temporaires sont masqués (`display: none`).
3. **Capture isolée des contrôles d'orientation et d'échelle** : Les conteneurs d'échelle et de rose des vents sont capturés individuellement en haute définition (`scale: 2`, `backgroundColor: 'transparent'`).

### Étape 3 : Capture du fond de carte et de la légende
1. **Légende** : Les colonnes de légende (`.legend-part-column`) et figurés non classés sont clonés dans un conteneur isolé blanc ou capturés avec `html2canvas` haute définition (`scale: 2.5`).
2. **Fond de carte** : Le conteneur cartographique parent est rendu via `html2canvas` avec fond blanc opaque (`#FFFFFF`).

### Étape 4 : L'Algorithme "Smart Crop" (Anti-Déformation)
Pour éviter de comprimer la carte lors de l'intégration de la légende sur le format A4 :
- `_computeSmartCropWindow(...)` calcule la *Bounding Box* (boîte englobante) de tous les figurés dessinés.
- Si des figurés existent, la fenêtre de cadrage est centrée verticalement sur le centre du contenu (`contentCenterY`), avec une marge de sécurité de 40px.
- La carte de base est découpée (`ctx.drawImage` avec sous-rectangle source) pour respecter le ratio cible sans anamorphose (sans étirer la carte).

```javascript
// Calcul de la zone utile centrée sur les figurés
const targetHeight = baseWidth / targetRatio;
const contentCenterY = (minY + maxY) / 2;
let cropY = contentCenterY - (targetHeight / 2);
if (cropY < 0) cropY = 0;
if (cropY + targetHeight > baseHeight) cropY = baseHeight - targetHeight;
```

### Étape 5 : Recomposition et Redessin Canvas Haute Précision
Sur un Canvas maître final créé en mémoire :
1. **Titre** : Dessiné en haut (`ctx.fillText`, police grasse centrée).
2. **Fond de carte** : Dessiné avec le décalage de rognage Smart Crop.
3. **Redessin direct des vecteurs géométriques dans le Canvas 2D** :
   - **Polylignes & Polygones** : Coordonnées projetées avec `map.latLngToContainerPoint()`, application du style (`lineColor`, `lineWeight * scale`, tirets `setLineDash`).
   - **Flèches directionnelles & doubles flèches** (`_drawArrowheads`) : Calcul précis de l'angle tangentiel $(\text{atan2}(\Delta y, \Delta x))$ et dessin d'une tête de flèche triangulaire pleine proportionnelle à l'épaisseur de ligne.
   - **Ponctuels & Marqueurs** (`_drawMarker`) : Rendu des formes géométriques (cercles, carrés, triangles, hexagones) selon les styles de l'application.
4. **Contrôles cartographiques** : L'échelle est dessinée en bas à gauche, et l'orientation en haut à gauche.
5. **Légende et réécriture des symboles** : La légende est positionnée sous la carte. Pour garantir une netteté parfaite, les symboles de chaque figuré de la légende sont redessinés par-dessus au Canvas 2D (`_redrawAllLegendSymbolsInColumn`).

### Étape 6 : Nettoyage et Restitution (Bloc `finally`)
Le système rétablit l'état de l'application :
- Réintégration de tous les calques vectoriels sur la carte Leaflet (`map.addLayer(layer)`).
- Réapplication des flèches SVG (`SVGUtils.addArrowheadsToPolylineSVG`).
- Réaffichage des contrôles Leaflet d'interface.

### Étape 7 : Génération et Téléchargement PDF (jsPDF)
```javascript
const { jsPDF } = window.jspdf;
const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
const pageWidth = pdf.internal.pageSize.getWidth();   // 297 mm
const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm
const margin = 10;

// Conservation stricte du ratio d'aspect
const mapRatio = mapCanvas.width / mapCanvas.height;
let finalWidth = pageWidth - margin * 2;
let finalHeight = finalWidth / mapRatio;
if (finalHeight > (pageHeight - margin * 2)) {
    finalHeight = pageHeight - margin * 2;
    finalWidth = finalHeight * mapRatio;
}
const x = (pageWidth - finalWidth) / 2;
const y = margin;

pdf.addImage(mapCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', x, y, finalWidth, finalHeight);
pdf.save(`carte_${title}_${timestamp}.pdf`);
```

---

## 4. Tableau Synthétique des Problèmes et Solutions Appliquées

| Problème rencontré | Cause sous-jacente | Solution déployée dans Croquis |
| :--- | :--- | :--- |
| **Canvas corrompu (Taint / CORS)** | Tuiles de cartes chargées depuis un CDN tiers sans entêtes CORS adéquats. | Injection de `crossOrigin = 'anonymous'`, filtre sur les tuiles compatibles (`osm`, `cartodb`), et capture manuelle DOM avec `html2canvas({ useCORS: true })`. |
| **Flèches directionnelles invisibles ou décalées** | Les marqueurs SVG dynamiques (`<marker>`, `defs`) sont mal interprétés par html2canvas. | Les couches vectorielles sont retirées de la capture DOM et redessinées nativement en pur **Canvas 2D** avec calcul trigonométrique de l'angle d'arrivée. |
| **Déformation de la carte (Écrasement)** | La carte et la légende doivent cohabiter sur une feuille A4 fixe (ratio 1.414). | Algorithme de **"Smart Crop"** qui calcule la Bounding Box des tracés et rogne le fond sans altérer l'échelle ni les proportions géographiques. |
| **Flou des figurés et des textes de légende** | Résolution d'écran standard (96 DPI) insuffisante pour l'impression PDF. | Facteur de suréchantillonnage (`scale: 2` à `scale: 2.5`) et redessin direct au trait vectoriel des figurés dans la légende. |
| **Disparition de la légende masquée** | Les panneaux UI peuvent être fermés ou en accordéon au moment de l'export. | Méthode `_ensureLegendVisible()` ou clonage isolé hors-champ (`top: -20000px`) pour forcer le rendu complet des parties et sous-parties. |
| **Pollution par les boutons de l'interface** | Outils Geoman, zoom `+ / -` capturés par erreur. | Masquage temporaire des conteneurs Leaflet pendant la capture puis restauration dans un bloc sécurisé `finally`. |
