// js/modules/mapping/io/PDFExporter.js
// Export PDF haute fidélité modulaire (Alignement tuiles/vecteurs et proportions préservées)

import { VectorCanvasRenderer } from './pdf_parts/VectorCanvasRenderer.js';
import { LegendPdfRenderer } from './pdf_parts/LegendPdfRenderer.js';
import { PdfCanvasComposer } from './pdf_parts/PdfCanvasComposer.js';

export class PDFExporter {
    constructor(mapManager, legendManager, stateManager, tileLayerManager = null) {
        if (!mapManager) throw new Error('MapManager requis pour PDFExporter.');
        if (!legendManager) throw new Error('LegendManager requis pour PDFExporter.');
        if (!stateManager) throw new Error('StateManager requis pour PDFExporter.');

        this.mapManager = mapManager;
        this.legendManager = legendManager;
        this.stateManager = stateManager;
        this.tileLayerManager = tileLayerManager;
    }

    setTileLayerManager(tileLayerManager) {
        if (tileLayerManager) this.tileLayerManager = tileLayerManager;
    }

    async exportPDF() {
        console.log('[PDFExporter] ====== EXPORT PDF START ======');
        try {
            const map = this.mapManager.map;
            const mapContainer = document.getElementById('map');
            if (!map || !mapContainer) throw new Error('Carte ou conteneur introuvable.');

            const canvas = await this._captureFullMap(map, mapContainer);
            PdfCanvasComposer.generatePDF(canvas, this.stateManager.mapTitle);
            console.log('[PDFExporter] ====== EXPORT PDF SUCCESS ======');
        } catch (error) {
            console.error('[PDFExporter] Export PDF failed:', error);
            alert("Erreur lors de l'export PDF : " + error.message);
        }
    }

    async _captureFullMap(map, mapContainer) {
        const legendContainer = this.legendManager.legendControl?.getContainer?.() || this.legendManager.container;
        this._ensureLegendVisible(legendContainer);

        // 1. Extraire les couches vectorielles pour éviter le décalage CSS d'html2canvas
        const vectorData = [];
        map.eachLayer(layer => {
            if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.CircleMarker) {
                let type = 'polyline';
                if (layer instanceof L.Marker) type = 'marker';
                else if (layer instanceof L.Circle) type = layer.getRadius ? 'circle-geo' : 'circle-marker';
                else if (layer instanceof L.CircleMarker) type = 'circle-marker';
                else if (layer instanceof L.Polygon) type = 'polygon';
                vectorData.push({ layer, type, arrowType: layer._arrowType || layer.arrowType || null });
                map.removeLayer(layer);
            }
        });

        // 2. Capture isolée de l'échelle, de la rose des vents ET de la légende
        //    AVANT masquage des contrôles UI (la légende est un Leaflet control,
        //    donc elle serait invisible après le display:none)
        let scaleCanvas = null;
        let orientationCanvas = null;
        let scalePos = 'bottomleft';
        let orientationPos = 'topleft';
        const captureScale = 2; // Même valeur que le paramètre scale de html2canvas
        let legendData = { canvases: [], maxHeight: 0, totalWidth: 0 };

        try {
            const scaleContainer = this.mapManager.scaleOrientationManager?.getScaleContainer?.();
            const orientationContainer = this.mapManager.scaleOrientationManager?.getOrientationContainer?.();
            const scaleControl = this.mapManager.scaleOrientationManager?.getScaleControl?.();
            const orientationControl = this.mapManager.scaleOrientationManager?.getOrientationControl?.();

            if (scaleControl?.options?.position) {
                scalePos = scaleControl.options.position;
            }
            if (orientationControl?.options?.position) {
                orientationPos = orientationControl.options.position;
            }

            if (scaleContainer && this._hasVisibleSize(scaleContainer)) {
                scaleCanvas = await html2canvas(scaleContainer, { useCORS: true, allowTaint: true, logging: false, scale: captureScale, backgroundColor: null });
            }
            if (orientationContainer && this._hasVisibleSize(orientationContainer)) {
                orientationCanvas = await html2canvas(orientationContainer, { useCORS: true, allowTaint: true, logging: false, scale: captureScale, backgroundColor: null });
            }
        } catch (err) {
            console.warn('[PDFExporter] Erreur capture échelle / orientation:', err);
        }

