// MarkerSVGFactory.js - Générateur de marqueurs vectoriels géométriques

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
