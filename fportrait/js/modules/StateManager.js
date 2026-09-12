// StateManager.js - Source de vérité unique modulaire
import { SVGUtils } from './utils/SVGUtils.js';
import { LegendStateStore } from './state_parts/LegendStateStore.js';
import { GeometryListRenderer } from './state_parts/GeometryListRenderer.js';
import { GeometryStampManager } from './state_parts/GeometryStampManager.js';

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
        this.stampManager = new GeometryStampManager(this);
    }

    get legendParts() { return this.legendStore.legendParts; }
    set legendParts(val) { this.legendStore.legendParts = val; }
    get geometryToPart() { return this.legendStore.geometryToPart; }

    setMapManager(mgr) { this.mapManager = mgr; }
    setLegendManager(mgr) { this.legendManager = mgr; }
    setSymbolPaletteManager(mgr) { this.symbolPaletteManager = mgr; }
    setExportImportManager(mgr) { this.exportImportManager = mgr; }
    setUIManager(mgr) { this.uiManager = mgr; }
    setMapTitle(t) { this.mapTitle = t; }

    addGeometry(geom) {
        if (!geom?.layer) return;
        geom.name = geom.name || `Figuré ${this.geometries.length + 1}`;
        const stableId = geom.layer._leaflet_id || `geom_${Date.now()}_${this.geometries.length}`;
        if (!geom.layer._leaflet_id) geom.layer._leaflet_id = stableId;
        geom.id = stableId;
        if (geom.layer._arrowType) geom.arrowType = geom.layer._arrowType;
        if (!geom.layers) geom.layers = [geom.layer];
        if (!geom.coordinatesList) geom.coordinatesList = [geom.coordinates];

        this.geometries.push(geom);
        const newIndex = this.geometries.length - 1;
        if (geom.layer.on) {
            geom.layer.on('click', (e) => {
                if (this.stampManager.isStamping()) return;
                if (this.mapManager?.markerControlManager?.activeMarkerType) {
                    this.mapManager.markerControlManager._handleMapClick(e);
                    return;
                }
                if (this.mapManager?.map?.pm?.globalDrawModeEnabled?.()) return;
                L.DomEvent?.stopPropagation?.(e);
                const currentIdx = this.geometries.indexOf(geom);
                if (currentIdx !== -1) this.selectGeometry(currentIdx);
            });
        }
        this.selectGeometry(newIndex);
        this.updateUI();
        this.symbolPaletteManager?.onGeometryAdded?.(geom);
    }

    deleteGeometry(idx) {
        if (idx < 0 || idx >= this.geometries.length) return;
        if (this.stampManager.stampingIndex === idx) this.stampManager.stopStamping();
        const geom = this.geometries[idx];
        const layers = geom.layers || (geom.layer ? [geom.layer] : []);
        layers.forEach(layer => {
            SVGUtils.cleanupArrowheads(layer);
            this.mapManager?.map?.removeLayer(layer);
        });
        this.geometries.splice(idx, 1);
        this.updateUI();
        this.symbolPaletteManager?.onGeometryRemoved?.(geom);
    }

    selectGeometry(idx) {
        this.selectedIndex = idx;
        const geom = this.geometries[idx];
        if (geom) this.openContextMenu(idx);
    }

    applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize) {
        const idx = this.selectedIndex;
        if (idx === null || !this.geometries[idx]) return;
        const geom = this.geometries[idx];

        Object.assign(geom, { color, lineColor, opacity, lineDash, lineWeight, markerSize });
        let dashArray = lineDash === 'dashed' ? '6, 6' : (lineDash === 'dotted' ? '2, 6' : null);

        const layers = geom.layers || (geom.layer ? [geom.layer] : []);
        layers.forEach(layer => {
            if (typeof layer.setStyle === 'function') {
                const styleOptions = {
                    fillColor: color,
                    color: geom.type === 'Polyline' ? color : lineColor,
                    opacity: opacity,
                    fillOpacity: opacity,
                    weight: lineWeight,
                    dashArray: dashArray
                };
                layer.setStyle(styleOptions);
                if (layer.options) Object.assign(layer.options, styleOptions);
                if (layer._arrowType) SVGUtils.updateArrowPath(layer);
            } else if (layer.setIcon) {
                SVGUtils.updateMarkerStyle(layer, geom);
            }
        });
        this.updateUI();
    }

    updateGeometry(index, newCoords) {
        if (this.geometries[index]) {
            this.geometries[index].coordinates = newCoords;
            this.updateUI();
        }
    }
    updateGeometryCoordinates(index, newCoords) { this.updateGeometry(index, newCoords); }

    startStamping(idx) { this.stampManager.startStamping(idx); }
    stopStamping() { this.stampManager.stopStamping(); }
    isStamping() { return this.stampManager.isStamping(); }

    updateUI() {
        GeometryListRenderer.render(
            this.geometries, this.selectedIndex,
            (idx) => this.selectGeometry(idx),
            (idx) => this.deleteGeometry(idx),
            (idx) => {
                if (this.isStamping() && this.stampManager.stampingIndex === idx) {
                    this.stopStamping();
                } else {
                    this.startStamping(idx);
                }
            }
        );
        this.legendManager?.updateLegend?.();
    }

    openContextMenu(idx) {
        const geom = this.geometries[idx];
        if (!geom) return;
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.display = 'block';
            const ui = this.uiManager || this.mapManager?.uiManager;
            ui?.populateContextMenuForGeometry?.(geom);
        }
    }

    addLegendPart(title) { const id = this.legendStore.addPart(title); this.updateUI(); return id; }
    addLegendSubPart(partId, title) { const id = this.legendStore.addSubPart(partId, title); this.updateUI(); return id; }
    updateSubPartTitle(subPartId, title) { this.legendStore.updateSubPartTitle(subPartId, title); this.updateUI(); }
    updatePartTitle(partId, title) { this.legendStore.updatePartTitle(partId, title); this.updateUI(); }
    deleteLegendPart(partId) { this.legendStore.deletePart(partId); this.updateUI(); }
    deleteLegendSubPart(subPartId) { this.legendStore.deleteSubPart(subPartId); this.updateUI(); }
    assignGeometryToPart(idx, partId) { this.legendStore.assignGeometryToPart(idx, partId); this.updateUI(); }
    getGeometryPart(idx) { return this.legendStore.getGeometryPart(idx); }
}
