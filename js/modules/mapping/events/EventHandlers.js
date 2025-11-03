// EventHandlers.js

export class EventHandlers {
    constructor(mapManager) {
        if (!mapManager) {
            throw new Error('MapManager is required for EventHandlers initialization.');
        }
        this.mapManager = mapManager;
    }

    /**
     * Gère la création de géométries (marqueurs, polygones, etc.).
     * @param {Object} e - L'événement de création.
     */
    handleGeometryCreation(e) {
        console.log(`[EventHandlers] ➡️ Handling geometry creation for shape: ${e.shape}`);

        // ✅ Pour les Lines, on laisse LineControlManager s'en occuper
        if (e.shape === 'Line') {
            console.log('[EventHandlers] ➡️ Line shape detected. IGNORING. LineControlManager will handle it.');
            // Le LineControlManager a son propre listener 'pm:create', donc on ne fait RIEN ici.
            // C'est la correction clé.
            return;
        }

        // Pour toutes les autres formes (Polygon, Circle, etc.), on utilise la logique standard.
        console.log('[EventHandlers] ➡️ Standard shape detected. Creating geometry object...');
        const geometry = this.mapManager.geometryHandler.createGeometryObject(e.layer);
        if (!geometry) {
            console.error('[EventHandlers] Failed to create geometry object.');
            return;
        }

        this.mapManager.stateManager.addGeometry(geometry);
    }

    /**
     * Gère la suppression de couches (géométries).
     * @param {Object} e - L'événement de suppression.
     */
    handleLayerRemoval(e) {
        console.log('[EventHandlers] Handling layer removal:', e);

        // Trouver l'index de la géométrie correspondant à la couche supprimée
        const index = this.mapManager.stateManager.geometries.findIndex(
            geometry => geometry.layer === e.layer
        );

        if (index !== -1) {
            // Supprimer la géométrie du StateManager
            this.mapManager.stateManager.deleteGeometry(index);
            console.log('[EventHandlers] Geometry removed at index:', index);
        } else {
            console.error('[EventHandlers] Layer not found in geometries list.');
        }
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

    /**
     * Gère le clic sur un marqueur SVG en mode "Edit Markers".
     * @param {Object} e - L'événement de clic.
     */
    handleMarkerClick(e) {
        console.log('[EventHandlers] Handling marker click:', e);

        // Vérifier si le clic est sur un marqueur SVG
        const marker = e.layer;
        if (marker && marker.options && marker.options.type === 'CustomMarker') {
            // Convertir le marqueur SVG en layer
            const layer = this.mapManager._convertMarkerToLayer(marker);
            if (layer) {
                this.mapManager.currentEditedLayer = layer;
                this.mapManager.map.addLayer(layer);
                layer.pm.enable({ allowEditing: true });
                console.log('[EventHandlers] Marker converted to layer for editing');
            }
        }
    }
}
