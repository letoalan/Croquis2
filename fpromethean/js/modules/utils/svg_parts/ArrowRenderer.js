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

    static addArrowheadsToPolyline(polyline, arrowType) {
        if (!polyline?._map) return false;
        const map = polyline._map;
        const arrowsGroup = ArrowRenderer.ensureArrowContainer(map);
        if (!arrowsGroup) return false;

        ArrowRenderer.cleanupArrowheads(polyline);

        if (polyline._path) {
            polyline._path.style.opacity = '0';
            polyline._path.style.pointerEvents = 'stroke';
        }

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.id = `arrow-group-${polyline._leaflet_id}`;
        group.setAttribute('class', 'arrow-group');
        group.style.pointerEvents = 'none';

        const renderArrow = function () {
            if (this._isDragging || this._isEditing) return;
            const coords = this.getLatLngs();
            if (!coords || coords.length < 2) return;

            const points = coords.map(ll => map.latLngToLayerPoint(ll));
            if (points.length < 2) return;

            while (group.firstChild) {
                group.removeChild(group.firstChild);
            }

            const color = this.options.color || '#3388ff';
            const lineWeight = this.options.weight || 3;
            const opacity = this.options.opacity !== undefined ? this.options.opacity : 1;
            const size = 8 + (lineWeight * 2.5);

            let startPoint = points[0];
            let endPoint = points[points.length - 1];

            if (this._arrowType === 'doubleArrow') {
                const next = points[1];
                const angle = Math.atan2(next.y - startPoint.y, next.x - startPoint.x);
                startPoint = {
                    x: startPoint.x + Math.cos(angle) * size,
                    y: startPoint.y + Math.sin(angle) * size
                };
            }

            if (this._arrowType === 'arrow' || this._arrowType === 'doubleArrow') {
                const prev = points[points.length - 2];
                const angle = Math.atan2(endPoint.y - prev.y, endPoint.x - prev.x);
                endPoint = {
                    x: endPoint.x - Math.cos(angle) * size,
                    y: endPoint.y - Math.sin(angle) * size
                };
            }

            const adjustedPoints = [...points];
            if (this._arrowType === 'doubleArrow') adjustedPoints[0] = startPoint;
            if (this._arrowType === 'arrow' || this._arrowType === 'doubleArrow') adjustedPoints[adjustedPoints.length - 1] = endPoint;

            const linePathData = adjustedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${Math.round(p.x)},${Math.round(p.y)}`).join(' ');
            const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            linePath.setAttribute('class', 'arrow-line');
            linePath.setAttribute('d', linePathData);
            linePath.setAttribute('stroke', color);
            linePath.setAttribute('stroke-width', lineWeight);
            linePath.setAttribute('stroke-opacity', opacity);
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke-linecap', 'round');
            linePath.setAttribute('stroke-linejoin', 'round');
            if (this.options.dashArray) linePath.setAttribute('stroke-dasharray', this.options.dashArray);
            group.appendChild(linePath);

            if (this._arrowType === 'arrow' || this._arrowType === 'doubleArrow') {
                const last = points[points.length - 1];
                const prev = points[points.length - 2];
                const angleEnd = Math.atan2(last.y - prev.y, last.x - prev.x) * 180 / Math.PI;

                const arrowEnd = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                arrowEnd.setAttribute('class', 'arrow-tip-end');
                arrowEnd.setAttribute('d', ArrowRenderer.createArrowPolygon(last, angleEnd, size));
                arrowEnd.setAttribute('fill', color);
                arrowEnd.setAttribute('fill-opacity', opacity);
                arrowEnd.setAttribute('stroke', 'none');
                group.appendChild(arrowEnd);
            }

            if (this._arrowType === 'doubleArrow') {
                const first = points[0];
                const next = points[1];
                const angleStart = Math.atan2(next.y - first.y, next.x - first.x) * 180 / Math.PI + 180;

                const arrowStart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                arrowStart.setAttribute('class', 'arrow-tip-start');
                arrowStart.setAttribute('d', ArrowRenderer.createArrowPolygon(first, angleStart, size));
                arrowStart.setAttribute('fill', color);
                arrowStart.setAttribute('fill-opacity', opacity);
                arrowStart.setAttribute('stroke', 'none');
                group.appendChild(arrowStart);
            }
        };

        arrowsGroup.appendChild(group);
        polyline._svgGroup = group;
        polyline._arrowType = arrowType;
        polyline._arrowRenderHandler = renderArrow;

        polyline.on('pm:dragstart', function () { this._isDragging = true; });
        polyline.on('pm:dragend', function () {
            this._isDragging = false;
            this._arrowRenderHandler?.call(this);
        });
        polyline.on('pm:vertexadded pm:vertexremoved pm:markerdragstart', function () { this._isEditing = true; });
        polyline.on('pm:markerdragend pm:edit', function () {
            this._isEditing = false;
            this._arrowRenderHandler?.call(this);
        });

        map.on('zoom move zoomend moveend', renderArrow, polyline);
        requestAnimationFrame(() => renderArrow.call(polyline));
        return true;
    }

    static cleanupArrowheads(polyline) {
        if (polyline._svgGroup) {
            polyline._svgGroup.remove();
            delete polyline._svgGroup;
        }
        if (polyline._arrowRenderHandler && polyline._map) {
            polyline._map.off('zoom move zoomend moveend', polyline._arrowRenderHandler, polyline);
            delete polyline._arrowRenderHandler;
        }
    }
}
