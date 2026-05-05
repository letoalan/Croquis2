// js/modules/mapping/layers/LayerGroupManager.js

export class LayerGroupManager {
    constructor(map) {
        if (!map) {
            throw new Error('Map is required for LayerGroupManager initialization.');
        }

        this.map = map; // Référence à la carte Leaflet
        this.layerGroup = L.layerGroup().addTo(this.map); // Groupe de couches principal
    }

    /**
     * Ajoute une couche au groupe de couches.
     * @param {L.Layer} layer - La couche à ajouter.
     */
    addLayer(layer) {
        if (!layer) {
            console.error('[LayerGroupManager] Layer is undefined.');
            return;
        }
        this.layerGroup.addLayer(layer);
    }

    /**
     * Retire une couche du groupe de couches.
     * @param {L.Layer} layer - La couche à retirer.
     */
    removeLayer(layer) {
        if (!layer) {
            console.error('[LayerGroupManager] Layer is undefined.');
            return;
        }
        this.layerGroup.removeLayer(layer);
    }

    /**
     * Supprime toutes les couches du groupe de couches.
     */
    clearLayers() {
        this.layerGroup.clearLayers();
    }

    /**
     * Retourne le groupe de couches.
     * @returns {L.LayerGroup} - Le groupe de couches.
     */
    getLayerGroup() {
        return this.layerGroup;
    }

    /**
     * Ajoute un marqueur SVG au groupe de couches.
     * @param {L.SVGOverlay} svgMarker - Le marqueur SVG à ajouter.
     */
    addSVGMarker(svgMarker) {
        if (!svgMarker) {
            console.error('[LayerGroupManager] SVG marker is undefined.');
            return;
        }
        this.layerGroup.addLayer(svgMarker);
    }

    /**
     * Retire un marqueur SVG du groupe de couches.
     * @param {L.SVGOverlay} svgMarker - Le marqueur SVG à retirer.
     */
    removeSVGMarker(svgMarker) {
        if (!svgMarker) {
            console.error('[LayerGroupManager] SVG marker is undefined.');
            return;
        }
        this.layerGroup.removeLayer(svgMarker);
    }

    /**
     * Met à jour les styles d'une couche dans le groupe de couches.
     * @param {L.Layer} layer - La couche à mettre à jour.
     * @param {Object} style - Les nouveaux styles à appliquer.
     */
    updateLayerStyle(layer, style) {
        if (!layer || !style) {
            console.error('[LayerGroupManager] Layer or style is undefined.');
            return;
        }
        if (typeof layer.setStyle === 'function') {
            layer.setStyle(style);
        } else {
            console.error('[LayerGroupManager] Layer does not have setStyle method:', layer);
        }
    }
}