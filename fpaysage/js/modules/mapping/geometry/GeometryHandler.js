// js/modules/mapping/geometry/GeometryHandler.js
export class GeometryHandler {
    constructor(map, layerGroupManager) {
        if (!map) {
            throw new Error('Map is required for GeometryHandler initialization.');
        }
        if (!layerGroupManager) {
            throw new Error('LayerGroupManager is required for GeometryHandler initialization.');
        }

        this.map = map; // Référence à la carte Leaflet
        this.layerGroupManager = layerGroupManager; // Référence au LayerGroupManager
    }

    /**
     * ✅ CORRIGÉ - Crée un objet géométrique à partir d'une couche Leaflet
     * Distinction STRICTE Circle (mètres) vs CircleMarker (pixels)
     * @param {L.Layer} layer - La couche Leaflet à convertir en objet géométrique.
     * @returns {Object} - L'objet géométrique créé.
     * @throws {Error} Si le type de couche n'est pas reconnu.
     */
    createGeometryObject(layer) {
        if (!layer) {
            throw new Error('Layer is undefined in createGeometryObject.');
        }

        console.log('[GeometryHandler] 🔨 Creating geometry object for layer:', layer._leaflet_id);
        console.log('[GeometryHandler] Layer type:', layer.constructor.name);
        console.log('[GeometryHandler] Layer._markerType:', layer._markerType);
        console.log('[GeometryHandler] Layer._arrowType:', layer._arrowType);

        // Récupérer les propriétés de style de la couche
        const color = layer.options.fillColor || layer.options.color || "#007bff";
        const opacity = layer.options.fillOpacity || layer.options.opacity || 1;
        const lineColor = layer.options.color || "#000000";
        const lineWeight = layer.options.weight || 2;
        const lineDash = layer.options.lineDash || "solid";

        // ========================================
        // ✅ CAS 1 : MARQUEURS SVG PERSONNALISÉS
        // ========================================
        if (layer instanceof L.Marker && layer._markerType) {
            console.log('[GeometryHandler] ✅ Custom SVG Marker detected:', layer._markerType);
            const originalOptions = layer.originalOptions || {};

            return {
                type: `Marker_${layer._markerType}`,
                coordinates: layer.getLatLng(),
                color: originalOptions.color || color,
                opacity: originalOptions.opacity || opacity,
                lineColor: originalOptions.lineColor || lineColor,
                lineWeight: originalOptions.lineWeight || lineWeight,
                lineDash: originalOptions.lineDash || lineDash,
                markerSize: originalOptions.markerSize || 24,
                markerType: layer._markerType,
                layer: layer
            };
        }

        // ========================================
        // ✅ CAS 2 : MARQUEURS LEAFLET STANDARDS
        // ========================================
        if (layer instanceof L.Marker) {
            console.log('[GeometryHandler] ✅ Standard Leaflet Marker detected');
            return {
                type: 'Marker',
                coordinates: layer.getLatLng(),
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        }

        // ========================================
        // ✅ CAS 3 : CIRCLE MARKERS (L.CircleMarker) - TESTER AVANT Circle
        // ========================================
        // IMPORTANT : CircleMarker hérite de Circle, donc tester EN PREMIER !
        if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
            console.log('[GeometryHandler] ✅ CircleMarker (pixels) detected');
            return {
                type: 'CircleMarker',
                coordinates: {
                    lat: layer.getLatLng().lat,
                    lng: layer.getLatLng().lng
                },
                radius: layer.getRadius(),  // ✅ Rayon EN PIXELS à la racine
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        }

        // ========================================
        // ✅ CAS 4 : CERCLES LEAFLET (L.Circle) - APRÈS CircleMarker
        // ========================================
        if (layer instanceof L.Circle) {
            console.log('[GeometryHandler] ✅ Leaflet Circle (meters) detected');
            return {
                type: 'Circle',
                coordinates: {
                    center: {
                        lat: layer.getLatLng().lat,
                        lng: layer.getLatLng().lng
                    },
                    radius: layer.getRadius()  // ✅ Rayon EN MÈTRES dans coordinates
                },
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        }

        // ========================================
        // ✅ CAS 5 : POLYGONES (L.Polygon)
        // ========================================
        if (layer instanceof L.Polygon) {
            console.log('[GeometryHandler] ✅ Polygon detected');
            return {
                type: 'Polygon',
                coordinates: layer.getLatLngs()[0] || layer.getLatLngs(),
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        }

        // ========================================
        // ✅ CAS 6 : POLYLINES (L.Polyline, mais pas Polygon)
        // ========================================
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            console.log('[GeometryHandler] ✅ Polyline detected');

            const arrowType = layer._arrowType || null;
            if (arrowType) {
                console.log('[GeometryHandler] 🎯 Arrow type detected:', arrowType);
            }

            return {
                type: 'Polyline',
                coordinates: layer.getLatLngs(),
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                arrowType: arrowType,
                layer: layer
            };
        }

        // ========================================
        // ❌ TYPE NON RECONNU
        // ========================================
        console.error('[GeometryHandler] ❌ Layer type not recognized:', layer.constructor.name);
        console.error('[GeometryHandler] Layer details:', layer);
        throw new Error(`Layer type not recognized: ${layer.constructor.name}`);
    }



    handleGeometryCreation(e) {
        console.log('[EventHandlers] Handling geometry creation:', e);

        // Vérifier si la couche existe déjà dans le StateManager
        const existingGeometry = this.mapManager.stateManager.geometries.find(g => g.layer === e.layer);
        if (existingGeometry) {
            console.warn('[EventHandlers] Geometry already exists:', existingGeometry);
            return;
        }

        // Créer un objet géométrique à partir de la couche Leaflet
        const geometry = this.mapManager.geometryHandler.createGeometryObject(e.layer);
        if (!geometry) {
            console.error('[EventHandlers] Failed to create geometry object.');
            return;
        }

        // Ajouter la géométrie au StateManager
        this.mapManager.stateManager.addGeometry(geometry);

        console.log('[EventHandlers] Geometry added:', geometry);
    }


    /**
     * Retire une géométrie de la carte.
     * @param {L.Layer} layer - La couche à retirer.
     */
    removeGeometry(layer) {
        if (!layer) {
            console.error('[GeometryHandler] Layer is undefined.');
            return;
        }
        this.layerGroupManager.removeLayer(layer);
    }

    /**
     * Met à jour les styles d'une géométrie.
     * @param {L.Layer} layer - La couche à mettre à jour.
     * @param {Object} style - Les nouveaux styles à appliquer.
     */
    // GeometryHandler.js
    updateGeometryStyle(layer, style) {
        if (!layer || !style) {
            console.error('[GeometryHandler] Layer or style is undefined.');
            return;
        }

        if (typeof layer.setStyle === 'function') {
            layer.setStyle(style);
        } else {
            console.error('[GeometryHandler] Layer does not have setStyle method:', layer);
        }
    }
}