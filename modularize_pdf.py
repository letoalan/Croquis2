import os

def modularize_pdfexporter():
    targets = [
        'fpaysage/js/modules/mapping/io/PDFExporter.js',
        'fportrait/js/modules/mapping/io/PDFExporter.js',
        'fpromethean/js/modules/mapping/io/PDFExporter.js'
    ]

    smartcrop_code = '''// SmartCropEngine.js - Algorithme de cadrage A4 paysage anti-déformation

export class SmartCropEngine {
    static computeCropWindow(map, vectorData, baseWidth, baseHeight) {
        const bounds = map.getBounds();
        const sw = map.latLngToContainerPoint(bounds.getSouthWest());
        const ne = map.latLngToContainerPoint(bounds.getNorthEast());

        const mapWidth = Math.abs(ne.x - sw.x);
        const mapHeight = Math.abs(sw.y - ne.y);
        const targetRatio = 297 / 210;

        let cropWidth = mapWidth;
        let cropHeight = mapWidth / targetRatio;

        if (cropHeight > mapHeight) {
            cropHeight = mapHeight;
            cropWidth = mapHeight * targetRatio;
        }

        const startX = Math.max(0, (mapWidth - cropWidth) / 2);
        const startY = Math.max(0, (mapHeight - cropHeight) / 2);

        return {
            x: Math.round(startX),
            y: Math.round(startY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight)
        };
    }
}
'''

    composer_code = '''// PdfCanvasComposer.js - Rendu canvas et assemblage jsPDF

export class PdfCanvasComposer {
    static async captureElement(element, scale = 2) {
        if (typeof html2canvas !== 'function') throw new Error('html2canvas not loaded');
        return await html2canvas(element, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            logging: false
        });
    }

    static generatePDF(canvas) {
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF not loaded');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        pdf.save(`croquis-${new Date().toISOString().slice(0, 10)}.pdf`);
    }
}
'''

    exporter_code = '''// js/modules/mapping/io/PDFExporter.js
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
'''

    for t in targets:
        dirpath = os.path.dirname(t)
        pdf_dir = os.path.join(dirpath, 'pdf_parts')
        os.makedirs(pdf_dir, exist_ok=True)
        with open(os.path.join(pdf_dir, 'SmartCropEngine.js'), 'w', encoding='utf-8') as f:
            f.write(smartcrop_code)
        with open(os.path.join(pdf_dir, 'PdfCanvasComposer.js'), 'w', encoding='utf-8') as f:
            f.write(composer_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(exporter_code)
        print(f"Modularized PDFExporter for {t}")

if __name__ == '__main__':
    modularize_pdfexporter()
