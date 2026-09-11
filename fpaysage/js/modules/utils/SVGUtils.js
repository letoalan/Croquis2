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
        if (!polyline?._map) return false;
        const map = polyline._map;
        const group = ArrowRenderer.ensureArrowContainer(map);
        if (!group) return false;

        polyline._arrowType = arrowType;
        if (polyline._path) {
            polyline._path.style.opacity = '0';
            polyline._path.style.pointerEvents = 'stroke';
        }

        const render = () => {
            const coords = polyline.getLatLngs();
            if (coords.length < 2) return;
            const pts = coords.map(ll => map.latLngToLayerPoint(ll));

            let pathEl = polyline._svgPath;
            if (!pathEl) {
                pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                polyline._svgPath = pathEl;
                group.appendChild(pathEl);
            }

            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            pathEl.setAttribute('d', d);
            pathEl.setAttribute('stroke', polyline.options.color || '#3388ff');
            pathEl.setAttribute('stroke-width', polyline.options.weight || 3);
            pathEl.setAttribute('fill', 'none');
        };

        polyline._arrowRenderHandler = render;
        map.on('zoom move', render);
        render();
        return true;
    }

    static cleanupArrowheads(polyline) {
        if (polyline._svgPath) {
            polyline._svgPath.remove();
            delete polyline._svgPath;
        }
        if (polyline._arrowRenderHandler && polyline._map) {
            polyline._map.off('zoom move', polyline._arrowRenderHandler);
            delete polyline._arrowRenderHandler;
        }
    }

    static updateArrowPath(polyline) {
        if (polyline._arrowRenderHandler) polyline._arrowRenderHandler();
    }

    static restoreArrowsAfterDrag(polyline) {
        if (polyline._arrowRenderHandler) polyline._arrowRenderHandler();
    }

    static createMarkerSVG(type, latlng, options = {}) {
        return MarkerSVGFactory.createMarkerSVG(type, latlng, options);
    }

    static convertMarkerToPolygon(marker) {
        return MarkerSVGFactory.convertMarkerToPolygon(marker);
    }

    static updateMarkerStyle(marker, newOptions) {
        const type = marker._markerType || 'circle';
        const newIcon = MarkerSVGFactory.createMarkerSVG(type, marker.getLatLng(), newOptions);
        marker.setIcon(newIcon);
    }
}
