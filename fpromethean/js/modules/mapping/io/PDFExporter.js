// js/modules/mapping/io/PDFExporter.js
// Réécriture complète: capture robuste de la carte, de la légende et des contrôles

export class PDFExporter {
    constructor(mapManager, legendManager, stateManager, tileLayerManager = null) {
        if (!mapManager) throw new Error('MapManager is required for PDFExporter initialization.');
        if (!legendManager) throw new Error('LegendManager is required for PDFExporter initialization.');
        if (!stateManager) throw new Error('StateManager is required for PDFExporter initialization.');

        this.mapManager = mapManager;
        this.legendManager = legendManager;
        this.stateManager = stateManager;
        this.tileLayerManager = tileLayerManager;
        this.CORS_SAFE_TILES = ['osm', 'cartodb'];
        console.log('[PDFExporter] Initialized');
    }

    setTileLayerManager(tileLayerManager) {
        if (!tileLayerManager) return;
        this.tileLayerManager = tileLayerManager;
    }

    _isCurrentTileCORSSafe() {
        if (!this.tileLayerManager || typeof this.tileLayerManager.getCurrentTileType !== 'function') return true;
        return this.CORS_SAFE_TILES.includes(this.tileLayerManager.getCurrentTileType());
    }

    async exportPDF() {
        try {
            const canvas = await this._captureMap();
            await this._generatePDF(canvas);
        } catch (error) {
            console.error('[PDFExporter] Export PDF failed:', error);
            alert("Erreur lors de l'export PDF : " + error.message);
        }
    }

    async _captureMap() {
        const map = this.mapManager.map;
        const mapContainer = document.getElementById('map');
        if (!map || !mapContainer) throw new Error('Map or container not found');

        const hasArrowheads = (this.stateManager.geometries || []).some(g => g.layer?._arrowType === 'arrow' || g.layer?._arrowType === 'doubleArrow');
        const canUseLeafletImage = typeof window.leafletImage === 'function' && this._isCurrentTileCORSSafe() && !hasArrowheads;

        if (canUseLeafletImage) {
            try {
                return await this._useLeafletImage(map, mapContainer);
            } catch (e) {
                console.warn('[PDFExporter] leaflet-image failed, fallback to manual capture:', e);
            }
        }
        return await this._manualLayerCapture(map, mapContainer);
    }

