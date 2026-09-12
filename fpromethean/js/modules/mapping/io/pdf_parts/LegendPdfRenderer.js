// LegendPdfRenderer.js - Capture haute fidélité de la légende pour l'export PDF

export class LegendPdfRenderer {

    static async captureLegend(legendContainer, scale) {
        if (!legendContainer) return { canvases: [], maxHeight: 0, totalWidth: 0 };

        const legendPartColumns = Array.from(legendContainer.querySelectorAll('.legend-part-column'));
        const unclassifiedContainer = legendContainer.querySelector('.legend-unclassified-section');
        const hasUnclassified = unclassifiedContainer && unclassifiedContainer.querySelectorAll('.legend-item').length > 0;

        const legendCanvases = [];
        let maxLegendHeight = 0;
        let totalLegendWidth = 0;

        const targetContainers = [...legendPartColumns];
        if (hasUnclassified) targetContainers.push(unclassifiedContainer);

        for (const col of targetContainers) {
            if (this._hasVisibleSize(col)) {
                col.dataset.pdfCapturing = 'true';
                const colCanvas = await html2canvas(col, {
                    backgroundColor: '#FFFFFF',
                    scale: 2,
                    logging: false,
                    willReadFrequently: true,
                    onclone: (clonedDoc) => {
                        const clonedCol = clonedDoc.querySelector('[data-pdf-capturing="true"]');
                        if (clonedCol) {
                            clonedCol.style.setProperty('background', '#FFFFFF', 'important');
                            clonedCol.style.setProperty('background-color', '#FFFFFF', 'important');
                            clonedCol.style.setProperty('opacity', '1', 'important');
                            clonedCol.style.setProperty('backdrop-filter', 'none', 'important');
                            clonedCol.style.setProperty('color', '#000000', 'important');
                            clonedCol.style.borderTop = '4px solid #4834d4';

                            const allElements = clonedCol.querySelectorAll('*');
                            allElements.forEach(el => {
                                el.style.setProperty('opacity', '1', 'important');
                                el.style.setProperty('backdrop-filter', 'none', 'important');
                                el.style.setProperty('color', '#1a1a1a', 'important');

                                if (el.classList.contains('legend-item') ||
                                    el.classList.contains('legend-part-title') ||
                                    el.classList.contains('legend-subpart-header') ||
                                    el.classList.contains('legend-part-column') ||
                                    el.classList.contains('legend-subpart-items')) {
                                    el.style.setProperty('background', '#FFFFFF', 'important');
                                    el.style.setProperty('background-color', '#FFFFFF', 'important');
                                    el.style.setProperty('border', '1px solid #CCCCCC', 'important');
                                }

                                if (el.tagName === 'BUTTON' || el.classList.contains('btn')) {
                                    el.style.setProperty('background', '#EEEEEE', 'important');
                                    el.style.setProperty('border', '1px solid #999999', 'important');
                                    el.style.setProperty('color', '#000000', 'important');
                                }

                                if (el.classList.contains('legend-empty-message') || el.classList.contains('legend-empty-state')) {
                                    el.style.setProperty('color', '#666666', 'important');
                                }
                            });
                        }
                    }
                });
                delete col.dataset.pdfCapturing;
                const colWidth = col.offsetWidth * scale;
                const colHeight = col.offsetHeight * scale;
                legendCanvases.push({ canvas: colCanvas, width: colWidth, height: colHeight, element: col });
                maxLegendHeight = Math.max(maxLegendHeight, colHeight);
                totalLegendWidth += colWidth + (10 * scale);
            }
        }

        return { canvases: legendCanvases, maxHeight: maxLegendHeight, totalWidth: totalLegendWidth };
    }

    static drawLegendToCanvas(ctx, legendData, startY, canvasWidth, scale, stateManager) {
        const { canvases, totalWidth } = legendData;
        if (!canvases || canvases.length === 0) return;

        let currentX = 20 * scale;
        const padding = 40 * scale;
        const availableWidth = canvasWidth - padding;
        const legendScale = totalWidth > availableWidth ? availableWidth / totalWidth : 1;

        for (const item of canvases) {
            const drawW = item.width * legendScale;
            const drawH = item.height * legendScale;
            ctx.drawImage(item.canvas, currentX, startY, drawW, drawH);
            this._redrawLegendSymbolsInColumn(ctx, item.element, currentX, startY, scale * legendScale, stateManager);
            currentX += drawW + (10 * scale * legendScale);
        }
    }

    static _redrawLegendSymbolsInColumn(ctx, columnContainer, offsetX, offsetY, scale, stateManager) {
        const allSymbols = columnContainer.querySelectorAll('.legend-item .legend-symbol');
        const columnRect = columnContainer.getBoundingClientRect();

        const styleMap = new Map();
        (stateManager?.geometries || []).forEach((geom, index) => {
            if (geom.type === 'Polyline') {
                styleMap.set(index, {
                    color: geom.lineColor || '#3388ff',
                    weight: geom.lineWeight || 3,
                    dashArray: geom.lineDash === 'solid' ? null : (geom.lineDash === 'dashed' ? '10, 10' : '2, 6'),
                    arrowType: geom.arrowType || null
                });
            }
        });

        allSymbols.forEach((symbolDiv) => {
            const geometryItem = symbolDiv.closest('.legend-item');
            if (!geometryItem) return;
            const geomIndex = parseInt(geometryItem.dataset.index || geometryItem.dataset.geometryIndex);
            const style = styleMap.get(geomIndex);
            if (!style) return;

            const symbolRect = symbolDiv.getBoundingClientRect();
            const x = offsetX + (symbolRect.left - columnRect.left) * scale;
            const y = offsetY + (symbolRect.top - columnRect.top) * scale;
            const width = symbolRect.width * scale;
            const height = symbolRect.height * scale;

            ctx.save();
            ctx.strokeStyle = style.color;
            ctx.lineWidth = Math.max(style.weight * scale * 0.5, 2);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (style.dashArray) {
                ctx.setLineDash(style.dashArray.split(',').map(d => parseFloat(d) * scale * 0.5));
            } else {
                ctx.setLineDash([]);
            }

            const lineY = y + height / 2;
            const startX = x + 5;
            const endX = x + width - 5;
            ctx.beginPath();
            ctx.moveTo(startX, lineY);
            ctx.lineTo(endX, lineY);
            ctx.stroke();
            ctx.setLineDash([]);

            if (style.arrowType) {
                const arrowSize = Math.min(width * 0.2, 8);
                if (style.arrowType === 'arrow' || style.arrowType === 'doubleArrow') {
                    this._drawSmallArrowhead(ctx, endX, lineY, 0, arrowSize, style.color);
                }
                if (style.arrowType === 'doubleArrow') {
                    this._drawSmallArrowhead(ctx, startX, lineY, Math.PI, arrowSize, style.color);
                }
            }
            ctx.restore();
        });
    }

    static _drawSmallArrowhead(ctx, x, y, angle, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size / 2);
        ctx.lineTo(-size, size / 2);
        ctx.closePath();
        ctx.fillStyle = color || '#3388ff';
        ctx.fill();
        ctx.restore();
    }

    static _hasVisibleSize(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }
}
