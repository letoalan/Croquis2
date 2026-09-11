// PalettePreviewRenderer.js - Rendu des figurés visuels dans le panneau de stockage

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
            preview.innerHTML = `<svg width="20" height="20"><polygon points="2,2 18,6 16,18 4,14" fill="${color}" stroke="${lineColor}" stroke-width="1.5"/></svg>`;
        } else if (geometry.type === 'Circle' || geometry.type === 'CircleMarker') {
            preview.innerHTML = `<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="${color}" stroke="${lineColor}" stroke-width="1.5"/></svg>`;
        } else if (geometry.type === 'Polyline') {
            preview.innerHTML = `<svg width="20" height="20"><line x1="2" y1="18" x2="18" y2="2" stroke="${color}" stroke-width="2.5"/></svg>`;
        } else {
            preview.innerHTML = `<svg width="20" height="20"><circle cx="10" cy="10" r="6" fill="${color}" stroke="${lineColor}" stroke-width="1.5"/></svg>`;
        }

        item.appendChild(preview);
        const label = document.createElement('span');
        label.className = 'symbol-label';
        label.textContent = geometry.name || 'Figuré';
        item.appendChild(label);
        return item;
    }
}
