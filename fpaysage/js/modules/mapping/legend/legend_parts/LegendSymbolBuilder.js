// LegendSymbolBuilder.js - Rendu visuel et icônes pour les figurés de légende

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
            symbol.innerHTML = `<svg width="20" height="20"><rect x="2" y="2" width="16" height="16" fill="${color}" stroke="${lineColor}" stroke-width="2" fill-opacity="${geometry.opacity || 0.7}"/></svg>`;
        } else if (geometry.type === 'Circle' || geometry.type === 'CircleMarker') {
            symbol.innerHTML = `<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="${color}" stroke="${lineColor}" stroke-width="2" fill-opacity="${geometry.opacity || 0.7}"/></svg>`;
        } else if (geometry.type === 'Polyline') {
            symbol.innerHTML = `<svg width="20" height="20"><line x1="2" y1="18" x2="18" y2="2" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`;
        } else {
            symbol.innerHTML = `<svg width="20" height="20"><circle cx="10" cy="10" r="6" fill="${color}" stroke="${lineColor}" stroke-width="2"/></svg>`;
        }
        return symbol;
    }
}
