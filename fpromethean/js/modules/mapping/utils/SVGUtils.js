export class SVGUtils {
    static createMarkerSVG(type, latlng, options = {}) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svgElement = document.createElementNS(svgNS, "svg");
        svgElement.setAttribute("width", options.markerSize || 24);
        svgElement.setAttribute("height", options.markerSize || 24);
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
                console.error('[SVGUtils] Invalid marker type:', type);
                return null;
        }

        path.setAttribute("fill", options.color || "#007bff");
        path.setAttribute("stroke", options.lineColor || "#000000");
        path.setAttribute("stroke-width", options.lineWeight || 2);
        path.setAttribute("opacity", options.opacity || 1);

        svgElement.appendChild(path);

        const svgOverlay = L.svgOverlay(svgElement, [latlng, latlng], {
            interactive: true,
            className: 'custom-marker'
        });

        return svgOverlay;
    }
}