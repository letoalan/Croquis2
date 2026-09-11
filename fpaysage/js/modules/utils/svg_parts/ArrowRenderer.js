// ArrowRenderer.js - Calcul et traçage SVG des flèches polygonales

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
