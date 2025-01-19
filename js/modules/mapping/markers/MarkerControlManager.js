import { SVGUtils } from '../../utils/SVGUtils.js';

export class MarkerControlManager {
    constructor(map, markerTypes, stateManager) {
        if (!map) {
            throw new Error('Map is required for MarkerControlManager initialization.');
        }
        if (!markerTypes) {
            throw new Error('Marker types are required for MarkerControlManager initialization.');
        }
        if (!stateManager) {
            throw new Error('StateManager is required for MarkerControlManager initialization.');
        }

        this.map = map; // Référence à la carte Leaflet
        this.markerTypes = markerTypes; // Types de marqueurs disponibles (cercle, carré, triangle, hexagone)
        this.activeMarkerType = null; // Type de marqueur actuellement sélectionné
        this.stateManager = stateManager; // Référence au StateManager
    }

    /**
     * Ajoute les contrôles personnalisés pour les marqueurs.
     */
    addCustomMarkerControls() {
        const markerControl = L.Control.extend({
            options: {
                position: 'topleft'
            },

            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar');

                this.markerTypes.forEach(type => {
                    const button = L.DomUtil.create('a', 'leaflet-control-custom', container);
                    button.href = '#'; // Lien vide pour le style
                    button.title = `Dessiner un marqueur ${type}`;

                    // Création de l'icône SVG pour le bouton
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('width', '24');
                    svg.setAttribute('height', '24');
                    svg.setAttribute('viewBox', '0 0 24 24');

                    let path;
                    switch (type) {
                        case 'circle':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            path.setAttribute('cx', '12');
                            path.setAttribute('cy', '12');
                            path.setAttribute('r', '10');
                            break;
                        case 'square':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            path.setAttribute('x', '2');
                            path.setAttribute('y', '2');
                            path.setAttribute('width', '20');
                            path.setAttribute('height', '20');
                            break;
                        case 'triangle':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            path.setAttribute('points', '12,2 22,20 2,20');
                            break;
                        case 'hexagon':
                            path = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            path.setAttribute('points', '12,2 20,6 20,18 12,22 4,18 4,6');
                            break;
                        default:
                            console.error(`[MarkerControlManager] Type de marqueur non supporté : ${type}`);
                            return;
                    }

                    // Configuration des styles SVG
                    path.setAttribute('fill', 'transparent'); // Remplissage transparent
                    path.setAttribute('stroke', '#000'); // Bordure noire
                    path.setAttribute('stroke-width', '2'); // Épaisseur de la bordure
                    svg.appendChild(path);
                    button.appendChild(svg);

                    // Gestion du clic sur le bouton
                    L.DomEvent.on(button, 'click', (e) => {
                        console.log(`[MarkerControlManager] Bouton cliqué pour le type de marqueur : ${type}`);
                        L.DomEvent.stopPropagation(e); // Empêcher la propagation de l'événement
                        L.DomEvent.preventDefault(e); // Empêcher le comportement par défaut
                        this.activeMarkerType = type; // Définir le type de marqueur actif

                        // Gestion du clic sur la carte pour placer le marqueur
                        const clickHandler = (e) => {
                            console.log(`[MarkerControlManager] Clic sur la carte à : ${e.latlng}`);

                            // Créer un marqueur SVG
                            const svgMarker = SVGUtils.createMarkerSVG(type, e.latlng, {
                                color: "#007bff", // Couleur de remplissage
                                lineColor: "#000000", // Couleur de la bordure
                                opacity: 1, // Opacité
                                lineWeight: 2, // Épaisseur de la bordure
                                markerSize: 24 // Taille du marqueur
                            });

                            if (svgMarker) {
                                console.log('[MarkerControlManager] Marqueur SVG créé :', svgMarker);
                                svgMarker.addTo(map); // Ajouter le marqueur à la carte
                                console.log('[MarkerControlManager] Marqueur SVG ajouté à la carte');

                                // Ajouter la géométrie au StateManager
                                const geometry = {
                                    type: 'CustomMarker', // Type de géométrie
                                    coordinates: e.latlng, // Coordonnées du marqueur
                                    color: "#007bff", // Couleur de remplissage
                                    lineColor: "#000000", // Couleur de la bordure
                                    opacity: 1, // Opacité
                                    lineWeight: 2, // Épaisseur de la bordure
                                    markerSize: 24, // Taille du marqueur
                                    shape: type, // Stocker la forme du marqueur (cercle, carré, triangle, hexagone)
                                    layer: svgMarker // Référence à la couche Leaflet

                                };

                                this.stateManager.addGeometry(geometry); // Ajouter la géométrie au StateManager

                                // Centrer la carte sur le marqueur
                                map.setView(e.latlng, map.getZoom());
                            } else {
                                console.error('[MarkerControlManager] Échec de la création du marqueur SVG');
                            }

                            // Une fois le marqueur ajouté, on supprime l'écouteur de clic
                            map.off('click', clickHandler);
                        };

                        // Activer l'écouteur de clic sur la carte
                        map.on('click', clickHandler);
                    });
                });

                return container;
            }
        });

        // Ajouter le contrôle à la carte
        this.map.addControl(new markerControl());
    }
}