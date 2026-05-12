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
        // ... (Logique Leaflet Control existante) ...
        const MapTileControl = L.Control.extend({
            options: { position: 'topright' }, // Mis à jour pour Promethean
            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                const button = L.DomUtil.create('a', 'tile-selector-button', container);
                button.href = '#';
                button.title = 'Changer de fond de carte';

                // Icône SVG...
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <rect x="3" y="3" width="18" height="4" rx="1" fill="currentColor"/>
                        <rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor"/>
                        <rect x="3" y="17" width="18" height="4" rx="1" fill="currentColor"/>
                    </svg>
                `;

                this.dropdown = L.DomUtil.create('div', 'tile-selector-popup');
                this.dropdown.style.display = 'none';
                document.body.appendChild(this.dropdown);

                const tiles = this._getTilesList();
                this._populateDropdown(tiles);
                this._populatePanelGrid(tiles); // ✅ Nouvelle méthode pour le panneau droit

                L.DomEvent.on(button, 'click', (e) => {
                    L.DomEvent.stopPropagation();
                    L.DomEvent.preventDefault();
                    this._toggleMenu(button);
                });

                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });

        this.control = new MapTileControl();
        this.map.addControl(this.control);
    }

    _getTilesList() {
        return [
            // 🌍 Modernes standards
            { value: 'osm', label: 'OpenStreetMap', icon: '🗺️', category: 'standard' },
            { value: 'cartodb', label: 'CartoDB Light', icon: '☀️', category: 'standard' },
            { value: 'dark', label: 'CartoDB Dark', icon: '🌑', category: 'standard' },
            { value: 'voyager', label: 'CartoDB Voyager', icon: '🚀', category: 'standard' },
            { value: 'satellite', label: 'Satellite Esri', icon: '🛰️', category: 'standard' },
            { value: 'hybrid', label: 'Satellite + Labels', icon: '🗺️', category: 'standard' },
            { value: 'streets', label: 'Esri Streets', icon: '🏙️', category: 'standard' },
            { value: 'topo', label: 'Esri Topo', icon: '⛰️', category: 'terrain' },
            { value: 'openTopo', label: 'OpenTopoMap', icon: '🏔️', category: 'terrain' },
            { value: 'terrain', label: 'Stamen Terrain', icon: '🌄', category: 'terrain' },
            { value: 'watercolor', label: 'Stamen Watercolor', icon: '🎨', category: 'terrain' },

            // 🗞️ Historiques / Vintage
            { value: 'toner', label: 'Stamen Toner', icon: '📰', category: 'vintage' },
            { value: 'tonerLite', label: 'Toner Lite', icon: '📄', category: 'vintage' },
            { value: 'natGeo', label: 'National Geographic', icon: '🌍', category: 'vintage' },
            { value: 'grayCanvas', label: 'Gray Canvas', icon: '📜', category: 'vintage' },
            { value: 'positron', label: 'Positron', icon: '⚪', category: 'vintage' },
            { value: 'osmFrance', label: 'OSM France', icon: '🇫🇷', category: 'france' },
            { value: 'humanitarian', label: 'Humanitarian OSM', icon: '🏥', category: 'vintage' },

            // 🇫🇷 IGN FRANCE
            { value: 'planIgn', label: 'Plan IGN', icon: '🗺️', category: 'france' },
            { value: 'scanExpress', label: 'Cartes IGN Topo', icon: '⛰️', category: 'france' },
            { value: 'ignOrtho', label: 'Ortho IGN', icon: '🛰️', category: 'france' },

            // 🌿 Alternatives Libres
            { value: 'wikipediaMap', label: 'Wikipedia Map', icon: '🌐', category: 'libre' },
            { value: 'openHikingMap', label: 'OpenHikingMap', icon: '🥾', category: 'libre' },
            { value: 'openMapsFrTopo', label: 'OpenMaps FR Topo', icon: '🇫🇷', category: 'libre' }
        ];
    }

    _populateDropdown(tiles) {
        tiles.forEach(tile => {
            const option = L.DomUtil.create('a', 'tile-option', this.dropdown);
            option.textContent = `${tile.icon} ${tile.label}`;
            L.DomEvent.on(option, 'click', () => {
                this.tileLayerManager.setTileLayer(tile.value);
                this.dropdown.style.display = 'none';
            });
        });
    }

    /**
     * ✅ Remplit la grille dans le panneau "Projet" avec catégories
     */
    _populatePanelGrid(tiles) {
        const grid = document.getElementById('tileSelectorGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const categories = {
            standard: '🌍 Standards',
            terrain: '⛰️ Terrain & Relief',
            vintage: '📜 Historiques',
            france: '🇫🇷 France / IGN',
            libre: '🌿 Alternatives Libres'
        };

        const grouped = {};
        tiles.forEach(tile => {
            const cat = tile.category || 'standard';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(tile);
        });

        Object.keys(categories).forEach(catKey => {
            if (!grouped[catKey]) return;

            const header = document.createElement('div');
            header.className = 'tile-category-header';
            header.textContent = categories[catKey];
            grid.appendChild(header);

            const row = document.createElement('div');
            row.className = 'tile-category-row';

            grouped[catKey].forEach(tile => {
                const btn = document.createElement('button');
                btn.className = 'tile-grid-btn';
                btn.innerHTML = `<span class="tile-icon">${tile.icon}</span><span class="tile-label">${tile.label}</span>`;
                btn.onclick = () => {
                    this.tileLayerManager.setTileLayer(tile.value);
                    document.querySelectorAll('.tile-grid-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
                if (tile.value === this.currentTile) btn.classList.add('active');
                row.appendChild(btn);
            });

            grid.appendChild(row);
        });
    }

    _toggleMenu(button) {
        if (!this.dropdown) return;
        const visible = this.dropdown.style.display === 'block';
        if (!visible) {
            const rect = button.getBoundingClientRect();
            this.dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            this.dropdown.style.top = (rect.bottom + 5) + 'px';
            this.dropdown.style.left = 'auto';
            this.dropdown.style.display = 'block';
        } else {
            this.dropdown.style.display = 'none';
        }
    }
}
