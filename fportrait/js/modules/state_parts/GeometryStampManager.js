// GeometryStampManager.js - Gestion du mode tampon continu pour géométries
import { GeometryDuplicator } from './GeometryDuplicator.js';

export class GeometryStampManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.stampingIndex = null;
        this._mapClickHandler = this._onMapClick.bind(this);
        this._keydownHandler = this._onKeyDown.bind(this);
    }

    isStamping() {
        return this.stampingIndex !== null;
    }

    getStampingGeometry() {
        if (this.stampingIndex === null) return null;
        return this.stateManager.geometries[this.stampingIndex] || null;
    }

    startStamping(geomIndex) {
        if (geomIndex < 0 || geomIndex >= this.stateManager.geometries.length) return;
        this.stopStamping();

        this.stampingIndex = geomIndex;
        const map = this.stateManager.mapManager?.map;
        if (!map) return;

        const mapContainer = map.getContainer();
        mapContainer?.classList.add('cursor-stamp');

        map.on('click', this._mapClickHandler);
        window.addEventListener('keydown', this._keydownHandler);

        this._updateButtonUI(true);
        console.log(`[GeometryStampManager] Tampon continu activé pour le figuré index ${geomIndex}`);
    }

    stopStamping() {
        if (this.stampingIndex === null) return;
        const map = this.stateManager.mapManager?.map;
        if (map) {
            const mapContainer = map.getContainer();
            mapContainer?.classList.remove('cursor-stamp');
            map.off('click', this._mapClickHandler);
        }
        window.removeEventListener('keydown', this._keydownHandler);
        this.stampingIndex = null;
        this._updateButtonUI(false);
        console.log('[GeometryStampManager] Tampon continu désactivé');
    }

    _onMapClick(e) {
        if (this.stampingIndex === null || !e.latlng) return;
        L.DomEvent?.stopPropagation?.(e);

        const geom = this.stateManager.geometries[this.stampingIndex];
        if (!geom) {
            this.stopStamping();
            return;
        }

        const map = this.stateManager.mapManager?.map;
        const currentIdx = this.stampingIndex;

        const result = GeometryDuplicator.createLayerInstance(geom, e.latlng, map, (clickEvent) => {
            if (this.isStamping()) return;
            L.DomEvent?.stopPropagation?.(clickEvent);
            this.stateManager.selectGeometry(currentIdx);
        });

        if (result && result.layer) {
            if (!geom.layers) {
                geom.layers = [geom.layer];
            }
            geom.layers.push(result.layer);

            if (!Array.isArray(geom.coordinatesList)) {
                geom.coordinatesList = [geom.coordinates];
            }
            geom.coordinatesList.push(result.coordinates);

            console.log(`[GeometryStampManager] Instance ajoutée au figuré index ${currentIdx} (total: ${geom.layers.length})`);
            // Annuler le mode tampon après le premier copier/coller (l'utilisateur doit réappuyer sur le bouton pour recommencer)
            this.stopStamping();
        }
    }

    _onKeyDown(e) {
        if (e.key === 'Escape') {
            this.stopStamping();
        }
    }

    _updateButtonUI(active) {
        const btn = document.getElementById('contextDuplicateBtn');
        if (btn) {
            btn.textContent = active ? '🛑 Arrêter le tampon' : '📋 Tamponner sur la carte';
            btn.classList.toggle('stamp-active', active);
        }
    }
}
