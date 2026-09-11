// SymbolPaletteManager.js - Gestionnaire modulaire de la palette de symboles
import { PaletteDropZones } from './palette_parts/PaletteDropZones.js';
import { PalettePreviewRenderer } from './palette_parts/PalettePreviewRenderer.js';

export class SymbolPaletteManager {
    constructor(stateManager, legendManager) {
        if (!stateManager) throw new Error('StateManager is required.');
        if (!legendManager) throw new Error('LegendManager is required.');

        this.stateManager = stateManager;
        this.legendManager = legendManager;
        this.usedSymbols = new Map();
        this.dropZoneElements = [];
        this.initialize();
    }

    initialize() {
        console.log('[SymbolPaletteManager] Initializing modular palette...');
        const container = document.getElementById('dropZonesContainer');
        this.dropZoneElements = PaletteDropZones.init(
            container,
            (e) => this.onDrop(e),
            (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
            (e) => { e.currentTarget?.classList.remove('drag-over'); }
        );
        this.syncWithLegend();
    }

    syncWithLegend() {
        const storage = document.getElementById('storageContainer');
        if (!storage) return;
        storage.innerHTML = '';

        this.stateManager.geometries.forEach((geom, idx) => {
            const symId = `sym_${idx}`;
            const el = PalettePreviewRenderer.createSymbolElement(geom, symId);
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', symId);
            });
            storage.appendChild(el);
        });
    }

    onDrop(e) {
        e.preventDefault();
        const symId = e.dataTransfer.getData('text/plain');
        const zone = e.currentTarget;
        if (!symId || !zone) return;

        const idx = parseInt(symId.replace('sym_', ''), 10);
        const geom = this.stateManager.geometries[idx];
        if (geom) {
            zone.innerHTML = '';
            zone.appendChild(PalettePreviewRenderer.createSymbolElement(geom, symId));
        }
    }

    onGeometryAdded() { this.syncWithLegend(); }
    onGeometryRemoved() { this.syncWithLegend(); }
    onGeometryUpdated() { this.syncWithLegend(); }
}
