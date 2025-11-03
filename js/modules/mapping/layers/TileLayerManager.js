// js/modules/mapping/layers/TileLayerManager.js

export class TileLayerManager {

    constructor(map, tileSources) {
        if (!map) {
            throw new Error('Map is required for TileLayerManager initialization.');
        }

        if (!tileSources) {
            throw new Error('Tile sources are required for TileLayerManager initialization.');
        }

        this.map = map;
        this.tileSources = tileSources;
        this.currentTileLayer = null; // Couche de tuiles principale (objet L.TileLayer)
        this.currentLabelsLayer = null; // Couche de labels pour le mode hybrid
        this.currentTileType = 'osm'; // ✅ AJOUT : Identifiant de la tuile active (string)
    }

    /**
     * Définit la couche de tuiles à afficher sur la carte.
     * @param {string} tileType - Le type de tuile à afficher (osm, cartodb, dark, satellite, hybrid).
     */
    setTileLayer(tileType) {
        console.log(`[TileLayerManager] Setting tile layer to: ${tileType}`);

        if (!this.tileSources[tileType]) {
            console.error(`[TileLayerManager] Tile type "${tileType}" is not defined.`);
            return;
        }

        // Retirer la couche de tuiles actuelle si elle existe
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
        }

        // Retirer la couche de labels si elle existe
        if (this.currentLabelsLayer) {
            this.map.removeLayer(this.currentLabelsLayer);
            this.currentLabelsLayer = null;
        }

        // ✅ AJOUT : Sauvegarder l'identifiant de la tuile
        this.currentTileType = tileType;

        // Récupérer la configuration de la couche de tuiles sélectionnée
        const tileConfig = this.tileSources[tileType];

        // Créer et ajouter la nouvelle couche de tuiles
        this.currentTileLayer = L.tileLayer(tileConfig.url, {
            attribution: tileConfig.attribution,
            maxZoom: 19
        });
        this.currentTileLayer.addTo(this.map);

        // Ajouter la couche de labels si le mode hybrid est sélectionné
        if (tileConfig.labels) {
            this.currentLabelsLayer = L.tileLayer(tileConfig.labels, {
                attribution: tileConfig.attribution,
                maxZoom: 19
            });
            this.currentLabelsLayer.addTo(this.map);
            console.log('[TileLayerManager] Labels layer added for hybrid mode');
        }

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
     * ✅ AJOUT : Retourne l'identifiant de la tuile actuellement affichée.
     * @returns {string} - L'identifiant de la tuile (ex: 'osm', 'satellite')
     */
    getCurrentTileType() {
        return this.currentTileType;
    }

    /**
     * Retourne la couche de labels actuellement affichée.
     * @returns {L.TileLayer|null} - La couche de labels ou null.
     */
    getCurrentLabelsLayer() {
        return this.currentLabelsLayer;
    }

    /**
     * Retourne les sources de tuiles disponibles.
     * @returns {Object} - Les sources de tuiles.
     */
    getTileSources() {
        return this.tileSources;
    }
}
