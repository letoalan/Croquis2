// js/modules/mapping/lines/CurveControlManager.js

export class CurveControlManager {
    constructor(map, stateManager) {
        if (!map) {
            throw new Error('Map is required for CurveControlManager initialization.');
        }
        if (!stateManager) {
            throw new Error('StateManager is required for CurveControlManager initialization.');
        }

        this.map = map;
        this.stateManager = stateManager;
        this.curveMode = false;
        this.selectedPolyline = null;
        this.curveHandles = [];
        this.originalLatLngs = null;
        this.segmentCurves = new Map();
        this.curveButton = null;
        this._mapClickHandler = null;
    }

    /**
     * ✅ Ajoute le bouton dans la toolbar Leaflet.PM existante
     */
    addCurveControl() {
        const attemptAddButton = (attempts = 0) => {
            if (attempts > 10) {
                console.error('[CurveControlManager] Failed to find PM toolbar after 10 attempts');
                return;
            }

            const pmToolbars = document.querySelectorAll('.leaflet-pm-toolbar');
            let pmToolbar = null;

            pmToolbars.forEach(toolbar => {
                if (toolbar.querySelector('[title*="Edit"]') || toolbar.querySelector('[title*="Drag"]')) {
                    pmToolbar = toolbar;
                }
            });

            if (!pmToolbar) {
                console.log(`[CurveControlManager] PM Toolbar not ready, attempt ${attempts + 1}/10`);
                setTimeout(() => attemptAddButton(attempts + 1), 200);
                return;
            }

            console.log('[CurveControlManager] PM Toolbar found:', pmToolbar);

            const button = L.DomUtil.create('a', 'leaflet-pm-action action-curve', pmToolbar);
            button.href = '#';
            button.title = 'Courber une ligne';

            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.setAttribute('width', '20');
            icon.setAttribute('height', '20');
            icon.setAttribute('fill', 'none');
            icon.setAttribute('stroke', 'currentColor');
            icon.setAttribute('stroke-width', '2');
            icon.setAttribute('stroke-linecap', 'round');
            icon.setAttribute('stroke-linejoin', 'round');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M3 12 Q12 3, 21 12');
            icon.appendChild(path);
            button.appendChild(icon);

            this.curveButton = button;

            L.DomEvent.on(button, 'click', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                this.toggleCurveMode();
            });

            console.log('[CurveControlManager] Curve button added successfully');
        };

