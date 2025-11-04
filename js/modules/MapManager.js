// MapManager.js



import { TileLayerManager } from './mapping/layers/TileLayerManager.js';

import { TileSelectorControl } from './mapping/layers/TileSelectorControl.js'; // ✅ Nouveau

import { LayerGroupManager } from './mapping/layers/LayerGroupManager.js';

import { MarkerControlManager } from './mapping/markers/MarkerControlManager.js';

import { LineControlManager } from './mapping/lines/LineControlManager.js';

import { EventManager } from './mapping/events/EventManager.js';

import { EventHandlers } from './mapping/events/EventHandlers.js';

import { GeometryHandler } from './mapping/geometry/GeometryHandler.js';

import { CurveControlManager } from './mapping/lines/CurveControlManager.js';

import { LegendManager } from './mapping/legend/LegendManager.js';

import { SVGUtils } from './utils/SVGUtils.js';

import { ScaleOrientationManager } from './mapping/controls/ScaleOrientationManager.js';





export class MapManager {

    static arrowUpdateTimeout = null;

    static arrowUpdateInProgress = false;

    static ARROW_UPDATE_DEBOUNCE = 100;  // ms



    constructor(stateManager) {

        console.log('[MapManager] Initializing MapManager...');

        if (!stateManager) {

            console.error('[MapManager] StateManager is required for initialization.');

            throw new Error('StateManager is required for MapManager initialization.');

        }



        this.stateManager = stateManager;

        this.map = null;

        this.tileLayerManager = null;

        this.tileSelectorControl = null; // ✅ Nouveau

        this.layerGroupManager = null;

        this.geometryHandler = null;

        this.eventManager = null;

        this.legendManager = null;

        this.markerControlManager = null;

        this.lineControlManager = null;

        // ✅ À AJOUTER au début de la classe MapManager









        // Définir les sources de tuiles disponibles

        this.tileSources = {





                osm: {
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    attribution: '© OpenStreetMap contributors'
                },
            
                voyager: {
                    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                    attribution: '© CARTO'
                },

                cartodb: {
                    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                    attribution: '© CARTO'
                },

                dark: {
                    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                    attribution: '© CARTO'
                },

                satellite: {
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    attribution: '© Esri'
                },

                hybrid: {
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    attribution: '© Esri',
                    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
                },

                streets: {
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                    attribution: '© Esri'
                },

                topo: {
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
                    attribution: '© Esri'
                },

                openTopo: {
                    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    attribution: '© OpenTopoMap contributors'
                },                

                positron: {
                    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
                    attribution: '© CARTO'
                },

                natGeo: {
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
                    attribution: '© Esri National Geographic'
                },

                grayCanvas: {
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                    attribution: '© Esri'
                },

                osmFrance: {
                    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                    attribution: '© OpenStreetMap France'
                },

                humanitarian: {
                    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                    attribution: '© Humanitarian OSM Team'
                },

                planIgn: {
                    url: 'https://igngp.geoapi.fr/tile.php/plan-ignv2/{z}/{x}/{y}.png',
                    attribution: '© IGN - Plan IGN',
                    maxZoom: 19
                },

                scanExpress: {
                    url: 'https://igngp.geoapi.fr/tile.php/cartes/{z}/{x}/{y}.jpg',
                    attribution: '© IGN - Cartes',
                    maxZoom: 18
                },

                ignOrtho: {
                    url: 'https://igngp.geoapi.fr/tile.php/orthos/{z}/{x}/{y}.jpg',
                    attribution: '© IGN - Ortho HR',
                    maxZoom: 19
                },

                wikipediaMap: {
                    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
                    attribution: '© Wikimedia © OpenStreetMap contributors'
                },

                // Ajout de tuiles libres sans clé
                openHikingMap: {
                    url: 'https://tile.openmaps.fr/openhikingmap/{z}/{x}/{y}.png',
                    attribution: '© OpenHikingMap © OpenStreetMap contributors'
                },

                openMapsFrTopo: {
                    url: 'https://tile.openmaps.fr/opentopomap/{z}/{x}/{y}.png',
                    attribution: '© OpenTopoMap contributors © OpenStreetMap contributors'
                }




        };



    }



