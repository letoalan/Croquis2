// MapEditingEvents.js - Configuration des écouteurs d'édition de Leaflet-Geoman

import { SVGUtils } from '../utils/SVGUtils.js';

export class MapEditingEvents {
    static setup(map, stateManager, geometryHandler, lineControlManager) {
        if (!map || !stateManager) return;

        map.on('pm:create', (e) => {
            const { shape, layer } = e;

            if (shape === 'Rectangle') {
                console.log('[MapEditingEvents] Rectangle créé → conversion en polygone');
                const latLngs = layer.getLatLngs()[0];
                const options = {
                    color: layer.options.color || '#3388ff',
                    fillColor: layer.options.fillColor || '#3388ff',
                    fillOpacity: layer.options.fillOpacity || 0.2,
                    weight: layer.options.weight || 3,
                    opacity: layer.options.opacity || 1,
                    dashArray: layer.options.dashArray || null,
                };
                const polygon = L.polygon(latLngs, options).addTo(map);
                map.removeLayer(layer);
                polygon.pm.enable({ snappable: true, snapDistance: 20, snapMiddle: true, allowSelfIntersection: false });
                polygon.pm.disable();

                polygon.options.bubblingMouseEvents = true;
                if (geometryHandler) {
                    const geometryObject = geometryHandler.createGeometryObject(polygon);
                    if (geometryObject) {
                        stateManager.addGeometry(geometryObject);
                        console.log('[MapEditingEvents] ✅ Polygone (ex-rectangle) ajouté au state');
                    }
                }
                return;
            }

            if (shape === 'Line') {
                // Toujours délégué à LineControlManager (qui gère pm:create lui-même)
                // Ne jamais enregistrer de géométrie ici pour éviter les doublons
                return;
            }

            // Autres formes créées (Circle, Polygon, Marker)
            const existing = stateManager.geometries.find(g => g.layer === layer);
            if (existing) return;

            if (layer?.options) {
                layer.options.bubblingMouseEvents = true;
            }

            if (geometryHandler) {
                try {
                    const geometryObject = geometryHandler.createGeometryObject(layer);
                    if (geometryObject) {
                        stateManager.addGeometry(geometryObject);
                        console.log('[MapEditingEvents] ✅ Géométrie ajoutée au state:', geometryObject.type);
                    }
                } catch (err) {
                    console.error('[MapEditingEvents] ❌ Erreur création géométrie:', err);
                }
            }
        });

        map.on('pm:vertex:dragend pm:markerdragend pm:dragend', (e) => {
            if (e.layer?._arrowType) {
                const idx = stateManager.geometries.findIndex(g => g.layer === e.layer);
                if (idx !== -1) {
                    stateManager.updateGeometry(idx, e.layer.getLatLngs());
                }
            }
        });

        map.on('pm:dragend', (e) => {
            if (e.layer?._arrowType) {
                SVGUtils.restoreArrowsAfterDrag(e.layer);
            }
        });
    }
}
