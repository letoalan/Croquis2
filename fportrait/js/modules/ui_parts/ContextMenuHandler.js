// ContextMenuHandler.js - Gestion du contenu et des actions du menu contextuel

export class ContextMenuHandler {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.stateManager = uiManager.stateManager;
    }

    setup() {
        const applyBtn = document.getElementById('applyContextBtn');
        const closeBtn = document.getElementById('closeContextBtn');
        const deleteBtn = document.getElementById('deleteContextBtn');

        applyBtn?.addEventListener('click', () => this.applyContextChanges());
        closeBtn?.addEventListener('click', () => this.uiManager.closeContextMenu());
        deleteBtn?.addEventListener('click', () => {
            const idx = this.stateManager.selectedIndex;
            if (idx !== null && confirm('Supprimer cet élément ?')) {
                this.stateManager.deleteGeometry(idx);
                this.uiManager.closeContextMenu();
            }
        });
    }

    applyContextChanges() {
        const idx = this.stateManager.selectedIndex;
        if (idx === null) return;

        const color = document.getElementById('contextColor')?.value;
        const lineColor = document.getElementById('contextLineColor')?.value;
        const opacity = parseFloat(document.getElementById('contextOpacity')?.value || 1);
        const lineDash = document.getElementById('contextLineDash')?.value;
        const lineWeight = parseInt(document.getElementById('contextLineWeight')?.value || 2, 10);
        const markerSize = parseInt(document.getElementById('contextMarkerSize')?.value || 24, 10);

        this.stateManager.applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize);
        this.uiManager.closeContextMenu();
    }

    populateForGeometry(geometry) {
        if (!geometry) return;
        const colorInput = document.getElementById('contextColor');
        const lineColorInput = document.getElementById('contextLineColor');
        const opacityInput = document.getElementById('contextOpacity');
        const lineDashInput = document.getElementById('contextLineDash');
        const lineWeightInput = document.getElementById('contextLineWeight');
        const markerSizeInput = document.getElementById('contextMarkerSize');

        if (colorInput && geometry.color) colorInput.value = geometry.color;
        if (lineColorInput && geometry.lineColor) lineColorInput.value = geometry.lineColor;
        if (opacityInput && geometry.opacity !== undefined) opacityInput.value = geometry.opacity;
        if (lineDashInput && geometry.lineDash) lineDashInput.value = geometry.lineDash;
        if (lineWeightInput && geometry.lineWeight !== undefined) lineWeightInput.value = geometry.lineWeight;
        if (markerSizeInput && geometry.markerSize !== undefined) markerSizeInput.value = geometry.markerSize;
    }
}
