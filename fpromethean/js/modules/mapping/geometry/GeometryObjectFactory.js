// GeometryObjectFactory.js - Extraction modulaire de la création d'objets géométriques

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

        if (layer instanceof L.CircleMarker) {
            return {
                type: 'CircleMarker',
                coordinates: { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng },
                radius: layer.getRadius(),
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
