// LineControlManager.js - REFACTORED

// ✅ Isolation complète de la polyline native dès la création

import { SVGUtils } from '../../utils/SVGUtils.js';

export class LineControlManager {

    constructor(map, lineTypes, stateManager, geometryHandler) {
        if (!map || !lineTypes || !stateManager || !geometryHandler)
            throw new Error('Map, lineTypes, StateManager et GeometryHandler sont requis');

        this.map = map;
        this.lineTypes = lineTypes;
        this.activeLineType = null;
        this.stateManager = stateManager;
        this.geometryHandler = geometryHandler;

        // ✅ CORRECTION : Lier le contexte 'this' à la méthode de gestion d'événement.
        this._handlePolylineCreation = this._handlePolylineCreation.bind(this);
    }

    /**
     * ✅ Ajoute les contrôles boutons pour les types de lignes
     */
    addCustomLineControls() {
        const lineControl = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
                this.lineTypes.forEach(type => {
                    const btn = L.DomUtil.create('a', 'leaflet-control-custom', container);
                    btn.href = '#';
                    btn.title = `Dessiner une ligne ${type}`;

                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('width', '24');
                    svg.setAttribute('height', '24');
                    svg.setAttribute('viewBox', '0 0 24 24');

                    let path;
                    switch (type) {
                        case 'line':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            path.setAttribute('x1', '2');
                            path.setAttribute('y1', '12');
                            path.setAttribute('x2', '22');
                            path.setAttribute('y2', '12');
                            break;
                        case 'arrow':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            path.setAttribute('d', 'M2 12 L22 12 L18 8 L22 12 L18 16 Z');
                            break;
                        case 'doubleArrow':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            path.setAttribute('d', 'M2 12 L6 8 L2 12 L6 16 M22 12 L18 8 L22 12 L18 16 Z');
                            break;
                        default:
                            return;
                    }

                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke', '#000');
                    path.setAttribute('stroke-width', '2');
                    svg.appendChild(path);
                    btn.appendChild(svg);

                    L.DomEvent.on(btn, 'click', (e) => {
                        L.DomEvent.stop(e);
                        this.activeLineType = type;
                        console.log('[LineControlManager] Drawing mode enabled for:', type);

                        this.map.pm.enableDraw('Line', {
                            snappable: true,
                            snapDistance: 20,
                            tooltips: true,
                            finishOn: 'dblclick', // ✅ Double-clic pour terminer
                            pathOptions: {
                                lineJoin: 'round',
                                lineCap: 'round',
                                smoothFactor: 1.0
                            }
                        });
                    });
                });
                return container;
            }
        });

        this.map.addControl(new lineControl());
        console.log('[LineControlManager] Custom line controls added');

        // ✅ CORRECTION CRITIQUE : Écouter l'événement pm:create
        this.map.on('pm:create', this._handlePolylineCreation);
        console.log('[LineControlManager] Event listener registered for pm:create');
    }

    /**
     * ✅ Gère la création de polylines avec flèches
     */
    _handlePolylineCreation(e) {
        console.log(`[LineControlManager] _handlePolylineCreation triggered. Shape: ${e.shape}, ActiveType: ${this.activeLineType}`);

        if (e.shape !== 'Line' || !this.activeLineType) {
            console.log('[LineControlManager] ⚠️ Not a line or no active type');
            return;
        }

        const type = this.activeLineType;
        const layer = e.layer;
        console.log('[LineControlManager] 🔨 Creating polyline of type:', type);

        // 1️⃣ Créer la polyline éditable avec vraie couleur
        const realLine = L.polyline(layer.getLatLngs(), {
            color: '#3388ff',
            weight: 3,
            opacity: 1,
            lineJoin: 'round',
            lineCap: 'round',
            smoothFactor: 1.0,
            ...layer.options,
            renderer: L.svg()
        });

        realLine._arrowType = type;
        realLine.addTo(this.map);
        console.log('[LineControlManager] 📍 Polyline added to map');

        // 2️⃣ Créer les flèches SVG pour les types arrow et doubleArrow
        if (type === 'arrow' || type === 'doubleArrow') {
            console.log('[LineControlManager] 🎯 Creating SVG arrows...');
            if (!SVGUtils.addArrowheadsToPolylineSVG(realLine, type)) {
                console.error('[LineControlManager] ❌ Failed to create arrow path');
            } else {
                console.log(`[LineControlManager] ✅ Appel à SVGUtils.addArrowheadsToPolylineSVG terminé pour le layer ${realLine._leaflet_id}.`);
                console.log('[LineControlManager] ✅ SVG arrows creation process initiated.');
                SVGUtils.maskPolylineWhenReady(realLine);
            }
        } else {
            console.log('[LineControlManager] 📍 Normal line - polyline visible');
        }

        // 7️⃣ Retirer la couche PM initiale
        this.map.removeLayer(layer);
        console.log('[LineControlManager] 🗑️ PM layer removed');

        // 8️⃣ Enregistrement dans le state
        console.log('[LineControlManager] ➡️ Enregistrement de la géométrie dans StateManager...');
        const geometryObject = this.geometryHandler.createGeometryObject(realLine);
        this.stateManager.addGeometry(geometryObject);
        console.log('[LineControlManager] 📊 Geometry registered in state');

        // 9️⃣ ✅ DÉSACTIVER LE MODE DESSIN - CORRECTION CRITIQUE
        this.map.pm.disableDraw();
        this.activeLineType = null;
        console.log('[LineControlManager] ✅ Drawing mode DISABLED - Polyline creation complete');
    }
}