    /**

     * Initialise la carte et tous ses composants.

     */

    initMap() {

        console.log('[MapManager] Initializing map...');

        this._initializeMapElement();

        this._initializeTileLayer();

        this._initializeTileSelector(); // ✅ Nouveau

        this._initializeLayerGroup();

        this._initializeGeometryHandler();

        this._initializeEventHandlers();

        this._initializeMarkerControls();

        this._initializeLineControls();

        this._initializeCurveControls();

        this._initializeEditingControls();

        console.log('[MapManager] Map initialization complete.');

    }



    /**

     * Gère la création de couches.

     * @param {Object} e - L'événement de création.

     */

    /**
     * Gère la création de couches.
     * @param {Object} e - L'événement de création.
     */
    _handleLayerCreation(e) {
        console.log('[MapManager] Handling layer creation:', e);

        if (e.shape === 'Rectangle') {
            console.log('[MapManager] Skipping rectangle (will be converted to polygon automatically)');
            return;
        }

        if (e.shape === 'Line') {
            console.log('[MapManager] Skipping Line (handled by LineControlManager)');
            return;
        }

        const existingGeometry = this.stateManager.geometries.find(g => g.layer === e.layer);
        if (existingGeometry) {
            console.warn('[MapManager] Layer already exists in state:', e.layer);
            return;
        }

        // ✅ CORRECTION CRITIQUE : Créer un objet géométrie via GeometryHandler
        console.log('[MapManager] 🔨 Creating geometry object for shape:', e.shape);

        try {
            const geometryObject = this.geometryHandler.createGeometryObject(e.layer);

            if (!geometryObject) {
                console.error('[MapManager] ❌ Failed to create geometry object');
                return;
            }

            console.log('[MapManager] ✅ Geometry object created:', geometryObject.type);

            // Appeler addGeometry avec l'objet complet
            this.stateManager.addGeometry(geometryObject);

            console.log('[MapManager] ✅ Geometry added to state:', geometryObject.type);

        } catch (error) {
            console.error('[MapManager] ❌ ERROR creating geometry:', error.message);
        }
    }



