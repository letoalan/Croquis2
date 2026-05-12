// js/modules/mapping/io/PDFExporter.js
// ✅ VERSION FINALE - Capture correcte des contrôles AVANT masquage

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
        console.log('[PDFExporter] Initialized', tileLayerManager ? 'with TileLayerManager' : 'without TileLayerManager (will be set later)');
    }

    setTileLayerManager(tileLayerManager) {
        if (!tileLayerManager) {
            console.warn('[PDFExporter] Attempted to set null TileLayerManager');
            return;
        }
        this.tileLayerManager = tileLayerManager;
        console.log('[PDFExporter] TileLayerManager injected successfully');
    }

    _isCurrentTileCORSSafe() {
        if (!this.tileLayerManager) {
            console.warn('[PDFExporter] TileLayerManager not available, assuming CORS-safe tile');
            return true;
        }
        const currentTileType = this.tileLayerManager.getCurrentTileType();
        const isSafe = this.CORS_SAFE_TILES.includes(currentTileType);
        console.log('[PDFExporter] Current tile:', currentTileType, '- CORS-safe:', isSafe);
        return isSafe;
    }

    async exportPDF() {
        console.log('[PDFExporter] ====== EXPORT PDF START ======');
        try {
            const fullCanvas = await this._captureMap();
            await this._generatePDF(fullCanvas);
            console.log('[PDFExporter] ====== EXPORT PDF SUCCESS ======');
        } catch (error) {
            console.error('[PDFExporter] Export PDF failed:', error);
            alert("Erreur lors de l'export PDF : " + error.message);
        }
    }

    async _captureMap() {
        console.log('[PDFExporter] Starting capture...');
        const map = this.mapManager.map;
        const mapContainer = document.getElementById('map');

        if (!map || !mapContainer) {
            throw new Error('Map or container not found');
        }

        const hasArrowheads = (this.stateManager.geometries || []).some(g =>
            (g.layer?._arrowType === 'arrow' || g.layer?._arrowType === 'doubleArrow')
        );

        console.log('[PDFExporter] Has arrowheads:', hasArrowheads);

        const canUseLeafletImage = typeof window.leafletImage === 'function' &&
            this._isCurrentTileCORSSafe() &&
            !hasArrowheads;

        if (canUseLeafletImage) {
            console.log('[PDFExporter] ✅ Using leaflet-image (CORS-safe tile, no arrowheads)');
            try {
                return await this._useLeafletImage(map, mapContainer);
            } catch (error) {
                console.error('[PDFExporter] ❌ leaflet-image failed:', error.message);
                console.log('[PDFExporter] 🔄 Falling back to manual capture...');
            }
        }

        if (hasArrowheads) {
            console.log('[PDFExporter] 🎨 Using manual capture (arrowheads present)');
        } else {
            console.log('[PDFExporter] ⚠️ Using manual capture (non-CORS tile or leaflet-image unavailable)');
        }

        return await this._manualLayerCapture(map, mapContainer);
    }

    async _useLeafletImage(map, mapContainer) {
        const legendContainer = this.legendManager.legendControl?.getContainer?.();

        if (legendContainer) {
            legendContainer.style.backgroundColor = 'rgba(255,255,255,1)';
            legendContainer.style.opacity = '1';
            legendContainer.style.visibility = 'visible';
        }

        let corsFixed = false;
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer && !layer.options.crossOrigin) {
                console.log('[PDFExporter] Setting crossOrigin on tile layer');
                layer.options.crossOrigin = 'anonymous';
                corsFixed = true;
            }
        });

        if (corsFixed) {
            console.log('[PDFExporter] Reloading tiles with CORS...');
            map.eachLayer(layer => {
                if (layer instanceof L.TileLayer) layer.redraw();
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('leaflet-image timeout after 10s'));
            }, 10000);

            window.leafletImage(map, async (err, mapCanvas) => {
                clearTimeout(timeout);
                if (err) {
                    console.error('[PDFExporter] leaflet-image error:', err);
                    reject(err);
                    return;
                }

                console.log('[PDFExporter] leaflet-image canvas:', mapCanvas.width, 'x', mapCanvas.height);

                if (legendContainer && legendContainer.style.visibility !== 'hidden') {
                    try {
                        const finalCanvas = await this._addLegendToCanvas(mapCanvas, legendContainer, mapContainer);
                        resolve(finalCanvas);
                    } catch (e) {
                        console.warn('[PDFExporter] Legend composition failed:', e);
                        resolve(mapCanvas);
                    }
                } else {
                    resolve(mapCanvas);
                }
            });
        });
    }

    /**
     * Calcule une fenêtre de recadrage intelligente pour éviter la déformation (response2.md)
     */
    _computeSmartCropWindow(map, vectorData, baseWidth, baseHeight, targetRatio) {
        let minX = baseWidth, minY = baseHeight, maxX = 0, maxY = 0;
        let hasFigures = false;

        vectorData.forEach(({ layer, type }) => {
            let points = [];
            if (layer.getLatLng) points = [layer.getLatLng()];
            else if (layer.getLatLngs) {
                const latlngs = layer.getLatLngs();
                points = Array.isArray(latlngs[0]) ? latlngs.flat(Infinity) : latlngs;
            } else if (layer.getBounds) {
                const b = layer.getBounds();
                points = [b.getSouthWest(), b.getNorthEast()];
            }

            points.forEach(ll => {
                if (ll && ll.lat !== undefined) {
                    const p = map.latLngToContainerPoint(ll);
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                    hasFigures = true;
                }
            });
        });

        const targetHeight = baseWidth / targetRatio;
        let cropY = 0;

        if (!hasFigures) {
            // Fallback centré
            cropY = Math.max(0, (baseHeight - targetHeight) / 2);
        } else {
            // Marge de sécurité (10%)
            const margin = 40;
            const contentCenterY = (minY + maxY) / 2;
            
            // On essaie de centrer la fenêtre sur le contenu
            cropY = contentCenterY - (targetHeight / 2);
            
            // Contraintes de bord
            if (cropY < 0) cropY = 0;
            if (cropY + targetHeight > baseHeight) cropY = baseHeight - targetHeight;
            
            // Si le contenu est trop grand pour la fenêtre, on s'assure de ne pas couper le haut
            if (maxY - minY > targetHeight) {
                cropY = minY - margin;
                if (cropY < 0) cropY = 0;
            }
        }

        return {
            y: Math.max(0, cropY),
            height: Math.min(baseHeight, targetHeight),
            width: baseWidth
        };
    }

    async _manualLayerCapture(map, mapContainer) {
        console.log('[PDFExporter] 🚀 SMART CROP CAPTURE (response2.md strategy)');
        
        const legendContainer = (this.legendManager.legendControl?.getContainer?.()) || this.legendManager.container;
        this._ensureLegendVisible(legendContainer);

        // 1. Capture Legend Parts FIRST
        const legendCanvases = [];
        let maxLegendHeight = 0;
        let totalLegendWidth = 0;
        const captureScale = 2.5;

        if (legendContainer) {
            const parts = Array.from(legendContainer.querySelectorAll('.legend-part-column'));
            for (const col of parts) {
                if (this._hasVisibleSize(col)) {
                    await new Promise(r => setTimeout(r, 50));
                    const tempDiv = document.createElement('div');
                    Object.assign(tempDiv.style, { position: 'absolute', top: '-20000px', left: '-20000px', width: col.offsetWidth + 'px', background: '#FFFFFF', padding: '15px' });
                    document.body.appendChild(tempDiv);
                    const clone = col.cloneNode(true);
                    Object.assign(clone.style, { width: '100%', height: 'auto', display: 'block', visibility: 'visible', opacity: '1' });
                    tempDiv.appendChild(clone);
                    try {
                        const colCanvas = await html2canvas(tempDiv, { backgroundColor: '#FFFFFF', scale: captureScale, logging: false, useCORS: true });
                        if (colCanvas && colCanvas.width > 0) {
                            legendCanvases.push({ canvas: colCanvas, width: col.offsetWidth, height: col.offsetHeight, element: col });
                            maxLegendHeight = Math.max(maxLegendHeight, colCanvas.height);
                            totalLegendWidth += colCanvas.width + (20 * captureScale);
                        }
                    } finally {
                        document.body.removeChild(tempDiv);
                    }
                }
            }
        }

        // 2. Capture vectors
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

        const controls = document.querySelectorAll('.leaflet-control-container');
        controls.forEach(c => (c.style.display = 'none'));

        try {
            const scaleContainer = this.mapManager.scaleOrientationManager?.getScaleContainer?.();
            const orientationContainer = this.mapManager.scaleOrientationManager?.getOrientationContainer?.();
            
            let scaleCanvas = null, orientationCanvas = null;
            if (scaleContainer && this._hasVisibleSize(scaleContainer)) scaleCanvas = await html2canvas(scaleContainer, { useCORS: true, logging: false, scale: 2, backgroundColor: 'transparent' });
            if (orientationContainer && this._hasVisibleSize(orientationContainer)) orientationCanvas = await html2canvas(orientationContainer, { useCORS: true, logging: false, scale: 2, backgroundColor: 'transparent' });

            const captureTarget = mapContainer.parentElement;
            const baseCanvas = await html2canvas(captureTarget, { useCORS: true, logging: false, scale: 2, backgroundColor: '#FFFFFF' });
            const canvasScale = baseCanvas.width / captureTarget.offsetWidth;

            // --- PHASE 3: SMART CROP ASSEMBLY ---
            const targetRatio = baseCanvas.width / (baseCanvas.height * 0.7); // On veut un bandeau d'environ 70% de la hauteur
            const crop = this._computeSmartCropWindow(map, vectorData, captureTarget.offsetWidth, captureTarget.offsetHeight, targetRatio);
            
            const titleHeight = this.stateManager.mapTitle ? 80 : 0;
            const drawMapWidth = baseCanvas.width;
            const drawMapHeight = crop.height * canvasScale;
            const scaledMaxLegendHeight = (maxLegendHeight / captureScale) * canvasScale;

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = baseCanvas.width;
            finalCanvas.height = drawMapHeight + titleHeight + (legendCanvases.length > 0 ? scaledMaxLegendHeight + (100 * canvasScale) : 0);
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

            // Draw map CROPPED (no squash)
            ctx.drawImage(
                baseCanvas, 
                0, crop.y * canvasScale, baseCanvas.width, crop.height * canvasScale, // Source
                0, titleHeight, drawMapWidth, drawMapHeight // Destination
            );

            // Draw vectors with OFFSET
            ctx.save();
            ctx.translate(0, titleHeight - (crop.y * canvasScale));
            vectorData.forEach(({ layer, type, arrowType }) => {
                if (type === 'polyline' || type === 'polygon') this._drawPolyline(ctx, map, layer, canvasScale, arrowType);
                else if (type === 'marker') this._drawMarker(ctx, map, layer, canvasScale);
                else if (type === 'circle-geo') this._drawCircleGeo(ctx, map, layer, canvasScale);
                else if (type === 'circle-marker') this._drawCircleMarker(ctx, map, layer, canvasScale);
            });
            ctx.restore();

            if (scaleCanvas && scaleCanvas.width > 0) ctx.drawImage(scaleCanvas, 20 * canvasScale, titleHeight + drawMapHeight - scaleCanvas.height - 20 * canvasScale);
            if (orientationCanvas && orientationCanvas.width > 0) ctx.drawImage(orientationCanvas, 20 * canvasScale, titleHeight + 20 * canvasScale);

            if (legendCanvases.length > 0) {
                const legendY = titleHeight + drawMapHeight + (50 * canvasScale);
                let currentX = 40 * canvasScale;
                const totalWidthReal = (totalLegendWidth / captureScale) * canvasScale;
                const availableW = finalCanvas.width - (80 * canvasScale);
                const finalLegendScale = totalWidthReal > availableW ? availableW / totalWidthReal : 1;

                for (const item of legendCanvases) {
                    const drawW = (item.canvas.width / captureScale) * canvasScale * finalLegendScale;
                    const drawH = (item.canvas.height / captureScale) * canvasScale * finalLegendScale;
                    ctx.drawImage(item.canvas, currentX, legendY, drawW, drawH);
                    this._redrawAllLegendSymbolsInColumn(ctx, item.element, currentX, legendY, canvasScale * finalLegendScale, vectorData);
                    currentX += drawW + (25 * canvasScale * finalLegendScale);
                }
            }

            return finalCanvas;

        } finally {
            vectorData.forEach(({ layer }) => { if (!map.hasLayer(layer)) map.addLayer(layer); });
            controls.forEach(c => (c.style.display = 'block'));
            if (map.invalidateSize) setTimeout(() => map.invalidateSize(), 100);
        }
    }

    _hasVisibleSize(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    _ensureLegendVisible(legendContainer) {
        if (!legendContainer) return;
        legendContainer.style.setProperty('display', 'block', 'important');
        legendContainer.style.setProperty('visibility', 'visible', 'important');
        legendContainer.style.setProperty('opacity', '1', 'important');
        legendContainer.style.setProperty('height', 'auto', 'important');
        legendContainer.style.setProperty('max-height', 'none', 'important');
        legendContainer.style.setProperty('overflow', 'visible', 'important');
    }

    _drawPolyline(ctx, map, layer, scale, arrowType) {
        const latlngs = layer.getLatLngs();
        const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;

        if (coords.length === 0) return;

        ctx.beginPath();
        coords.forEach((latlng, i) => {
            const point = map.latLngToContainerPoint(latlng);
            const x = point.x * scale;
            const y = point.y * scale;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        const options = layer.options;
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 3) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (options.dashArray) {
            const dashArray = options.dashArray.split(',').map(d => parseFloat(d) * scale);
            ctx.setLineDash(dashArray);
        } else {
            ctx.setLineDash([]);
        }

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

        if (arrowType === 'arrow' || arrowType === 'doubleArrow') {
            this._drawArrowheads(ctx, map, coords, arrowType, scale, options);
        }
    }

    _drawArrowheads(ctx, map, coords, arrowType, scale, options) {
        if (coords.length < 2) return;

        const color = options.color || '#3388ff';
        const lastPoint = map.latLngToContainerPoint(coords[coords.length - 1]);
        const secondLastPoint = map.latLngToContainerPoint(coords[coords.length - 2]);

        const dx = lastPoint.x - secondLastPoint.x;
        const dy = lastPoint.y - secondLastPoint.y;
        const angle = Math.atan2(dy, dx);

        const baseSize = Math.max(options.weight || 3, 3) * scale;
        const arrowLength = Math.max(baseSize * 6, 20);
        const arrowWidth = Math.max(baseSize * 3, 12);

        this._drawArrowhead(ctx, lastPoint.x * scale, lastPoint.y * scale, angle, arrowLength, arrowWidth, color);

        if (arrowType === 'doubleArrow' && coords.length >= 2) {
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

        if (originalOptions && originalOptions.type) {
            const markerSize = (originalOptions.markerSize || 24) * scale;
            const halfSize = markerSize / 2;

            ctx.fillStyle = originalOptions.color || '#007bff';
            ctx.strokeStyle = originalOptions.lineColor || '#000000';
            ctx.lineWidth = (originalOptions.lineWeight || 2) * scale;
            ctx.globalAlpha = originalOptions.opacity || 1;

            ctx.beginPath();
            switch (originalOptions.type) {
                case 'circle':
                    ctx.arc(x, y, halfSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;
                case 'square':
                    ctx.rect(x - halfSize, y - halfSize, markerSize, markerSize);
                    ctx.fill();
                    ctx.stroke();
                    break;
                case 'triangle':
                    ctx.moveTo(x, y - halfSize);
                    ctx.lineTo(x + halfSize, y + halfSize);
                    ctx.lineTo(x - halfSize, y + halfSize);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
                case 'hexagon':
                    const angleStep = Math.PI / 3;
                    for (let i = 0; i < 6; i++) {
                        const angle = angleStep * i - Math.PI / 2;
                        const px = x + halfSize * Math.cos(angle);
                        const py = y + halfSize * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
                default:
                    ctx.arc(x, y, halfSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
            }

            ctx.globalAlpha = 1;
        }
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

    _redrawAllLegendSymbolsInColumn(ctx, columnElement, colX, colY, scale, vectorData) {
        const allSymbols = columnElement.querySelectorAll('.legend-item .legend-symbol-wrapper');
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
            try {
                const geometryItem = symbolDiv.closest('.legend-item');
                if (!geometryItem) return;
                const geomIndex = parseInt(geometryItem.dataset.geometryIndex);
                const style = styleMap.get(geomIndex);
                if (!style) return;

                const symbolRect = symbolDiv.getBoundingClientRect();
                const colRect = columnElement.getBoundingClientRect();
                const x = colX + (symbolRect.left - colRect.left) * scale;
                const y = colY + (symbolRect.top - colRect.top) * scale;
                const width = symbolRect.width * scale;
                const height = symbolRect.height * scale;

                ctx.save();
                ctx.strokeStyle = style.color;
                ctx.lineWidth = Math.max(style.weight * scale * 0.5, 2);
                ctx.lineCap = 'round';
                if (style.dashArray) {
                    const dashes = style.dashArray.split(',').map(d => parseFloat(d) * scale * 0.5);
                    ctx.setLineDash(dashes);
                }

                const lineY = y + height / 2;
                const startX = x + 2;
                const endX = x + width - 2;

                ctx.beginPath();
                ctx.moveTo(startX, lineY);
                ctx.lineTo(endX, lineY);
                ctx.stroke();
                ctx.setLineDash([]);

                if (style.arrowType) {
                    const arrowSize = Math.min(width * 0.25, 8 * scale);
                    if (style.arrowType === 'arrow' || style.arrowType === 'doubleArrow') {
                        this._drawSmallArrowhead(ctx, endX, lineY, 0, arrowSize, style.color);
                    }
                    if (style.arrowType === 'doubleArrow') {
                        this._drawSmallArrowhead(ctx, startX, lineY, Math.PI, arrowSize, style.color);
                    }
                }
                ctx.restore();
            } catch (e) { console.error('[PDFExporter] Error redrawing legend symbol:', e); }
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

    async _addLegendToCanvas(mapCanvas, legendContainer, mapContainer) {
        console.log('[PDFExporter] Adding legend to canvas...');

        const legendCanvas = await html2canvas(legendContainer, {
            backgroundColor: 'rgba(255,255,255,1)',
            scale: 2,
            logging: false,
        });

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
        const legendWidth = legendRect.width * scaleX;
        const legendHeight = legendRect.height * scaleY;

        ctx.drawImage(legendCanvas, legendX, legendY, legendWidth, legendHeight);
        console.log('[PDFExporter] Legend added successfully');

        return finalCanvas;
    }

    async _generatePDF(mapCanvas) {
        console.log('[PDFExporter] Generating PDF...');

        if (!mapCanvas || !mapCanvas.width || !mapCanvas.height) {
            throw new Error('Canvas invalide ou vide – capture échouée.');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

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

        if (!isFinite(finalWidth) || !isFinite(finalHeight) || finalWidth <= 0 || finalHeight <= 0) {
            console.error('[PDFExporter] Invalid dimensions:', { finalWidth, finalHeight });
            throw new Error('Dimensions invalides pour pdf.addImage()');
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = margin;
        const mapImgData = mapCanvas.toDataURL('image/jpeg', 1.0);

        pdf.addImage(mapImgData, 'JPEG', x, y, finalWidth, finalHeight);
        pdf.setProperties({
            title: this.stateManager.mapTitle || 'Carte Interactive',
            subject: 'Export de carte pédagogique',
            author: 'Cartographie Interactive',
            creator: 'Cartographie Interactive v1.0',
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `carte_${this.stateManager.mapTitle || 'export'}_${timestamp}.pdf`;

        pdf.save(filename);
        console.log('[PDFExporter] PDF saved:', filename);
    }
}