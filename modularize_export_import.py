import os

def modularize_export_import_manager():
    targets = [
        'fpaysage/js/modules/mapping/io/ExportImportManager.js',
        'fportrait/js/modules/mapping/io/ExportImportManager.js',
        'fpromethean/js/modules/mapping/io/ExportImportManager.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        io_dir = os.path.join(dirpath, 'io_parts')
        os.makedirs(io_dir, exist_ok=True)

        serializer_code = '''// StateSerializer.js - Sérialisation JSON de l'état applicatif complet

export class StateSerializer {
    static serialize(stateManager, mapManager) {
        const center = mapManager.map.getCenter();
        const bounds = mapManager.map.getBounds();
        const tileType = mapManager.tileLayerManager?.getCurrentTileType?.() || 'osm';

        const geometries = stateManager.geometries.map((geom, idx) => ({
            id: geom.id || `geom_${idx}`,
            type: geom.type,
            name: geom.name,
            coordinates: geom.coordinates,
            color: geom.color,
            lineColor: geom.lineColor,
            opacity: geom.opacity,
            lineDash: geom.lineDash,
            lineWeight: geom.lineWeight,
            markerSize: geom.markerSize,
            arrowType: geom.arrowType,
            partId: stateManager.getGeometryPart?.(idx) ?? null
        }));

        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            mapTitle: stateManager.mapTitle || '',
            mapState: {
                center: { lat: center.lat, lng: center.lng },
                zoom: mapManager.map.getZoom(),
                bounds: bounds,
                tileLayer: tileType
            },
            legendParts: stateManager.legendParts || [],
            geometries: geometries
        };
    }
}
'''

        deserializer_code = '''// StateDeserializer.js - Restauration et ré-instanciation des calques

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
'''

        manager_code = '''// ExportImportManager.js - Façade modulaire pour l'exportation et importation JSON
import { StateSerializer } from './io_parts/StateSerializer.js';
import { StateDeserializer } from './io_parts/StateDeserializer.js';

export class ExportImportManager {
    constructor(stateManager, mapManager) {
        if (!stateManager) throw new Error('StateManager is required.');
        if (!mapManager) throw new Error('MapManager is required.');
        this.stateManager = stateManager;
        this.mapManager = mapManager;
    }

    exportState() {
        return StateSerializer.serialize(this.stateManager, this.mapManager);
    }

    downloadJSON() {
        const state = this.exportState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `croquis-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    }

    importState(state) {
        try {
            StateDeserializer.restore(state, this.stateManager, this.mapManager);
            return true;
        } catch (err) {
            console.error('[ExportImportManager] Import error:', err);
            alert("Erreur lors de l'import : " + err.message);
            return false;
        }
    }
}
'''

        with open(os.path.join(io_dir, 'StateSerializer.js'), 'w', encoding='utf-8') as f:
            f.write(serializer_code)
        with open(os.path.join(io_dir, 'StateDeserializer.js'), 'w', encoding='utf-8') as f:
            f.write(deserializer_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(manager_code)
        print(f"Modularized ExportImportManager for {t}")

if __name__ == '__main__':
    modularize_export_import_manager()
