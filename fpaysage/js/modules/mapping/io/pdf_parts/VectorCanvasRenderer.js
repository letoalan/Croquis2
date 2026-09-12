// VectorCanvasRenderer.js - Rendu direct haute fidélité des couches géométriques sur Canvas

export class VectorCanvasRenderer {

    static drawAllVectors(ctx, map, vectorData, scale) {
        vectorData.forEach(({ layer, type, arrowType }) => {
            if (type === 'polyline' || type === 'polygon') this.drawPolyline(ctx, map, layer, scale, arrowType);
            else if (type === 'marker') this.drawMarker(ctx, map, layer, scale);
            else if (type === 'circle-geo') this.drawCircleGeo(ctx, map, layer, scale);
            else if (type === 'circle-marker') this.drawCircleMarker(ctx, map, layer, scale);
        });
    }

    static drawPolyline(ctx, map, layer, scale, arrowType) {
        const latlngs = layer.getLatLngs();
        const coords = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
        if (!coords || !coords.length) return;

        ctx.beginPath();
        coords.forEach((latlng, i) => {
            const point = map.latLngToContainerPoint(latlng);
            const x = point.x * scale;
            const y = point.y * scale;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        const options = layer.options || {};
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 3) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (options.dashArray) {
            ctx.setLineDash(options.dashArray.split(',').map(d => parseFloat(d) * scale));
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
            this.drawArrowheads(ctx, map, coords, arrowType, scale, options);
        }
    }

    static drawArrowheads(ctx, map, coords, arrowType, scale, options) {
        if (coords.length < 2) return;
        const color = options.color || '#3388ff';
        const weight = options.weight || 3;
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

    static _drawArrowhead(ctx, x, y, angle, length, width, color) {
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

    static drawMarker(ctx, map, layer, scale) {
        const latlng = layer.getLatLng();
        const point = map.latLngToContainerPoint(latlng);
        const x = point.x * scale;
        const y = point.y * scale;
        const originalOptions = layer.originalOptions || {};
        const shape = originalOptions.type || originalOptions.shape || 'circle';
        const markerSize = (originalOptions.markerSize || 24) * scale;
        const halfSize = markerSize / 2;

        ctx.fillStyle = originalOptions.color || '#007bff';
        ctx.strokeStyle = originalOptions.lineColor || '#000000';
        ctx.lineWidth = (originalOptions.lineWeight || 2) * scale;
        ctx.globalAlpha = originalOptions.opacity || 1;

        ctx.beginPath();
        switch (shape) {
            case 'circle':
                ctx.arc(x, y, halfSize, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(x - halfSize, y - halfSize, markerSize, markerSize);
                break;
            case 'triangle':
                ctx.moveTo(x, y - halfSize);
                ctx.lineTo(x + halfSize, y + halfSize);
                ctx.lineTo(x - halfSize, y + halfSize);
                ctx.closePath();
                break;
            case 'hexagon': {
                const angleStep = Math.PI / 3;
                for (let i = 0; i < 6; i++) {
                    const angle = angleStep * i - Math.PI / 2;
                    const px = x + halfSize * Math.cos(angle);
                    const py = y + halfSize * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            }
            default:
                ctx.arc(x, y, halfSize, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    static drawCircleGeo(ctx, map, layer, scale) {
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
        const options = layer.options || {};
        if (options.fillColor || options.color) {
            ctx.fillStyle = options.fillColor || options.color;
            ctx.globalAlpha = options.fillOpacity !== undefined ? options.fillOpacity : 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 2) * scale;
        ctx.stroke();
    }

    static drawCircleMarker(ctx, map, layer, scale) {
        const latlng = layer.getLatLng();
        const point = map.latLngToContainerPoint(latlng);
        const x = point.x * scale;
        const y = point.y * scale;
        const radius = (layer.options?.radius || 10) * scale;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const options = layer.options || {};
        if (options.fillColor || options.color) {
            ctx.fillStyle = options.fillColor || options.color;
            ctx.globalAlpha = options.fillOpacity !== undefined ? options.fillOpacity : 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = options.color || '#3388ff';
        ctx.lineWidth = (options.weight || 2) * scale;
        ctx.stroke();
    }
}
