// GeometryManager.js
import { LegendManager } from './mapping/legend/LegendManager.js';
import { StateManager } from './StateManager.js';
import { MapManager } from './MapManager.js';
import { UIManager } from './UIManager.js';

export class GeometryManager {
    constructor() {
        console.log('Début du chargement de GeometryManager.js');

        // Initialiser le StateManager en premier
        this.stateManager = new StateManager();

        // Initialiser le MapManager avec le StateManager
        this.mapManager = new MapManager(this.stateManager);

        // Passer le MapManager au StateManager
        this.stateManager.setMapManager(this.mapManager);

        // Initialiser la carte
        this.mapManager.initMap();

        // Maintenant que la carte est initialisée, on peut initialiser le LegendManager
        this.legendManager = new LegendManager(this.mapManager.map, this.stateManager);

        // Passer le LegendManager au StateManager
        this.stateManager.setLegendManager(this.legendManager);

        // Initialiser UIManager avec StateManager
        this.uiManager = new UIManager(this.stateManager);
    }

    init() {
        this.uiManager.initUI();
    }
}