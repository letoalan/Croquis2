// SVGUtils.js

export class SVGUtilsOLD {


    /* ------------------------------------------------------------------
   Garantit l’existence du conteneur SVG (+ <defs>) pour les arrowheads
   ------------------------------------------------------------------ */
    static _ensureArrowContainer(map) {
        /* 1.  verrou idempotent */
        if (document.getElementById('arrow-svg-container')) {
            return document.getElementById('arrow-svg-container');
        }

        /* 2.  création propre */
        const b = map.getPixelBounds();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'arrow-svg-container';
        svg.setAttribute('class', 'leaflet-zoom-animated');
        Object.assign(svg.style, {
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 400,
            overflow: 'visible',
            pointerEvents: 'none'          /* ← laisse cliquer à travers */
        });
        svg.setAttribute('width', b.max.x - b.min.x);
        svg.setAttribute('height', b.max.y - b.min.y);
        svg.setAttribute('viewBox', `0 0 ${b.max.x - b.min.x} ${b.max.y - b.min.y}`);
        svg._arrowheadsCache = new Set();

        /* 3.  on place avant tout le reste → z-index le plus bas du pane */
        const pane = map.getPane('overlayPane');
        pane.insertBefore(svg, pane.firstChild);

        /* 4.  on recalcule dès que la carte bouge */
        const updateSize = () => {
            const nb = map.getPixelBounds();
            svg.setAttribute('width', nb.max.x - nb.min.x);
            svg.setAttribute('height', nb.max.y - nb.min.y);
            svg.setAttribute('viewBox', `0 0 ${nb.max.x - nb.min.x} ${nb.max.y - nb.min.y}`);
        };
        map.on('moveend zoomend resize', updateSize);

        return svg;
    }

    /**

     * Convertit un marqueur SVG en layer (polygone).

     * @param {L.Marker} marker - Le marqueur SVG à convertir.

     * @returns {L.Polygon} - Le layer converti.

     */