        attemptAddButton();
    }

    toggleCurveMode() {
        this.curveMode = !this.curveMode;
        if (this.curveMode) {
            this.curveButton.classList.add('active');
            console.log('[CurveControlManager] Curve mode ACTIVATED');
            this._activateCurveMode();
        } else {
            this.curveButton.classList.remove('active');
            console.log('[CurveControlManager] Curve mode DEACTIVATED');
            this._deactivateCurveMode();
        }
    }

    _activateCurveMode() {
        this.map.pm.disableGlobalEditMode();
        this.map.pm.disableDraw();

        console.log('[CurveControlManager] 🎯 Activation mode courbe - détection au clic...');

        // ✅ Solution 2 : Écouter au niveau de la carte avec détection géométrique
        this._mapClickHandler = (e) => {
            console.log('[CurveControlManager] 🗺️ Map clicked at', e.latlng);

            let clickedPolyline = null;
            const clickPoint = this.map.latLngToLayerPoint(e.latlng);
            const tolerance = 10; // pixels

            this.stateManager.geometries.forEach((geometry) => {
                if (geometry.type === 'Polyline' && geometry.layer) {
                    const latLngs = geometry.layer.getLatLngs();

                    // Vérifier chaque segment
                    for (let i = 0; i < latLngs.length - 1; i++) {
                        const p1 = this.map.latLngToLayerPoint(latLngs[i]);
                        const p2 = this.map.latLngToLayerPoint(latLngs[i + 1]);

                        const dist = this._pointToSegmentDistance(clickPoint, p1, p2);

                        if (dist < tolerance) {
                            console.log('[CurveControlManager] ✅ Polyline détectée! Distance:', dist);
                            clickedPolyline = geometry.layer;
                            break;
                        }
                    }
                }
            });

            if (clickedPolyline) {
                console.log('[CurveControlManager] 🎯 Polyline sélectionnée:', clickedPolyline._leaflet_id,
                    'arrowType:', clickedPolyline._arrowType || 'none');
                this._selectPolyline(clickedPolyline);
            } else {
                // Désélectionner si on clique ailleurs
                if (this.selectedPolyline) {
                    this._clearCurveHandles();
                    this.selectedPolyline = null;
                }
            }
        };

        this.map.on('click', this._mapClickHandler);
        console.log('[CurveControlManager] ✅ Mode courbe activé');
    }

    _deactivateCurveMode() {
        if (this._mapClickHandler) {
            this.map.off('click', this._mapClickHandler);
            this._mapClickHandler = null;
        }

        this._clearCurveHandles();
        this.selectedPolyline = null;
        this.originalLatLngs = null;
        this.segmentCurves.clear();

        console.log('[CurveControlManager] ✅ Mode courbe désactivé');
    }

    /**
     * ✅ Nouvelle méthode pour sélectionner une polyline
     */
    _selectPolyline(polyline) {
        if (this.selectedPolyline && this.selectedPolyline !== polyline) {
            this._clearCurveHandles();
        }

        this.selectedPolyline = polyline;
        this.originalLatLngs = polyline.getLatLngs().map(ll => L.latLng(ll.lat, ll.lng));
        this.segmentCurves.clear();

        console.log('[CurveControlManager] ✅ Polyline sélectionnée avec', this.originalLatLngs.length, 'points');
        this._showCurveHandles();
    }

    /**
     * ✅ Calcul de distance point-segment (utility)
     */
    _pointToSegmentDistance(p, p1, p2) {
        const A = p.x - p1.x;
        const B = p.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const dx = p.x - xx;
        const dy = p.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    _showCurveHandles() {
        this._clearCurveHandles();

        const latlngs = this.originalLatLngs;
        console.log('[CurveControlManager] 📍 Creating curve handles for', latlngs.length, 'points');

        for (let i = 0; i < latlngs.length - 1; i++) {
            const start = latlngs[i];
            const end = latlngs[i + 1];
            const midLat = (start.lat + end.lat) / 2;
            const midLng = (start.lng + end.lng) / 2;

            // ✅ HTML VISIBLE
            const handleHtml = `<div style="
        background: #ff6b6b;
        border: 2px solid white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: grab;
      "></div>`;

            const handle = L.marker([midLat, midLng], {
                draggable: true,
                icon: L.divIcon({
                    className: 'curve-handle',
                    html: handleHtml,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(this.map);

            handle.segmentIndex = i;
            handle.on('drag', (e) => {
                this._updateCurve(handle);
            });
            handle.on('dragend', (e) => {
                this._finalizeCurve();
            });

            this.curveHandles.push(handle);
        }

        console.log('[CurveControlManager] ✅ Curve handles créés:', this.curveHandles.length);
    }

    _updateCurve(handle) {
        const handlePos = handle.getLatLng();
        const segmentIndex = handle.segmentIndex;
        this.segmentCurves.set(segmentIndex, handlePos);

        console.log('[CurveControlManager] 🔄 Updating curve segment', segmentIndex);

        this._rebuildPolyline();

        // ✅ IMPORTANT : Si c'est une flèche, regénérer les flèches après courbage
        if (this.selectedPolyline._arrowType) {
            console.log('[CurveControlManager] 🎯 Regenerating arrows for', this.selectedPolyline._arrowType);

            if (this.selectedPolyline._arrowRenderHandler) {
                this.selectedPolyline._arrowRenderHandler.call(this.selectedPolyline);
            }
        }
    }

    _rebuildPolyline() {
        const newLatLngs = [];

        for (let i = 0; i < this.originalLatLngs.length - 1; i++) {
            const start = this.originalLatLngs[i];
            const end = this.originalLatLngs[i + 1];

            if (this.segmentCurves.has(i)) {
                const controlPoint = this.segmentCurves.get(i);
                const curvePoints = this._generateBezierCurve(start, controlPoint, end, 20);
                newLatLngs.push(...curvePoints.slice(0, -1));
            } else {
                newLatLngs.push(start);
            }
        }

        newLatLngs.push(this.originalLatLngs[this.originalLatLngs.length - 1]);

        this.selectedPolyline.setLatLngs(newLatLngs);
    }

    _finalizeCurve() {
        const geometryIndex = this.stateManager.geometries.findIndex(
            g => g.layer === this.selectedPolyline
        );

        if (geometryIndex !== -1) {
            const newLatLngs = this.selectedPolyline.getLatLngs();
            this.stateManager.updateGeometryCoordinates(geometryIndex, newLatLngs);
            this.originalLatLngs = newLatLngs.map(ll => L.latLng(ll.lat, ll.lng));
            this.segmentCurves.clear();

            // ✅ Regénérer les flèches si nécessaire
            if (this.selectedPolyline._arrowType && this.selectedPolyline._arrowRenderHandler) {
                this.selectedPolyline._arrowRenderHandler.call(this.selectedPolyline);
            }

            console.log('[CurveControlManager] ✅ Courbe finalisée, handles recréés');
            this._showCurveHandles();
        }
    }

    _generateBezierCurve(start, control, end, steps) {
        const points = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lat = Math.pow(1 - t, 2) * start.lat +
                2 * (1 - t) * t * control.lat +
                Math.pow(t, 2) * end.lat;
            const lng = Math.pow(1 - t, 2) * start.lng +
                2 * (1 - t) * t * control.lng +
                Math.pow(t, 2) * end.lng;

            points.push(L.latLng(lat, lng));
        }

        return points;
    }

    _clearCurveHandles() {
        this.curveHandles.forEach(handle => this.map.removeLayer(handle));
        this.curveHandles = [];
    }
}
