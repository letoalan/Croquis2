// js/modules/mapping/events/EventManager.js

export class EventManager {
    constructor(map, eventHandlers) {
        if (!map) {
            throw new Error('Map is required for EventManager initialization.');
        }
        if (!eventHandlers) {
            throw new Error('EventHandlers is required for EventManager initialization.');
        }

        this.map = map; // Référence à la carte Leaflet
        this.eventHandlers = eventHandlers; // Référence aux gestionnaires d'événements
    }

    /**
     * Initialise les gestionnaires d'événements pour la carte.
     */
    // EventManager.js
    initEvents() {
        if (!this.map) {
            console.error('[EventManager] Map is not defined.');
            return;
        }

        // Événement de création de géométries
        this.map.on('pm:create', (e) => {
            this.eventHandlers.handleGeometryCreation(e);
        });

        // Événement de suppression de couches
        this.map.on('pm:removelayer', (e) => {
            this.eventHandlers.handleLayerRemoval(e);
        });

        // Événement d'édition de couches
        this.map.on('pm:edit', (e) => {
            this.eventHandlers.handleLayerEdit(e);
        });

        // Événement d'ajout de vertex aux couches
        this.map.on('pm:vertexadded', (e) => {
            this.eventHandlers.handleVertexAdded(e);
        });

        // Événement de fin d'édition d'une couche
        this.map.on('pm:editcomplete', (e) => {
            this.eventHandlers.handleEditComplete(e);
        });

        // Événement de début d'édition d'une couche
        this.map.on('pm:editstart', (e) => {
            this.eventHandlers.handleEditStart(e);
        });

        console.log('[EventManager] Events initialized.');
    }
}