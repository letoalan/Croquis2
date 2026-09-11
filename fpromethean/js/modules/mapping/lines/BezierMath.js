// BezierMath.js - Calculs d'interpolation et distances de segments pour les courbes

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
