// SymbolPaletteManager.js - Gestionnaire modulaire de la palette de symboles
import { PaletteDropZones } from './palette_parts/PaletteDropZones.js';
import { PalettePreviewRenderer } from './palette_parts/PalettePreviewRenderer.js';

export class SymbolPaletteManager {
    constructor(stateManager, legendManager) {
        if (!stateManager) throw new Error('StateManager is required.');
        if (!legendManager) throw new Error('LegendManager is required.');

        this.stateManager = stateManager;
        this.legendManager = legendManager;
        this.dropZoneElements = [];
        this.initialize();
    }

    initialize() {
        console.log('[SymbolPaletteManager] Initializing modular palette...');
        const container = document.getElementById('dropZonesContainer');
        this.dropZoneElements = PaletteDropZones.init(
            container,
            (e) => this.onDrop(e),
            (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.currentTarget?.classList.add('drag-over');
            },
            (e) => { e.currentTarget?.classList.remove('drag-over'); }
        );

        this.initStorageDrop();
        this.syncWithGeometries();
    }

    initStorageDrop() {
        const storage = document.getElementById('usedSymbolsStorage');
        if (!storage) return;

        storage.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            storage.classList.add('drag-over');
        });

        storage.addEventListener('dragleave', () => {
            storage.classList.remove('drag-over');
        });

        storage.addEventListener('drop', (e) => {
            e.preventDefault();
            storage.classList.remove('drag-over');
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;

            try {
                const data = JSON.parse(dataStr);
                if (data.fromZoneId !== null && data.fromZoneId !== undefined) {
                    this.clearZone(data.fromZoneId);
                }
            } catch (err) {
                // Ignore parsing errors
            }
        });
    }

    /**
     * Calcule l'ensemble des IDs de symboles actuellement placés dans les drop zones
     */
    getPlacedSymbolIds() {
        const placed = new Set();
        document.querySelectorAll('.symbol-drop-zone').forEach(zone => {
            const symItem = zone.querySelector('.storage-symbol-item');
            if (symItem) {
                const symId = symItem.getAttribute('data-symbol-id');
                if (symId) placed.add(symId);
            }
        });
        return placed;
    }

    /**
     * Synchronise la zone d'attente (stockage).
     * Les figurés déjà placés dans une drop zone ne sont plus affichés dans la zone d'attente.
     */
    syncWithGeometries() {
        const storage = document.getElementById('usedSymbolsStorage');
        if (!storage) return;
        storage.innerHTML = '';

        const placedIds = this.getPlacedSymbolIds();

        this.stateManager.geometries.forEach((geom, idx) => {
            const symId = `sym_${idx}`;
            if (placedIds.has(symId)) {
                return; // Déjà placé dans une drop zone
            }

            const el = PalettePreviewRenderer.createSymbolElement(geom, symId);
            el.setAttribute('draggable', 'true');
            el.addEventListener('dragstart', (e) => {
                const dragData = { symId, fromZoneId: null };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                e.dataTransfer.effectAllowed = 'copyMove';
            });
            storage.appendChild(el);
        });
    }

    onDrop(e) {
        e.preventDefault();
        const zone = e.currentTarget;
        if (!zone) return;
        zone.classList.remove('drag-over');

        const rawData = e.dataTransfer.getData('text/plain');
        if (!rawData) return;

        let symId = rawData;
        let fromZoneId = null;

        try {
            const parsed = JSON.parse(rawData);
            if (parsed && parsed.symId) {
                symId = parsed.symId;
                fromZoneId = parsed.fromZoneId ?? null;
            }
        } catch (_) {}

        const targetZoneId = zone.getAttribute('data-zone-id');
        if (fromZoneId !== null && String(fromZoneId) === String(targetZoneId)) {
            return; // Déposé sur la même zone
        }

        const idx = parseInt(symId.replace('sym_', ''), 10);
        const geom = this.stateManager.geometries[idx];
        if (!geom) return;

        // Si la zone de destination contenait déjà un figuré, on la vide
        if (zone.querySelector('.storage-symbol-item')) {
            zone.innerHTML = '';
            zone.classList.remove('filled');
        }

        // Si déplacé depuis une autre drop zone, libérer l'ancienne
        if (fromZoneId !== null && fromZoneId !== undefined) {
            const sourceZone = document.querySelector(`.symbol-drop-zone[data-zone-id="${fromZoneId}"]`);
            if (sourceZone) {
                sourceZone.innerHTML = '';
                sourceZone.classList.remove('filled');
            }
        }

        this.renderInZone(zone, geom, symId);
        this.syncWithGeometries();
    }

    renderInZone(zone, geom, symId) {
        zone.innerHTML = '';
        zone.classList.add('filled');

        const item = PalettePreviewRenderer.createSymbolElement(geom, symId);
        item.setAttribute('draggable', 'true');
        item.style.width = '100%';
        item.style.cursor = 'grab';

        const zoneId = zone.getAttribute('data-zone-id');
        item.addEventListener('dragstart', (e) => {
            const dragData = { symId, fromZoneId: zoneId };
            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            e.dataTransfer.effectAllowed = 'move';
        });

        // Bouton de suppression / retour
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'drop-zone-remove-btn';
        removeBtn.title = 'Retourner le figuré au stockage';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearZone(zoneId);
        });

        zone.appendChild(item);
        zone.appendChild(removeBtn);
    }

    clearZone(zoneId) {
        const zone = document.querySelector(`.symbol-drop-zone[data-zone-id="${zoneId}"]`);
        if (zone) {
            zone.innerHTML = '';
            zone.classList.remove('filled');
        }
        this.syncWithGeometries();
    }

    onGeometryAdded()   { this.syncWithGeometries(); }
    onGeometryRemoved() { this.syncWithGeometries(); }
    onGeometryUpdated() { this.syncWithGeometries(); }
}