        // 2b. Capture de la légende AVANT masquage (elle vit dans .leaflet-control-container)
        try {
            legendData = await LegendPdfRenderer.captureLegend(legendContainer, captureScale);
            console.log('[PDFExporter] Legend captured:', legendData.canvases.length, 'colonnes, maxHeight:', legendData.maxHeight);
        } catch (err) {
            console.warn('[PDFExporter] Erreur capture légende:', err);
        }

        // 3. Masquer les contrôles natifs Leaflet et conteneurs de flèches personnalisés
        const controls = document.querySelectorAll('.leaflet-control-container');
        controls.forEach(c => (c.style.display = 'none'));
        const customArrows = [document.getElementById('leaflet-arrows-group'), document.getElementById('arrow-svg-container')];
        customArrows.forEach(c => { if (c) c.style.display = 'none'; });

        try {
            await new Promise(r => setTimeout(r, 200));

            // Capture raster propre des tuiles
            const baseCanvas = await html2canvas(mapContainer, {
                useCORS: true,
                allowTaint: true,
                logging: false,
                scale: 2,
                backgroundColor: '#FFFFFF'
            });

            const scale = baseCanvas.width / mapContainer.offsetWidth;
            const titleHeight = this.stateManager.mapTitle ? 80 : 0;

            // 4. Utiliser la légende déjà capturée (avant masquage des contrôles)
            const extraLegendHeight = legendData.maxHeight > 0 ? legendData.maxHeight + (40 * scale) : 0;

            // 5. Assembler le canvas composite
            const { canvas: finalCanvas, ctx } = PdfCanvasComposer.createCompositeCanvas(
                baseCanvas, titleHeight, this.stateManager.mapTitle, extraLegendHeight
            );

            // 6. Redessiner les couches vectorielles avec alignement mathématique au pixel près
            ctx.save();
            ctx.translate(0, titleHeight);
            VectorCanvasRenderer.drawAllVectors(ctx, map, vectorData, scale);
            ctx.restore();

            // 7. Dessiner la rose des vents et l'échelle selon leur position
            const margin = 20 * scale;
            if (scaleCanvas) {
                let sx = margin;
                if (scalePos.includes('right')) {
                    sx = baseCanvas.width - scaleCanvas.width - margin;
                }
                let sy = titleHeight + baseCanvas.height - scaleCanvas.height - margin;
                if (scalePos.includes('top')) {
                    sy = titleHeight + margin;
                }
                PdfCanvasComposer.drawControlCanvas(ctx, scaleCanvas, sx, sy);
            }

            if (orientationCanvas) {
                let ox = margin;
                if (orientationPos.includes('right')) {
                    ox = baseCanvas.width - orientationCanvas.width - margin;
                }
                let oy = titleHeight + margin;
                if (orientationPos.includes('bottom')) {
                    oy = titleHeight + baseCanvas.height - orientationCanvas.height - margin;
                }
                PdfCanvasComposer.drawControlCanvas(ctx, orientationCanvas, ox, oy);
            }

            // 8. Dessiner la légende
            if (legendData.canvases.length > 0) {
                const legendStartY = titleHeight + baseCanvas.height + (20 * scale);
                LegendPdfRenderer.drawLegendToCanvas(ctx, legendData, legendStartY, finalCanvas.width, scale, this.stateManager);
            }

            return finalCanvas;
        } finally {
            // Restaurer les couches sur la carte
            vectorData.forEach(({ layer, arrowType }) => {
                if (!map.hasLayer(layer)) map.addLayer(layer);
                if (arrowType && typeof SVGUtils !== 'undefined' && SVGUtils.addArrowheadsToPolylineSVG) {
                    setTimeout(() => SVGUtils.addArrowheadsToPolylineSVG(layer, arrowType), 50);
                }
            });
            controls.forEach(c => (c.style.display = 'block'));
            customArrows.forEach(c => { if (c) c.style.display = 'block'; });
        }
    }

    _ensureLegendVisible(legendContainer) {
        if (!legendContainer) return;
        const sidePanel = legendContainer.closest('.side-panel');
        if (sidePanel) {
            sidePanel.classList.add('active');
            const panelsContainer = document.getElementById('panelsContainer');
            if (panelsContainer) panelsContainer.style.width = 'var(--sidebar-width)';
        }
        legendContainer.style.display = 'block';
        legendContainer.style.visibility = 'visible';
    }

    _hasVisibleSize(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }
}
