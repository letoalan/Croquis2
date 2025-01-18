// MapManager.js
import { TileLayerManager } from './mapping/layers/TileLayerManager.js'; // Import correct de TileLayerManager
import { LayerGroupManager } from './mapping/layers/LayerGroupManager.js';
import { MarkerControlManager } from './mapping/markers/MarkerControlManager.js';
import { EventManager } from './mapping/events/EventManager.js';
import { EventHandlers } from './mapping/events/EventHandlers.js';
import { GeometryHandler } from './mapping/geometry/GeometryHandler.js';
import { LegendManager } from './mapping/legend/LegendManager.js';
import { SVGUtils } from './utils/SVGUtils.js';

export class MapManager {
    constructor(stateManager) {
        if (!stateManager) {
            console.error('[MapManager] StateManager is required for initialization.');
            throw new Error('StateManager is required for MapManager initialization.');
        }

        console.log('[MapManager] Initializing MapManager...');
        this.stateManager = stateManager;
        this.map = null;
        this.tileLayerManager = null;
        this.layerGroupManager = null;
        this.geometryHandler = null;
        this.eventManager = null;
        this.legendManager = null;
        this.markerControlManager = null;

        // Définir les sources de tuiles disponibles
        this.tileSources = {
            osm: {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            },
            cartodb: {
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
            },
            dark: {
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
            },
            satellite: {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
            }
        };
    }

    initMap() {
        console.log('[MapManager] Initializing the map...');
        try {
            this._initializeMapElement(); // Initialise la carte (this.map)
            this._initializeTileLayer(); // Initialise la couche de tuiles
            this._initializeLayerGroup(); // Initialise le gestionnaire de groupes de couches
            this._initializeGeometryHandler(); // Initialise le gestionnaire de géométries
            this._initializeEventHandlers(); // Initialise les gestionnaires d'événements

            // Initialiser le MarkerControlManager après que la carte et le StateManager soient prêts
            this.markerControlManager = new MarkerControlManager(this.map, ['circle', 'square', 'triangle', 'hexagon'], this.stateManager);
            this._initializeMarkerControls(); // Ajouter les contrôles de marqueurs personnalisés

            this._initializeEditingControls(); // Initialiser les contrôles d'édition
            //this._initializeLegend(); // Initialiser la légende

            console.log('[MapManager] Map initialization completed.');
        } catch (error) {
            console.error('[MapManager] Error during map initialization:', error);
        }
    }

