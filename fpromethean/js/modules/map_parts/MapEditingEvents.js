// MapEditingEvents.js - Configuration des écouteurs d'édition de Leaflet-Geoman

import { SVGUtils } from '../utils/SVGUtils.js';

export class MapEditingEvents {
    static setup(map, stateManager) {
        if (!map || !stateManager) return;

        map.on('pm:create', (e) => {
            if (e.shape === 'Rectangle' || e.shape === 'Line') return;
            const existing = stateManager.geometries.find(g => g.layer === e.layer);
            if (existing) return;
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
