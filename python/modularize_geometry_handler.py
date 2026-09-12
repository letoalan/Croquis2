import os

def modularize_geometry_handler():
    target_js = [
        'fpaysage/js/modules/mapping/geometry/GeometryHandler.js',
        'fportrait/js/modules/mapping/geometry/GeometryHandler.js',
        'fpromethean/js/modules/mapping/geometry/GeometryHandler.js'
    ]

    factory_code = '''// GeometryObjectFactory.js - Extraction modulaire de la création d'objets géométriques

export class GeometryObjectFactory {
    static createFromLayer(layer) {
        if (!layer) throw new Error('Layer is undefined in GeometryObjectFactory.');

        const color = layer.options.fillColor || layer.options.color || "#007bff";
        const opacity = layer.options.fillOpacity || layer.options.opacity || 1;
        const lineColor = layer.options.color || "#000000";
        const lineWeight = layer.options.weight || 2;
        const lineDash = layer.options.lineDash || "solid";

        if (layer instanceof L.Marker && layer._markerType) {
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

        if (layer instanceof L.Marker) {
            return {
                type: 'Marker',
                coordinates: layer.getLatLng(),
                color, opacity, lineColor, lineWeight, lineDash,
                layer
            };
        }

        if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
            return {
                type: 'CircleMarker',
                coordinates: { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng },
                radius: layer.getRadius(),
                color, opacity, lineColor, lineWeight, lineDash,
                layer
            };
        }

        if (layer instanceof L.Circle) {
            return {
                type: 'Circle',
                coordinates: {
                    center: { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng },
                    radius: layer.getRadius()
                },
                color, opacity, lineColor, lineWeight, lineDash,
                layer
            };
        }

        if (layer instanceof L.Polygon) {
            return {
                type: 'Polygon',
                coordinates: layer.getLatLngs()[0] || layer.getLatLngs(),
                color, opacity, lineColor, lineWeight, lineDash,
                layer
            };
        }

        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            return {
                type: 'Polyline',
                coordinates: layer.getLatLngs(),
                color, opacity, lineColor, lineWeight, lineDash,
                arrowType: layer._arrowType || null,
                layer
            };
        }

        throw new Error(`Layer type not recognized: ${layer.constructor.name}`);
    }
}
'''

    handler_code = '''// js/modules/mapping/geometry/GeometryHandler.js
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
'''

    for t in target_js:
        dirpath = os.path.dirname(t)
        factory_path = os.path.join(dirpath, 'GeometryObjectFactory.js')
        with open(factory_path, 'w', encoding='utf-8') as f:
            f.write(factory_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(handler_code)
        print(f"Modularized {t}")

if __name__ == '__main__':
    modularize_geometry_handler()
