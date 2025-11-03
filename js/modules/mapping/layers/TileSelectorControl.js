// js/modules/mapping/layers/TileSelectorControl.js

export class TileSelectorControl {
    constructor(map, tileLayerManager, tileSources) {
        if (!map) {
            throw new Error('Map is required for TileSelectorControl initialization.');
        }
        if (!tileLayerManager) {
            throw new Error('TileLayerManager is required for TileSelectorControl initialization.');
        }
        if (!tileSources) {
            throw new Error('Tile sources are required for TileSelectorControl initialization.');
        }

        this.map = map;
        this.tileLayerManager = tileLayerManager;
        this.tileSources = tileSources;
        this.control = null;
        this.currentTile = 'osm';
        this.dropdown = null;
    }

    /**
     * ✅ Ajoute uniquement l'icône (menu apparaît au clic)
     */
    addTileSelector() {
        const TileSelectorControl = L.Control.extend({
            options: {
                position: 'bottomleft'
            },
            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

                // ✅ Créer uniquement le bouton avec icône de couches empilées
                const button = L.DomUtil.create('a', 'tile-selector-button', container);
                button.href = '#';
                button.title = 'Changer de fond de carte';
                button.setAttribute('role', 'button');

                // ✅ Créer l'icône d'empilement de couches avec remplissage (comme les autres icônes)
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.setAttribute('width', '20');
                icon.setAttribute('height', '20');

                // ✅ Dessiner 3 rectangles empilés REMPLIS (fill au lieu de stroke)
                const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect1.setAttribute('x', '3');
                rect1.setAttribute('y', '3');
                rect1.setAttribute('width', '18');
                rect1.setAttribute('height', '4');
                rect1.setAttribute('rx', '1');
                rect1.setAttribute('fill', 'currentColor'); // ✅ Utilise la couleur du texte parent
                icon.appendChild(rect1);

                const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect2.setAttribute('x', '3');
                rect2.setAttribute('y', '10');
                rect2.setAttribute('width', '18');
                rect2.setAttribute('height', '4');
                rect2.setAttribute('rx', '1');
                rect2.setAttribute('fill', 'currentColor'); // ✅ Utilise la couleur du texte parent
                icon.appendChild(rect2);

                const rect3 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect3.setAttribute('x', '3');
                rect3.setAttribute('y', '17');
                rect3.setAttribute('width', '18');
                rect3.setAttribute('height', '4');
                rect3.setAttribute('rx', '1');
                rect3.setAttribute('fill', 'currentColor'); // ✅ Utilise la couleur du texte parent
                icon.appendChild(rect3);

                button.appendChild(icon);


                // ✅ Créer le menu déroulant (caché, sera affiché en popup)
                this.dropdown = L.DomUtil.create('div', 'tile-selector-popup');
                this.dropdown.style.display = 'none';
                document.body.appendChild(this.dropdown); // Ajouter au body pour positioning absolu

                const tiles = [
                    // 🌍 Modernes standards
                    { value: 'osm', label: '🗺️ OpenStreetMap' },
                    { value: 'cartodb', label: '☀️ CartoDB Light' },
                    { value: 'dark', label: '🌑 CartoDB Dark' },
                    { value: 'voyager', label: '🚀 CartoDB Voyager' },
                    { value: 'satellite', label: '🛰️ Satellite Esri' },
                    { value: 'hybrid', label: '🗺️ Satellite + Labels' },
                    { value: 'streets', label: '🏙️ Esri Streets' },
                    { value: 'topo', label: '⛰️ Esri Topo' },
                    { value: 'openTopo', label: '🏔️ OpenTopoMap' },
                    { value: 'terrain', label: '🌄 Stamen Terrain' },
                    { value: 'watercolor', label: '🎨 Stamen Watercolor' },

                    // 🗞️ Historiques / Vintage
                    { value: 'toner', label: '📰 Stamen Toner' },
                    { value: 'tonerLite', label: '📄 Toner Lite' },
                    { value: 'natGeo', label: '🌍 National Geographic' },
                    { value: 'grayCanvas', label: '📜 Gray Canvas' },
                    { value: 'positron', label: '⚪ Positron' },
                    { value: 'osmFrance', label: '🇫🇷 OSM France' },
                    { value: 'humanitarian', label: '🏥 Humanitarian OSM' },

                    // 🇫🇷 IGN FRANCE
                    { value: 'planIgn', label: '🗺️ Plan IGN' },
                    { value: 'scanExpress', label: '⛰️ Cartes IGN Topo' },
                    { value: 'ignOrtho', label: '🛰️ Ortho IGN' },

                    // 🌿 Alternatives Libres
                    { value: 'wikipediaMap', label: '🌐 Wikipedia Map' },
                    { value: 'openHikingMap', label: '🥾 OpenHikingMap' },
                    { value: 'openMapsFrTopo', label: '🇫🇷 OpenMaps FR Topo' }
                



                ];




                tiles.forEach(tile => {
                    const option = L.DomUtil.create('a', 'tile-option', this.dropdown);
                    option.href = '#';
                    option.textContent = tile.label;
                    option.setAttribute('data-value', tile.value);

                    if (tile.value === this.currentTile) {
                        option.classList.add('active');
                    }

                    L.DomEvent.on(option, 'click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        L.DomEvent.preventDefault(e);

                        this.currentTile = tile.value;
                        this.tileLayerManager.setTileLayer(tile.value);

                        // Mettre à jour l'option active
                        this.dropdown.querySelectorAll('.tile-option').forEach(opt => {
                            opt.classList.remove('active');
                        });
                        option.classList.add('active');

                        // Masquer le menu
                        this.dropdown.style.display = 'none';

                        console.log('[TileSelectorControl] Tile layer changed to:', tile.value);
                    });
                });

                // ✅ Toggle du menu au clic sur le bouton
                L.DomEvent.on(button, 'click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);

                    if (this.dropdown.style.display === 'none') {
                        // Positionner le menu près du bouton
                        const buttonRect = button.getBoundingClientRect();
                        this.dropdown.style.left = buttonRect.left + 'px';
                        this.dropdown.style.bottom = (window.innerHeight - buttonRect.top + 5) + 'px';
                        this.dropdown.style.display = 'block';
                    } else {
                        this.dropdown.style.display = 'none';
                    }
                });

                // ✅ Fermer le menu si on clique ailleurs
                L.DomEvent.on(document, 'click', (e) => {
                    if (!this.dropdown.contains(e.target) && e.target !== button) {
                        this.dropdown.style.display = 'none';
                    }
                });

                // Empêcher la propagation des événements
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                return container;
            }
        });

        this.control = new TileSelectorControl();
        this.map.addControl(this.control);
        console.log('[TileSelectorControl] Tile selector added to map');
    }
}
