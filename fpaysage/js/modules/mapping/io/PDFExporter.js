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

    async _manualLayerCapture(map, mapContainer) {
        console.log('[PDFExporter] 📸 Manual layer-by-layer capture...');
        const legendContainer = this.legendManager.legendControl?.getContainer?.();
        let legendWasHidden = false;

        if (legendContainer) {
            const originalDisplay = legendContainer.style.display;
            const originalVisibility = legendContainer.style.visibility;
            if (originalDisplay === 'none' || originalVisibility === 'hidden') {
                legendWasHidden = true;
            }
            legendContainer.style.display = 'block';
            legendContainer.style.visibility = 'visible';
            legendContainer.style.opacity = '1';
            legendContainer.style.backgroundColor = 'rgba(255,255,255,1)';
            legendContainer.style.backdropFilter = 'none';
        }

        // ========== ÉTAPE 1 : CAPTURER LES VECTEURS ==========
        const vectorData = [];
        map.eachLayer(layer => {
            if (
                layer instanceof L.Polyline ||
                layer instanceof L.Polygon ||
                layer instanceof L.Marker ||
                layer instanceof L.Circle ||
                layer instanceof L.CircleMarker
            ) {
                let type;
                if (layer instanceof L.Marker) type = 'marker';
                else if (layer instanceof L.Circle) type = layer.getRadius ? 'circle-geo' : 'circle-marker';
                else if (layer instanceof L.CircleMarker) type = 'circle-marker';
                else if (layer instanceof L.Polygon) type = 'polygon';
                else type = 'polyline';

                const arrowType = layer._arrowType || layer.arrowType || null;
                vectorData.push({ layer, type, arrowType });
                map.removeLayer(layer);
            }
        });

        console.log('[PDFExporter] ✅ Captured', vectorData.length, 'vector layers');

        // ========== ÉTAPE 2 : RETIRER LES FLÈCHES SVG ==========
        vectorData.forEach(({ layer, arrowType }) => {
            if (arrowType && (arrowType === 'arrow' || arrowType === 'doubleArrow')) {
                if (typeof SVGUtils !== 'undefined' && SVGUtils.removeArrowheadsFromPolylineSVG) {
                    console.log('[PDFExporter] 🗑️ Removing SVG arrowheads:', arrowType);
                    SVGUtils.removeArrowheadsFromPolylineSVG(layer);
                }
            }
        });

        // ========== ÉTAPE 3 : CAPTURER LES CONTRÔLES **AVANT** MASQUAGE ==========
        console.log('[PDFExporter] 🎯 Pre-capturing scale & orientation controls...');

        let scaleCanvas = null;
        let orientationCanvas = null;

        const scaleContainer = this.mapManager.scaleOrientationManager?.getScaleContainer?.();
        const orientationContainer = this.mapManager.scaleOrientationManager?.getOrientationContainer?.();

        console.log('[PDFExporter] Scale container:', scaleContainer ? '✅ Found' : '❌ Not found');
        console.log('[PDFExporter] Orientation container:', orientationContainer ? '✅ Found' : '❌ Not found');

        if (scaleContainer && scaleContainer.offsetWidth > 0) {
            console.log('[PDFExporter] 📸 Capturing scale control (BEFORE hiding)...');
            try {
                scaleCanvas = await html2canvas(scaleContainer, {
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    scale: 2,
                    backgroundColor: 'transparent'
                });
                console.log('[PDFExporter] ✅ Scale control pre-captured:', scaleCanvas.width, 'x', scaleCanvas.height);
            } catch (e) {
                console.warn('[PDFExporter] ⚠️ Failed to pre-capture scale:', e.message);
            }
        }

        if (orientationContainer && orientationContainer.offsetWidth > 0) {
            console.log('[PDFExporter] 📸 Capturing orientation control (BEFORE hiding)...');
            try {
                orientationCanvas = await html2canvas(orientationContainer, {
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    scale: 2,
                    backgroundColor: 'transparent'
                });
                console.log('[PDFExporter] ✅ Orientation control pre-captured:', orientationCanvas.width, 'x', orientationCanvas.height);
            } catch (e) {
                console.warn('[PDFExporter] ⚠️ Failed to pre-capture orientation:', e.message);
            }
        }

        // ========== ÉTAPE 4 : MASQUER LES CONTRÔLES ==========
        console.log('[PDFExporter] 🚫 Hiding all Leaflet controls for base capture...');
        const controls = document.querySelectorAll('.leaflet-control-container');
        controls.forEach(c => (c.style.display = 'none'));

        const vectorPane = map.getPane('overlayPane');
        const oldZ = vectorPane.style.zIndex;
        vectorPane.style.zIndex = '9999';
        vectorPane.style.position = 'relative';

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            // ========== ÉTAPE 5 : CAPTURER LA CARTE DE BASE ==========
            console.log('[PDFExporter] 📷 Capturing base map canvas...');
            const captureTarget = mapContainer.parentElement;
            if (!captureTarget) {
                throw new Error('Map container has no parent element to capture.');
            }
            console.log('[PDFExporter] 🎯 Capture target:', captureTarget.tagName, `.${captureTarget.className}`);

            const baseCanvas = await html2canvas(captureTarget, {
                useCORS: true,
                allowTaint: true,
                logging: false,
                scale: 2,
                backgroundColor: '#FFFFFF',
            });

            console.log('[PDFExporter] ✅ Base canvas captured:', baseCanvas.width, 'x', baseCanvas.height);

            // ========== ÉTAPE 6 : CRÉER LE CANVAS FINAL ==========
            const titleHeight = this.stateManager.mapTitle ? 80 : 0;
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = baseCanvas.width;
            finalCanvas.height = baseCanvas.height + titleHeight;
            const ctx = finalCanvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // Titre
            if (this.stateManager.mapTitle) {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.stateManager.mapTitle, finalCanvas.width / 2, titleHeight / 2);
            }

            // Carte de base
            ctx.drawImage(baseCanvas, 0, titleHeight);

            // ========== ÉTAPE 7 : DESSINER LES VECTEURS AVEC FLÈCHES ==========
            const scale = baseCanvas.width / captureTarget.offsetWidth;
            ctx.save();
            ctx.translate(0, titleHeight);

            console.log('[PDFExporter] 🎨 Drawing vectors with arrowheads...');
            vectorData.forEach(({ layer, type, arrowType }) => {
                if (type === 'polyline' || type === 'polygon') {
                    this._drawPolyline(ctx, map, layer, scale, arrowType);
                } else if (type === 'marker') {
                    this._drawMarker(ctx, map, layer, scale);
                } else if (type === 'circle-geo') {
                    this._drawCircleGeo(ctx, map, layer, scale);
                } else if (type === 'circle-marker') {
                    this._drawCircleMarker(ctx, map, layer, scale);
                }
            });

            ctx.restore();

            // ========== ÉTAPE 8 : DESSINER LES CONTRÔLES CAPTURÉS ==========
            console.log('[PDFExporter] 🎯 Drawing pre-captured controls on final canvas...');

            if (scaleCanvas) {
                const scalePadding = 20;
                const scaleX = scalePadding;
                const scaleY = finalCanvas.height - scaleCanvas.height / 2 - scalePadding;

                ctx.drawImage(scaleCanvas, scaleX, scaleY);
                console.log('[PDFExporter] ✅ Scale control drawn at:', { x: scaleX, y: scaleY });
            } else {
                console.warn('[PDFExporter] ⚠️ No scale canvas to draw');
            }

            if (orientationCanvas) {
                const orientationPadding = 20;
                const orientationX = orientationPadding;
                const orientationY = titleHeight + orientationPadding;

                ctx.drawImage(orientationCanvas, orientationX, orientationY);
                console.log('[PDFExporter] ✅ Orientation control drawn at:', { x: orientationX, y: orientationY });
            } else {
                console.warn('[PDFExporter] ⚠️ No orientation canvas to draw');
            }

            // ========== ÉTAPE 9 : RESTAURER LES LAYERS ==========
            console.log('[PDFExporter] 🔄 Restoring map layers...');
            vectorData.forEach(({ layer }) => map.addLayer(layer));
            controls.forEach(c => (c.style.display = 'block'));
            await new Promise(resolve => setTimeout(resolve, 100));

            vectorData.forEach(({ layer, arrowType }) => {
                if (arrowType && (arrowType === 'arrow' || arrowType === 'doubleArrow')) {
                    if (typeof SVGUtils !== 'undefined' && SVGUtils.addArrowheadsToPolylineSVG) {
                        console.log('[PDFExporter] ✨ Restoring SVG arrowheads:', arrowType);
                        SVGUtils.addArrowheadsToPolylineSVG(layer, arrowType);
                    }
                }
            });

            // ========== ÉTAPE 10 : DESSINER LA LÉGENDE ==========
            if (legendContainer) {
                await this._drawLegendOnCanvas(ctx, legendContainer, captureTarget, scale, titleHeight, vectorData);
            }

            if (legendWasHidden && legendContainer) {
                legendContainer.style.display = 'none';
                legendContainer.style.visibility = 'hidden';
            }

            console.log('[PDFExporter] ✅ Canvas capture complete');
            return finalCanvas;

        } finally {
            console.log('[PDFExporter] 🔧 Final cleanup...');

            vectorData.forEach(({ layer }) => {
                if (!map.hasLayer(layer)) map.addLayer(layer);
            });

            controls.forEach(c => (c.style.display = 'block'));

            vectorData.forEach(({ layer, arrowType }) => {
                if (arrowType && (arrowType === 'arrow' || arrowType === 'doubleArrow')) {
                    if (typeof SVGUtils !== 'undefined' && SVGUtils.addArrowheadsToPolylineSVG) {
                        SVGUtils.addArrowheadsToPolylineSVG(layer, arrowType);
                    }
                }
            });

            vectorPane.style.zIndex = oldZ;
            console.log('[PDFExporter] ✅ Map state fully restored');
        }
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

    async _drawLegendOnCanvas(ctx, legendContainer, mapContainer, scale, titleOffset = 0, vectorData = []) {
        try {
            console.log('[PDFExporter] 🎨 Drawing legend...');

            const legendRect = legendContainer.getBoundingClientRect();
            if (legendRect.width === 0 || legendRect.height === 0) {
                console.warn('[PDFExporter] Legend has no dimensions, skipping');
                return;
            }

            const mapRect = mapContainer.getBoundingClientRect();
            const legendX = (legendRect.left - mapRect.left) * scale;
            const legendY = (legendRect.top - mapRect.top) * scale + titleOffset;

            console.log('[PDFExporter] 📷 Capturing legend with html2canvas...');
            const legendCanvas = await html2canvas(legendContainer, {
                backgroundColor: 'rgba(255,255,255,1)',
                scale: 2,
                logging: false,
                willReadFrequently: true,
            });

            if (!legendCanvas || legendCanvas.width === 0 || legendCanvas.height === 0) {
                console.log('[PDFExporter] Legend capture failed');
                return;
            }

            const legendWidth = legendRect.width * scale;
            const legendHeight = legendRect.height * scale;

            ctx.drawImage(legendCanvas, legendX, legendY, legendWidth, legendHeight);
            console.log('[PDFExporter] ✅ Legend background drawn');

            console.log('[PDFExporter] 🎯 Manually drawing line symbols in legend...');
            this._redrawAllLegendSymbols(ctx, legendContainer, legendX, legendY, scale, vectorData);

        } catch (e) {
            console.error('[PDFExporter] Failed to add legend:', e.message);
        }
    }

    _redrawAllLegendSymbols(ctx, legendContainer, offsetX, offsetY, scale, vectorData) {
        const allSymbols = legendContainer.querySelectorAll('.legend-item .legend-symbol');
        console.log(`[PDFExporter] 🔍 Found ${allSymbols.length} potential symbols in legend to redraw.`);

        if (allSymbols.length === 0) {
            console.warn('[PDFExporter] ⚠️ No .legend-symbol elements found within .legend-item.');
            return;
        }

        const styleMap = new Map();
        this.stateManager.geometries.forEach((geom, index) => {
            if (geom.type === 'Polyline') {
                styleMap.set(index, {
                    color: geom.lineColor || '#3388ff',
                    weight: geom.lineWeight || 3,
                    dashArray: geom.lineDash === 'solid' ? null : (geom.lineDash === 'dashed' ? '10, 10' : '2, 6'),
                    arrowType: geom.arrowType || null
                });
            }
        });

        console.log('[PDFExporter] 🗺️ Created style map for', styleMap.size, 'polylines from StateManager.');

        allSymbols.forEach((symbolDiv, symbolIndex) => {
            try {
                const geometryItem = symbolDiv.closest('.legend-item');
                if (!geometryItem) {
                    console.warn(`[PDFExporter] Symbol ${symbolIndex} has no .legend-item parent, skipping.`);
                    return;
                }

                const geomIndex = parseInt(geometryItem.dataset.index || geometryItem.dataset.geometryIndex);
                if (isNaN(geomIndex)) {
                    console.warn(`[PDFExporter] Invalid geometry index for symbol ${symbolIndex}, skipping.`);
                    return;
                }

                const style = styleMap.get(geomIndex);
                if (!style) {
                    return;
                }

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

                if (style.dashArray) {
                    const dashes = style.dashArray.split(',').map(d => parseFloat(d) * scale * 0.5);
                    ctx.setLineDash(dashes);
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

            } catch (e) {
                console.error(`[PDFExporter] ❌ Error redrawing symbol ${symbolIndex}:`, e);
            }
        });

        console.log('[PDFExporter] ✅ All legend symbols redrawn');
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