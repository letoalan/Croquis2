import os

def modularize_state_manager():
    targets = [
        'fpaysage/js/modules/StateManager.js',
        'fportrait/js/modules/StateManager.js',
        'fpromethean/js/modules/StateManager.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        state_dir = os.path.join(dirpath, 'state_parts')
        os.makedirs(state_dir, exist_ok=True)

        legend_state_code = '''// LegendStateStore.js - Gestion des parties et sous-parties de la légende

export class LegendStateStore {
    constructor() {
        this.legendParts = [];
        this.geometryToPart = new Map();
    }

    addPart(title = 'Nouvelle partie') {
        const id = `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        this.legendParts.push({ id, title, geometries: [], subParts: [] });
        return id;
    }

    updatePartTitle(partId, newTitle) {
        const part = this.legendParts.find(p => p.id === partId);
        if (part) part.title = newTitle;
    }

    deletePart(partId) {
        const idx = this.legendParts.findIndex(p => p.id === partId);
        if (idx !== -1) {
            this.legendParts[idx].geometries.forEach(gIdx => this.geometryToPart.delete(gIdx));
            this.legendParts.splice(idx, 1);
        }
    }

    assignGeometryToPart(geomIndex, partId) {
        this.legendParts.forEach(part => {
            part.geometries = part.geometries.filter(i => i !== geomIndex);
        });
        if (partId) {
            const part = this.legendParts.find(p => p.id === partId);
            if (part && !part.geometries.includes(geomIndex)) {
                part.geometries.push(geomIndex);
                this.geometryToPart.set(geomIndex, partId);
            }
        } else {
            this.geometryToPart.delete(geomIndex);
        }
    }

    getGeometryPart(geomIndex) {
        for (const part of this.legendParts) {
            if (part.geometries.includes(geomIndex)) return part.id;
        }
        return null;
    }
}
'''

        ui_list_code = '''// GeometryListRenderer.js - Rendu du panneau latéral listant les géométries

export class GeometryListRenderer {
    static render(geometries, selectedIndex, onSelect, onDelete) {
        const list = document.getElementById('geometryList');
        if (!list) return;
        list.innerHTML = '';

        geometries.forEach((geom, idx) => {
            const item = document.createElement('div');
            item.className = `list-item ${selectedIndex === idx ? 'selected' : ''}`;

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = geom.name || `Figuré ${idx + 1}`;
            nameInput.onclick = (e) => e.stopPropagation();
            nameInput.onchange = () => { geom.name = nameInput.value; };

            const actions = document.createElement('div');
            actions.className = 'item-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary';
            editBtn.textContent = '✏️';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                onSelect(idx);
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-outline-danger';
            delBtn.textContent = '🗑️';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                onDelete(idx);
            };

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);
            item.appendChild(nameInput);
            item.appendChild(actions);

            item.onclick = () => onSelect(idx);
            list.appendChild(item);
        });
    }
}
'''

        statemanager_code = '''// StateManager.js - Source de vérité unique modulaire
import { SVGUtils } from './utils/SVGUtils.js';
import { LegendStateStore } from './state_parts/LegendStateStore.js';
import { GeometryListRenderer } from './state_parts/GeometryListRenderer.js';

export class StateManager {
    constructor() {
        console.log('[StateManager] Initializing modular StateManager...');
        this.geometries = [];
        this.selectedIndex = null;
        this.mapManager = null;
        this.legendManager = null;
        this.symbolPaletteManager = null;
        this.exportImportManager = null;
        this.mapTitle = '';
        this.isTitlePanelCollapsed = false;
        this.legendStore = new LegendStateStore();
    }

    get legendParts() { return this.legendStore.legendParts; }
    set legendParts(val) { this.legendStore.legendParts = val; }
    get geometryToPart() { return this.legendStore.geometryToPart; }

    setMapManager(mgr) { this.mapManager = mgr; }
    setLegendManager(mgr) { this.legendManager = mgr; }
    setSymbolPaletteManager(mgr) { this.symbolPaletteManager = mgr; }
    setExportImportManager(mgr) { this.exportImportManager = mgr; }
    setMapTitle(t) { this.mapTitle = t; }

    addGeometry(geom) {
        if (!geom?.layer) return;
        geom.name = geom.name || `Figuré ${this.geometries.length + 1}`;
        this.geometries.push(geom);
        this.updateUI();
        this.symbolPaletteManager?.onGeometryAdded?.(geom);
    }

    deleteGeometry(idx) {
        if (idx < 0 || idx >= this.geometries.length) return;
        const geom = this.geometries[idx];
        if (geom.layer) {
            SVGUtils.cleanupArrowheads(geom.layer);
            this.mapManager?.map?.removeLayer(geom.layer);
        }
        this.geometries.splice(idx, 1);
        this.updateUI();
        this.symbolPaletteManager?.onGeometryRemoved?.(geom);
    }

    selectGeometry(idx) {
        this.selectedIndex = idx;
        const geom = this.geometries[idx];
        if (geom) {
            this.openContextMenu(idx);
        }
    }

    applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize) {
        const idx = this.selectedIndex;
        if (idx === null || !this.geometries[idx]) return;
        const geom = this.geometries[idx];

        geom.color = color;
        geom.lineColor = lineColor;
        geom.opacity = opacity;
        geom.lineDash = lineDash;
        geom.lineWeight = lineWeight;
        geom.markerSize = markerSize;

        if (geom.layer) {
            if (typeof geom.layer.setStyle === 'function') {
                geom.layer.setStyle({ fillColor: color, color: lineColor, fillOpacity: opacity, weight: lineWeight });
            } else if (geom.layer.setIcon) {
                SVGUtils.updateMarkerStyle(geom.layer, geom);
            }
        }
        this.updateUI();
    }

    updateGeometry(index, newCoords) {
        if (this.geometries[index]) {
            this.geometries[index].coordinates = newCoords;
            this.updateUI();
        }
    }

    updateGeometryCoordinates(index, newCoords) {
        this.updateGeometry(index, newCoords);
    }

    updateUI() {
        GeometryListRenderer.render(
            this.geometries,
            this.selectedIndex,
            (idx) => this.selectGeometry(idx),
            (idx) => this.deleteGeometry(idx)
        );
        this.legendManager?.updateLegend?.();
    }

    openContextMenu(idx) {
        const geom = this.geometries[idx];
        if (!geom) return;
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.display = 'block';
            this.mapManager?.uiManager?.populateContextMenuForGeometry?.(geom);
        }
    }

    addLegendPart(title) {
        const id = this.legendStore.addPart(title);
        this.updateUI();
        return id;
    }

    updatePartTitle(partId, title) {
        this.legendStore.updatePartTitle(partId, title);
        this.updateUI();
    }

    deleteLegendPart(partId) {
        this.legendStore.deletePart(partId);
        this.updateUI();
    }

    assignGeometryToPart(idx, partId) {
        this.legendStore.assignGeometryToPart(idx, partId);
        this.updateUI();
    }

    getGeometryPart(idx) {
        return this.legendStore.getGeometryPart(idx);
    }
}
'''

        with open(os.path.join(state_dir, 'LegendStateStore.js'), 'w', encoding='utf-8') as f:
            f.write(legend_state_code)
        with open(os.path.join(state_dir, 'GeometryListRenderer.js'), 'w', encoding='utf-8') as f:
            f.write(ui_list_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(statemanager_code)
        print(f"Modularized StateManager for {t}")

if __name__ == '__main__':
    modularize_state_manager()
