import os

def modularize_svg_utils():
    targets = [
        'fpaysage/js/modules/utils/SVGUtils.js',
        'fportrait/js/modules/utils/SVGUtils.js',
        'fpromethean/js/modules/utils/SVGUtils.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        svg_parts_dir = os.path.join(dirpath, 'svg_parts')
        os.makedirs(svg_parts_dir, exist_ok=True)

        arrow_code = '''// ArrowRenderer.js - Calcul et traçage SVG des flèches polygonales

export class ArrowRenderer {
    static createArrowPolygon(point, angle, size) {
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

    static ensureArrowContainer(map) {
        const pane = map.getPane('overlayPane');
        if (!pane) return null;
        let svg = pane.querySelector('svg.leaflet-zoom-animated');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'leaflet-zoom-animated');
            svg.style.pointerEvents = 'none';
            svg.style.position = 'absolute';
            pane.appendChild(svg);
        }
        let group = svg.querySelector('#leaflet-arrows-group');
        if (!group) {
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.id = 'leaflet-arrows-group';
            svg.appendChild(group);
        }
        return group;
    }
}
'''

        marker_code = '''// MarkerSVGFactory.js - Générateur de marqueurs vectoriels géométriques

export class MarkerSVGFactory {
    static createMarkerSVG(type, latlng, options = {}) {
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
                path = document.createElementNS(svgNS, "circle");
                path.setAttribute("cx", "12");
                path.setAttribute("cy", "12");
                path.setAttribute("r", "10");
        }

        path.setAttribute("fill", options.color || "#007bff");
        path.setAttribute("stroke", options.lineColor || "#000000");
        path.setAttribute("stroke-width", options.lineWeight || 2);
        path.setAttribute("opacity", options.opacity || 1);
        if (options.lineDash === 'dashed') path.setAttribute("stroke-dasharray", "6, 4");
        if (options.lineDash === 'dotted') path.setAttribute("stroke-dasharray", "2, 3");

        svgElement.appendChild(path);
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

        return L.icon({
            iconUrl: dataUrl,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
            popupAnchor: [0, -markerSize / 2]
        });
    }

    static convertMarkerToPolygon(marker) {
        const latlng = marker.getLatLng();
        const opt = marker.options;
        const size = (opt.markerSize || 24) / 1000;
        const points = [
            [latlng.lat + size, latlng.lng + size],
            [latlng.lat + size, latlng.lng - size],
            [latlng.lat - size, latlng.lng - size],
            [latlng.lat - size, latlng.lng + size]
        ];
        return L.polygon(points, {
            fillColor: opt.fillColor || '#007bff',
            color: opt.color || '#000000',
            fillOpacity: opt.fillOpacity || 1,
            weight: opt.weight || 2
        });
    }
}
'''

        svgutils_code = '''// SVGUtils.js - Façade modulaire pour flèches et marqueurs SVG
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
'''

        with open(os.path.join(svg_parts_dir, 'ArrowRenderer.js'), 'w', encoding='utf-8') as f:
            f.write(arrow_code)
        with open(os.path.join(svg_parts_dir, 'MarkerSVGFactory.js'), 'w', encoding='utf-8') as f:
            f.write(marker_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(svgutils_code)
        print(f"Modularized SVGUtils for {t}")

if __name__ == '__main__':
    modularize_svg_utils()