    updateMap() {
        console.log('[MapManager] ========== updateMap() START ==========');

        // ✅ ÉTAPE 1 : Effacer toutes les layers
        console.log('[MapManager] 📍 Step 1: Clearing all layers...');
        this.layerGroupManager.clearLayers(); // ✅ CORRECTION : Le nom correct de la méthode est clearLayers()
        console.log('[MapManager] ✅ All layers cleared');

        // ✅ ÉTAPE 2 : Redessiner les géométries avec les nouveaux styles
        console.log('[MapManager] 📍 Step 2: Redrawing all geometries...');

        this.stateManager.geometries.forEach((geometry, index) => {
            console.log(`[MapManager] Processing geometry ${index}:`, geometry.name);

            const layer = geometry.layer;

            if (!layer) {
                console.warn(`[MapManager] ⚠️ Geometry ${index} has no layer, skipping`);
                return;
            }

            // ✅ VÉRIFICATION DU TYPE : Les marqueurs n'ont pas de setStyle()
            const isMarker = geometry.type.startsWith('Marker_') || layer instanceof L.Marker;

            if (isMarker) {
                // ✅ CAS MARQUEUR : Ajouter directement sans setStyle
                console.log(`[MapManager] 📍 Marker geometry detected (type: ${geometry.type})`);
                try {
                    this.layerGroupManager.addLayer(layer);
                    console.log(`[MapManager] ✅ Marker ${index} added back to map`);
                } catch (error) {
                    console.error(`[MapManager] ❌ ERROR adding marker ${index} back to map:`, error.message);
                }
            } else {
                // ✅ CAS GÉOMÉTRIES STÉRÉOTYPES (Polyline, Polygon, etc.) : Appliquer setStyle()

                // Construire les options de style
                const layerOptions = {
                    color: geometry.lineColor || '#000000',
                    fillColor: geometry.color || '#3388ff',
                    fillOpacity: geometry.opacity || 1,
                    weight: geometry.lineWeight || 2,
                    opacity: geometry.opacity || 1
                };

                // Appliquer le style de tirets
                switch (geometry.lineDash) {
                    case 'dashed':
                        layerOptions.dashArray = '10, 10';
                        break;
                    case 'dotted':
                        layerOptions.dashArray = '2, 6';
                        break;
                    default:
                        layerOptions.dashArray = null;
                }

                console.log(`[MapManager] Layer options for "${geometry.name}":`, layerOptions);

                // ✅ APPLIQUER LE STYLE au layer
                try {
                    if (layer.setStyle && typeof layer.setStyle === 'function') {
                        layer.setStyle(layerOptions);
                        console.log(`[MapManager] ✅ Style applied to layer ${index}`);
                    } else {
                        console.warn(`[MapManager] ⚠️ Layer ${index} doesn't have setStyle method`);
                    }
                } catch (error) {
                    console.error(`[MapManager] ❌ ERROR applying style to layer ${index}:`, error.message);
                }

                // ✅ Ré-ajouter la layer à la carte
                try {
                    this.layerGroupManager.addLayer(layer);
                    console.log(`[MapManager] ✅ Layer ${index} added back to map`);
                } catch (error) {
                    console.error(`[MapManager] ❌ ERROR adding layer ${index} back to map:`, error.message);
                }

                // ✅ Si c'est une flèche, regénérer les arrowheads
                if (geometry.arrowType) {
                    console.log(`[MapManager] 🎯 Regenerating arrowheads for geometry ${index}: ${geometry.arrowType}`);
                    try {
                        if (typeof SVGUtils !== 'undefined' && SVGUtils.addArrowheadsToPolylineSVG) {
                            SVGUtils.addArrowheadsToPolylineSVG(layer, geometry.arrowType);
                            console.log(`[MapManager] ✅ Arrowheads regenerated for geometry ${index}`);
                        } else {
                            console.error('[MapManager] ❌ SVGUtils not available');
                        }
                    } catch (error) {
                        console.error(`[MapManager] ❌ ERROR regenerating arrowheads for geometry ${index}:`, error.message);
                    }
                }
            }
        });

        console.log('[MapManager] ✅ All geometries redrawn with new styles');
        console.log('[MapManager] ========== updateMap() END ==========');
    }



    // MapManager.js - Dans la méthode _initializeMapElement()

    _initializeMapElement() {

        console.log('[MapManager] Initializing map element...');

        const mapElement = document.getElementById('map');

        if (!mapElement) {

            console.error('[MapManager] Map element not found in the DOM.');

            throw new Error('Map element not found in the DOM.');

        }



        // S'assurer que l'élément a une taille

        mapElement.style.height = '100%';

        mapElement.style.width = '100%';



        this.map = L.map('map', {

            preferCanvas: true,

            zoomControl: false

        }).setView([37.0902, -95.7129], 4);



        // ✅ EXPOSER LA CARTE GLOBALEMENT

        window.map = this.map;

        console.log('[MapManager] Map exposed globally as window.map');



        // Ajouter le contrôle de zoom si nécessaire

        L.control.zoom({

            position: 'topright'

        }).addTo(this.map);



        console.log('[MapManager] Map element initialized.');

    }



    /**

     * Initialise la couche de tuiles.

     */

    _initializeTileLayer() {

        console.log('[MapManager] Initializing tile layer...');

        this.tileLayerManager = new TileLayerManager(this.map, this.tileSources);

        this.tileLayerManager.setTileLayer('osm');

        console.log('[MapManager] Tile layer initialized with "osm".');

    }



    /**

     * ✅ Initialise le sélecteur de tuiles

     */

    _initializeTileSelector() {

        console.log('[MapManager] Initializing tile selector...');

        this.tileSelectorControl = new TileSelectorControl(

            this.map,

            this.tileLayerManager,

            this.tileSources

        );

        this.tileSelectorControl.addTileSelector();

        console.log('[MapManager] Tile selector initialized.');

    }



