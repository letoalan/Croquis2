// PalettePreviewRenderer.js - Rendu des figurés visuels dans le panneau de stockage

import { LegendSymbolBuilder } from '../../mapping/legend/legend_parts/LegendSymbolBuilder.js';

export class PalettePreviewRenderer {
    static createSymbolElement(geometry, symbolId) {
        const item = document.createElement('div');
        item.className = 'storage-symbol-item';
        item.draggable = true;
        item.setAttribute('data-symbol-id', symbolId);
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '6px';
        item.style.padding = '3px 6px';
        item.style.cursor = 'grab';
        item.style.borderRadius = '4px';
        item.style.marginBottom = '3px';
        item.style.userSelect = 'none';

        // Réutilise LegendSymbolBuilder pour un rendu cohérent (marqueurs, formes, lignes)
        const preview = LegendSymbolBuilder.createSymbol(geometry);
        item.appendChild(preview);

        const label = document.createElement('span');
        label.className = 'symbol-label';
        label.style.fontSize = '12px';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.whiteSpace = 'nowrap';
        label.textContent = geometry.name || 'Figuré';
        item.appendChild(label);

        return item;
    }
}
