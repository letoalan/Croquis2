// LegendManager.js - Orchestrateur modulaire de la légende dynamique
import { LegendOrganizer } from './LegendOrganizer.js';
import { LegendDomBuilder } from './legend_parts/LegendDomBuilder.js';

export class LegendManager {
    constructor(map, stateManager) {
        if (!map) throw new Error('Map is required for LegendManager.');
        if (!stateManager) throw new Error('StateManager is required for LegendManager.');

        this.map = map;
        this.stateManager = stateManager;
        this.legendControl = null;
        this.legendOrganizer = new LegendOrganizer(stateManager, this);
        this.initLegend();
    }

    initLegend() {
        const LegendControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd: () => {
                const c = L.DomUtil.create('div', 'legend-control');
                L.DomEvent.disableClickPropagation(c);
                L.DomEvent.disableScrollPropagation(c);
                return c;
            }
        });

        this.legendControl = new LegendControl();
        this.map.addControl(this.legendControl);

        if (this.stateManager.legendParts.length === 0) {
            this.stateManager.addLegendPart('I');
        }

        this.updateLegend();
    }

    updateLegend() {
        const container = this.legendControl?.getContainer();
        if (!container) return;

        container.innerHTML = `
            <div class="legend-header">
                <span class="legend-title">✏️ Légende</span>
                <button class="legend-add-part-btn" id="addPartBtn">+ Partie</button>
            </div>
        `;

        container.querySelector('#addPartBtn')?.addEventListener('click', () => {
            const name = prompt('Nom de la partie:');
            if (name?.trim()) {
                this.stateManager.addLegendPart(name.trim());
                this.updateLegend();
            }
        });

        LegendDomBuilder.renderColumns(container, this.stateManager, () => this.updateLegend());
        this.legendOrganizer.setupDragAndDrop();
    }

    createLegendSymbol(geometry) {
        return LegendDomBuilder.createSymbol ? LegendDomBuilder.createSymbol(geometry) : document.createElement('div');
    }
}
