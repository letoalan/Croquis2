// js/modules/mapping/geometry/GeometryHandler.js
import { GeometryObjectFactory } from './GeometryObjectFactory.js';

export class GeometryHandler {
    constructor(map, layerGroupManager) {
        if (!map) throw new Error('Map is required for GeometryHandler initialization.');
        if (!layerGroupManager) throw new Error('LayerGroupManager is required for GeometryHandler initialization.');
        this.map = map;
        this.layerGroupManager = layerGroupManager;
    }

    createGeometryObject(layer) {
        return GeometryObjectFactory.createFromLayer(layer);
    }

    handleGeometryCreation(e) {
        const existingGeometry = this.mapManager?.stateManager?.geometries.find(g => g.layer === e.layer);
        if (existingGeometry) return;

        const geometry = this.createGeometryObject(e.layer);
        if (!geometry) return;

        this.mapManager?.stateManager?.addGeometry(geometry);
    }

    removeGeometry(layer) {
        if (!layer) return;
        this.layerGroupManager.removeLayer(layer);
    }

    updateGeometryStyle(layer, style) {
        if (!layer || !style) return;
        if (typeof layer.setStyle === 'function') {
            layer.setStyle(style);
        }
    }
}
