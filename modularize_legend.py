import os

def modularize_legend_manager():
    targets = [
        'fpaysage/js/modules/mapping/legend/LegendManager.js',
        'fportrait/js/modules/mapping/legend/LegendManager.js',
        'fpromethean/js/modules/mapping/legend/LegendManager.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        legend_parts_dir = os.path.join(dirpath, 'legend_parts')
        os.makedirs(legend_parts_dir, exist_ok=True)

        symbol_code = '''// LegendSymbolBuilder.js - Rendu visuel et icônes pour les figurés de légende

export class LegendSymbolBuilder {
    static createSymbol(geometry) {
        const symbol = document.createElement('div');
        symbol.className = 'legend-symbol-preview';
        symbol.style.width = '24px';
        symbol.style.height = '24px';
        symbol.style.display = 'inline-flex';
        symbol.style.alignItems = 'center';
        symbol.style.justifyContent = 'center';
        symbol.style.marginRight = '8px';

        const color = geometry.color || '#3388ff';
        const lineColor = geometry.lineColor || '#000000';

        if (geometry.type === 'Polygon' || geometry.type === 'Rectangle') {
            symbol.innerHTML = `<svg width=\"20\" height=\"20\"><rect x=\"2\" y=\"2\" width=\"16\" height=\"16\" fill=\"${color}\" stroke=\"${lineColor}\" stroke-width=\"2\" fill-opacity=\"${geometry.opacity || 0.7}\"/></svg>`;
        } else if (geometry.type === 'Circle' || geometry.type === 'CircleMarker') {
            symbol.innerHTML = `<svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"8\" fill=\"${color}\" stroke=\"${lineColor}\" stroke-width=\"2\" fill-opacity=\"${geometry.opacity || 0.7}\"/></svg>`;
        } else if (geometry.type === 'Polyline') {
            symbol.innerHTML = `<svg width=\"20\" height=\"20\"><line x1=\"2\" y1=\"18\" x2=\"18\" y2=\"2\" stroke=\"${color}\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>`;
        } else {
            symbol.innerHTML = `<svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"6\" fill=\"${color}\" stroke=\"${lineColor}\" stroke-width=\"2\"/></svg>`;
        }
        return symbol;
    }
}
'''

        dom_builder_code = '''// LegendDomBuilder.js - Construction DOM des colonnes, parties et figurés

import { LegendSymbolBuilder } from './LegendSymbolBuilder.js';

export class LegendDomBuilder {
    static renderColumns(container, stateManager, onUpdate) {
        const columns = document.createElement('div');
        columns.className = 'legend-columns';

        (stateManager.legendParts || []).forEach((part, partIndex) => {
            const col = document.createElement('div');
            col.className = 'legend-part-column';
            col.setAttribute('data-part-id', part.id);

            const header = document.createElement('div');
            header.className = 'legend-part-header';
            header.innerHTML = `<span class=\"legend-part-title\">${part.title || `Partie ${partIndex + 1}`}</span>`;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'part-management-controls';

            const renameBtn = document.createElement('button');
            renameBtn.className = 'btn btn-sm btn-warning';
            renameBtn.textContent = '✏️';
            renameBtn.onclick = () => {
                const name = prompt('Nouveau nom:', part.title);
                if (name?.trim()) {
                    stateManager.updatePartTitle(part.id, name.trim());
                    onUpdate();
                }
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-danger';
            delBtn.textContent = '🗑️';
            delBtn.onclick = () => {
                if (confirm(`Supprimer \"${part.title}\" ?`)) {
                    stateManager.deleteLegendPart(part.id);
                    onUpdate();
                }
            };

            btnGroup.appendChild(renameBtn);
            btnGroup.appendChild(delBtn);
            header.appendChild(btnGroup);
            col.appendChild(header);

            const items = document.createElement('div');
            items.className = 'legend-part-items legend-drop-zone';
            items.setAttribute('data-part-id', part.id);

            (part.geometries || []).forEach(idx => {
                const geom = stateManager.geometries[idx];
                if (geom) {
                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    item.draggable = true;
                    item.setAttribute('data-geometry-index', idx);
                    item.appendChild(LegendSymbolBuilder.createSymbol(geom));
                    const name = document.createElement('span');
                    name.textContent = geom.name || 'Figuré';
                    item.appendChild(name);
                    items.appendChild(item);
                }
            });

            col.appendChild(items);
            columns.appendChild(col);
        });

        container.appendChild(columns);
    }
}
'''

        legendmanager_code = '''// LegendManager.js - Orchestrateur modulaire de la légende dynamique
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
            <div class=\"legend-header\">
                <span class=\"legend-title\">✏️ Légende</span>
                <button class=\"legend-add-part-btn\" id=\"addPartBtn\">+ Partie</button>
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
'''

        with open(os.path.join(legend_parts_dir, 'LegendSymbolBuilder.js'), 'w', encoding='utf-8') as f:
            f.write(symbol_code)
        with open(os.path.join(legend_parts_dir, 'LegendDomBuilder.js'), 'w', encoding='utf-8') as f:
            f.write(dom_builder_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(legendmanager_code)
        print(f"Modularized LegendManager for {t}")

if __name__ == '__main__':
    modularize_legend_manager()
