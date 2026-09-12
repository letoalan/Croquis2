import os

def modularize_map_manager():
    targets = [
        'fpaysage/js/modules/MapManager.js',
        'fportrait/js/modules/MapManager.js',
        'fpromethean/js/modules/MapManager.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        map_parts_dir = os.path.join(dirpath, 'map_parts')
        os.makedirs(map_parts_dir, exist_ok=True)

        tilesources_code = '''// TileSources.js - Définitions des couches et fournisseurs de tuiles cartographiques

export const TILE_SOURCES = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    cartodb: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Satellite'
    },
    topo: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap'
    },
    toner: {
        url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png',
        attribution: '© Stadia Maps'
    },
    positron: {
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        attribution: '© CARTO'
    },
    osmFrance: {
        url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap France'
    }
};
'''

        events_code = '''// MapEditingEvents.js - Configuration des écouteurs d'édition de Leaflet-Geoman

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
'''

        mapmanager_code = '''// MapManager.js - Orchestrateur modulaire de la carte Leaflet
import { TileLayerManager } from './mapping/layers/TileLayerManager.js';
import { TileSelectorControl } from './mapping/layers/TileSelectorControl.js';
import { LayerGroupManager } from './mapping/layers/LayerGroupManager.js';
import { MarkerControlManager } from './mapping/markers/MarkerControlManager.js';
import { LineControlManager } from './mapping/lines/LineControlManager.js';
import { CurveControlManager } from './mapping/lines/CurveControlManager.js';
import { GeometryHandler } from './mapping/geometry/GeometryHandler.js';
import { ScaleOrientationManager } from './mapping/controls/ScaleOrientationManager.js';
import { PDFExporter } from './mapping/io/PDFExporter.js';
import { SVGUtils } from './utils/SVGUtils.js';
import { TILE_SOURCES } from './map_parts/TileSources.js';
import { MapEditingEvents } from './map_parts/MapEditingEvents.js';

export class MapManager {
    constructor(stateManager) {
        if (!stateManager) throw new Error('StateManager is required for MapManager.');
        this.stateManager = stateManager;
        this.map = null;
        this.tileLayerManager = null;
        this.tileSelectorControl = null;
        this.layerGroupManager = null;
        this.geometryHandler = null;
        this.legendManager = null;
        this.markerControlManager = null;
        this.lineControlManager = null;
        this.curveControlManager = null;
        this.scaleOrientationManager = null;
        this.pdfExporter = null;
        this.tileSources = TILE_SOURCES;
    }

    initMap() {
        console.log('[MapManager] Initializing modular map...');
        this.map = L.map('map', { center: [46.603354, 1.888334], zoom: 6 });
        window.map = this.map;

        this.tileLayerManager = new TileLayerManager(this.map, this.tileSources);
        this.tileSelectorControl = new TileSelectorControl(this.tileLayerManager);
        this.tileSelectorControl.addTo(this.map);

        this.layerGroupManager = new LayerGroupManager(this.map);
        this.geometryHandler = new GeometryHandler(this.map, this.layerGroupManager);

        this.markerControlManager = new MarkerControlManager(this.map, this.stateManager);
        this.markerControlManager.init();

        this.lineControlManager = new LineControlManager(this.map, this.stateManager);
        this.lineControlManager.init();

        this.curveControlManager = new CurveControlManager(this.map, this.stateManager);
        this.curveControlManager.addCurveControl();

        this.scaleOrientationManager = new ScaleOrientationManager(this.map);

        if (this.stateManager.legendManager) {
            this.pdfExporter = new PDFExporter(this, this.stateManager.legendManager, this.stateManager, this.tileLayerManager);
        }

        this.map.pm?.addControls({
            position: 'topleft',
            drawCircle: true,
            drawMarker: true,
            drawPolygon: true,
            drawPolyline: false,
            drawRectangle: true,
            editMode: true,
            dragMode: true,
            cutPolygon: false,
            removalMode: true
        });

        MapEditingEvents.setup(this.map, this.stateManager);
        console.log('[MapManager] Map initialized successfully');
    }

    updateMap() {
        if (!this.layerGroupManager) return;
        this.layerGroupManager.clearLayers();
        this.stateManager.geometries.forEach(geom => {
            if (geom.layer) this.layerGroupManager.addLayer(geom.layer);
        });
    }
}
'''

        with open(os.path.join(map_parts_dir, 'TileSources.js'), 'w', encoding='utf-8') as f:
            f.write(tilesources_code)
        with open(os.path.join(map_parts_dir, 'MapEditingEvents.js'), 'w', encoding='utf-8') as f:
            f.write(events_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(mapmanager_code)
        print(f"Modularized MapManager for {t}")

if __name__ == '__main__':
    modularize_map_manager()
