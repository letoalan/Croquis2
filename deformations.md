# Spécification Technique : Déformation des Figurés Surfaciques et Linéaires (Segmentaire et Courbe)

Ce document décrit l'architecture et les fonctions techniques nécessaires pour permettre la **déformation interactive** des figurés **surfaciques** (polygones, rectangles convertis) et **linéaires** (polylignes, lignes fléchées simples ou doubles) au sein de la suite Croquis (`fpaysage`, `fportrait`, `fpromethean`).

Deux approches complémentaires de déformation sont formalisées :
1. **La déformation polygonale/segmentaire (Vertex / Midpoint Dragging)** : déplacement direct des sommets existants et insertion dynamique de nouveaux sommets au milieu des segments.
2. **La déformation en courbe (Spline / Bézier / Courbure d'arcs)** : lissage dynamique ou manipulation de tangentes/poignées pour arrondir contours et trajectoires.

---

## 1. Vue d'Ensemble des Deux Modes de Déformation

```
                               ┌── Sommets existants déplaçables (Vertex Dragging)
 1. DÉFORMATION SEGMENTAIRE ───┼── Points médians insérables (Ghost / Midpoint Markers)
                               └── Suppression de sommet (Alt+Click ou Clic Droit)

                               ┌── Interpolation globale (Catmull-Rom / Chaikin / B-Spline)
 2. DÉFORMATION EN COURBE ─────┼── Arcs et poignées de Bézier (Leaflet.Path.Transform / L.Curve)
                               └── Invariance topologique (Préservation fermeture polygonale & têtes de flèches)
```

| Mode | Figurés Surfaciques (`Polygon`) | Figurés Linéaires (`Polyline`, `arrow`, `doubleArrow`) |
| :--- | :--- | :--- |
| **Segmentaire (Geoman natif)** | Déplacement des sommets (`latlngs[0]`), ajout de sommets au milieu d'arêtes. Calcul recalculé de surface/centroïde. | Déplacement des sommets (`latlngs`), ajout de sommets intermédiaires, recalcul automatique de l'angle des flèches d'extrémité. |
| **En courbe (Spline / Bézier)** | Conversion des segments droits en contour lissé (anneau fermé de coordonnées interpolées ou arc SVG `d="M... C/S..."`). | Conversion de la ligne brisée en courbe continue fluide (idéal pour flux géographiques, fleuves, routes sinueuses). |

---

## 2. Déformation Segmentaire : Fonctions Techniques

Ce mode s'appuie sur le moteur d'édition vectoriel intégré (`Leaflet-Geoman`), déjà interfacé dans `MapEditingEvents.js` et `LineControlManager.js`.

### 2.1. Activation et Contrôle de l'Édition

Chaque instance `L.Polygon` ou `L.Polyline` dispose de son contrôleur d'édition `layer.pm`.

```javascript
/**
 * Active le mode édition/déformation sur un calque sélectionné.
 * @param {L.Polygon|L.Polyline} layer - Calque à éditer
 * @param {Object} options - Options d'édition Geoman
 */
function enableLayerDeformation(layer, options = {}) {
    if (!layer || !layer.pm) return;

    const defaultOptions = {
        snappable: true,
        snapDistance: 15,
        allowSelfIntersection: false,  // Empêche les polygones croisés invalides
        preventMarkerRemoval: false,   // Permet la suppression d'un sommet superflu
        snapMiddle: true               // Affiche les poignées virtuelles pour insérer un point
    };

    layer.pm.enable(Object.assign(defaultOptions, options));
    layer.fire('deformation:start');
}

/**
 * Désactive le mode déformation et valide l'état final.
 * @param {L.Polygon|L.Polyline} layer
 */
function disableLayerDeformation(layer) {
    if (!layer || !layer.pm) return;
    layer.pm.disable();
    layer.fire('deformation:end');
}
```

### 2.2. Synchronisation avec le StateManager

Lors d'un déplacement de sommet (`pm:vertex:dragend`), d'une insertion (`pm:vertexadded`) ou suppression (`pm:vertexremoved`), le `StateManager` et les éléments dépendants (flèches SVG) doivent être mis à jour.

```javascript
/**
 * Écouteur unifié pour les événements de déformation segmentaire.
 * @param {L.Map} map
 * @param {StateManager} stateManager
 */
function bindDeformationEvents(map, stateManager) {
    map.on('pm:vertex:dragend pm:vertexadded pm:vertexremoved', (e) => {
        const { layer } = e;
        if (!layer) return;

        // 1. Récupération des coordonnées actualisées
        const updatedLatLngs = layer.getLatLngs();

        // 2. Mise à jour de la géométrie enregistrée dans le StateManager
        const geomIndex = stateManager.geometries.findIndex(g => g.layer === layer);
        if (geomIndex !== -1) {
            stateManager.updateGeometry(geomIndex, updatedLatLngs);
        }

        // 3. Cas particulier des lignes avec flèches : orientation dynamique
        if (layer._arrowType) {
            SVGUtils.restoreArrowsAfterDrag(layer);
        }

        // 4. Déclenchement de la sauvegarde et notification d'historique (Undo/Redo)
        stateManager.notifyChange('geometry:deformed', { layer, index: geomIndex });
    });
}
```

---

## 3. Déformation en Courbe : Fonctions Techniques

La déformation courbe transforme des séries de segments droits en courbes continues esthétiques (splines ou courbes de Bézier cubiques).

### 3.1. Méthode A : Lissage par Interpolation Spline (Chaikin / Catmull-Rom)

Cette méthode conserve la structure native `L.Polyline` et `L.Polygon` en augmentant la densité de points le long d'une courbe mathématique.

```javascript
/**
 * Algorithme de Chaikin pour lisser un tableau de coordonnées (points de contrôle).
 * @param {Array<L.LatLng>} latlngs - Sommets originaux
 * @param {number} iterations - Niveau de lissage (typiquement 2 à 4)
 * @param {boolean} isClosed - true pour un polygone surfacique, false pour une polyligne
 * @returns {Array<L.LatLng>} Coordonnées lissées
 */
function smoothCoordinatesChaikin(latlngs, iterations = 3, isClosed = false) {
    if (latlngs.length < 3 && !isClosed) return latlngs;

    let points = latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));

    for (let it = 0; it < iterations; it++) {
        const refined = [];
        const len = isClosed ? points.length : points.length - 1;

        if (!isClosed) {
            refined.push(points[0]); // Conserve l'extrémité de départ
        }

        for (let i = 0; i < len; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % points.length];

            // Règle 1/4 - 3/4
            const q = {
                lat: 0.75 * p0.lat + 0.25 * p1.lat,
                lng: 0.75 * p0.lng + 0.25 * p1.lng
            };
            const r = {
                lat: 0.25 * p0.lat + 0.75 * p1.lat,
                lng: 0.25 * p0.lng + 0.75 * p1.lng
            };

            refined.push(q);
            refined.push(r);
        }

        if (!isClosed) {
            refined.push(points[points.length - 1]); // Conserve l'extrémité d'arrivée
        }

        points = refined;
    }

    return points.map(p => L.latLng(p.lat, p.lng));
}
```

### 3.2. Méthode B : Courbes de Bézier avec Poignées Tangentes (Leaflet.Curve)

Pour un contrôle graphique fin (style Illustrator / Inkscape), chaque sommet dispose de deux poignées tangentielles manipulables.

```javascript
/**
 * Structure de données pour une ligne ou surface avec poignées de courbure
 */
class CurvedGeometryPath {
    constructor(isClosed = false) {
        this.isClosed = isClosed;
        // Chaque point de contrôle contient le point d'ancrage et ses deux poignées tangentes
        this.nodes = []; // [{ anchor: L.latLng, handleIn: L.latLng, handleOut: L.latLng }]
    }

    /**
     * Génère la chaîne de commande SVG (path 'd') pour Leaflet.Curve ou SVGRenderer
     * @param {L.Map} map
     * @returns {Array} Tableau de commandes pour L.curve (ex: ['M', p0, 'C', h1, h2, p1...])
     */
    toCurveCommands(map) {
        if (this.nodes.length < 2) return [];

        const commands = ['M', [this.nodes[0].anchor.lat, this.nodes[0].anchor.lng]];

        for (let i = 1; i < this.nodes.length; i++) {
            const prev = this.nodes[i - 1];
            const curr = this.nodes[i];

            // Segment cubique de Bézier 'C' : poignée sortie N-1, poignée entrée N, point d'ancrage N
            commands.push('C',
                [prev.handleOut.lat, prev.handleOut.lng],
                [curr.handleIn.lat, curr.handleIn.lng],
                [curr.anchor.lat, curr.anchor.lng]
            );
        }

        if (this.isClosed && this.nodes.length > 2) {
            const last = this.nodes[this.nodes.length - 1];
            const first = this.nodes[0];
            commands.push('C',
                [last.handleOut.lat, last.handleOut.lng],
                [first.handleIn.lat, first.handleIn.lng],
                [first.anchor.lat, first.anchor.lng],
                'Z'
            );
        }

        return commands;
    }
}
```

---

## 4. Unification de la Déformation : Surface vs Ligne

La clé de conception réside dans une **interface unifiée** applicable indifféremment à un `L.Polygon` ou un `L.Polyline`.

```
                  ┌──────────────────────────────┐
                  │      DeformationManager      │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────┐                           ┌──────────────────┐
│ Figurés Lignes   │                           │ Figurés Surfaces │
│ (Polyline)       │                           │ (Polygon)        │
└────────┬─────────┘                           └────────┬─────────┘
         │                                              │
         ├── Extrémités libres                          ├── Anneau fermé (latlngs[0])
         ├── Recalcul flèches                           ├── Préservation aire & centroïde
         └── Mode courbe ouvert                         └── Mode courbe cyclique (Z)
```

### 4.1. Gestionnaire Polyvalent (`DeformationManager`)

```javascript
export class DeformationManager {
    constructor(map, stateManager) {
        this.map = map;
        this.stateManager = stateManager;
        this.activeLayer = null;
        this.mode = 'segment'; // 'segment' | 'curve'
    }

    /**
     * Définit le mode de déformation pour un figuré donné
     * @param {L.Polygon|L.Polyline} layer
     * @param {'segment'|'curve'} mode
     * @param {Object} curveOptions - { tension: 0.5, iterations: 3 }
     */
    setDeformationMode(layer, mode = 'segment', curveOptions = {}) {
        this.activeLayer = layer;
        this.mode = mode;

        const isPolygon = layer instanceof L.Polygon;

        if (mode === 'segment') {
            // Activer les poignées de sommets Geoman
            layer.pm.enable({
                snappable: true,
                snapMiddle: true,
                allowSelfIntersection: !isPolygon
            });
        } else if (mode === 'curve') {
            // Désactiver Geoman classique
            layer.pm.disable();

            // Mémoriser les sommets maîtres originaux si non présents
            if (!layer._originalControlPoints) {
                const rawLatLngs = isPolygon ? layer.getLatLngs()[0] : layer.getLatLngs();
                layer._originalControlPoints = [...rawLatLngs];
            }

            // Générer le contour courbe interpolé
            const smoothed = smoothCoordinatesChaikin(
                layer._originalControlPoints,
                curveOptions.iterations || 3,
                isPolygon
            );

            // Appliquer au calque
            if (isPolygon) {
                layer.setLatLngs([smoothed]);
            } else {
                layer.setLatLngs(smoothed);
                if (layer._arrowType) {
                    SVGUtils.restoreArrowsAfterDrag(layer);
                }
            }

            // Afficher les marqueurs de contrôle pour les sommets maîtres
            this._renderCurveControlHandles(layer);
        }
    }

    /**
     * Affiche les poignées interactives pour déplacer les points de contrôle d'une courbe
     * @private
     */
    _renderCurveControlHandles(layer) {
        this._clearHandles();
        const isPolygon = layer instanceof L.Polygon;
        const controlPoints = layer._originalControlPoints || [];

        this.handlesGroup = L.featureGroup().addTo(this.map);

        controlPoints.forEach((latlng, idx) => {
            const handle = L.circleMarker(latlng, {
                radius: 6,
                fillColor: '#ffffff',
                color: '#2563eb',
                weight: 2,
                fillOpacity: 1
            }).addTo(this.handlesGroup);

            // Permettre le glissement du point de contrôle
            if (handle.pm) {
                handle.pm.enable({ draggable: true });
                handle.on('pm:drag', (e) => {
                    controlPoints[idx] = e.layer.getLatLng();
                    const updatedSmooth = smoothCoordinatesChaikin(controlPoints, 3, isPolygon);

                    if (isPolygon) {
                        layer.setLatLngs([updatedSmooth]);
                    } else {
                        layer.setLatLngs(updatedSmooth);
                        if (layer._arrowType) SVGUtils.restoreArrowsAfterDrag(layer);
                    }
                });

                handle.on('pm:dragend', () => {
                    const geomIndex = this.stateManager.geometries.findIndex(g => g.layer === layer);
                    if (geomIndex !== -1) {
                        this.stateManager.updateGeometry(geomIndex, layer.getLatLngs());
                    }
                });
            }
        });
    }

    _clearHandles() {
        if (this.handlesGroup) {
            this.map.removeLayer(this.handlesGroup);
            this.handlesGroup = null;
        }
    }
}
```

---

## 5. Impact sur la Sérialisation et Sauvegarde (`StateSerializer` / `StateDeserializer`)

Pour que les déformations (segmentaires ou courbes) persistent lors de l'export/import du projet (`.json`) :

1. **Sauvegarde des points de contrôle maîtres** :
   - Sauvegarder à la fois `latlngs` finaux (utilisés pour le rendu statique) et `_originalControlPoints` (pour permettre la reprise de l'édition ultérieure sans altération cumulative de lissage).
2. **Attribut de mode géométrique** :
   - Ajouter un champ `geometryMode: 'straight' | 'curved'` dans l'objet de géométrie sérialisé.
3. **Cas des flèches orientées** :
   - Recalculer le cap tangentiel à l'extrême limite de la courbe pour conserver l'alignement exact de la tête de flèche.
