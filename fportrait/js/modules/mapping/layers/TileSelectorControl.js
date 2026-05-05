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
        const MapTileControl = L.Control.extend({
            options: {
                position: 'bottomleft'
            },
            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                container.id = 'leaflet-tile-selector-container';

                // ✅ Créer uniquement le bouton avec icône de couches empilées
                const button = L.DomUtil.create('a', 'tile-selector-button', container);
                button.href = '#';
                button.title = 'Changer de fond de carte';
                button.setAttribute('role', 'button');

                // ✅ Créer l'icône d'empilement de couches avec remplissage
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.setAttribute('width', '20');
                icon.setAttribute('height', '20');

                // Rectangles
                for (let y of [3, 10, 17]) {
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', '3'); rect.setAttribute('y', y.toString());
                    rect.setAttribute('width', '18'); rect.setAttribute('height', '4');
                    rect.setAttribute('rx', '1'); rect.setAttribute('fill', 'currentColor');
                    icon.appendChild(rect);
                }
                button.appendChild(icon);

                // ✅ Créer le menu déroulant
                this.dropdown = L.DomUtil.create('div', 'tile-selector-popup');
                this.dropdown.style.display = 'none';
                document.body.appendChild(this.dropdown);

                const tiles = [
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
                    { value: 'toner', label: '📰 Stamen Toner' },
                    { value: 'tonerLite', label: '📄 Toner Lite' },
                    { value: 'natGeo', label: '🌍 National Geographic' },
                    { value: 'grayCanvas', label: '📜 Gray Canvas' },
                    { value: 'positron', label: '⚪ Positron' },
                    { value: 'osmFrance', label: '🇫🇷 OSM France' },
                    { value: 'humanitarian', label: '🏥 Humanitarian OSM' },
                    { value: 'planIgn', label: '🗺️ Plan IGN' },
                    { value: 'scanExpress', label: '⛰️ Cartes IGN Topo' },
                    { value: 'ignOrtho', label: '🛰️ Ortho IGN' },
                    { value: 'wikipediaMap', label: '🌐 Wikipedia Map' },
                    { value: 'openHikingMap', label: '🥾 OpenHikingMap' },
                    { value: 'openMapsFrTopo', label: '🇫🇷 OpenMaps FR Topo' }
                ];

                tiles.forEach(tile => {
                    const option = L.DomUtil.create('a', 'tile-option', this.dropdown);
                    option.href = '#';
                    option.textContent = tile.label;
                    option.setAttribute('data-value', tile.value);

                    if (tile.value === this.currentTile) option.classList.add('active');

                    L.DomEvent.on(option, 'click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        L.DomEvent.preventDefault(e);
                        this.currentTile = tile.value;
                        this.tileLayerManager.setTileLayer(tile.value);
                        this.dropdown.querySelectorAll('.tile-option').forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                        this.dropdown.style.display = 'none';
                    });
                });

                L.DomEvent.on(button, 'click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    this._toggleMenu(button);
                });

                L.DomEvent.on(document, 'click', (e) => {
                    if (this.dropdown && !this.dropdown.contains(e.target) && e.target !== button) {
                        this.dropdown.style.display = 'none';
                    }
                });

                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);
                this._button = button;
                return container;
            }
        });

        this.control = new MapTileControl();
        this.map.addControl(this.control);
        console.log('[TileSelectorControl] Tile selector added to map');
    }

    /**
     * ✅ Logique interne de bascule
     */
    _toggleMenu(button) {
        console.log('[TileSelectorControl] _toggleMenu called', { 
            hasDropdown: !!this.dropdown,
            currentDisplay: this.dropdown ? this.dropdown.style.display : 'N/A'
        });

        if (!this.dropdown) return;

        if (this.dropdown.style.display === 'none') {
            // Positionner le menu
            const buttonRect = button ? button.getBoundingClientRect() : { width: 0 };
            console.log('[TileSelectorControl] Opening menu, buttonRect:', buttonRect);
            
            if (buttonRect.width > 0) {
                // Position normale près du bouton
                this.dropdown.style.left = buttonRect.left + 'px';
                this.dropdown.style.bottom = (window.innerHeight - buttonRect.top + 5) + 'px';
                this.dropdown.style.transform = 'none';
            } else {
                // Fallback mobile : centré en bas
                console.log('[TileSelectorControl] Button hidden or width=0, using mobile fallback position');
                this.dropdown.style.left = '50%';
                this.dropdown.style.bottom = '80px';
                this.dropdown.style.transform = 'translateX(-50%)';
            }
            
            this.dropdown.style.display = 'block';
            console.log('[TileSelectorControl] Menu display set to block');
        } else {
            this.dropdown.style.display = 'none';
            console.log('[TileSelectorControl] Menu display set to none');
        }
    }

    /**
     * ✅ Méthode publique pour ouvrir/fermer le menu programmatiquement
     */
    toggleDropdown() {
        this._toggleMenu(this._button);
    }
}
