// js/modules/mapping/io/PDFExporter.js
import { SmartCropEngine } from './pdf_parts/SmartCropEngine.js';
import { PdfCanvasComposer } from './pdf_parts/PdfCanvasComposer.js';

export class PDFExporter {
    constructor(mapManager, legendManager, stateManager, tileLayerManager = null) {
        if (!mapManager) throw new Error('MapManager is required for PDFExporter.');
        if (!legendManager) throw new Error('LegendManager is required for PDFExporter.');
        if (!stateManager) throw new Error('StateManager is required for PDFExporter.');

        this.mapManager = mapManager;
        this.legendManager = legendManager;
        this.stateManager = stateManager;
        this.tileLayerManager = tileLayerManager;
        this.CORS_SAFE_TILES = ['osm', 'cartodb'];
    }

    setTileLayerManager(tileLayerManager) {
        if (tileLayerManager) this.tileLayerManager = tileLayerManager;
    }

    async exportPDF() {
        console.log('[PDFExporter] ====== EXPORT PDF START ======');
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) throw new Error('Map container not found');

            const canvas = await PdfCanvasComposer.captureElement(mapContainer, 2);
            PdfCanvasComposer.generatePDF(canvas);
            console.log('[PDFExporter] ====== EXPORT PDF SUCCESS ======');
        } catch (error) {
            console.error('[PDFExporter] Export PDF failed:', error);
            alert("Erreur lors de l'export PDF : " + error.message);
        }
    }
}
