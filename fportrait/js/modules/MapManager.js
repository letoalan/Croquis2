// MapManager.js - Orchestrateur modulaire de la carte Leaflet
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
