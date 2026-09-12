// SVGUtils.js - Façade modulaire pour flèches et marqueurs SVG
import { ArrowRenderer } from './svg_parts/ArrowRenderer.js';
import { MarkerSVGFactory } from './svg_parts/MarkerSVGFactory.js';

export class SVGUtils {
    static USE_POLYGON_ARROWS = true;

    static _ensureArrowContainer(map) {
        return ArrowRenderer.ensureArrowContainer(map);
    }

    static _createArrowPolygon(point, angle, size) {
        return ArrowRenderer.createArrowPolygon(point, angle, size);
    }

    static addArrowheadsToPolylineSVG(polyline, arrowType) {
        return ArrowRenderer.addArrowheadsToPolyline(polyline, arrowType);
    }

    static cleanupArrowheads(polyline) {
        ArrowRenderer.cleanupArrowheads(polyline);
    }

    static maskPolylineWhenReady(polyline, attempt = 0) {
        const MAX_ATTEMPTS = 5;
        if (attempt >= MAX_ATTEMPTS) return;
        if (!polyline || !polyline._map) return;
        if (polyline._path) {
            polyline._path.style.display = 'none';
        } else {
            requestAnimationFrame(() => {
                SVGUtils.maskPolylineWhenReady(polyline, attempt + 1);
            });
        }
    }

    static updateArrowPath(polyline) {
        if (polyline._arrowRenderHandler) polyline._arrowRenderHandler.call(polyline);
    }

    static restoreArrowsAfterDrag(polyline) {
        if (polyline._arrowRenderHandler) polyline._arrowRenderHandler.call(polyline);
    }

    static createMarkerIcon(type, options = {}) {
        return MarkerSVGFactory.createMarkerIcon(type, options);
    }

    static createMarkerSVG(type, latlng, options = {}) {
        return MarkerSVGFactory.createMarkerSVG(type, latlng, options);
    }

    static convertMarkerToPolygon(marker) {
        return MarkerSVGFactory.convertMarkerToPolygon(marker);
    }

    static updateMarkerStyle(marker, newOptions) {
        try {
            const originalOptions = marker.originalOptions || {};
            const options = { ...originalOptions, ...newOptions };
            const type = options.markerType || marker._markerType || (typeof options.type === 'string' ? options.type.replace(/^Marker_/, '') : null) || 'circle';
            const newIcon = MarkerSVGFactory.createMarkerIcon(type, options);
            marker.setIcon(newIcon);
            marker._markerType = type;
            marker.originalOptions = { ...options, type, markerType: type };
            marker._markerOptions = marker.originalOptions;
        } catch (error) {
            console.error('[SVGUtils] Error updating marker style:', error);
        }
    }
}
