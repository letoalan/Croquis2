// LegendDomBuilder.js - Construction DOM des colonnes, parties et figurés

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
            header.innerHTML = `<span class="legend-part-title">${part.title || `Partie ${partIndex + 1}`}</span>`;

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
                if (confirm(`Supprimer "${part.title}" ?`)) {
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
