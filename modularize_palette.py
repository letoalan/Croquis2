import os

def modularize_symbol_palette_manager():
    targets = [
        'fpaysage/js/modules/ui/SymbolPaletteManager.js',
        'fportrait/js/modules/ui/SymbolPaletteManager.js',
        'fpromethean/js/modules/ui/SymbolPaletteManager.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        palette_dir = os.path.join(dirpath, 'palette_parts')
        os.makedirs(palette_dir, exist_ok=True)

        dropzones_code = '''// PaletteDropZones.js - Gestion des drop zones synchronisées avec l'éditeur de texte

export class PaletteDropZones {
    static init(container, onDrop, onDragOver, onDragLeave) {
        if (!container) return [];
        container.innerHTML = '';
        const zones = [];
        for (let i = 0; i < 15; i++) {
            const zone = document.createElement('div');
            zone.className = 'symbol-drop-zone';
            zone.setAttribute('data-zone-id', i);
            zone.style.height = '36px';
            zone.style.minHeight = '36px';
            zone.addEventListener('dragover', onDragOver);
            zone.addEventListener('drop', onDrop);
            zone.addEventListener('dragleave', onDragLeave);
            container.appendChild(zone);
            zones.push(zone);
        }
        return zones;
    }
}
'''

        preview_code = '''// PalettePreviewRenderer.js - Rendu des figurés visuels dans le panneau de stockage

import { SVGUtils } from '../utils/SVGUtils.js';

export class PalettePreviewRenderer {
    static createSymbolElement(geometry, symbolId) {
        const item = document.createElement('div');
        item.className = 'storage-symbol-item';
        item.draggable = true;
        item.setAttribute('data-symbol-id', symbolId);

        const preview = document.createElement('div');
        preview.className = 'symbol-preview-icon';
        preview.style.width = '24px';
        preview.style.height = '24px';
        preview.style.display = 'inline-flex';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';

        const color = geometry.color || '#007bff';
        const lineColor = geometry.lineColor || '#000000';

        if (geometry.type === 'Polygon') {
            preview.innerHTML = `<svg width=\"20\" height=\"20\"><polygon points=\"2,2 18,6 16,18 4,14\" fill=\"${color}\" stroke=\"${lineColor}\" stroke-width=\"1.5\"/></svg>`;
        } else if (geometry.type === 'Circle' || geometry.type === 'CircleMarker') {
            preview.innerHTML = `<svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"8\" fill=\"${color}\" stroke=\"${lineColor}\" stroke-width=\"1.5\"/></svg>`;
        } else if (geometry.type === 'Polyline') {
            preview.innerHTML = `<svg width=\"20\" height=\"20\"><line x1=\"2\" y1=\"18\" x2=\"18\" y2=\"2\" stroke=\"${color}\" stroke-width=\"2.5\"/></svg>`;
        } else {
            preview.innerHTML = `<svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"6\" fill=\"${color}\" stroke=\"${lineColor}\" stroke-width=\"1.5\"/></svg>`;
        }

        item.appendChild(preview);
        const label = document.createElement('span');
        label.className = 'symbol-label';
        label.textContent = geometry.name || 'Figuré';
        item.appendChild(label);
        return item;
    }
}
'''

        palettemanager_code = '''// SymbolPaletteManager.js - Gestionnaire modulaire de la palette de symboles
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
'''

        with open(os.path.join(palette_dir, 'PaletteDropZones.js'), 'w', encoding='utf-8') as f:
            f.write(dropzones_code)
        with open(os.path.join(palette_dir, 'PalettePreviewRenderer.js'), 'w', encoding='utf-8') as f:
            f.write(preview_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(palettemanager_code)
        print(f"Modularized SymbolPaletteManager for {t}")

if __name__ == '__main__':
    modularize_symbol_palette_manager()
