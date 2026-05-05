// SVGUtils.js - VERSION FINALE AVEC FLÈCHES POLYGONALES VISIBLES

export class SVGUtils {

    static USE_POLYGON_ARROWS = true;

    static _ensureArrowContainer(map) {
    console.log('[SVGUtils] 🔍 Looking for Leaflet SVG container...');

    try {
        // ✅ Étape 1 : Obtenir le pane overlay
        const pane = map.getPane('overlayPane');

        if (!pane) {
            console.error('[SVGUtils] ❌ Overlay pane not found!');
            return null;
        }

        // ✅ Étape 2 : Chercher le SVG zoomé existant
        let svg = pane.querySelector('svg.leaflet-zoom-animated');

        // ✅ Étape 3 : Si pas trouvé, créer un nouveau SVG
        if (!svg) {
            console.log('[SVGUtils] ⚠️ Leaflet zoom SVG not found, creating one...');

            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'leaflet-zoom-animated');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.style.pointerEvents = 'none';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.zIndex = '0';

            // Définir les dimensions appropriées
            const rect = pane.getBoundingClientRect();
            svg.setAttribute('width', rect.width || '0');
            svg.setAttribute('height', rect.height || '0');

            pane.appendChild(svg);
            console.log('[SVGUtils] ✅ SVG created successfully');
        } else {
            console.log('[SVGUtils] ✅ Found existing Leaflet zoom SVG');
        }

        // ✅ Étape 4 : Chercher ou créer le groupe des flèches
        let arrowsGroup = svg.querySelector('#leaflet-arrows-group');

        if (!arrowsGroup) {
            console.log('[SVGUtils] 📍 Creating arrow container group...');
            arrowsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            arrowsGroup.id = 'leaflet-arrows-group';
            arrowsGroup.setAttribute('class', 'leaflet-zoom-animated');
            svg.appendChild(arrowsGroup);
            console.log('[SVGUtils] ✅ Arrow container group created');
        } else {
            console.log('[SVGUtils] ✅ Arrow container group already exists');
        }

        console.log('[SVGUtils] ✅ Arrow container ready');
        return arrowsGroup;

    } catch (error) {
        console.error('[SVGUtils] ❌ Error in _ensureArrowContainer:', error);
        console.error('[SVGUtils] Error details:', error.message);
        return null;
    }
}


    static forceCompleteArrowRefresh(map) {
        console.log('[SVGUtils] 🔄 COMPLETE ARROW REFRESH - rebuilding all arrows');

        // Forcer Leaflet à recalculer toutes les transformations
        map.fire('viewreset');
        map.fire('zoom');

        // Attendre que Leaflet ait mis à jour, PUIS rafraîchir les flèches
        requestAnimationFrame(() => {
            // Récupérer TOUS les groupes de flèches
            const pane = map.getPane('overlayPane');
            const svg = pane.querySelector('svg.leaflet-zoom-animated[viewBox]');

            if (!svg) return;

            const arrowGroups = svg.querySelectorAll('.arrow-group');
            console.log('[SVGUtils] 🔍 Found', arrowGroups.length, 'arrow groups to refresh');

            arrowGroups.forEach(group => {
                const polylineId = group.getAttribute('data-polyline-id');
                // Trouver le polyline correspondant ET son handler
                // (sera géré à un niveau plus haut)
                console.log('[SVGUtils] 📍 Marked for refresh:', polylineId);
            });
        });
    }



    // ============================================================
    // CALCUL DU TRIANGLE POUR FLÈCHE POLYGONALE
    // ============================================================
    static _createArrowPolygon(point, angle, size) {
        const rad = angle * Math.PI / 180;
        const tip = { x: point.x, y: point.y };
        const backOffset = size;
        const halfWidth = size * 0.4;

        const left = {
            x: point.x - Math.cos(rad) * backOffset + Math.sin(rad) * halfWidth,
            y: point.y - Math.sin(rad) * backOffset - Math.cos(rad) * halfWidth
        };

        const right = {
            x: point.x - Math.cos(rad) * backOffset - Math.sin(rad) * halfWidth,
            y: point.y - Math.sin(rad) * backOffset + Math.cos(rad) * halfWidth
        };

        return `M${tip.x},${tip.y} L${left.x},${left.y} L${right.x},${right.y}Z`;
    }

    // ============================================================
    // DISPATCHER - Choisit le mode de rendu
    // ============================================================
    static addArrowheadsToPolylineSVG(polyline, arrowType, retryCount = 0) {
        if (SVGUtils.USE_POLYGON_ARROWS) {
            return SVGUtils._addArrowheadsPolygonMode(polyline, arrowType);
        } else {
            return SVGUtils._addArrowheadsMarkerMode(polyline, arrowType, retryCount);
        }
    }

    // ============================================================
    // MODE POLYGON - Rendu avec polygones SVG (NOUVEAU)
    // ============================================================
    static _addArrowheadsPolygonMode(polyline, arrowType) {
        try {
            console.log('[SVGUtils:POLYGON] 🎯 Creating arrows for', arrowType);
            console.log('[SVGUtils:POLYGON] Polyline ID:', polyline._leaflet_id);
            console.log('[SVGUtils:POLYGON] Has map:', !!polyline._map);

            SVGUtils.cleanupArrowheads(polyline);

            if (!polyline?._map) {
                console.error('[SVGUtils:POLYGON] ❌ Polyline has no map reference');
                return false;
            }

            const map = polyline._map;
            const arrowsGroup = SVGUtils._ensureArrowContainer(map);

            // ✅ FALLBACK si arrowsGroup est null
            if (!arrowsGroup) {
                console.error('[SVGUtils:POLYGON] ❌ Failed to create/find arrow container');
                return false;
            }

            // ✅ Rendre le path original invisible mais interactif
            if (polyline._path) {
                polyline._path.style.opacity = '0';
                polyline._path.style.pointerEvents = 'stroke';
            }

            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.id = `arrow-group-${polyline._leaflet_id}`;
            group.setAttribute('class', 'arrow-group');
            group.setAttribute('data-polyline-id', polyline._leaflet_id);
            group.style.pointerEvents = 'none';

            // Fonction de rendu avec verrou anti-fantôme
            const renderArrow = function() {
                // Ne pas rendre si en cours d'édition
                if (this._isDragging || this._isEditing) {
                    return;
                }

                const coords = this.getLatLngs();
                console.log('[SVGUtils:POLYGON] renderArrow - coords:', coords.length);

                const points = coords.map(ll => this._map.latLngToLayerPoint(ll));

                if (points.length < 2) {
                    console.warn('[SVGUtils:POLYGON] ⚠️ Not enough points:', points.length);
                    return;
                }

                // Vider le groupe (synchrone)
                while (this._svgGroup.firstChild) {
                    this._svgGroup.removeChild(this._svgGroup.firstChild);
                }

                const color = this.options.color || '#3388ff';
                const lineWeight = this.options.weight || 3;
                const size = 8 + (lineWeight * 2.5);

                console.log('[SVGUtils:POLYGON] 📐 Rendering with color:', color, 'weight:', lineWeight, 'size:', size);

                // ✅ Calculer les points de terminaison avec décalage
                let startPoint = points[0];
                let endPoint = points[points.length - 1];

                // Si double flèche, décaler le point de départ
                if (this._arrowType === 'doubleArrow') {
                    const next = points[1];
                    const angle = Math.atan2(next.y - startPoint.y, next.x - startPoint.x);
                    startPoint = {
                        x: startPoint.x + Math.cos(angle) * size,
                        y: startPoint.y + Math.sin(angle) * size
                    };
                }

                // Décaler le point de fin pour arrow et doubleArrow
                if (this._arrowType === 'arrow' || this._arrowType === 'doubleArrow') {
                    const prev = points[points.length - 2];
                    const angle = Math.atan2(endPoint.y - prev.y, endPoint.x - prev.x);
                    endPoint = {
                        x: endPoint.x - Math.cos(angle) * size,
                        y: endPoint.y - Math.sin(angle) * size
                    };
                }

                // Créer la ligne avec les points ajustés
                let adjustedPoints = [...points];
                if (this._arrowType === 'doubleArrow') {
                    adjustedPoints[0] = startPoint;
                }
                if (this._arrowType === 'arrow' || this._arrowType === 'doubleArrow') {
                    adjustedPoints[adjustedPoints.length - 1] = endPoint;
                }

                let linePathData = adjustedPoints.map((p, i) =>
                    `${i === 0 ? 'M' : 'L'}${Math.round(p.x)},${Math.round(p.y)}`
                ).join(' ');

                const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                linePath.setAttribute('class', 'arrow-line');
                linePath.setAttribute('d', linePathData);
                linePath.setAttribute('stroke', color);
                linePath.setAttribute('stroke-width', lineWeight);
                linePath.setAttribute('fill', 'none');
                linePath.setAttribute('stroke-linecap', 'round');
                linePath.setAttribute('stroke-linejoin', 'round');

                if (this.options.dashArray) {
                    linePath.setAttribute('stroke-dasharray', this.options.dashArray);
                }

                this._svgGroup.appendChild(linePath);
                console.log('[SVGUtils:POLYGON] ✅ Line path added');

                // Ajouter les triangles aux positions originales
                if (this._arrowType === 'arrow' || this._arrowType === 'doubleArrow') {
                    const last = points[points.length - 1];
                    const prev = points[points.length - 2];
                    const angleEnd = Math.atan2(last.y - prev.y, last.x - prev.x) * 180 / Math.PI;

                    const arrowEnd = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    arrowEnd.setAttribute('class', 'arrow-tip-end');
                    arrowEnd.setAttribute('d', SVGUtils._createArrowPolygon(last, angleEnd, size));
                    arrowEnd.setAttribute('fill', color);
                    arrowEnd.setAttribute('stroke', 'none');

                    this._svgGroup.appendChild(arrowEnd);
                    console.log('[SVGUtils:POLYGON] ✅ End arrow added');
                }

                if (this._arrowType === 'doubleArrow') {
                    const first = points[0];
                    const next = points[1];
                    const angleStart = Math.atan2(next.y - first.y, next.x - first.x) * 180 / Math.PI + 180;

                    const arrowStart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    arrowStart.setAttribute('class', 'arrow-tip-start');
                    arrowStart.setAttribute('d', SVGUtils._createArrowPolygon(first, angleStart, size));
                    arrowStart.setAttribute('fill', color);
                    arrowStart.setAttribute('stroke', 'none');

                    this._svgGroup.appendChild(arrowStart);
                    console.log('[SVGUtils:POLYGON] ✅ Start arrow added');
                }

                console.log('[SVGUtils:POLYGON] ✅ renderArrow complete');
            };

            arrowsGroup.appendChild(group);

            polyline._svgGroup = group;
            polyline._arrowType = arrowType;
            polyline._arrowRenderHandler = renderArrow;

            // Gestion des flags d'édition
            polyline.on('pm:dragstart', function() {
                this._isDragging = true;
            });

            polyline.on('pm:dragend', function() {
                this._isDragging = false;
                if (this._arrowRenderHandler) {
                    this._arrowRenderHandler.call(this);
                }
            });

            polyline.on('pm:vertexadded pm:vertexremoved pm:markerdragstart', function() {
                this._isEditing = true;
            });

            polyline.on('pm:markerdragend pm:edit', function() {
                this._isEditing = false;
                if (this._arrowRenderHandler) {
                    this._arrowRenderHandler.call(this);
                }
            });

            // Rendu uniquement sur les événements finaux
            map.on('zoomend moveend', renderArrow, polyline);

            // ✅ CRUCIAL : Forcer le rendu initial avec requestAnimationFrame
            console.log('[SVGUtils:POLYGON] 🔄 Scheduling initial render...');
            requestAnimationFrame(() => {
                console.log('[SVGUtils:POLYGON] 🎨 Executing initial render');
                renderArrow.call(polyline);
            });

            console.log('[SVGUtils:POLYGON] ✅ Arrows created');
            return true;

        } catch (error) {
            console.error('[SVGUtils:POLYGON] ❌ Error:', error);
            console.error('[SVGUtils:POLYGON] Error stack:', error.stack);
            return false;
        }
    }









    // ============================================================
    // MODE MARKER - Ancien système avec markers SVG (CONSERVÉ)
    // ============================================================
    static _addArrowheadsMarkerMode(polyline, arrowType, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 150;
        console.log('[SVGUtils:MARKER] 🎯 addArrowheadsToPolylineSVG called for:', arrowType, 'Retry:', retryCount);

        try {
            SVGUtils.cleanupArrowheads(polyline);

            if (!polyline || !polyline._map) {
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        SVGUtils._addArrowheadsMarkerMode(polyline, arrowType, retryCount + 1);
                    }, RETRY_DELAY);
                }
                return false;
            }

            const map = polyline._map;
            const svgContainer = SVGUtils._ensureArrowContainer(map);
            let defs = svgContainer.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                svgContainer.insertBefore(defs, svgContainer.firstChild);
            }

            const markerConfig = {
                arrow: {
                    id: `arrowhead-end-${polyline._leaflet_id}`,
                    path: 'M0,0 L10,5 L0,10 Z'
                },
                doubleArrow: {
                    idStart: `arrowhead-start-${polyline._leaflet_id}`,
                    idEnd: `arrowhead-end-${polyline._leaflet_id}`,
                    pathStart: 'M10,0 L0,5 L10,10 Z',
                    pathEnd: 'M0,0 L10,5 L0,10 Z'
                }
            };

            const config = markerConfig[arrowType];
            if (!config) return false;
            const color = polyline.options.color || '#000000';

            const createMarkerIfNeeded = (markerId, pathD) => {
                let marker = defs.querySelector(`#${markerId}`);
                if (!marker) {
                    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                    marker.setAttribute('id', markerId);
                    marker.setAttribute('viewBox', '0 0 10 10');
                    marker.setAttribute('refX', '9');
                    marker.setAttribute('refY', '5');
                    marker.setAttribute('markerWidth', '8');
                    marker.setAttribute('markerHeight', '8');
                    marker.setAttribute('markerUnits', 'strokeWidth');
                    marker.setAttribute('orient', 'auto');
                    marker.setAttribute('overflow', 'visible');

                    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    arrowPath.setAttribute('d', pathD);
                    arrowPath.setAttribute('fill', color);
                    arrowPath.setAttribute('stroke', 'none');
                    marker.appendChild(arrowPath);
                    defs.appendChild(marker);
                    console.log('[SVGUtils:MARKER] ✓ Marker created:', markerId);
                } else {
                    const existingPath = marker.querySelector('path');
                    if (existingPath) existingPath.setAttribute('fill', color);
                }
                return markerId;
            };

            if (arrowType === 'arrow') {
                createMarkerIfNeeded(config.id, config.path);
            } else if (arrowType === 'doubleArrow') {
                createMarkerIfNeeded(config.idStart, config.pathStart);
                createMarkerIfNeeded(config.idEnd, config.pathEnd);
            }

            const latlngs = polyline.getLatLngs();
            const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
            if (coords.length < 2) {
                console.warn('[SVGUtils:MARKER] ⚠️ Not enough coords:', coords.length);
                return false;
            }

            let pathData = '';
            coords.forEach((latlng, i) => {
                const point = map.latLngToLayerPoint(latlng);
                pathData += (i === 0 ? `M${point.x},${point.y}` : ` L${point.x},${point.y}`);
            });

            const pathId = `arrow-path-${polyline._leaflet_id}`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('id', pathId);
            path.setAttribute('class', 'leaflet-interactive');
            path.setAttribute('data-polyline-id', polyline._leaflet_id);
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', (polyline.options.weight || 3).toString());
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('fill', 'none');
            path.setAttribute('pointer-events', 'stroke');
            path.setAttribute('opacity', '1');

            if (polyline.options.dashArray) {
                path.setAttribute('stroke-dasharray', polyline.options.dashArray);
            }

            if (arrowType === 'arrow') {
                path.setAttribute('marker-end', `url(#${config.id})`);
            } else if (arrowType === 'doubleArrow') {
                path.setAttribute('marker-start', `url(#${config.idStart})`);
                path.setAttribute('marker-end', `url(#${config.idEnd})`);
            }

            svgContainer.appendChild(path);

            const updatePath = function() {
                requestAnimationFrame(() => {
                    if (!this._svgPath || !this._svgPath.isConnected || !this._map) {
                        this._map?.off('zoom move', this._arrowUpdateHandler, this);
                        return;
                    }

                    const currentMap = this._map;
                    const latlngs = this.getLatLngs();
                    const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
                    let pathData = '';
                    coords.forEach((latlng, i) => {
                        const point = currentMap.latLngToLayerPoint(latlng);
                        pathData += (i === 0 ? `M${point.x},${point.y}` : ` L${point.x},${point.y}`);
                    });

                    this._svgPath.setAttribute('d', pathData);

                    if (this._path && this._path.style.display !== 'none') {
                        this._path.style.display = 'none';
                    }
                });
            };

            polyline._svgPath = path;
            polyline._arrowMarkerId = config.id || config.idEnd;
            polyline._arrowType = arrowType;
            polyline._arrowPathId = pathId;
            polyline._arrowUpdateHandler = updatePath;

            map.on('zoom move', updatePath, polyline);

            console.log(`[SVGUtils:MARKER] ✅ Arrows created for layer ${polyline._leaflet_id}`);

            SVGUtils.maskPolylineWhenReady(polyline);

            return true;

        } catch (error) {
            console.error(`[SVGUtils:MARKER] ❌ ERROR:`, error);
            return false;
        }
    }

    // ============================================================
    // NETTOYAGE - Compatible avec les deux modes
    // ============================================================
    static cleanupArrowheads(polyline) {
        console.log(`[SVGUtils] 🧹 cleanupArrowheads START - polyline ID: ${polyline?._leaflet_id}`);

        try {
            if (polyline.options) {
                polyline.options.marker = null;
                polyline.options.markerStart = null;
                polyline.options.markerEnd = null;
            }

            if (polyline._svgPath) {
                polyline._svgPath.remove?.();
                delete polyline._svgPath;
            }

            if (polyline._svgGroup) {
                polyline._svgGroup.remove?.();
                delete polyline._svgGroup;
            }

            const svgContainer = document.getElementById('arrow-svg-container');
            if (svgContainer) {
                const elements = svgContainer.querySelectorAll(`[data-polyline-id="${polyline._leaflet_id}"]`);
                elements.forEach(el => el.remove());
            }

            if (polyline._arrowRenderHandler && polyline._map) {
                const map = polyline._map;
                ['zoom', 'move', 'zoomend', 'moveend', 'viewreset'].forEach(event => {
                    map.off(event, polyline._arrowRenderHandler, polyline);
                });
                delete polyline._arrowRenderHandler;
            }

            if (polyline._arrowUpdateHandler && polyline._map) {
                const map = polyline._map;
                ['zoom', 'move', 'zoomend', 'moveend', 'viewreset'].forEach(event => {
                    map.off(event, polyline._arrowUpdateHandler, polyline);
                });
                delete polyline._arrowUpdateHandler;
            }

            delete polyline._arrowType;
            delete polyline._arrowMarkerId;
            delete polyline._arrowPathId;

            console.log(`[SVGUtils] ✅ cleanupArrowheads COMPLETE`);

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in cleanupArrowheads:', error.message);
        }
    }

    // ============================================================
    // MASQUAGE POLYLINE NATIVE
    // ============================================================
    static maskPolylineWhenReady(polyline, attempt = 0) {
        const MAX_ATTEMPTS = 3;
        const layerId = polyline?._leaflet_id || 'unknown';

        if (attempt >= MAX_ATTEMPTS) {
            console.error(`[SVGUtils] ❌ Masquage échoué après ${MAX_ATTEMPTS} tentatives`);
            return;
        }

        if (!polyline._map) {
            console.warn(`[SVGUtils] ⚠️ Layer ${layerId} n'est plus sur la carte`);
            return;
        }

        if (polyline._path) {
            polyline._path.style.display = 'none';
            console.log(`[SVGUtils] ✅ [Tentative ${attempt + 1}] Polyline ${layerId} masquée`);
        } else {
            requestAnimationFrame(() => {
                SVGUtils.maskPolylineWhenReady(polyline, attempt + 1);
            });
        }
    }

    // ============================================================
    // MISE À JOUR MANUELLE
    // ============================================================
    static updateArrowPath(polyline) {
        // Mode POLYGON
        if (polyline._svgGroup && polyline._arrowRenderHandler) {
            polyline._arrowRenderHandler.call(polyline);
            return true;
        }

        // Mode MARKER
        if (!polyline._svgPath || !polyline._svgPath.isConnected) {
            console.warn('[SVGUtils] ⚠️ Cannot update: path not connected');
            return false;
        }

        const map = polyline._map;
        if (!map) {
            console.warn('[SVGUtils] ⚠️ Cannot update: no map reference');
            return false;
        }

        const coords = polyline.getLatLngs();
        if (coords.length < 2) {
            console.warn('[SVGUtils] ⚠️ Cannot update: insufficient coordinates');
            return false;
        }

        let d = '';
        coords.forEach((ll, i) => {
            const p = map.latLngToLayerPoint(ll);
            d += (i ? ' L' : 'M') + Math.round(p.x) + ',' + Math.round(p.y);
        });

        const path = polyline._svgPath;
        path.setAttribute('d', d);

        if (polyline._path) {
            polyline._path.style.display = 'none';
        }

        return true;
    }

    // ============================================================
    // GESTION DU DRAG
    // ============================================================
    static handleLayerDrag(polyline) {
        console.log('[SVGUtils] 🖱️ handleLayerDrag called for:', polyline._leaflet_id);
        try {
            polyline._dragState = {
                hadArrows: !!polyline._arrowType,
                arrowType: polyline._arrowType,
                svgPath: polyline._svgPath,
                svgGroup: polyline._svgGroup,
                arrowUpdateHandler: polyline._arrowUpdateHandler,
                arrowRenderHandler: polyline._arrowRenderHandler
            };

            if (polyline._svgPath && polyline._svgPath.isConnected) {
                polyline._svgPath.style.display = 'none';
                console.log('[SVGUtils] ✅ SVG path hidden during drag');
            }

            if (polyline._svgGroup && polyline._svgGroup.isConnected) {
                polyline._svgGroup.style.display = 'none';
                console.log('[SVGUtils] ✅ SVG group hidden during drag');
            }

            if (polyline._path) {
                polyline._path.style.display = '';
                console.log('[SVGUtils] ✅ Leaflet path shown during drag');
            }

            if (polyline._arrowUpdateHandler && polyline._map) {
                const map = polyline._map;
                ['zoom', 'move', 'zoomend', 'moveend'].forEach(evt => {
                    map.off(evt, polyline._arrowUpdateHandler, polyline);
                });
                console.log('[SVGUtils] ✅ Handlers detached during drag');
            }

            if (polyline._arrowRenderHandler && polyline._map) {
                const map = polyline._map;
                ['zoomend', 'moveend', 'viewreset'].forEach(evt => {
                    map.off(evt, polyline._arrowRenderHandler, polyline);
                });
            }

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in handleLayerDrag:', error.message);
        }
    }

    static restoreArrowsAfterDrag(polyline) {
        console.log('[SVGUtils] 🔄 restoreArrowsAfterDrag called for:', polyline._leaflet_id);
        try {
            if (!polyline._dragState || !polyline._dragState.hadArrows) {
                console.log('[SVGUtils] ⚠️ No arrows to restore');
                return;
            }

            const arrowType = polyline._dragState.arrowType;
            SVGUtils.cleanupArrowheads(polyline);

            setTimeout(() => {
                const success = SVGUtils.addArrowheadsToPolylineSVG(polyline, arrowType);
                if (success) {
                    requestAnimationFrame(() => {
                        if (polyline._path) {
                            polyline._path.style.display = 'none';
                        }

                        if (polyline._svgPath) {
                            polyline._svgPath.style.display = '';
                        }

                        if (polyline._svgGroup) {
                            polyline._svgGroup.style.display = '';
                        }

                        SVGUtils.updateArrowPath(polyline);
                        console.log('[SVGUtils] ✅ Arrows restored after drag');
                    });
                }

                delete polyline._dragState;
            }, 100);

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in restoreArrowsAfterDrag:', error.message);
        }
    }

    static removeArrowheadsFromPolylineSVG(polyline) {
        if (!polyline) return;
        console.log('[SVGUtils] 🗑️ removeArrowheadsFromPolylineSVG called for:', polyline._leaflet_id);

        SVGUtils.cleanupArrowheads(polyline);

        if (polyline._path) {
            polyline._path.style.display = '';
        }

        console.log('[SVGUtils] ✓ Arrowheads removed completely');
    }

    // ============================================================
    // FONCTIONS MARQUEURS SVG (INCHANGÉES)
    // ============================================================

    static convertMarkerToPolygon(marker) {
        try {
            console.log('[SVGUtils] Converting marker to polygon:', marker);

            const latlng = marker.getLatLng();
            const options = marker.options;
            const properties = {
                color: options.fillColor || '#007bff',
                lineColor: options.color || '#000000',
                opacity: options.fillOpacity || 1,
                lineWeight: options.weight || 2,
                markerSize: options.markerSize || 24
            };

            let polygon;
            switch (options.type) {
                case 'circle':
                    const radius = properties.markerSize / 1000;
                    const points = [];
                    for (let i = 0; i < 32; i++) {
                        const angle = (i / 32) * Math.PI * 2;
                        points.push([
                            latlng.lat + Math.sin(angle) * radius,
                            latlng.lng + Math.cos(angle) * radius
                        ]);
                    }
                    polygon = L.polygon(points, {
                        fillColor: properties.color,
                        color: properties.lineColor,
                        fillOpacity: properties.opacity,
                        weight: properties.lineWeight
                    });
                    break;

                case 'square':
                    const size = properties.markerSize / 1000;
                    polygon = L.polygon([
                        [latlng.lat + size, latlng.lng + size],
                        [latlng.lat + size, latlng.lng - size],
                        [latlng.lat - size, latlng.lng - size],
                        [latlng.lat - size, latlng.lng + size]
                    ], {
                        fillColor: properties.color,
                        color: properties.lineColor,
                        fillOpacity: properties.opacity,
                        weight: properties.lineWeight
                    });
                    break;

                case 'triangle':
                    const triangleSize = properties.markerSize / 1000;
                    polygon = L.polygon([
                        [latlng.lat + triangleSize, latlng.lng],
                        [latlng.lat - triangleSize, latlng.lng + triangleSize],
                        [latlng.lat - triangleSize, latlng.lng - triangleSize]
                    ], {
                        fillColor: properties.color,
                        color: properties.lineColor,
                        fillOpacity: properties.opacity,
                        weight: properties.lineWeight
                    });
                    break;

                case 'hexagon':
                    const hexSize = properties.markerSize / 1000;
                    const hexPoints = [
                        [latlng.lat + hexSize, latlng.lng],
                        [latlng.lat + hexSize / 2, latlng.lng + hexSize * 0.866],
                        [latlng.lat - hexSize / 2, latlng.lng + hexSize * 0.866],
                        [latlng.lat - hexSize, latlng.lng],
                        [latlng.lat - hexSize / 2, latlng.lng - hexSize * 0.866],
                        [latlng.lat + hexSize / 2, latlng.lng - hexSize * 0.866]
                    ];
                    polygon = L.polygon(hexPoints, {
                        fillColor: properties.color,
                        color: properties.lineColor,
                        fillOpacity: properties.opacity,
                        weight: properties.lineWeight
                    });
                    break;

                default:
                    console.error('[SVGUtils] Unsupported marker type:', options.type);
                    return null;
            }

            console.log('[SVGUtils] Marker converted to polygon:', polygon);
            return polygon;

        } catch (error) {
            console.error('[SVGUtils] Error converting marker to polygon:', error);
            throw error;
        }
    }

    static createMarkerSVG(type, latlng, options = {}) {
        try {
            console.log(`[SVGUtils] Creating SVG marker of type: ${type}, Options:`, options);

            const svgNS = "http://www.w3.org/2000/svg";
            const svgElement = document.createElementNS(svgNS, "svg");
            const markerSize = options.markerSize || 24;

            svgElement.setAttribute("width", markerSize);
            svgElement.setAttribute("height", markerSize);
            svgElement.setAttribute("viewBox", "0 0 24 24");

            let path;

            switch (type) {
                case 'circle':
                    path = document.createElementNS(svgNS, "circle");
                    path.setAttribute("cx", "12");
                    path.setAttribute("cy", "12");
                    path.setAttribute("r", "10");
                    break;
                case 'square':
                    path = document.createElementNS(svgNS, "rect");
                    path.setAttribute("x", "2");
                    path.setAttribute("y", "2");
                    path.setAttribute("width", "20");
                    path.setAttribute("height", "20");
                    break;
                case 'triangle':
                    path = document.createElementNS(svgNS, "polygon");
                    path.setAttribute("points", "12,2 22,20 2,20");
                    break;
                case 'hexagon':
                    path = document.createElementNS(svgNS, "polygon");
                    path.setAttribute("points", "12,2 20,6 20,18 12,22 4,18 4,6");
                    break;
                default:
                    console.error(`[SVGUtils] Unsupported marker type: ${type}`);
                    throw new Error(`Le type de marqueur "${type}" n'est pas pris en charge.`);
            }

            path.setAttribute("fill", options.color || "#007bff");
            path.setAttribute("stroke", options.lineColor || "#000000");
            path.setAttribute("stroke-width", options.lineWeight || 2);
            path.setAttribute("opacity", options.opacity || 1);

            // ✅ AJOUTER LE STYLE DE TIRETS
            if (options.lineDash === 'dashed') {
                path.setAttribute("stroke-dasharray", "6, 4");  // Pointillés classiques
                console.log('[SVGUtils] ✅ Applied dashed style to marker');
            } else if (options.lineDash === 'dotted') {
                path.setAttribute("stroke-dasharray", "2, 3");  // Pointillés fins
                console.log('[SVGUtils] ✅ Applied dotted style to marker');
            } else {
                console.log('[SVGUtils] ✅ Applied solid style to marker');
            }

            svgElement.appendChild(path);

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBase64 = btoa(svgString);
            const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

            const icon = L.icon({
                iconUrl: dataUrl,
                iconSize: [markerSize, markerSize],
                iconAnchor: [markerSize / 2, markerSize / 2],
                className: 'custom-marker'
            });

            const marker = L.marker(latlng, {
                icon: icon,
                draggable: options.draggable || false,
                interactive: true
            });

            // ✅ STOCKER LES OPTIONS ORIGINALES (pour la légende et l'édition)
            marker.originalOptions = {
                type: type,
                color: options.color || "#007bff",
                lineColor: options.lineColor || "#000000",
                opacity: options.opacity || 1,
                lineWeight: options.lineWeight || 2,
                lineDash: options.lineDash || 'solid',  // ✅ AJOUTER CETTE LIGNE
                markerSize: markerSize
            };

            console.log('[SVGUtils] Marker created and ready to be added to the map:', marker);
            return marker;

        } catch (error) {
            console.error('[SVGUtils] Error creating SVG marker:', error);
            throw error;
        }
    }

    /**
     * ✅ NOUVELLE MÉTHODE - Met à jour les styles des flèches SVG SANS regénération
     * Utilisée par applyStyle() pour un changement immédiat sans destruction/recréation
     */
    static updateArrowStylesOnly(polyline, newStyles) {
        console.log('[SVGUtils] 🎨 updateArrowStylesOnly called');
        console.log('[SVGUtils] New styles:', newStyles);

        try {
            // ========================================
            // MODE POLYGON (le vôtre)
            // ========================================
            if (polyline._svgGroup && polyline._arrowRenderHandler) {
                console.log('[SVGUtils] 📍 Updating POLYGON mode arrows');

                const group = polyline._svgGroup;

                // Mettre à jour les propriétés Leaflet
                polyline.options.color = newStyles.lineColor || polyline.options.color;
                polyline.options.weight = newStyles.lineWeight || polyline.options.weight;
                polyline.options.opacity = newStyles.opacity || polyline.options.opacity;
                polyline.options.dashArray = SVGUtils._convertDashToArray(newStyles.lineDash) || null;

                console.log('[SVGUtils] ✅ Leaflet options updated:', polyline.options);

                // Chercher tous les éléments SVG du groupe
                const linePath = group.querySelector('.arrow-line');
                const endArrow = group.querySelector('.arrow-tip-end');
                const startArrow = group.querySelector('.arrow-tip-start');

                const color = newStyles.lineColor || polyline.options.color || '#3388ff';
                const weight = newStyles.lineWeight || polyline.options.weight || 3;
                const dashArray = SVGUtils._convertDashToArray(newStyles.lineDash) || null;

                // Mettre à jour le chemin principal
                if (linePath) {
                    linePath.setAttribute('stroke', color);
                    linePath.setAttribute('stroke-width', weight);
                    if (dashArray) {
                        linePath.setAttribute('stroke-dasharray', dashArray);
                    } else {
                        linePath.removeAttribute('stroke-dasharray');
                    }
                    console.log('[SVGUtils] ✅ Line path updated');
                }

                // Mettre à jour la flèche de fin
                if (endArrow) {
                    endArrow.setAttribute('fill', color);
                    console.log('[SVGUtils] ✅ End arrow updated');
                }

                // Mettre à jour la flèche de début (doubleArrow)
                if (startArrow) {
                    startArrow.setAttribute('fill', color);
                    console.log('[SVGUtils] ✅ Start arrow updated');
                }

                console.log('[SVGUtils] ✅ Arrow styles updated (POLYGON mode)');
                return true;
            }

            // ========================================
            // MODE MARKER (ancien système)
            // ========================================
            if (polyline._svgPath) {
                console.log('[SVGUtils] 📍 Updating MARKER mode arrows');

                const color = newStyles.lineColor || polyline.options.color || '#000000';
                const weight = newStyles.lineWeight || polyline.options.weight || 3;
                const dashArray = SVGUtils._convertDashToArray(newStyles.lineDash) || null;

                polyline._svgPath.setAttribute('stroke', color);
                polyline._svgPath.setAttribute('stroke-width', weight);

                if (dashArray) {
                    polyline._svgPath.setAttribute('stroke-dasharray', dashArray);
                } else {
                    polyline._svgPath.removeAttribute('stroke-dasharray');
                }

                // Mettre à jour les marqueurs de flèche
                if (polyline._arrowMarkerId) {
                    const marker = document.getElementById(polyline._arrowMarkerId);
                    const markerPath = marker?.querySelector('path');
                    if (markerPath) {
                        markerPath.setAttribute('fill', color);
                        console.log('[SVGUtils] ✅ Marker arrow updated');
                    }
                }

                console.log('[SVGUtils] ✅ Arrow styles updated (MARKER mode)');
                return true;
            }

            console.warn('[SVGUtils] ⚠️ No arrow elements found to update');
            return false;

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in updateArrowStylesOnly:', error.message);
            return false;
        }
    }

    /**
     * ✅ UTILITAIRE - Convertit le type de tiret en format SVG
     */
    static _convertDashToArray(lineDash) {
        if (!lineDash || lineDash === 'solid') return null;
        if (lineDash === 'dashed') return '10, 10';
        if (lineDash === 'dotted') return '2, 6';
        return null;
    }



    static updateMarkerStyle(marker, newOptions) {
        try {
            console.log('[SVGUtils] Updating marker style:', marker, newOptions);

            const originalOptions = marker.originalOptions || {};
            const options = { ...originalOptions, ...newOptions };
            const newMarker = SVGUtils.createMarkerSVG(originalOptions.type, marker.getLatLng(), options);

            marker.setIcon(newMarker.getIcon());
            marker.originalOptions = options;

            console.log('[SVGUtils] Marker style updated:', marker);

        } catch (error) {
            console.error('[SVGUtils] Error updating marker style:', error);
            throw error;
        }
    }
}
