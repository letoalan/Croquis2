// js/modules/mapping/layers/TileLayerManager.js

export class TileLayerManager {
    constructor(map, tileSources) {
        if (!map) {
            throw new Error('Map is required for TileLayerManager initialization.');
        }
        if (!tileSources) {
            throw new Error('Tile sources are required for TileLayerManager initialization.');
        }

        this.map = map; // Référence à la carte Leaflet
        this.tileSources = tileSources; // Sources de tuiles disponibles
        this.currentTileLayer = null; // Couche de tuiles actuellement affichée
    }

    /**
     * Définit la couche de tuiles à afficher sur la carte.
     * @param {string} tileType - Le type de tuile à afficher (osm, cartodb, dark, satellite).
     */
    setTileLayer(tileType) {
        if (!this.tileSources[tileType]) {
            console.error(`[TileLayerManager] Tile type "${tileType}" is not defined.`);
            return;
        }

        // Retirer la couche de tuiles actuelle si elle existe
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
        }

        // Récupérer la configuration de la couche de tuiles sélectionnée
        const tileConfig = this.tileSources[tileType];

        // Créer et ajouter la nouvelle couche de tuiles
        this.currentTileLayer = L.tileLayer(tileConfig.url, {
            attribution: tileConfig.attribution
        });

        this.currentTileLayer.addTo(this.map);

        console.log(`[TileLayerManager] Tile layer "${tileType}" set successfully.`);
    }

    /**
     * Retourne la couche de tuiles actuellement affichée.
     * @returns {L.TileLayer} - La couche de tuiles actuelle.
     */
    getCurrentTileLayer() {
        return this.currentTileLayer;
    }

    /**
     * Retourne les sources de tuiles disponibles.
     * @returns {Object} - Les sources de tuiles.
     */
    getTileSources() {
        return this.tileSources;
    }
}