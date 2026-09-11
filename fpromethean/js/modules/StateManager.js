// StateManager.js - Source de vérité unique modulaire
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
