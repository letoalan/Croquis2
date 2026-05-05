// GeometryManager.js

import { MapManager } from './MapManager.js';
import { StateManager } from './StateManager.js';
import { LegendManager } from './mapping/legend/LegendManager.js';
import { UIManager } from './UIManager.js';
import { ExportImportManager } from './mapping/io/ExportImportManager.js';
import { ScaleOrientationManager } from './mapping/controls/ScaleOrientationManager.js';
import { PDFExporter } from './mapping/io/PDFExporter.js';
import { SymbolPaletteManager } from './ui/SymbolPaletteManager.js';

export class GeometryManager {
    constructor() {
        console.log('Début du chargement de GeometryManager.js');

        // ✅ 1. Initialiser le StateManager en premier
        this.stateManager = new StateManager();
        console.log('[GeometryManager] StateManager initialized:', this.stateManager);

        // ✅ 2. Initialiser le MapManager avec le StateManager
        this.mapManager = new MapManager(this.stateManager);
        console.log('[GeometryManager] MapManager initialized:', this.mapManager);

        // ✅ 3. Passer le MapManager au StateManager
        this.stateManager.setMapManager(this.mapManager);
        console.log('[GeometryManager] MapManager passed to StateManager');

        // ✅ 4. Initialiser la carte
        console.log('[GeometryManager] Initializing map...');
        this.mapManager.initMap();

        // ✅ 5. Initialiser le LegendManager (nécessite la carte initialisée)
        this.legendManager = new LegendManager(this.mapManager.map, this.stateManager);
        console.log('[GeometryManager] LegendManager initialized:', this.legendManager);

        // ✅ 6. Passer le LegendManager au StateManager
        this.stateManager.setLegendManager(this.legendManager);
        console.log('[GeometryManager] LegendManager passed to StateManager');

        // ✅ 7. Initialiser ScaleOrientationManager (nécessite la carte initialisée)
        this.scaleOrientationManager = new ScaleOrientationManager(this.mapManager.map);
        console.log('[GeometryManager] ScaleOrientationManager initialized');

        // ✅ AJOUT CRITIQUE : Lier l'instance au MapManager pour qu'elle soit accessible
        this.mapManager.scaleOrientationManager = this.scaleOrientationManager;
        console.log('[GeometryManager] ✅ ScaleOrientationManager linked to MapManager');

        // ✅ 8. Initialiser ExportImportManager
        this.exportImportManager = new ExportImportManager(this.stateManager, this.mapManager);
        this.stateManager.setExportImportManager(this.exportImportManager);
        console.log('[GeometryManager] ExportImportManager initialized and linked');

        // ✅ 9. Initialiser PDFExporter
        this.pdfExporter = new PDFExporter(this.mapManager, this.legendManager, this.stateManager);
        console.log('[GeometryManager] PDFExporter initialized');

        // ✅ 9b. Injecter TileLayerManager depuis MapManager
        if (this.mapManager.tileLayerManager) {
            this.pdfExporter.setTileLayerManager(this.mapManager.tileLayerManager);
            console.log('[GeometryManager] TileLayerManager injected into PDFExporter');
        } else {
            console.warn('[GeometryManager] TileLayerManager not found in MapManager');
        }

        // ✅ 10. ⭐ INITIALISER SymbolPaletteManager (NOUVEAU)
        this.symbolPaletteManager = new SymbolPaletteManager(this.stateManager, this.legendManager);
        console.log('[GeometryManager] SymbolPaletteManager initialized');

        // ✅ 10b. Passer le SymbolPaletteManager au StateManager
        this.stateManager.setSymbolPaletteManager(this.symbolPaletteManager);
        console.log('[GeometryManager] SymbolPaletteManager passed to StateManager');

        // ✅ 11. Initialiser UIManager avec StateManager
        this.uiManager = new UIManager(this.stateManager);
        console.log('[GeometryManager] UIManager initialized:', this.uiManager);

        // ✅ 12. Initialiser les gestionnaires d'événements de l'UI
        this.uiManager.initUI();
        console.log('[GeometryManager] ========== Initialization complete ==========');
    }

    /**
     * ✅ Méthode publique pour accéder au StateManager
     */
    getStateManager() {
        return this.stateManager;
    }

    /**
     * ✅ Méthode publique pour accéder au MapManager
     */
    getMapManager() {
        return this.mapManager;
    }

    /**
     * ✅ Méthode publique pour accéder au LegendManager
     */
    getLegendManager() {
        return this.legendManager;
    }

    /**
     * ✅ Méthode publique pour accéder à l'ExportImportManager
     */
    getExportImportManager() {
        return this.exportImportManager;
    }

    /**
     * ✅ Méthode publique pour accéder au ScaleOrientationManager
     */
    getScaleOrientationManager() {
        return this.scaleOrientationManager;
    }

    /**
     * ✅ Méthode publique pour accéder au PDFExporter
     */
    getPDFExporter() {
        return this.pdfExporter;
    }

    /**
     * ✅ ⭐ NOUVEAU : Méthode publique pour accéder au SymbolPaletteManager
     */
    getSymbolPaletteManager() {
        return this.symbolPaletteManager;
    }
}
