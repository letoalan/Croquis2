// StateDeserializer.js - Restauration et ré-instanciation des calques

import { SVGUtils } from '../../utils/SVGUtils.js';

export class StateDeserializer {
    static restore(state, stateManager, mapManager) {
        if (!state || !state.geometries) throw new Error('Format JSON invalide');

        // Nettoyer l'état existant
        for (let i = stateManager.geometries.length - 1; i >= 0; i--) {
            stateManager.deleteGeometry(i);
        }
        (stateManager.legendParts || []).forEach(p => stateManager.deleteLegendPart?.(p.id));

        if (state.mapTitle) stateManager.setMapTitle(state.mapTitle);
        if (state.legendParts) stateManager.legendParts = state.legendParts;

        // Reconstruire les géométries
        state.geometries.forEach(g => {
            let layer = null;
            if (g.type.startsWith('Marker_') || g.type === 'Marker') {
                const type = g.markerType || (g.type.startsWith('Marker_') ? g.type.replace('Marker_', '') : 'circle');
                layer = L.marker(g.coordinates, {
                    icon: SVGUtils.createMarkerSVG(type, g.coordinates, g)
                });
            } else if (g.type === 'Polygon') {
                layer = L.polygon(g.coordinates, {
                    fillColor: g.color, color: g.lineColor, fillOpacity: g.opacity, weight: g.lineWeight
                });
            } else if (g.type === 'Polyline') {
                layer = L.polyline(g.coordinates, {
                    color: g.color, opacity: g.opacity, weight: g.lineWeight
                });
                if (g.arrowType) SVGUtils.addArrowheadsToPolylineSVG(layer, g.arrowType);
            } else if (g.type === 'CircleMarker') {
                layer = L.circleMarker(g.coordinates, {
                    radius: g.radius || 10, fillColor: g.color, color: g.lineColor, fillOpacity: g.opacity
                });
            }

            if (layer) {
                layer.addTo(mapManager.map);
                stateManager.geometries.push({ ...g, layer });
            }
        });

        stateManager.updateUI();
    }
}
