// js/modules/mapping/events/EventHandlers.js

export class EventHandlers {
    constructor(mapManager) {
        if (!mapManager) {
            throw new Error('MapManager is required for EventHandlers initialization.');
        }
        this.mapManager = mapManager; // Référence au MapManager
    }

    /**
     * Gère la création de géométries (marqueurs, polygones, etc.).
     * @param {Object} e - L'événement de création.
     */
    // Dans EventHandlers.js, méthode handleGeometryCreation
    handleGeometryCreation(e) {
        console.log('[EventHandlers] Handling geometry creation:', e);

        // Pour les rectangles, on laisse MapManager._handleLayerCreation s'en occuper
        if (e.shape === 'Rectangle') {
            console.log('[EventHandlers] Skipping rectangle creation, will be handled by MapManager');
            return;
        }

        // Vérifier si la couche existe déjà dans le StateManager
        const existingGeometry = this.mapManager.stateManager.geometries.find(g => g.layer === e.layer);
        if (existingGeometry) {
            console.warn('[EventHandlers] Layer already exists in state:', e.layer);
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
     * Gère l'édition de couches (géométries).
     * @param {Object} e - L'événement d'édition.
     */
    handleLayerEdit(e) {
        console.log('[EventHandlers] Handling layer edit:', e);

        // Trouver l'index de la géométrie correspondant à la couche éditée
        const index = this.mapManager.stateManager.geometries.findIndex(
            geometry => geometry.layer === e.layer
        );

        if (index !== -1) {
            // Mettre à jour les coordonnées de la géométrie
            const newCoordinates = e.layer.getLatLngs();
            this.mapManager.stateManager.updateGeometryCoordinates(index, newCoordinates);
            console.log('[EventHandlers] Geometry updated at index:', index);
        } else {
            console.error('[EventHandlers] Layer not found in geometries list.');
        }
    }

    /**
     * Gère l'ajout de vertex aux couches (géométries).
     * @param {Object} e - L'événement d'ajout de vertex.
     */
    handleVertexAdded(e) {
        console.log('[EventHandlers] Handling vertex added:', e);

        // Trouver l'index de la géométrie correspondant à la couche modifiée
        const index = this.mapManager.stateManager.geometries.findIndex(
            geometry => geometry.layer === e.layer
        );

        if (index !== -1) {
            // Mettre à jour les coordonnées de la géométrie
            const newCoordinates = e.layer.getLatLngs();
            this.mapManager.stateManager.updateGeometryCoordinates(index, newCoordinates);
            console.log('[EventHandlers] Geometry updated at index:', index);
        } else {
            console.error('[EventHandlers] Layer not found in geometries list.');
        }
    }

    /**
     * Gère la fin de l'édition d'une couche.
     * @param {Object} e - L'événement de fin d'édition.
     */
    handleEditComplete(e) {
        console.log('[EventHandlers] Handling edit complete:', e);

        // Trouver l'index de la géométrie correspondant à la couche éditée
        const index = this.mapManager.stateManager.geometries.findIndex(
            geometry => geometry.layer === e.layer
        );

        if (index !== -1) {
            // Mettre à jour les coordonnées de la géométrie
            const newCoordinates = e.layer.getLatLngs();
            this.mapManager.stateManager.updateGeometryCoordinates(index, newCoordinates);
            console.log('[EventHandlers] Geometry updated at index:', index);
        } else {
            console.error('[EventHandlers] Layer not found in geometries list.');
        }
    }

    /**
     * Gère le début de l'édition d'une couche.
     * @param {Object} e - L'événement de début d'édition.
     */
    handleEditStart(e) {
        console.log('[EventHandlers] Handling edit start:', e);

        // Trouver l'index de la géométrie correspondant à la couche éditée
        const index = this.mapManager.stateManager.geometries.findIndex(
            geometry => geometry.layer === e.layer
        );

        if (index !== -1) {
            // Mettre à jour l'interface utilisateur pour refléter l'édition
            this.mapManager.stateManager.selectedIndex = index;
            this.mapManager.stateManager.updateUI();
            console.log('[EventHandlers] Editing started for geometry at index:', index);
        } else {
            console.error('[EventHandlers] Layer not found in geometries list.');
        }
    }
}