    async _useLeafletImage(map, mapContainer) {
        const legendContainer = this.legendManager.legendControl?.getContainer?.();
        this._ensureLegendVisible(legendContainer);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('leaflet-image timeout after 10s')), 10000);
            window.leafletImage(map, async (err, mapCanvas) => {
                clearTimeout(timeout);
                if (err) return reject(err);
                try {
                    if (legendContainer && this._hasVisibleSize(legendContainer)) {
                        const finalCanvas = await this._composeLegendOnMapCanvas(mapCanvas, legendContainer, mapContainer);
                        resolve(finalCanvas);
                    } else {
                        resolve(mapCanvas);
                    }
                } catch (e) {
                    console.warn('[PDFExporter] Legend composition failed:', e);
                    resolve(mapCanvas);
                }
            });
        });
    }

    async _manualLayerCapture(map, mapContainer) {
        // Support for both Leaflet Control and custom HTML container (Promethean mode)
        const legendContainer = (this.legendManager.legendControl?.getContainer?.()) || this.legendManager.container;
        this._ensureLegendVisible(legendContainer);

        const vectorData = [];
        map.eachLayer(layer => {
            if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.CircleMarker) {
                let type;
                if (layer instanceof L.Marker) type = 'marker';
                else if (layer instanceof L.Circle) type = layer.getRadius ? 'circle-geo' : 'circle-marker';
                else if (layer instanceof L.CircleMarker) type = 'circle-marker';
                else if (layer instanceof L.Polygon) type = 'polygon';
                else type = 'polyline';
                vectorData.push({ layer, type, arrowType: layer._arrowType || layer.arrowType || null });
                map.removeLayer(layer);
            }
        });

        // We don't call SVGUtils.removeArrowheadsFromPolylineSVG here because it's destructive (deletes _arrowType).
        // Since we remove the layers from the map anyway, the SVG arrows will disappear from the overlayPane automatically.

        const controls = document.querySelectorAll('.leaflet-control-container');
        controls.forEach(c => (c.style.display = 'none'));

        const vectorPane = map.getPane('overlayPane');
        const oldZ = vectorPane.style.zIndex;
        vectorPane.style.zIndex = '9999';
        vectorPane.style.position = 'relative';

        // Temporarily hide custom arrow containers to avoid doubling (we redraw them manually)
        const customArrowContainers = [
            document.getElementById('leaflet-arrows-group'),
            document.getElementById('arrow-svg-container')
        ];
        customArrowContainers.forEach(c => { if (c) c.style.display = 'none'; });

        let scaleCanvas = null;
        let orientationCanvas = null;
        try {
            const scaleContainer = this.mapManager.scaleOrientationManager?.getScaleContainer?.();
            const orientationContainer = this.mapManager.scaleOrientationManager?.getOrientationContainer?.();

            // Temporarily show controls for capture if they exist
            if (scaleContainer) scaleContainer.style.display = 'block';
            if (orientationContainer) orientationContainer.style.display = 'block';

            if (scaleContainer && this._hasVisibleSize(scaleContainer)) {
                scaleCanvas = await html2canvas(scaleContainer, { useCORS: true, allowTaint: true, logging: false, scale: 2, backgroundColor: 'transparent' });
            }
            if (orientationContainer && this._hasVisibleSize(orientationContainer)) {
                orientationCanvas = await html2canvas(orientationContainer, { useCORS: true, allowTaint: true, logging: false, scale: 2, backgroundColor: 'transparent' });
            }

            await new Promise(r => setTimeout(r, 300));
            const captureTarget = mapContainer.parentElement;
            if (!captureTarget) throw new Error('Map container has no parent element to capture.');

            const baseCanvas = await html2canvas(captureTarget, {
                useCORS: true,
                allowTaint: true,
                logging: false,
                scale: 2,
                backgroundColor: '#FFFFFF',
            });

            const titleHeight = this.stateManager.mapTitle ? 80 : 0;
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = baseCanvas.width;
            finalCanvas.height = baseCanvas.height + titleHeight;
            let ctx = finalCanvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            if (this.stateManager.mapTitle) {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.stateManager.mapTitle, finalCanvas.width / 2, titleHeight / 2);
            }

            ctx.drawImage(baseCanvas, 0, titleHeight);
            const scale = baseCanvas.width / captureTarget.offsetWidth;

            // --- PROMETHEAN LEGEND REDESIGN ---
            // 1. Prepare legend columns
            const legendPartColumns = Array.from(legendContainer.querySelectorAll('.legend-part-column'));
            const unclassifiedContainer = legendContainer.querySelector('.legend-unclassified-section');
            const hasUnclassified = unclassifiedContainer && unclassifiedContainer.querySelectorAll('.legend-item').length > 0;
            
            const legendCanvases = [];
            let maxLegendHeight = 0;
            let totalLegendWidth = 0;

            if (legendPartColumns.length > 0 || hasUnclassified) {
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
                                        el.style.setProperty('color', '#1a1a1a', 'important'); // Dark text
                                        
                                        // Force white background for containers
                                        if (el.classList.contains('legend-item') || 
                                            el.classList.contains('legend-part-title') || 
                                            el.classList.contains('legend-subpart-header') ||
                                            el.classList.contains('legend-part-column') ||
                                            el.classList.contains('legend-subpart-items')) {
                                            el.style.setProperty('background', '#FFFFFF', 'important');
                                            el.style.setProperty('background-color', '#FFFFFF', 'important');
                                            el.style.setProperty('border', '1px solid #CCCCCC', 'important');
                                        }
                                        
                                        // Make buttons solid instead of gradients
                                        if (el.tagName === 'BUTTON' || el.classList.contains('btn')) {
                                            el.style.setProperty('background', '#EEEEEE', 'important');
                                            el.style.setProperty('border', '1px solid #999999', 'important');
                                            el.style.setProperty('color', '#000000', 'important');
                                        }

                                        // Ensure empty messages are visible but subtle
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
                        totalLegendWidth += colWidth + (10 * scale); // 10px spacing
                    }
                }
            }

            // 2. Adjust final canvas height if needed
            if (maxLegendHeight > 0) {
                const newHeight = finalCanvas.height + maxLegendHeight + (40 * scale); // padding
                const currentData = ctx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
                finalCanvas.height = newHeight;
                ctx = finalCanvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                ctx.putImageData(currentData, 0, 0);
            }

            ctx.save();
            ctx.translate(0, titleHeight);
            vectorData.forEach(({ layer, type, arrowType }) => {
                if (type === 'polyline' || type === 'polygon') this._drawPolyline(ctx, map, layer, scale, arrowType);
                else if (type === 'marker') this._drawMarker(ctx, map, layer, scale);
                else if (type === 'circle-geo') this._drawCircleGeo(ctx, map, layer, scale);
                else if (type === 'circle-marker') this._drawCircleMarker(ctx, map, layer, scale);
            });
            ctx.restore();

            if (scaleCanvas) {
                // Position at bottom-left, with margins scaled to canvas resolution
                const marginX = 20 * scale;
                const marginY = 20 * scale;
                ctx.drawImage(scaleCanvas, marginX, titleHeight + baseCanvas.height - scaleCanvas.height - marginY);
            }
            if (orientationCanvas) {
                // Position at top-left (below title if exists)
                const marginX = 20 * scale;
                const marginY = 20 * scale;
                ctx.drawImage(orientationCanvas, marginX, titleHeight + marginY);
            }

            if (legendCanvases.length > 0) {
                const legendY = titleHeight + baseCanvas.height + (20 * scale);
                let currentX = 20 * scale;
                
                // If total width exceeds canvas width, scale down the whole row
                const padding = 40 * scale;
                const availableWidth = finalCanvas.width - padding;
                const legendScale = totalLegendWidth > availableWidth ? availableWidth / totalLegendWidth : 1;

                for (const item of legendCanvases) {
                    const drawW = item.width * legendScale;
                    const drawH = item.height * legendScale;
                    ctx.drawImage(item.canvas, currentX, legendY, drawW, drawH);
                    
                    // Redraw symbols on top for quality (offset from currentX, legendY)
                    this._redrawAllLegendSymbolsInColumn(ctx, item.element, currentX, legendY, scale * legendScale, vectorData);
                    
                    currentX += drawW + (10 * scale * legendScale);
                }
            }

            return finalCanvas;
        } finally {
            vectorData.forEach(({ layer, arrowType }) => {
                if (!map.hasLayer(layer)) map.addLayer(layer);
                
                // For Promethean mode: ensure arrows are recreated after being added back
                if (arrowType && typeof SVGUtils !== 'undefined' && SVGUtils.addArrowheadsToPolylineSVG) {
                    setTimeout(() => {
                        SVGUtils.addArrowheadsToPolylineSVG(layer, arrowType);
                    }, 50);
                }
            });
            controls.forEach(c => (c.style.display = 'block'));
            
            // Restore custom arrow containers
            const customArrowContainers = [
                document.getElementById('leaflet-arrows-group'),
                document.getElementById('arrow-svg-container')
            ];
            customArrowContainers.forEach(c => { if (c) c.style.display = 'block'; });

            vectorPane.style.zIndex = oldZ;
        }
    }

    _ensureLegendVisible(legendContainer) {
        if (!legendContainer) return;
        
        // Force side-panel visibility if it's inside one (Promethean mode)
        const sidePanel = legendContainer.closest('.side-panel');
        if (sidePanel) {
            sidePanel.classList.add('active');
            const panelsContainer = document.getElementById('panelsContainer');
            if (panelsContainer) panelsContainer.style.width = 'var(--sidebar-width)';
        }

        legendContainer.style.display = 'block';
        legendContainer.style.visibility = 'visible';
        legendContainer.style.opacity = '1';
        legendContainer.style.backgroundColor = 'rgba(255,255,255,1)';
        legendContainer.style.backdropFilter = 'none';
    }

    _hasVisibleSize(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    _redrawAllLegendSymbolsInColumn(ctx, columnContainer, offsetX, offsetY, scale, vectorData) {
        const allSymbols = columnContainer.querySelectorAll('.legend-item .legend-symbol');
        const columnRect = columnContainer.getBoundingClientRect();
        
        const styleMap = new Map();
        (this.stateManager.geometries || []).forEach((geom, index) => {
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
            if (style.dashArray) ctx.setLineDash(style.dashArray.split(',').map(d => parseFloat(d) * scale * 0.5));
            else ctx.setLineDash([]);
            
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
                if (style.arrowType === 'arrow' || style.arrowType === 'doubleArrow') this._drawSmallArrowhead(ctx, endX, lineY, 0, arrowSize, style.color);
                if (style.arrowType === 'doubleArrow') this._drawSmallArrowhead(ctx, startX, lineY, Math.PI, arrowSize, style.color);
            }
            ctx.restore();
        });
    }

    async _composeLegendOnMapCanvas(mapCanvas, legendContainer, mapContainer) {
        const legendCanvas = await html2canvas(legendContainer, { backgroundColor: 'rgba(255,255,255,1)', scale: 2, logging: false });
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = mapCanvas.width;
        finalCanvas.height = mapCanvas.height;
        const ctx = finalCanvas.getContext('2d');
        ctx.drawImage(mapCanvas, 0, 0);
        const mapRect = mapContainer.getBoundingClientRect();
        const legendRect = legendContainer.getBoundingClientRect();
        const scaleX = mapCanvas.width / mapRect.width;
        const scaleY = mapCanvas.height / mapRect.height;
        const legendX = (legendRect.left - mapRect.left) * scaleX;
        const legendY = (legendRect.top - mapRect.top) * scaleY;
        ctx.drawImage(legendCanvas, legendX, legendY, legendRect.width * scaleX, legendRect.height * scaleY);
        return finalCanvas;
    }

    _redrawAllLegendSymbols(ctx, legendContainer, offsetX, offsetY, scale, vectorData) {
        const allSymbols = legendContainer.querySelectorAll('.legend-item .legend-symbol');
        const styleMap = new Map();
        (this.stateManager.geometries || []).forEach((geom, index) => {
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
            const legendRect = legendContainer.getBoundingClientRect();
            const x = offsetX + (symbolRect.left - legendRect.left) * scale;
            const y = offsetY + (symbolRect.top - legendRect.top) * scale;
            const width = symbolRect.width * scale;
            const height = symbolRect.height * scale;
            ctx.save();
            ctx.strokeStyle = style.color;
            ctx.lineWidth = Math.max(style.weight * scale * 0.5, 2);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (style.dashArray) ctx.setLineDash(style.dashArray.split(',').map(d => parseFloat(d) * scale * 0.5));
            else ctx.setLineDash([]);
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
                if (style.arrowType === 'arrow' || style.arrowType === 'doubleArrow') this._drawSmallArrowhead(ctx, endX, lineY, 0, arrowSize, style.color);
                if (style.arrowType === 'doubleArrow') this._drawSmallArrowhead(ctx, startX, lineY, Math.PI, arrowSize, style.color);
            }
            ctx.restore();
        });
    }

    _drawSmallArrowhead(ctx, x, y, angle, size, color) {
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

    _drawPolyline(ctx, map, layer, scale, arrowType) {
        const latlngs = layer.getLatLngs();
        const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
        if (!coords.length) return;
        ctx.beginPath();
        coords.forEach((latlng, i) => {
            const point = map.latLngToContainerPoint(latlng);
            const x = point.x * scale;
            const y = point.y * scale;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        const options = layer.options;
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 3) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (options.dashArray) ctx.setLineDash(options.dashArray.split(',').map(d => parseFloat(d) * scale));
        else ctx.setLineDash([]);
        if (layer instanceof L.Polygon) {
            ctx.closePath();
            if (options.fillColor || options.color) {
                ctx.fillStyle = options.fillColor || options.color;
                ctx.globalAlpha = options.fillOpacity !== undefined ? options.fillOpacity : 0.2;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        if (arrowType === 'arrow' || arrowType === 'doubleArrow') this._drawArrowheads(ctx, map, coords, arrowType, scale, options);
    }

    _drawArrowheads(ctx, map, coords, arrowType, scale, options) {
        if (coords.length < 2) return;
        const color = options.color || '#3388ff';
        const weight = options.weight || 3;
        
        // Match SVGUtils.js sizing: size = 8 + (lineWeight * 2.5)
        const size = (8 + (weight * 2.5)) * scale;
        const arrowLength = size;
        const arrowWidth = size * 0.8;

        const lastPoint = map.latLngToContainerPoint(coords[coords.length - 1]);
        const secondLastPoint = map.latLngToContainerPoint(coords[coords.length - 2]);
        const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
        
        this._drawArrowhead(ctx, lastPoint.x * scale, lastPoint.y * scale, angle, arrowLength, arrowWidth, color);
        
        if (arrowType === 'doubleArrow') {
            const firstPoint = map.latLngToContainerPoint(coords[0]);
            const secondPoint = map.latLngToContainerPoint(coords[1]);
            const startAngle = Math.atan2(secondPoint.y - firstPoint.y, secondPoint.x - firstPoint.x);
            this._drawArrowhead(ctx, firstPoint.x * scale, firstPoint.y * scale, startAngle + Math.PI, arrowLength, arrowWidth, color);
        }
    }

    _drawArrowhead(ctx, x, y, angle, length, width, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-length, -width / 2);
        ctx.lineTo(-length, width / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    _drawMarker(ctx, map, layer, scale) {
        const latlng = layer.getLatLng();
        const point = map.latLngToContainerPoint(latlng);
        const x = point.x * scale;
        const y = point.y * scale;
        const originalOptions = layer.originalOptions;
        if (!originalOptions || !originalOptions.type) return;
        const markerSize = (originalOptions.markerSize || 24) * scale;
        const halfSize = markerSize / 2;
        ctx.fillStyle = originalOptions.color || '#007bff';
        ctx.strokeStyle = originalOptions.lineColor || '#000000';
        ctx.lineWidth = (originalOptions.lineWeight || 2) * scale;
        ctx.globalAlpha = originalOptions.opacity || 1;
        ctx.beginPath();
        switch (originalOptions.type) {
            case 'circle': ctx.arc(x, y, halfSize, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
            case 'square': ctx.rect(x - halfSize, y - halfSize, markerSize, markerSize); ctx.fill(); ctx.stroke(); break;
            case 'triangle': ctx.moveTo(x, y - halfSize); ctx.lineTo(x + halfSize, y + halfSize); ctx.lineTo(x - halfSize, y + halfSize); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'hexagon': {
                const angleStep = Math.PI / 3;
                for (let i = 0; i < 6; i++) {
                    const angle = angleStep * i - Math.PI / 2;
                    const px = x + halfSize * Math.cos(angle);
                    const py = y + halfSize * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            }
            default: ctx.arc(x, y, halfSize, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    _drawCircleGeo(ctx, map, layer, scale) {
        const latlng = layer.getLatLng();
        const point = map.latLngToContainerPoint(latlng);
        const x = point.x * scale;
        const y = point.y * scale;
        const radiusInMeters = layer.getRadius();
        const earthRadius = 6378137;
        const lat = latlng.lat * Math.PI / 180;
        const deltaLng = (radiusInMeters / (earthRadius * Math.cos(lat))) * (180 / Math.PI);
        const edgeLatLng = L.latLng(latlng.lat, latlng.lng + deltaLng);
        const edgePoint = map.latLngToContainerPoint(edgeLatLng);
        const dx = edgePoint.x - point.x;
        const dy = edgePoint.y - point.y;
        const radiusInPixels = Math.sqrt(dx * dx + dy * dy) * scale;
        ctx.beginPath();
        ctx.arc(x, y, radiusInPixels, 0, Math.PI * 2);
        const options = layer.options;
        if (options.fillColor || options.color) {
            ctx.fillStyle = options.fillColor || options.color;
            ctx.globalAlpha = options.fillOpacity || 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 2) * scale;
        ctx.stroke();
    }

    _drawCircleMarker(ctx, map, layer, scale) {
        const latlng = layer.getLatLng();
        const point = map.latLngToContainerPoint(latlng);
        const x = point.x * scale;
        const y = point.y * scale;
        const radius = (layer.options.radius || 10) * scale;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const options = layer.options;
        if (options.fillColor || options.color) {
            ctx.fillStyle = options.fillColor || options.color;
            ctx.globalAlpha = options.fillOpacity || 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 2) * scale;
        ctx.stroke();
    }

    async _generatePDF(mapCanvas) {
        if (!mapCanvas || !mapCanvas.width || !mapCanvas.height) throw new Error('Canvas invalide ou vide – capture échouée.');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;
        const mapRatio = mapCanvas.width / mapCanvas.height;
        let finalWidth = availableWidth;
        let finalHeight = finalWidth / mapRatio;
        if (finalHeight > availableHeight) {
            finalHeight = availableHeight;
            finalWidth = finalHeight * mapRatio;
        }
        const x = (pageWidth - finalWidth) / 2;
        const y = margin;
        pdf.addImage(mapCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', x, y, finalWidth, finalHeight);
        pdf.setProperties({
            title: this.stateManager.mapTitle || 'Carte Interactive',
            subject: 'Export de carte pédagogique',
            author: 'Cartographie Interactive',
            creator: 'Cartographie Interactive v1.0',
        });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        pdf.save(`carte_${this.stateManager.mapTitle || 'export'}_${timestamp}.pdf`);
    }
}