    static convertMarkerToPolygon(marker) {

        try {

            console.log('[SVGUtils] Converting marker to polygon:', marker);



            // Récupérer les coordonnées du marqueur

            const latlng = marker.getLatLng();



            // Récupérer les propriétés du marqueur

            const options = marker.options;

            const properties = {

                color: options.fillColor || '#007bff',

                lineColor: options.color || '#000000',

                opacity: options.fillOpacity || 1,

                lineWeight: options.weight || 2,

                markerSize: options.markerSize || 24

            };



            // Créer un polygone en fonction du type de marqueur

            let polygon;

            switch (options.type) {

                case 'circle':

                    // Convertir un cercle en polygone avec 32 sommets

                    const radius = properties.markerSize / 1000; // Conversion approximative en degrés

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

                    // Convertir un carré en polygone

                    const size = properties.markerSize / 1000; // Conversion approximative en degrés

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

                    // Convertir un triangle en polygone

                    const triangleSize = properties.markerSize / 1000; // Conversion approximative en degrés

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

                    // Convertir un hexagone en polygone

                    const hexSize = properties.markerSize / 1000; // Conversion approximative en degrés

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



    /**

     * Crée un marqueur SVG à partir d'un layer (polygone).

     * @param {string} type - Le type de marqueur (circle, square, triangle, hexagon).

     * @param {L.LatLng} latlng - Les coordonnées du marqueur.

     * @param {Object} options - Les propriétés du marqueur.

     * @returns {L.Marker} - Le marqueur SVG créé.

     */

    static createMarkerSVG(type, latlng, options = {}) {

        try {

            console.log(`[SVGUtils] Creating SVG marker of type: ${type}, Options:`, options);



            // Namespace SVG

            const svgNS = "http://www.w3.org/2000/svg";



            // Création de l'élément SVG

            const svgElement = document.createElementNS(svgNS, "svg");

            const markerSize = options.markerSize || 24;

            svgElement.setAttribute("width", markerSize);

            svgElement.setAttribute("height", markerSize);

            svgElement.setAttribute("viewBox", "0 0 24 24");



            let path;



            // Sélection du type de marqueur

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



            // Configuration des styles SVG

            path.setAttribute("fill", options.color || "#007bff");

            path.setAttribute("stroke", options.lineColor || "#000000");

            path.setAttribute("stroke-width", options.lineWeight || 2);

            path.setAttribute("opacity", options.opacity || 1);

            svgElement.appendChild(path);



            // Conversion du SVG en string pour l'URL data

            const svgString = new XMLSerializer().serializeToString(svgElement);

            const svgBase64 = btoa(svgString);

            const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;



            // Création de l'icône pour le marker

            const icon = L.icon({

                iconUrl: dataUrl,

                iconSize: [markerSize, markerSize],

                iconAnchor: [markerSize / 2, markerSize / 2],

                className: 'custom-marker'

            });



            // Création du marker avec l'icône SVG

            const marker = L.marker(latlng, {

                icon: icon,

                draggable: options.draggable || false,

                interactive: true

            });



            // Stockage des propriétés originales pour la conversion

            marker.originalOptions = {

                type: type,

                color: options.color || "#007bff",

                lineColor: options.lineColor || "#000000",

                opacity: options.opacity || 1,

                lineWeight: options.lineWeight || 2,

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

     * Met à jour le style d'un marqueur SVG.

     * @param {L.Marker} marker - Le marqueur à mettre à jour.

     * @param {Object} newOptions - Les nouvelles options de style.

     */

    static updateMarkerStyle(marker, newOptions) {

        try {

            console.log('[SVGUtils] Updating marker style:', marker, newOptions);



            const originalOptions = marker.originalOptions || {};

            const options = { ...originalOptions, ...newOptions };



            const newMarker = SVGUtilsOLD.createMarkerSVG(originalOptions.type, marker.getLatLng(), options);



            marker.setIcon(newMarker.getIcon());

            marker.originalOptions = options;



            console.log('[SVGUtils] Marker style updated:', marker);

        } catch (error) {

            console.error('[SVGUtils] Error updating marker style:', error);

            throw error;

        }

    }



    /**

     * ✅ FONCTION FINALE COMPLÈTE - Ajoute les arrowheads sans rémanence

     */

    /**
     * ✅ FONCTION FINALE COMPLÈTE – Ajoute les flèches sans rémanence
     */
    static addArrowheadsToPolylineSVG(polyline, arrowType, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 150;

        try {
            console.log('[SVGUtils] 🎯 addArrowheadsToPolylineSVG called for:', arrowType, 'Retry:', retryCount);

            // ✅ NETTOYAGE COMPLET avant création
            console.log('[SVGUtils] 🧹 Cleaning before creation...');
            SVGUtilsOLD.cleanupArrowheads(polyline);

            if (!polyline || !polyline._map) {
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        SVGUtilsOLD.addArrowheadsToPolylineSVG(polyline, arrowType, retryCount + 1);
                    }, RETRY_DELAY);
                }
                return false;
            }

            const map = polyline._map;

            // ✅ GARANTIR que le conteneur SVG existe
            const svgContainer = SVGUtilsOLD._ensureArrowContainer(map);
            let defs = svgContainer.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                svgContainer.insertBefore(defs, svgContainer.firstChild);
            }

            // ✅ Configuration des markers
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

            // ✅ Créer les markers si nécessaire
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
                    console.log('[SVGUtils] ✓ Marker created:', markerId);
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

            // ✅ Suppression des anciens paths
            const allOldPaths = svgContainer.querySelectorAll(`path[data-polyline-id="${polyline._leaflet_id}"]`);
            allOldPaths.forEach(oldPath => {
                oldPath.remove();
                console.log('[SVGUtils] ✅ Old path removed:', oldPath.id);
            });

            const directPath = document.getElementById(`arrow-path-${polyline._leaflet_id}`);
            if (directPath && directPath.isConnected) {
                directPath.remove();
                console.log('[SVGUtils] ✅ Direct path removed:', directPath.id);
            }

            // ✅ Créer le nouveau path
            const latlngs = polyline.getLatLngs();
            const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
            if (coords.length < 2) {
                console.warn('[SVGUtils] ⚠️ Not enough coords:', coords.length);
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

            // ✅ Appliquer les marqueurs
            if (arrowType === 'arrow') {
                path.setAttribute('marker-end', `url(#${config.id})`);
            } else if (arrowType === 'doubleArrow') {
                path.setAttribute('marker-start', `url(#${config.idStart})`);
                path.setAttribute('marker-end', `url(#${config.idEnd})`);
            }

            svgContainer.appendChild(path);

            // ✅ Mise à jour automatique au zoom/move
            const updatePath = () => {
                if (!path.isConnected) return;
                const latlngs = polyline.getLatLngs();
                const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
                let pathData = '';
                coords.forEach((latlng, i) => {
                    const point = map.latLngToLayerPoint(latlng);
                    pathData += (i === 0 ? `M${point.x},${point.y}` : ` L${point.x},${point.y}`);
                });
                path.setAttribute('d', pathData);
            };

            // ✅ Stocker les références
            polyline._svgPath = path;
            polyline._arrowMarkerId = config.id || config.idEnd;
            polyline._arrowType = arrowType;
            polyline._arrowPathId = pathId;
            polyline._arrowUpdateHandler = updatePath;

            // ✅ Attacher les événements
            map.on('zoom', updatePath);
            map.on('move', updatePath);

            console.log('[SVGUtils] ✅✅✅ Arrowheads added successfully!');
            return true;

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR:', error.message);
            return false;
        }
    }

    static updateArrowPath(polyline) {
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

        // ✅ CORRECTION : Utiliser latLngToLayerPoint pour cohérence
        let d = '';
        coords.forEach((ll, i) => {
            const p = map.latLngToLayerPoint(ll);
            d += (i ? ' L' : 'M') + Math.round(p.x) + ',' + Math.round(p.y);
        });

        // ✅ Mise à jour atomique du path
        const path = polyline._svgPath;
        path.setAttribute('d', d);

        // ✅ Forcer le repaint immédiat
        path.style.visibility = 'hidden';
        void path.offsetHeight; // Force reflow
        path.style.visibility = 'visible';

        // ✅ S'assurer que la polyline Leaflet reste masquée
        if (polyline._path) {
            polyline._path.style.display = 'none';
        }

        return true;
    }



    /**

     * ✅ Nettoie complètement les arrowheads

     */

    static cleanupArrowheads(polyline) {
        console.log('[SVGUtils] 🧹 cleanupArrowheads START - polyline ID:', polyline._leaflet_id);

        try {
            // 1. Nettoyer les propriétés Leaflet
            if (polyline.options) {
                polyline.options.marker = null;
                polyline.options.markerStart = null;
                polyline.options.markerEnd = null;
            }

            // 2. Suppression complète du path SVG
            if (polyline._svgPath) {
                // Vérifier si le path existe encore dans le DOM
                const pathId = polyline._svgPath.getAttribute('id');
                const existingPath = document.getElementById(pathId);

                if (existingPath && existingPath.isConnected) {
                    existingPath.remove();
                    console.log('[SVGUtils] ✅ Path removed from DOM:', pathId);
                }

                delete polyline._svgPath;
            }

            // 3. Nettoyer le cache SVG
            if (polyline._arrowPathId) {
                const svgContainer = document.getElementById('arrow-svg-container');
                if (svgContainer && svgContainer._arrowheadsCache) {
                    svgContainer._arrowheadsCache.delete(polyline._arrowPathId);
                }
                delete polyline._arrowPathId;
            }

            // 4. Détacher les event listeners (CRITIQUE)
            if (polyline._arrowUpdateHandler && polyline._map) {
                const map = polyline._map;

                // Détacher tous les événements possibles
                ['zoom', 'move', 'zoomend', 'moveend', 'viewreset'].forEach(event => {
                    map.off(event, polyline._arrowUpdateHandler);
                });

                delete polyline._arrowUpdateHandler;
                console.log('[SVGUtils] ✅ All event handlers detached');
            }

            // 5. Nettoyer les propriétés
            delete polyline._arrowType;
            delete polyline._arrowMarkerId;

            console.log('[SVGUtils] ✅ cleanupArrowheads COMPLETE');

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in cleanupArrowheads:', error.message);
        }
    }

    /**
     * ✅ Gère le nettoyage pendant le drag des layers
     */
    static handleLayerDrag(polyline) {
        console.log('[SVGUtils] 🖱️ handleLayerDrag called for:', polyline._leaflet_id);
        try {
            // ✅ Stocker l'état AVANT toute modification
            polyline._dragState = {
                hadArrows: !!polyline._arrowType,
                arrowType: polyline._arrowType,
                svgPath: polyline._svgPath,
                arrowUpdateHandler: polyline._arrowUpdateHandler
            };

            // ✅ Cacher le SVG pendant le drag
            if (polyline._svgPath && polyline._svgPath.isConnected) {
                polyline._svgPath.style.display = 'none';
                console.log('[SVGUtils] ✅ SVG hidden during drag');
            }

            // ✅ Afficher temporairement la polyline Leaflet
            if (polyline._path) {
                polyline._path.style.display = '';
                console.log('[SVGUtils] ✅ Leaflet path shown during drag');
            }

            // ✅ Détacher les handlers de zoom/move pendant le drag
            if (polyline._arrowUpdateHandler && polyline._map) {
                const map = polyline._map;
                ['zoom', 'move', 'zoomend', 'moveend'].forEach(evt => {
                    map.off(evt, polyline._arrowUpdateHandler);
                });
                console.log('[SVGUtils] ✅ Handlers detached during drag');
            }

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in handleLayerDrag:', error.message);
        }
    }

    /**
     * ✅ Restaure les flèches après le drag
     */
    static restoreArrowsAfterDrag(polyline) {
        console.log('[SVGUtils] 🔄 restoreArrowsAfterDrag called for:', polyline._leaflet_id);
        try {
            if (!polyline._dragState || !polyline._dragState.hadArrows) {
                console.log('[SVGUtils] ⚠️ No arrows to restore');
                return;
            }

            const arrowType = polyline._dragState.arrowType;

            // ✅ NETTOYAGE COMPLET (supprime l'ancien path SVG)
            SVGUtilsOLD.cleanupArrowheads(polyline);

            // ✅ RECRÉER les flèches avec les nouvelles coordonnées
            setTimeout(() => {
                const success = SVGUtilsOLD.addArrowheadsToPolylineSVG(polyline, arrowType);

                if (success) {
                    // ✅ Masquer la polyline Leaflet après restauration
                    requestAnimationFrame(() => {
                        if (polyline._path) {
                            polyline._path.style.display = 'none';
                        }
                        if (polyline._svgPath) {
                            polyline._svgPath.style.display = '';
                            SVGUtilsOLD.updateArrowPath(polyline);
                        }
                        console.log('[SVGUtils] ✅ Arrows restored after drag');
                    });
                }

                // ✅ Nettoyer l'état
                delete polyline._dragState;
            }, 100); // Délai pour stabiliser le DOM

        } catch (error) {
            console.error('[SVGUtils] ❌ ERROR in restoreArrowsAfterDrag:', error.message);
        }
    }

    /**

     * Supprime les flèches d'une polyline

     */

    static removeArrowheadsFromPolylineSVG(polyline) {

        if (!polyline) return;



        console.log('[SVGUtils] 🗑️ removeArrowheadsFromPolylineSVG called for:', polyline._leaflet_id);



        const path = polyline._path;

        if (path) {

            path.removeAttribute('marker-start');

            path.removeAttribute('marker-end');

            console.log('[SVGUtils] Markers removed from path');

        }



        // ✅ Détacher TOUS les event listeners

        if (polyline._arrowUpdateHandler && polyline._map) {

            polyline._map.off('zoom', polyline._arrowUpdateHandler);

            polyline._map.off('move', polyline._arrowUpdateHandler);

            polyline._map.off('zoomend', polyline._arrowUpdateHandler);

            polyline._map.off('moveend', polyline._arrowUpdateHandler);

            polyline._map.off('viewreset', polyline._arrowUpdateHandler);

            polyline._arrowUpdateHandler = null;

        }



        delete polyline._arrowType;

        delete polyline._arrowMarkerId;



        console.log('[SVGUtils] ✓ Arrowheads removed completely');

    }







}