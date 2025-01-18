export class SVGUtils {
    static createMarkerSVG(type, latlng, options = {}) {
        try {
            console.log(`[SVGUtils] Création d'un marqueur SVG de type : ${type}, Options :`, options);

            // Namespace SVG
            const svgNS = "http://www.w3.org/2000/svg";

            // Création de l'élément SVG
            const svgElement = document.createElementNS(svgNS, "svg");
            const markerSize = options.markerSize || 24;
            svgElement.setAttribute("width", markerSize);
            svgElement.setAttribute("height", markerSize);
            svgElement.setAttribute("viewBox", "0 0 24 24");

            let path;

            // Sélection du type de marqueur
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
                    console.error(`[SVGUtils] Type de marqueur non supporté : ${type}`);
                    throw new Error(`Le type de marqueur "${type}" n'est pas pris en charge.`);
            }

            // Configuration des styles SVG
            path.setAttribute("fill", options.color || "#007bff");
            path.setAttribute("stroke", options.lineColor || "#000000");
            path.setAttribute("stroke-width", options.lineWeight || 2);
            path.setAttribute("opacity", options.opacity || 1);
            svgElement.appendChild(path);

            // Conversion du SVG en string pour l'URL data
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBase64 = btoa(svgString);
            const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

            // Création de l'icône pour le marker
            const icon = L.icon({
                iconUrl: dataUrl,
                iconSize: [markerSize, markerSize],
                iconAnchor: [markerSize / 2, markerSize / 2], // Centre du marqueur
                className: 'custom-marker'
            });

            // Création du marker avec l'icône SVG
            const marker = L.marker(latlng, {
                icon: icon,
                draggable: options.draggable || false,
                interactive: true
            });

            // Stockage des propriétés originales pour la conversion
            marker.originalOptions = {
                type: type,
                color: options.color || "#007bff",
                lineColor: options.lineColor || "#000000",
                opacity: options.opacity || 1,
                lineWeight: options.lineWeight || 2,
                markerSize: markerSize
            };

            console.log('[SVGUtils] Marqueur créé et prêt à être ajouté à la carte :', marker);

            return marker;
        } catch (error) {
            console.error('[SVGUtils] Erreur lors de la création du marqueur SVG :', error);
            throw error;
        }
    }

    static updateMarkerStyle(marker, options = {}) {
        try {
            const icon = marker.getIcon();
            const svgString = atob(icon.options.iconUrl.split(',')[1]);
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
            const path = svgDoc.querySelector('circle, rect, polygon');

            if (path) {
                path.setAttribute("fill", options.color || path.getAttribute("fill"));
                path.setAttribute("stroke", options.lineColor || path.getAttribute("stroke"));
                path.setAttribute("stroke-width", options.lineWeight || path.getAttribute("stroke-width"));
                path.setAttribute("opacity", options.opacity || path.getAttribute("opacity"));
            }

            // Mettre à jour la taille du marqueur
            const markerSize = options.markerSize || 24;
            const svgElement = svgDoc.querySelector('svg');
            svgElement.setAttribute("width", markerSize);
            svgElement.setAttribute("height", markerSize);

            const updatedSvgString = new XMLSerializer().serializeToString(svgDoc);
            const updatedSvgBase64 = btoa(updatedSvgString);
            const updatedDataUrl = `data:image/svg+xml;base64,${updatedSvgBase64}`;

            icon.options.iconUrl = updatedDataUrl;
            icon.options.iconSize = [markerSize, markerSize];
            icon.options.iconAnchor = [markerSize / 2, markerSize / 2]; // Mettre à jour l'ancre pour centrer le marqueur
            marker.setIcon(icon);

            console.log('[SVGUtils] Style du marqueur mis à jour :', marker);
        } catch (error) {
            console.error('[SVGUtils] Erreur lors de la mise à jour du style du marqueur :', error);
            throw error;
        }
    }

    static convertMarkerToPolygon(marker) {
        try {
            const latlng = marker.getLatLng();
            const options = marker.originalOptions;
            const size = options.markerSize / 1000; // Conversion en degrés approximative

            // Création des points du polygone selon le type
            let points;
            switch (options.type) {
                case 'square':
                    points = [
                        [latlng.lat + size, latlng.lng + size],
                        [latlng.lat + size, latlng.lng - size],
                        [latlng.lat - size, latlng.lng - size],
                        [latlng.lat - size, latlng.lng + size]
                    ];
                    break;
                case 'triangle':
                    points = [
                        [latlng.lat + size, latlng.lng],
                        [latlng.lat - size, latlng.lng + size],
                        [latlng.lat - size, latlng.lng - size]
                    ];
                    break;
                case 'hexagon':
                    const hexSize = size * 0.866; // cos(30°)
                    points = [
                        [latlng.lat + size, latlng.lng],
                        [latlng.lat + size / 2, latlng.lng + hexSize],
                        [latlng.lat - size / 2, latlng.lng + hexSize],
                        [latlng.lat - size, latlng.lng],
                        [latlng.lat - size / 2, latlng.lng - hexSize],
                        [latlng.lat + size / 2, latlng.lng - hexSize]
                    ];
                    break;
                case 'circle':
                default:
                    // Pour un cercle, on crée un polygone avec 32 points
                    points = [];
                    for (let i = 0; i < 32; i++) {
                        const angle = (i / 32) * Math.PI * 2;
                        points.push([
                            latlng.lat + Math.sin(angle) * size,
                            latlng.lng + Math.cos(angle) * size
                        ]);
                    }
            }

            return L.polygon(points, {
                color: options.lineColor,
                fillColor: options.color,
                fillOpacity: options.opacity,
                weight: options.lineWeight
            });
        } catch (error) {
            console.error('[SVGUtils] Erreur lors de la conversion Marker -> Polygone :', error);
            throw error;
        }
    }
}