    /**

     * Initialise le gestionnaire de groupes de couches.

     */

    _initializeLayerGroup() {

        console.log('[MapManager] Initializing layer group manager...');

        this.layerGroupManager = new LayerGroupManager(this.map);

        console.log('[MapManager] Layer group manager initialized.');

    }



    /**

     * Initialise le gestionnaire de géométries.

     */

    _initializeGeometryHandler() {

        console.log('[MapManager] Initializing geometry handler...');

        this.geometryHandler = new GeometryHandler(this.map, this.layerGroupManager);

        console.log('[MapManager] Geometry handler initialized.');

    }



    /**

     * Initialise les gestionnaires d'événements.

     */

    _initializeEventHandlers() {

        console.log('[MapManager] Initializing event handlers...');

        const eventHandlers = new EventHandlers(this);

        this.eventManager = new EventManager(this.map, eventHandlers);

        this.eventManager.initEvents();

        console.log('[MapManager] Event handlers initialized.');

    }



    /**

     * Initialise les contrôles de marqueurs personnalisés.

     */

    _initializeMarkerControls() {

        console.log('[MapManager] Initializing marker controls...');

        // ✅ CORRECTION : Restaurer la définition des types de marqueurs
        const markerTypes = ['circle', 'square', 'triangle', 'hexagon'];

        // ✅ INJECTION DE DÉPENDANCE : Passer le geometryHandler
        this.markerControlManager = new MarkerControlManager(this.map, markerTypes, this.stateManager, this.geometryHandler);
        this.markerControlManager.addCustomMarkerControls();

        console.log('[MapManager] Custom marker controls added.');

    }



    /**

     * Initialise les contrôles de ligne personnalisés.

     */

    _initializeLineControls() {

        console.log('[MapManager] Initializing line controls...');

        // ✅ CORRECTION : Restaurer la définition des types de lignes
        const lineTypes = ['line', 'arrow', 'doubleArrow'];

        // ✅ INJECTION DE DÉPENDANCE : Passer le geometryHandler
        this.lineControlManager = new LineControlManager(this.map, lineTypes, this.stateManager, this.geometryHandler);
        this.lineControlManager.addCustomLineControls();

        console.log('[MapManager] Custom line controls added.');

    }



    /**

     * Initialise les contrôles de courbe.

     */

    _initializeCurveControls() {

        console.log('[MapManager] Initializing curve controls...');

        this.curveControlManager = new CurveControlManager(this.map, this.stateManager);

        this.curveControlManager.addCurveControl();

        console.log('[MapManager] Curve controls added.');

    }



    /**

     * Initialise les contrôles d'édition.

     */

