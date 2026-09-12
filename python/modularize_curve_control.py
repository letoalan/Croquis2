import os

def modularize_curve_control_manager():
    targets = [
        'fpaysage/js/modules/mapping/lines/CurveControlManager.js',
        'fportrait/js/modules/mapping/lines/CurveControlManager.js',
        'fpromethean/js/modules/mapping/lines/CurveControlManager.js'
    ]

    math_code = '''// BezierMath.js - Calculs d'interpolation et distances de segments pour les courbes

export class BezierMath {
    static pointToSegmentDistance(p, p1, p2) {
        const x = p.lat, y = p.lng;
        const x1 = p1.lat, y1 = p1.lng;
        const x2 = p2.lat, y2 = p2.lng;

        const A = x - x1, B = y - y1;
        const C = x2 - x1, D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
            xx = x1; yy = y1;
        } else if (param > 1) {
            xx = x2; yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx, dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static generateBezierCurve(start, control, end, steps = 20) {
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
}
'''

    manager_code = '''// js/modules/mapping/lines/CurveControlManager.js
import { BezierMath } from './BezierMath.js';

export class CurveControlManager {
    constructor(map, stateManager) {
        if (!map) throw new Error('Map is required for CurveControlManager initialization.');
        if (!stateManager) throw new Error('StateManager is required for CurveControlManager initialization.');

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

    addCurveControl() {
        const attemptAdd = (attempts = 0) => {
            if (attempts > 10) return;
            const pmToolbars = document.querySelectorAll('.leaflet-pm-toolbar');
            let pmToolbar = null;
            pmToolbars.forEach(tb => {
                if (tb.querySelector('[title*=\"Edit\"]') || tb.querySelector('[title*=\"Drag\"]')) pmToolbar = tb;
            });
            if (!pmToolbar) {
                setTimeout(() => attemptAdd(attempts + 1), 200);
                return;
            }

            const button = L.DomUtil.create('a', 'leaflet-pm-action action-curve', pmToolbar);
            button.href = '#';
            button.title = 'Courber une ligne';
            button.innerHTML = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M3 12 Q12 3, 21 12\"/></svg>`;
            this.curveButton = button;

            L.DomEvent.on(button, 'click', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                this.toggleCurveMode();
            });
        };
        attemptAdd();
    }

    toggleCurveMode() {
        this.curveMode = !this.curveMode;
        if (this.curveMode) {
            this.curveButton?.classList.add('active');
            this._activateCurveMode();
        } else {
            this.curveButton?.classList.remove('active');
            this._deactivateCurveMode();
        }
    }

    _activateCurveMode() {
        this.map.pm?.disableGlobalEditMode();
        this.map.pm?.disableDraw();

        this._mapClickHandler = (e) => {
            let clickedPolyline = null;
            let minDistance = Infinity;

            this.map.eachLayer(layer => {
                if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                    const latlngs = layer.getLatLngs();
                    for (let i = 0; i < latlngs.length - 1; i++) {
                        const dist = BezierMath.pointToSegmentDistance(e.latlng, latlngs[i], latlngs[i + 1]);
                        if (dist < minDistance && dist < 0.05) {
                            minDistance = dist;
                            clickedPolyline = layer;
                        }
                    }
                }
            });

            if (clickedPolyline) this._selectPolyline(clickedPolyline);
        };

        this.map.on('click', this._mapClickHandler);
    }

    _deactivateCurveMode() {
        if (this._mapClickHandler) {
            this.map.off('click', this._mapClickHandler);
            this._mapClickHandler = null;
        }
        this._clearCurveHandles();
        this.selectedPolyline = null;
    }

    _selectPolyline(polyline) {
        if (this.selectedPolyline === polyline) return;
        this._clearCurveHandles();
        this.selectedPolyline = polyline;
        this.originalLatLngs = polyline.getLatLngs().map(ll => L.latLng(ll.lat, ll.lng));
        this.segmentCurves.clear();
        this._showCurveHandles();
    }

    _showCurveHandles() {
        if (!this.selectedPolyline || !this.originalLatLngs) return;
        for (let i = 0; i < this.originalLatLngs.length - 1; i++) {
            const p1 = this.originalLatLngs[i], p2 = this.originalLatLngs[i + 1];
            const mid = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

            const handle = L.circleMarker(mid, {
                radius: 6, color: '#ff7800', fillColor: '#ffa500', fillOpacity: 0.8, weight: 2
            }).addTo(this.map);

            handle.segmentIndex = i;
            let isDragging = false;

            handle.on('mousedown', (e) => {
                L.DomEvent.stopPropagation(e);
                isDragging = true;
                this.map.dragging.disable();

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    handle.setLatLng(moveEvent.latlng);
                    this._updateCurve(handle);
                };

                const onMouseUp = () => {
                    if (!isDragging) return;
                    isDragging = false;
                    this.map.dragging.enable();
                    this.map.off('mousemove', onMouseMove);
                    this.map.off('mouseup', onMouseUp);
                    this._finalizeCurve();
                };

                this.map.on('mousemove', onMouseMove);
                this.map.on('mouseup', onMouseUp);
            });

            this.curveHandles.push(handle);
        }
    }

    _updateCurve(handle) {
        this.segmentCurves.set(handle.segmentIndex, handle.getLatLng());
        this._rebuildPolyline();
        if (this.selectedPolyline._arrowType && this.selectedPolyline._arrowRenderHandler) {
            this.selectedPolyline._arrowRenderHandler.call(this.selectedPolyline);
        }
    }

    _rebuildPolyline() {
        const newLatLngs = [];
        for (let i = 0; i < this.originalLatLngs.length - 1; i++) {
            const start = this.originalLatLngs[i], end = this.originalLatLngs[i + 1];
            if (this.segmentCurves.has(i)) {
                const control = this.segmentCurves.get(i);
                const pts = BezierMath.generateBezierCurve(start, control, end, 20);
                newLatLngs.push(...pts.slice(0, -1));
            } else {
                newLatLngs.push(start);
            }
        }
        newLatLngs.push(this.originalLatLngs[this.originalLatLngs.length - 1]);
        this.selectedPolyline.setLatLngs(newLatLngs);
    }

    _finalizeCurve() {
        const idx = this.stateManager.geometries.findIndex(g => g.layer === this.selectedPolyline);
        if (idx !== -1) {
            const newLatLngs = this.selectedPolyline.getLatLngs();
            this.stateManager.updateGeometryCoordinates(idx, newLatLngs);
            this.originalLatLngs = newLatLngs.map(ll => L.latLng(ll.lat, ll.lng));
            this.segmentCurves.clear();
            if (this.selectedPolyline._arrowType && this.selectedPolyline._arrowRenderHandler) {
                this.selectedPolyline._arrowRenderHandler.call(this.selectedPolyline);
            }
            this._showCurveHandles();
        }
    }

    _clearCurveHandles() {
        this.curveHandles.forEach(h => this.map.removeLayer(h));
        this.curveHandles = [];
    }
}
'''

    for t in targets:
        dirpath = os.path.dirname(t)
        math_path = os.path.join(dirpath, 'BezierMath.js')
        with open(math_path, 'w', encoding='utf-8') as f:
            f.write(math_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(manager_code)
        print(f"Modularized {t}")

if __name__ == '__main__':
    modularize_curve_control_manager()