    _initializeMapElement() {
        console.log('[MapManager] Initializing map element...');
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('[MapManager] Map element not found in the DOM.');
            throw new Error('Map element not found in the DOM.');
        }
        this.map = L.map('map').setView([37.0902, -95.7129], 4);
        console.log('[MapManager] Map element initialized.');
    }

    _initializeTileLayer() {
        console.log('[MapManager] Initializing tile layer...');
        this.tileLayerManager = new TileLayerManager(this.map, this.tileSources);
        this.tileLayerManager.setTileLayer('osm'); // Définir la couche de tuiles par défaut
        console.log('[MapManager] Tile layer initialized with "osm".');
    }

    _initializeLayerGroup() {
        console.log('[MapManager] Initializing layer group manager...');
        this.layerGroupManager = new LayerGroupManager(this.map);
        console.log('[MapManager] Layer group manager initialized.');
    }

    _initializeGeometryHandler() {
        console.log('[MapManager] Initializing geometry handler...');
        this.geometryHandler = new GeometryHandler(this.map, this.layerGroupManager);
        console.log('[MapManager] Geometry handler initialized.');
    }

    _initializeEventHandlers() {
        console.log('[MapManager] Initializing event handlers...');
        const eventHandlers = new EventHandlers(this);
        this.eventManager = new EventManager(this.map, eventHandlers);
        this.eventManager.initEvents();
        console.log('[MapManager] Event handlers initialized.');
    }

    _initializeMarkerControls() {
        console.log('[MapManager] Adding custom marker controls...');
        this.markerControlManager.addCustomMarkerControls();
        console.log('[MapManager] Custom marker controls added.');
    }

    _initializeEditingControls() {
        if (!this.map.pm) {
            console.error('[MapManager] Leaflet.PM plugin is not loaded.');
            throw new Error('Leaflet.PM plugin is not loaded.');
        }

        console.log('[MapManager] Initializing editing controls...');

        // Configuration globale des modes d'édition
        this.map.pm.enableGlobalEditMode({
            allowEditing: true,
            allowAddingIntersections: true,
            allowRemoval: true,
            editMode: true,
            dragMode: true,
        });

        console.log('[MapManager] Global edit mode enabled.');

        // Configuration des contrôles
        this.map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawCircle: true,
            drawPolygon: true,
            drawPolyline: true,
            drawRectangle: true,
            drawCircleMarker: false,
            editMode: true,
            dragMode: true,
            cutPolygon: false,
            removalMode: false,
            customControls: true,
            editControls: {
                edit: 'Editer la forme',
                cancel: 'Annuler',
                save: 'Enregistrer',
            },
        });

        console.log('[MapManager] Editing controls added.');

        // Configuration des options de chemin
        this.map.pm.setPathOptions({
            allowEditing: true,
        });

        // Gestion des événements d'édition
        this._setupEditingEventListeners();
    }

    _setupEditingEventListeners() {
        // Événement pour intercepter la création d'un rectangle
        this.map.on('pm:create', (e) => {
            if (e.shape === 'Rectangle') {
                console.log('[MapManager] Rectangle created, converting to polygon...');
                const rectangle = e.layer;

                // Convertir le rectangle en polygone
                const latLngs = rectangle.getLatLngs();
                const polygon = L.polygon(latLngs, rectangle.options);

                // Supprimer le rectangle de la carte
                this.map.removeLayer(rectangle);

                // Ajouter le polygone à la carte
                this.map.addLayer(polygon);

                // Ajouter le polygone au StateManager
                const geometry = {
                    type: 'Polygon',
                    coordinates: latLngs,
                    color: rectangle.options.fillColor || '#007bff',
                    lineColor: rectangle.options.color || '#000000',
                    opacity: rectangle.options.fillOpacity || 0.5,
                    lineWeight: rectangle.options.weight || 2,
                    lineDash: rectangle.options.dashArray ? 'dashed' : 'solid',
                    layer: polygon
                };

                this.stateManager.addGeometry(geometry);

                console.log('[MapManager] Rectangle converted to polygon and added to state:', geometry);
            }
        });

        // Événement pour activer l'édition sur une forme spécifique
        this.map.on('pm:editstart', (e) => {
            console.log('[MapManager] pm:editstart event triggered:', e);

            // Activer l'édition uniquement sur la forme sélectionnée
            const layer = e.layer;
            if (layer.pm) {
                layer.pm.enable({
                    snappable: true,
                    snapDistance: 20,
                    allowSelfIntersection: true,
                    addVertexOn: 'midpoint', // Activation des vertex midpoints
                    preventMarkerRemoval: false,
                    removeLayerOnEmpty: true,
                });
            }

            // Désactiver l'édition sur toutes les autres formes
            this.map.eachLayer((otherLayer) => {
                if (otherLayer !== layer && otherLayer.pm) {
                    otherLayer.pm.disable();
                }
            });
        });

        // Événement pour désactiver l'édition après la fin de l'édition
        this.map.on('pm:editcomplete', (e) => {
            console.log('[MapManager] pm:editcomplete event triggered:', e);

            // Désactiver l'édition sur la forme
            const layer = e.layer;
            if (layer.pm) {
                layer.pm.disable();
            }
        });

        // Événement pour gérer la suppression des vertex midpoints
        this.map.on('pm:vertexremoved', (e) => {
            console.log('[MapManager] pm:vertexremoved event triggered:', e);
            this.stateManager.updateGeometryCoordinates(
                this.stateManager.geometries.findIndex(g => g.layer === e.layer),
                e.layer.getLatLngs()
            );
        });

        // Événement pour gérer l'ajout de vertex midpoints
        this.map.on('pm:vertexadded', (e) => {
            console.log('[MapManager] pm:vertexadded event triggered:', e);
            this.stateManager.updateGeometryCoordinates(
                this.stateManager.geometries.findIndex(g => g.layer === e.layer),
                e.layer.getLatLngs()
            );
        });

        // Événement pour gérer la suppression d'une couche
        this.map.on('pm:removelayer', (e) => {
            console.log('[MapManager] pm:removelayer event triggered:', e);
            const index = this.stateManager.geometries.findIndex(g => g.layer === e.layer);
            if (index !== -1) {
                this.stateManager.deleteGeometry(index);
            }
        });
    }

    _handleLayerCreation(layer) {
        if (layer.pm) {
            console.log('[MapManager] Setting up newly created layer:', layer);

            // Convert rectangles to polygons
            if (layer instanceof L.Rectangle) {
                const latLngs = layer.getLatLngs();
                const originalOptions = {
                    color: layer.options.color || '#000000',
                    fillColor: layer.options.fillColor || '#000000',
                    fillOpacity: layer.options.fillOpacity || 0.5,
                    weight: layer.options.weight || 2,
                    dashArray: layer.options.dashArray || ''
                };

                // Create a polygon with the same style options
                const polygon = L.polygon(latLngs, originalOptions);

                // Remove the rectangle layer from the map
                this.map.removeLayer(layer);

                // Add the polygon layer to the map
                this.map.addLayer(polygon);

                // Add the polygon geometry to the state manager
                const geometry = {
                    type: 'Polygon',
                    coordinates: latLngs,
                    color: originalOptions.fillColor,
                    lineColor: originalOptions.color,
                    opacity: originalOptions.fillOpacity,
                    lineWeight: originalOptions.weight,
                    lineDash: originalOptions.dashArray ? 'dashed' : 'solid',
                    layer: polygon
                };

                // Ensure the rectangle is not added to the state
                this.stateManager.addGeometry(geometry);
            } else {
                // Determine the type of the layer based on its instance
                let type;
                if (layer instanceof L.Circle) {
                    type = 'Circle';
                } else if (layer instanceof L.Polygon) {
                    type = 'Polygon';
                } else if (layer instanceof L.Polyline) {
                    type = 'Polyline';
                } else if (layer instanceof L.Marker) {
                    type = 'Marker';
                } else {
                    console.error('[MapManager] Unsupported layer type:', layer);
                    return;
                }

                // For other layers, add them directly to the state
                this.stateManager.addGeometry({
                    type: type,
                    coordinates: layer.getLatLngs ? layer.getLatLngs() : layer.getLatLng(),
                    color: layer.options.fillColor || '#000000',
                    lineColor: layer.options.color || '#000000',
                    opacity: layer.options.fillOpacity || 0.5,
                    lineWeight: layer.options.weight || 2,
                    lineDash: layer.options.dashArray ? 'dashed' : 'solid',
                    layer: layer
                });
            }
        }
    }

    _handleVertexAddition(layer, marker) {
        const geometry = this.stateManager.geometries.find(g => g.layer === layer);
        if (!geometry) {
            console.error('[MapManager] Geometry not found for layer');
            return;
        }

        let newCoordinates;
        if (layer.getLatLngs) {
            newCoordinates = layer.getLatLngs();
        } else if (layer.getLatLng) {
            newCoordinates = layer.getLatLng();
        }

        // Désactiver l'édition avant de supprimer la couche
        if (layer.pm) {
            layer.pm.disable();
        }

        // Supprimer l'ancienne couche de la carte
        this.map.removeLayer(layer);

        // Créer et ajouter la nouvelle couche
        const newLayer = this._createLayerFromGeometry(geometry, newCoordinates);
        if (!newLayer) return;

        newLayer.addTo(this.map);

        // Mettre à jour les références dans la géométrie
        geometry.layer = newLayer;
        geometry.coordinates = newCoordinates;

        // Réactiver l'édition sur la nouvelle couche si nécessaire
        if (this.map.pm.globalEditEnabled()) {
            this._enableLayerEditing(newLayer);
        }

        // Forcer la mise à jour du StateManager
        this.stateManager.updateGeometryCoordinates(
            this.stateManager.geometries.indexOf(geometry),
            newCoordinates
        );
    }

    _enableLayerEditing(layer) {
        if (!layer.pm) {
            console.warn('[MapManager] Layer does not support editing');
            return;
        }

        layer.pm.enable({
            snappable: true,
            snapDistance: 20,
            allowSelfIntersection: true,
            addVertexOn: 'midpoint', // Activation des vertex midpoints
            preventMarkerRemoval: false,
            removeLayerOnEmpty: true,
        });
    }

    _createLayerFromGeometry(geometry, coordinates) {
        const type = geometry.type.toLowerCase(); // Convertir en minuscules

        if (type === 'rectangle') {
            // Convertir le rectangle en polygone pour activer les vertex midpoints
            return L.polygon(coordinates, geometry.options);
        } else if (type === 'polygon') {
            return L.polygon(coordinates, geometry.options);
        } else if (type === 'polyline') {
            return L.polyline(coordinates, geometry.options);
        } else if (type === 'circle') {
            return L.circle(geometry.center, geometry.radius, geometry.options);
        } else {
            console.error('[MapManager] Unsupported geometry type:', geometry.type);
            return null;
        }
    }

    _initializeLegend() {
        console.log('[MapManager] Initializing legend...');
        this.legendManager = new LegendManager(this.map, this.stateManager);
        this.stateManager.setLegendManager(this.legendManager); // Passer LegendManager à StateManager
        console.log('[MapManager] Legend initialized.');
    }

    // MapManager.js
    updateMap() {
        console.log('[MapManager] Updating map...');

        // Ajouter un log pour afficher les paramètres de chaque couche
        this.map.eachLayer(layer => {
            if (layer.options) {
                // Ignorer les couches par défaut (noires)
                if (layer.options.color === '#000000' && layer.options.fillColor === '#000000') {
                    console.log('[MapManager] Ignoring default black layer:', layer);
                    return;
                }

                console.log('[MapManager] Layer options:', {
                    color: layer.options.color,
                    fillColor: layer.options.fillColor,
                    fillOpacity: layer.options.fillOpacity,
                    weight: layer.options.weight,
                    dashArray: layer.options.dashArray
                });
            }
        });

        console.log('[MapManager] Map update complete.');
    }

    addSVGMarker(svgMarker) {
        if (!svgMarker) {
            console.error('[MapManager] SVG marker is undefined.');
            return;
        }
        console.log('[MapManager] Adding SVG marker:', svgMarker);
        svgMarker.addTo(this.map);
    }

    removeSVGMarker(svgMarker) {
        if (!svgMarker) {
            console.error('[MapManager] SVG marker is undefined.');
            return;
        }
        console.log('[MapManager] Removing SVG marker:', svgMarker);
        this.map.removeLayer(svgMarker);
    }

    addLayer(layer) {
        if (!layer) {
            console.error('[MapManager] Layer is undefined.');
            return;
        }
        console.log('[MapManager] Adding layer:', layer);
        layer.addTo(this.map);
    }

    removeLayer(layer) {
        if (!layer) {
            console.error('[MapManager] Layer is undefined.');
            return;
        }
        console.log('[MapManager] Removing layer:', layer);
        this.map.removeLayer(layer);
    }

    setTileLayer(tileType) {
        if (!this.tileSources[tileType]) {
            console.error(`[MapManager] Tile type "${tileType}" is not defined.`);
            return;
        }

        console.log(`[MapManager] Setting tile layer to "${tileType}".`);
        if (this.tileLayer) {
            this.map.removeLayer(this.tileLayer);
        }

        const tileConfig = this.tileSources[tileType];
        this.tileLayer = L.tileLayer(tileConfig.url, {
            attribution: tileConfig.attribution,
        });

        this.tileLayer.addTo(this.map);
        console.log('[MapManager] Tile layer updated.');
    }
}