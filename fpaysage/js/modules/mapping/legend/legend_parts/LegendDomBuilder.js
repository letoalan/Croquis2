// LegendDomBuilder.js - Construction DOM des colonnes, parties, sous-parties et figurés

import { LegendSymbolBuilder } from './LegendSymbolBuilder.js';

export class LegendDomBuilder {

    static _buildGeomItem(geom, geomIndex) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.draggable = true;
        item.setAttribute('data-geometry-index', geomIndex);
        item.appendChild(LegendSymbolBuilder.createSymbol(geom));
        const name = document.createElement('span');
        name.className = 'legend-item-name';
        name.textContent = geom.name || 'Figuré';
        item.appendChild(name);
        return item;
    }

    static _buildSubPart(sub, stateManager, onUpdate) {
        const wrap = document.createElement('div');
        wrap.className = 'legend-subpart';

        const hdr = document.createElement('div');
        hdr.className = 'legend-subpart-header';

        const title = document.createElement('span');
        title.className = 'legend-subpart-title';
        title.textContent = sub.title || 'Sous-partie';
        hdr.appendChild(title);

        const controls = document.createElement('div');
        controls.className = 'part-management-controls';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn btn-sm btn-warning';
        renameBtn.textContent = '✏️';
        renameBtn.onclick = () => {
            const name = prompt('Nouveau nom:', sub.title);
            if (name?.trim()) {
                stateManager.updateSubPartTitle(sub.id, name.trim());
                onUpdate();
            }
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-danger';
        delBtn.textContent = '🗑️';
        delBtn.onclick = () => {
            if (confirm(`Supprimer la sous-partie "${sub.title}" ?`)) {
                stateManager.deleteLegendSubPart(sub.id);
                onUpdate();
            }
        };

        controls.appendChild(renameBtn);
        controls.appendChild(delBtn);
        hdr.appendChild(controls);
        wrap.appendChild(hdr);

        const items = document.createElement('div');
        items.className = 'legend-subpart-items legend-drop-zone';
        items.setAttribute('data-subpart-id', sub.id);

        (sub.geometries || []).forEach(idx => {
            const geom = stateManager.geometries[idx];
            if (geom) items.appendChild(LegendDomBuilder._buildGeomItem(geom, idx));
        });

        wrap.appendChild(items);
        return wrap;
    }

    static renderColumns(container, stateManager, onUpdate) {
        const columns = document.createElement('div');
        columns.className = 'legend-columns';

        (stateManager.legendParts || []).forEach((part, partIndex) => {
            const col = document.createElement('div');
            col.className = 'legend-part-column';
            col.setAttribute('data-part-id', part.id);

            // En-tête de partie
            const header = document.createElement('div');
            header.className = 'legend-part-header';
            header.innerHTML = `<span class="legend-part-title">${part.title || `Partie ${partIndex + 1}`}</span>`;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'part-management-controls';

            const addSubBtn = document.createElement('button');
            addSubBtn.className = 'btn btn-sm btn-info';
            addSubBtn.textContent = '+ Sous-partie';
            addSubBtn.onclick = () => {
                const name = prompt('Nom de la sous-partie:');
                if (name?.trim()) {
                    stateManager.addLegendSubPart(part.id, name.trim());
                    onUpdate();
                }
            };

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

            btnGroup.appendChild(addSubBtn);
            btnGroup.appendChild(renameBtn);
            btnGroup.appendChild(delBtn);
            header.appendChild(btnGroup);
            col.appendChild(header);

            const hasSubParts = (part.subParts || []).length > 0;

            // Zone de figurés directs : désactivée si la partie a des sous-parties
            const items = document.createElement('div');
            if (hasSubParts) {
                // Non droppable : les figurés sont redirigés vers les sous-parties
                items.className = 'legend-part-items legend-part-locked';
                const hint = document.createElement('div');
                hint.className = 'legend-locked-hint';
                hint.textContent = '↕ Glissez les figurés dans une sous-partie';
                items.appendChild(hint);
            } else {
                items.className = 'legend-part-items legend-drop-zone';
                items.setAttribute('data-part-id', part.id);
                (part.geometries || []).forEach(idx => {
                    const geom = stateManager.geometries[idx];
                    if (geom) items.appendChild(LegendDomBuilder._buildGeomItem(geom, idx));
                });
            }

            col.appendChild(items);

            // Sous-parties
            (part.subParts || []).forEach(sub => {
                col.appendChild(LegendDomBuilder._buildSubPart(sub, stateManager, onUpdate));
            });

            columns.appendChild(col);
        });

        container.appendChild(columns);

        // Section Non classés
        const unclassifiedSection = document.createElement('div');
        unclassifiedSection.className = 'legend-unclassified-section';

        const unclassifiedHeader = document.createElement('div');
        unclassifiedHeader.className = 'legend-unclassified-header';
        unclassifiedHeader.innerHTML = '<span class="legend-folder-icon">📁</span> Non classés';
        unclassifiedSection.appendChild(unclassifiedHeader);

        const unclassifiedContainer = document.createElement('div');
        unclassifiedContainer.className = 'legend-unclassified-items legend-drop-zone';
        unclassifiedContainer.setAttribute('data-part-id', 'unclassified');
        unclassifiedContainer.setAttribute('data-drop-zone', 'true');

        const unclassifiedGeometries = (stateManager.geometries || []).filter((_, index) => {
            return !stateManager.geometryToPart?.has(index);
        });

        if (unclassifiedGeometries.length > 0) {
            unclassifiedGeometries.forEach((geometry) => {
                const geomIndex = stateManager.geometries.indexOf(geometry);
                unclassifiedContainer.appendChild(LegendDomBuilder._buildGeomItem(geometry, geomIndex));
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'legend-empty-message';
            emptyMsg.textContent = '📍 Aucun figuré non classé';
            unclassifiedContainer.appendChild(emptyMsg);
        }

        unclassifiedSection.appendChild(unclassifiedContainer);
        container.appendChild(unclassifiedSection);
    }
}
