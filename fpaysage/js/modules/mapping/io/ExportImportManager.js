// ExportImportManager.js - Façade modulaire pour l'exportation et importation JSON
import { StateSerializer } from './io_parts/StateSerializer.js';
import { StateDeserializer } from './io_parts/StateDeserializer.js';

export class ExportImportManager {
    constructor(stateManager, mapManager) {
        if (!stateManager) throw new Error('StateManager is required.');
        if (!mapManager) throw new Error('MapManager is required.');
        this.stateManager = stateManager;
        this.mapManager = mapManager;
    }

    exportState() {
        return StateSerializer.serialize(this.stateManager, this.mapManager);
    }

    downloadJSON() {
        const state = this.exportState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `croquis-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    }

    importState(state) {
        try {
            StateDeserializer.restore(state, this.stateManager, this.mapManager);
            return true;
        } catch (err) {
            console.error('[ExportImportManager] Import error:', err);
            alert("Erreur lors de l'import : " + err.message);
            return false;
        }
    }
}
