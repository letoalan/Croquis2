// js/modules/mapping/legend/LegendManager.js

export class LegendManager {
    /**
     * Constructeur de LegendManager.
     * @param {L.Map} map - La carte Leaflet.
     * @param {StateManager} stateManager - Le gestionnaire d'état de l'application.
     * @throws {Error} Si la carte ou le StateManager n'est pas fourni.
     */
    constructor(map, stateManager) {
        if (!map) {
            throw new Error('Map is required for LegendManager initialization.');
        }
        if (!stateManager) {
            throw new Error('StateManager is required for LegendManager initialization.');
        }

        this.map = map; // Référence à la carte Leaflet
        this.stateManager = stateManager; // Référence au StateManager
        this.legendControl = null; // Contrôle de légende Leaflet
        this.initLegend(); // Initialiser la légende
    }

    /**
     * Initialise la légende de la carte.
     */
    initLegend() {
        // Créer un contrôle Leaflet pour la légende
        const LegendControl = L.Control.extend({
            options: {
                position: 'bottomright' // Position de la légende sur la carte
            },

            onAdd: () => {
                const container = L.DomUtil.create('div', 'legend-control');
                container.style.backgroundColor = 'white';
                container.style.padding = '10px';
                container.style.borderRadius = '4px';
                container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
                container.style.maxHeight = '300px';
                container.style.overflowY = 'auto';
                container.style.minWidth = '200px';
                return container;
            }
        });

        // Ajouter le contrôle de légende à la carte
        this.legendControl = new LegendControl();
        this.map.addControl(this.legendControl);

        console.log('[LegendManager] Legend initialized');
    }

    /**
     * Met à jour la légende avec les géométries actuelles.
     */
    updateLegend() {
        console.log('[LegendManager] Updating legend');

        const container = this.legendControl.getContainer();
        if (!container) {
            console.error('[LegendManager] Legend container not found.');
            return;
        }

        // Réinitialiser le contenu de la légende
        container.innerHTML = '<h6 class="mb-2">Légende</h6>';

        // Vérifier s'il y a des géométries à afficher
        if (this.stateManager.geometries.length === 0) {
            container.innerHTML += '<p class="text-muted small mb-0">Aucun élément sur la carte</p>';
            console.log('[LegendManager] No geometries found, legend updated with empty state');
            return;
        }

        // Parcourir toutes les géométries pour les ajouter à la légende
        this.stateManager.geometries.forEach((geometry, index) => {
            console.log('[LegendManager] Adding geometry to legend:', geometry);

            const item = document.createElement('div');
            item.className = 'legend-item d-flex align-items-center mb-2';

            // Créer le symbole de la légende
            const symbol = document.createElement('div');
            symbol.className = 'legend-symbol me-2';

            // Appliquer les styles du marqueur ou de la zone
            let legendSize;
            if (geometry.type === 'CustomMarker') {
                // Pour les marqueurs, appliquer un rapport *1.5
                const markerSize = geometry.markerSize || 24;
                legendSize = markerSize / 1.5; // Rapport /1.5 pour les marqueurs
            } else {
                const height = 24; // Hauteur fixe
                const width = height * 1.5; // Largeur = 1.5 * hauteur
                symbol.style.width = `${width}px`; // Largeur du rectangle
                symbol.style.height = `${height}px`; // Hauteur du rectangle
            }

            symbol.style.width = `${legendSize}px`; // Taille ajustée pour la légende
            symbol.style.height = `${legendSize}px`;
            symbol.style.backgroundColor = geometry.color || '#007bff'; // Couleur de fond
            symbol.style.border = `${geometry.lineWeight || 2}px ${this._getLineStyle(geometry.lineDash)} ${geometry.lineColor || '#000000'}`; // Bordure avec style de ligne
            symbol.style.opacity = geometry.opacity || 1; // Opacité du fond

            // Appliquer la forme en fonction du type de géométrie
            if (geometry.type === 'CustomMarker') {
                // Pour les marqueurs, utiliser la forme spécifique (cercle, carré, triangle, hexagone)
                switch (geometry.shape) {
                    case 'circle':
                        symbol.style.borderRadius = '50%'; // Cercle
                        break;
                    case 'square':
                        symbol.style.borderRadius = '0%'; // Carré
                        symbol.style.clipPath = 'none'; // Désactiver clip-path pour le carré
                        break;
                    case 'triangle':
                        symbol.style.borderRadius = '0%'; // Désactiver border-radius pour le triangle
                        symbol.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'; // Triangle
                        break;
                    case 'hexagon':
                        symbol.style.borderRadius = '0%'; // Désactiver border-radius pour l'hexagone
                        symbol.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'; // Hexagone
                        break;
                    default:
                        symbol.style.borderRadius = '0%'; // Par défaut, un carré
                        symbol.style.clipPath = 'none'; // Désactiver clip-path
                }
            } else {
                // Pour les zones (layers), utiliser un rectangle
                symbol.style.borderRadius = '0%'; // Rectangle
                symbol.style.clipPath = 'none'; // Désactiver clip-path
            }

            // Ajouter le nom de la géométrie
            const name = document.createElement('span');
            name.className = 'small';
            name.textContent = geometry.name || `Geometry ${index + 1}`; // Utiliser un nom par défaut si aucun nom n'est défini

            // Ajouter le symbole et le nom à l'élément de la légende
            item.appendChild(symbol);
            item.appendChild(name);

            // Ajouter l'élément à la légende
            container.appendChild(item);
        });

        console.log('[LegendManager] Legend updated with current geometries');
    }

    /**
     * Retourne le style de ligne CSS en fonction du type de ligne (solid, dashed, dotted).
     * @param {string} lineDash - Le type de ligne (solid, dashed, dotted).
     * @returns {string} - Le style de ligne CSS.
     */
    _getLineStyle(lineDash) {
        switch (lineDash) {
            case 'solid':
                return 'solid';
            case 'dashed':
                return 'dashed';
            case 'dotted':
                return 'dotted';
            default:
                return 'solid'; // Par défaut, une ligne continue
        }
    }
}