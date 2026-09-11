// PaletteDropZones.js - Gestion des drop zones synchronisées avec l'éditeur de texte

export class PaletteDropZones {
    static init(container, onDrop, onDragOver, onDragLeave) {
        if (!container) return [];
        container.innerHTML = '';
        const zones = [];
        for (let i = 0; i < 15; i++) {
            const zone = document.createElement('div');
            zone.className = 'symbol-drop-zone';
            zone.setAttribute('data-zone-id', i);
            zone.style.height = '36px';
            zone.style.minHeight = '36px';
            zone.addEventListener('dragover', onDragOver);
            zone.addEventListener('drop', onDrop);
            zone.addEventListener('dragleave', onDragLeave);
            container.appendChild(zone);
            zones.push(zone);
        }
        return zones;
    }
}
