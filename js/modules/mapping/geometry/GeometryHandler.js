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
     * Crée un objet géométrique à partir d'une couche Leaflet.
     * @param {L.Layer} layer - La couche Leaflet à convertir en objet géométrique.
     * @returns {Object} - L'objet géométrique créé.
     * @throws {Error} Si le type de couche n'est pas reconnu.
     */
    createGeometryObject(layer) {
        if (!layer) {
            throw new Error('Layer is undefined in createGeometryObject.');
        }

        // Récupérer les propriétés de style de la couche
        const color = layer.options.color || "#007bff";
        const opacity = layer.options.opacity || 1;
        const lineColor = layer.options.lineColor || "#000000";
        const lineWeight = layer.options.lineWeight || 2;
        const lineDash = layer.options.lineDash || "solid";

        // Créer l'objet géométrique en fonction du type de couche
        if (layer instanceof L.Circle) {
            return {
                type: 'Circle',
                coordinates: layer.getLatLng(),
                radius: layer.getRadius(),
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        } else if (layer instanceof L.Polygon) {
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
        } else if (layer instanceof L.Polyline) {
            return {
                type: 'Polyline',
                coordinates: layer.getLatLngs(),
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        } else if (layer instanceof L.SVGOverlay) {
            // Gestion des marqueurs SVG personnalisés
            return {
                type: 'CustomMarker',
                coordinates: layer.getLatLngs()[0], // ou layer.getLatLng() selon votre implémentation
                color: color,
                opacity: opacity,
                lineColor: lineColor,
                lineWeight: lineWeight,
                lineDash: lineDash,
                layer: layer
            };
        } else {
            throw new Error('Layer type not recognized.');
        }
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