import { SVGUtils } from '../../utils/SVGUtils.js';

export class MarkerControlManager {
    constructor(map, markerTypes, stateManager, geometryHandler) {
        if (!map || !markerTypes || !stateManager || !geometryHandler)
            throw new Error('Map, markerTypes, StateManager et GeometryHandler sont requis');

        this.map = map; // Référence à la carte Leaflet
        this.markerTypes = markerTypes; // Types de marqueurs disponibles (cercle, carré, triangle, hexagone)
        this.activeMarkerType = null; // Type de marqueur actuellement sélectionné
        this.stateManager = stateManager; // Référence au StateManager
        this.geometryHandler = geometryHandler; // ✅ Stocker la référence

        // ✅ CORRECTION : Lier le contexte 'this'
        this._handleMapClick = this._handleMapClick.bind(this);
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

                        // Activer l'écouteur de clic sur la carte
                        map.on('click', this._handleMapClick);
                    });
                });

                return container;
            }
        });

        // Ajouter le contrôle à la carte
        this.map.addControl(new markerControl());
    }

    /**
     * ✅ Gère le clic sur la carte pour placer un marqueur
     */
    _handleMapClick(e) {
        if (!this.activeMarkerType) return;

        console.log(`[MarkerControlManager] Clic sur la carte à : ${e.latlng}`);

        const markerOptions = {
            color: "#007bff",
            lineColor: "#000000",
            opacity: 1,
            lineWeight: 2,
            lineDash: "solid",
            markerSize: 24,
            draggable: false
        };

        // ✅ createMarkerSVG retourne DÉJÀ un L.marker !
        const marker = SVGUtils.createMarkerSVG(this.activeMarkerType, e.latlng, markerOptions);

        if (!marker) {
            console.error('[MarkerControlManager] ❌ Erreur création marqueur SVG');
            return;
        }

        // ✅ Ajouter le marqueur à la carte
        marker.addTo(this.map);

        // ✅ Stocker le type personnalisé pour la sérialisation
        marker._markerType = this.activeMarkerType;
        marker._markerOptions = markerOptions;

        console.log(`[MarkerControlManager] ✅ Marqueur SVG créé et ajouté: ${this.activeMarkerType}`);

        // ✅ Créer l'objet géométrie avec le marqueur Leaflet
        const geometryObject = this.geometryHandler.createGeometryObject(marker);
        this.stateManager.addGeometry(geometryObject);

        console.log(`[MarkerControlManager] ✅ Géométrie enregistrée pour le marqueur: ${this.activeMarkerType}`);

        // ✅ Désactiver l'écouteur après un seul clic
        this.map.off('click', this._handleMapClick);
        this.activeMarkerType = null;
    }

}