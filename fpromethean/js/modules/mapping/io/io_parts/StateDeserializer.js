// StateDeserializer.js - Restauration et ré-instanciation des calques (support multi-instances)

import { SVGUtils } from '../../utils/SVGUtils.js';

export class StateDeserializer {
    static _createLayerForCoords(g, coords) {
        let layer = null;
        let dashArray = null;
        if (g.lineDash === 'dashed') dashArray = '6, 6';
        else if (g.lineDash === 'dotted') dashArray = '2, 6';

        if (g.type.startsWith('Marker_') || g.type === 'Marker') {
            const type = g.markerType || (g.type.startsWith('Marker_') ? g.type.replace('Marker_', '') : 'circle');
            layer = SVGUtils.createMarkerSVG(type, coords, g);
            if (layer) {
                layer._markerType = type;
                layer.originalOptions = { ...g };
            }
        } else if (g.type === 'Polygon' || g.type === 'Rectangle') {
            layer = L.polygon(coords, {
                fillColor: g.color, color: g.lineColor, fillOpacity: g.opacity, opacity: g.opacity,
                weight: g.lineWeight, dashArray: dashArray, bubblingMouseEvents: true
            });
        } else if (g.type === 'Polyline') {
            layer = L.polyline(coords, {
                color: g.color, opacity: g.opacity, weight: g.lineWeight, dashArray: dashArray
            });
            if (g.arrowType) {
                layer._arrowType = g.arrowType;
                SVGUtils.addArrowheadsToPolylineSVG(layer, g.arrowType);
            }
        } else if (g.type === 'Circle' || g.type === 'CircleMarker') {
            layer = L.circleMarker(coords, {
                radius: g.radius || (coords?.radius ? coords.radius / 1000 : 10),
                fillColor: g.color, color: g.lineColor, fillOpacity: g.opacity, opacity: g.opacity,
                weight: g.lineWeight, dashArray: dashArray, bubblingMouseEvents: true
            });
        }
        return layer;
    }

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
            const allCoords = g.coordinatesList && g.coordinatesList.length > 0 ? g.coordinatesList : [g.coordinates];
            const layers = [];

            allCoords.forEach(coords => {
                const layer = StateDeserializer._createLayerForCoords(g, coords);
                if (layer) {
                    layer.addTo(mapManager.map);
                    layers.push(layer);
                }
            });

            if (layers.length > 0) {
                const primaryLayer = layers[0];
                const geomObj = {
                    ...g,
                    layer: primaryLayer,
                    layers: layers,
                    coordinates: allCoords[0],
                    coordinatesList: allCoords
                };

                stateManager.geometries.push(geomObj);
                const currentIdx = stateManager.geometries.length - 1;

                layers.forEach(layer => {
                    if (layer.on) {
                        layer.on('click', (e) => {
                            if (stateManager.isStamping?.()) return;
                            L.DomEvent?.stopPropagation?.(e);
                            stateManager.selectGeometry(currentIdx);
                        });
                    }
                });
            }
        });

        stateManager.updateUI();
    }
}