    _initializeEditingControls() {

        if (!this.map.pm) {

            console.error('[MapManager] Leaflet.PM plugin is not loaded.');

            throw new Error('Leaflet.PM plugin is not loaded.');

        }



        console.log('[MapManager] Initializing editing controls...');

        const editOptions = {

            snappable: true,

            snapDistance: 20,

            allowSelfIntersection: true,

            addVertexOn: 'midpoint',

            preventMarkerRemoval: false,

            removeLayerOnEmpty: true

        };



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

            customControls: true

        });

        console.log('[MapManager] Editing controls added.');



        setTimeout(() => {

            const polylineButton = document.querySelector('.leaflet-pm-icon-polyline');

            if (polylineButton && polylineButton.parentElement) {

                polylineButton.parentElement.style.display = 'none';

                console.log('[MapManager] Default Polyline button hidden');

            }

        }, 100);


        this.map.on('pm:dragstart', (e) => {
            console.log('[MapManager] 🎯 Drag started on layer:', e.layer._leaflet_id);
            // Masquer les handles de courbe si en mode courbe
            if (this.curveControlManager && this.curveControlManager.curveMode) {
                this.curveControlManager._clearCurveHandles();
            }
        });

        this.map.on('pm:dragend', (e) => {
            console.log('[MapManager] ✅ Drag ended on layer:', e.layer._leaflet_id);
            // Regénérer les flèches après le drag
            if (e.layer._arrowRenderHandler) {
                e.layer._arrowRenderHandler.call(e.layer);
            }
        });



        this.map.on('pm:globaleditmodetoggled', (e) => {

            console.log('[MapManager] Global edit mode toggled:', e.enabled);



            if (this.map.pm.setGlobalOptions) {

                this.map.pm.setGlobalOptions({ snapMiddle: true });

            }



            this.map.eachLayer((layer) => {

                if (layer instanceof L.Path && !(layer instanceof L.TileLayer)) {

                    if (e.enabled) {

                        console.log('[MapManager] Enabling editing for layer:', layer);

                        layer.pm.enable(editOptions);

                    } else {

                        layer.pm.disable();

                    }

                }

            });

        });



        this._setupEditingEventListeners();

        console.log('[MapManager] Editing controls initialized successfully.');

    }



    /**
     * Configure les écouteurs d'événements d'édition.
     */
    _setupEditingEventListeners() {
        console.log('[MapManager] Initialisation des écouteurs d’édition...');

        const updateArrowPath = (layer) => {
            if (!layer || !layer._svgPath || !layer._arrowType) return;
            const coords = layer.getLatLngs();
            let pathData = '';
            coords.forEach((latlng, i) => {
                const p = this.map.latLngToLayerPoint(latlng);
                pathData += (i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`);
            });
            layer._svgPath.setAttribute('d', pathData);
            console.log('[MapManager] 🔄 Arrow path updated');
        };

        // ============================================================
        // 🎯 CREATION D'OBJETS
        // ============================================================
        this.map.on('pm:create', (e) => {
            const {shape, layer} = e;
            if (shape === 'Rectangle') {
                console.log('[MapManager] Rectangle créé → conversion en polygone');
                const latLngs = layer.getLatLngs()[0];
                const options = {
                    color: layer.options.color || '#3388ff',
                    fillColor: layer.options.fillColor || '#3388ff',
                    fillOpacity: layer.options.fillOpacity || 0.2,
                    weight: layer.options.weight || 3,
                    opacity: layer.options.opacity || 1,
                    dashArray: layer.options.dashArray || null,
                };
                const polygon = L.polygon(latLngs, options).addTo(this.map);
                this.map.removeLayer(layer);
                polygon.pm.enable({snappable: true, snapDistance: 20, snapMiddle: true, allowSelfIntersection: false});
                polygon.pm.disable();

                // ✅ CORRECTION: Créer un objet géométrie structuré
                if (polygon) {
                    const geometryObject = this.geometryHandler.createGeometryObject(polygon);
                    this.stateManager.addGeometry(geometryObject);
                    console.log('[MapManager] ✅ Polygone (ex-rectangle) ajouté');
                }
            } else if (shape === 'Line') {
                console.log('[MapManager] ➡️ Line détectée - Délégation à LineControlManager...');
                if (this.lineControlManager) {
                    this.lineControlManager._handlePolylineCreation(e);
                }
            } else this._handleLayerCreation(e);
        });


        // ============================================================
        // 🎯 EDITION / DEPLACEMENT DES POINTS
        // ============================================================
        const refreshGeometry = (layer) => {
            // Cette fonction est maintenant obsolète et gérée par les écouteurs pm.
            // La mise à jour des coordonnées se fait à la fin de l'opération (dragend).
        };

        const hideSVGShowPath = (l) => {
            if (!l) return;
            console.log(`[MapManager] 👁️ hideSVGShowPath: Affichage de la polyline native pour édition (layer ${l._leaflet_id})`);
            if (l._svgPath) l._svgPath.style.display = 'none';
            if (l._path) {
                l._path.style.display = '';
                console.log(`[MapManager]    -> Style natif appliqué: display='${l._path.style.display}'`);
            }
        };

        const showSVGHidePath = (l) => {
            if (!l) return;
            console.log(`[MapManager] 🙈 showSVGHidePath: Masquage de la polyline native post-édition (layer ${l._leaflet_id})`);
            if (l._path) l._path.style.display = 'none';
            if (l._svgPath) {
                l._svgPath.style.display = '';
                console.log(`[MapManager]    -> SVG ré-affiché pour le layer ${l._leaflet_id}`);
                SVGUtils.updateArrowPath(l);
            }
        };

        // ---- Début d’édition ----
        this.map.on('pm:vertex:dragstart pm:vertexadded pm:markerdragstart pm:dragstart', e => {
            if (e.layer?._arrowType) hideSVGShowPath(e.layer);
            console.log(`[MapManager] 🎬 Début d'édition pour le layer ${e.layer?._leaflet_id}. SVG masqué, natif affiché.`);
        });

        // ---- Fin de déplacement (DRAG END) ----
        this.map.on('pm:vertex:dragend pm:markerdragend pm:dragend', e => {
            if (e.layer?._arrowType) {
                console.log(`[MapManager] ✅ Fin d'édition pour le layer ${e.layer._leaflet_id}. Notification au StateManager.`);
                const index = this.stateManager.geometries.findIndex(g => g.layer === e.layer);
                if (index !== -1) {
                    // ✅ Notifier le StateManager qui va gérer la mise à jour et la reconstruction.
                    this.stateManager.updateGeometry(index, e.layer.getLatLngs());
                } else {
                    console.warn(`[MapManager] ⚠️ Layer ${e.layer._leaflet_id} non trouvé dans le state après édition.`);
                }
                // Ré-afficher le SVG (la reconstruction est gérée par StateManager)
                showSVGHidePath(e.layer);
            }
        });

        // ============================================================
        // 🎯 MISE À JOUR DES FLÈCHES AU ZOOM / MOUVEMENT (SIMPLIFIÉ)
        // ============================================================
        // La mise à jour est maintenant gérée localement par chaque flèche
        // dans SVGUtils.js pour de meilleures performances et éviter les conflits.
        console.log("[MapManager] La mise à jour des flèches au zoom/move est maintenant déléguée à SVGUtils.");

        // ============================================================
        // 🎯 GESTION DU DRAG POUR LES FLÈCHES
        // ============================================================
        this.map.on('pm:dragstart', (e) => {
            if (e.layer && e.layer._arrowType) {
                // La logique est déjà couverte par 'pm:markerdragstart'
                console.log(`[MapManager] 🖱️ Drag start détecté pour la flèche ${e.layer._leaflet_id}`);
            }
        });

        this.map.on('pm:dragend', (e) => {
            if (e.layer && e.layer._arrowType) {
                console.log('[MapManager] 🖱️ Drag end detected for arrow');
                SVGUtils.restoreArrowsAfterDrag(e.layer);
                // La mise à jour de l'état est déjà gérée par 'pm:vertex:dragend'
            }
        });

        console.log('[MapManager] ✅ Écouteurs d\'édition pour les flèches configurés.');
    }

    /**
     * ✅ Modifier la fonction _updateArrowheads
     */
    _updateArrowheads(layer, arrowType) {
        if (!layer || !arrowType) return;

        console.log('[MapManager] 🔄 Updating arrowheads for layer:', layer._leaflet_id);

        // ✅ NETTOYAGE COMPLET avant mise à jour
        if (layer._svgPath && layer._svgPath.isConnected) {
            layer._svgPath.remove();
            delete layer._svgPath;
            console.log('[MapManager] 🧹 Old path removed');
        }

        // ✅ Détacher les anciens handlers
        if (layer._arrowUpdateHandler && this.map) {
            this.map.off('zoom', layer._arrowUpdateHandler);
            this.map.off('move', layer._arrowUpdateHandler);
            delete layer._arrowUpdateHandler;
        }

        // ✅ Créer les nouvelles flèches
        SVGUtils.addArrowheadsToPolylineSVG(layer, arrowType);

        console.log('[MapManager] ✅ Arrowheads updated and polyline masked');
    }


}
