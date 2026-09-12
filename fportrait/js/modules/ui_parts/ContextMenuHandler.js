// ContextMenuHandler.js - Gestion du contenu et des actions du menu contextuel

export class ContextMenuHandler {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.stateManager = uiManager.stateManager;
    }

    setup() {
        const applyBtn = document.getElementById('contextApplyBtn') || document.getElementById('applyContextBtn');
        const closeBtn = document.getElementById('closeContextBtn') || document.getElementById('contextCloseBtn');
        const deleteBtn = document.getElementById('contextDeleteBtn') || document.getElementById('deleteContextBtn');
        const resetBtn = document.getElementById('contextResetBtn');
        const duplicateBtn = document.getElementById('contextDuplicateBtn');

        applyBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.applyContextChanges();
            const originalText = applyBtn.textContent;
            applyBtn.textContent = '✓ Validé !';
            setTimeout(() => { applyBtn.textContent = originalText; }, 1000);
        });
        closeBtn?.addEventListener('click', () => this.uiManager.closeContextMenu());
        duplicateBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = this.stateManager.selectedIndex;
            if (idx !== null) {
                if (this.stateManager.isStamping()) {
                    this.stateManager.stopStamping();
                } else {
                    this.stateManager.startStamping(idx);
                    this.uiManager.closeContextMenu();
                }
            }
        });
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = this.stateManager.selectedIndex;
            if (idx !== null && confirm('Supprimer ce figuré et toutes ses copies ?')) {
                this.stateManager.deleteGeometry(idx);
                this.uiManager.closeContextMenu();
            }
        });
        resetBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = this.stateManager.selectedIndex;
            if (idx !== null && this.stateManager.geometries[idx]) {
                this.populateForGeometry(this.stateManager.geometries[idx]);
            }
        });

        // Mise à jour visuelle dynamique des sliders
        document.getElementById('contextOpacitySlider')?.addEventListener('input', (e) => {
            const valEl = document.getElementById('contextOpacityValue');
            if (valEl) valEl.textContent = parseFloat(e.target.value).toFixed(1);
        });
        document.getElementById('contextLineWeight')?.addEventListener('input', (e) => {
            const valEl = document.getElementById('contextLineWeightValue');
            if (valEl) valEl.textContent = e.target.value;
        });
        document.getElementById('contextMarkerSize')?.addEventListener('input', (e) => {
            const valEl = document.getElementById('contextMarkerSizeValue');
            if (valEl) valEl.textContent = e.target.value;
        });
    }

    applyContextChanges() {
        const idx = this.stateManager.selectedIndex;
        if (idx === null) return;

        const colorInput = document.getElementById('contextColorPicker') || document.getElementById('contextColor');
        const lineColorInput = document.getElementById('contextLineColorPicker') || document.getElementById('contextLineColor');
        const opacityInput = document.getElementById('contextOpacitySlider') || document.getElementById('contextOpacity');
        const lineDashInput = document.getElementById('contextLineDash');
        const lineWeightInput = document.getElementById('contextLineWeight');
        const markerSizeInput = document.getElementById('contextMarkerSize');

        const color = colorInput?.value || '#3388ff';
        const lineColor = lineColorInput?.value || '#000000';
        const opacity = parseFloat(opacityInput?.value || 1);
        const lineDash = lineDashInput?.value || 'solid';
        const lineWeight = parseInt(lineWeightInput?.value || 2, 10);
        const markerSize = parseInt(markerSizeInput?.value || 24, 10);

        this.stateManager.applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize);
        this.uiManager.closeContextMenu();
    }

    populateForGeometry(geometry) {
        if (!geometry) return;
        const colorInput = document.getElementById('contextColorPicker') || document.getElementById('contextColor');
        const lineColorInput = document.getElementById('contextLineColorPicker') || document.getElementById('contextLineColor');
        const opacityInput = document.getElementById('contextOpacitySlider') || document.getElementById('contextOpacity');
        const opacityVal = document.getElementById('contextOpacityValue');
        const lineDashInput = document.getElementById('contextLineDash');
        const lineWeightInput = document.getElementById('contextLineWeight');
        const lineWeightVal = document.getElementById('contextLineWeightValue');
        const markerSizeInput = document.getElementById('contextMarkerSize');
        const markerSizeVal = document.getElementById('contextMarkerSizeValue');
        const markerContainer = document.getElementById('contextMarkerSizeContainer');
        const duplicateBtn = document.getElementById('contextDuplicateBtn');

        if (colorInput && geometry.color) colorInput.value = geometry.color;
        if (lineColorInput && geometry.lineColor) lineColorInput.value = geometry.lineColor;
        if (opacityInput && geometry.opacity !== undefined) {
            opacityInput.value = geometry.opacity;
            if (opacityVal) opacityVal.textContent = parseFloat(geometry.opacity).toFixed(1);
        }
        if (lineDashInput && geometry.lineDash) lineDashInput.value = geometry.lineDash;
        if (lineWeightInput && geometry.lineWeight) {
            lineWeightInput.value = geometry.lineWeight;
            if (lineWeightVal) lineWeightVal.textContent = geometry.lineWeight;
        }

        const isMarker = geometry.type?.startsWith('Marker') || geometry.layer?._markerType;
        if (markerContainer) {
            markerContainer.style.display = isMarker ? 'block' : 'none';
            if (isMarker && markerSizeInput) {
                markerSizeInput.value = geometry.markerSize || 24;
                if (markerSizeVal) markerSizeVal.textContent = geometry.markerSize || 24;
            }
        }

        if (duplicateBtn) {
            const isStamping = this.stateManager.isStamping();
            duplicateBtn.textContent = isStamping ? '🛑 Arrêter le tampon' : '📋 Tamponner sur la carte';
            duplicateBtn.classList.toggle('stamp-active', isStamping);
        }
    }
}
