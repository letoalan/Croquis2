// UIManager.js
export class UIManager {
    constructor(stateManager) {
        if (!stateManager) {
            throw new Error('StateManager is required for UIManager initialization.');
        }
        this.stateManager = stateManager;
    }

    /**
     * Initialise l'interface utilisateur.
     */
    initUI() {
        // Gestionnaire pour le sélecteur de fond de carte
        const tileSelector = document.getElementById('tileSelector');
        if (tileSelector) {
            tileSelector.addEventListener('change', (e) => {
                const selectedTile = e.target.value;
                this.stateManager.mapManager.setTileLayer(selectedTile);
            });
        }

        // Gestionnaire pour le bouton "Enregistrer" du titre de la carte
        const saveMapTitleBtn = document.getElementById('saveMapTitleBtn');
        if (saveMapTitleBtn) {
            saveMapTitleBtn.addEventListener('click', () => {
                const mapTitleInput = document.getElementById('mapTitleInput');
                if (mapTitleInput) {
                    const newTitle = mapTitleInput.value;
                    this.stateManager.setMapTitle(newTitle); // Mettre à jour le titre dans le StateManager
                    const mapTitleDisplay = document.getElementById('mapTitleDisplay');
                    if (mapTitleDisplay) {
                        mapTitleDisplay.textContent = newTitle; // Afficher le nouveau titre
                    }
                }
            });
        }

        // Gestionnaire pour le bouton "Appliquer" du menu contextuel
        const contextApplyBtn = document.getElementById('contextApplyBtn');
        if (contextApplyBtn) {
            contextApplyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = document.getElementById('contextColorPicker').value;
                const lineColor = document.getElementById('contextLineColorPicker').value;
                const opacity = parseFloat(document.getElementById('contextOpacitySlider').value);
                const lineDash = document.getElementById('contextLineDash').value;
                const lineWeight = parseInt(document.getElementById('contextLineWeight').value);
                const markerSize = parseInt(document.getElementById('contextMarkerSize').value);

                // Appeler la méthode applyStyle du StateManager
                this.stateManager.applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize);

                this.closeContextMenu(); // Fermer le menu contextuel après application
            });
        }

        // Gestionnaire pour le bouton "Annuler" du menu contextuel
        const contextCancelBtn = document.getElementById('contextCancelBtn');
        if (contextCancelBtn) {
            contextCancelBtn.addEventListener('click', () => {
                this.closeContextMenu(); // Fermer le menu contextuel sans appliquer les modifications
            });
        }

        // Fermer le menu contextuel en cliquant à l'extérieur
        document.addEventListener('click', (event) => {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && !contextMenu.contains(event.target)) {
                this.closeContextMenu(); // Fermer le menu contextuel
            }
        });

        // Gestionnaire pour l'icône de retrait/développement du titre
        const toggleTitleIcon = document.getElementById('toggleTitleIcon');
        if (toggleTitleIcon) {
            toggleTitleIcon.addEventListener('click', () => {
                const mapTitleContainer = document.getElementById('map-title-container');
                if (mapTitleContainer) {
                    mapTitleContainer.classList.toggle('collapsed');
                    mapTitleContainer.classList.toggle('expanded');
                    toggleTitleIcon.classList.toggle('bi-chevron-up');
                    toggleTitleIcon.classList.toggle('bi-chevron-down');
                }
            });
        }
    }

    /**
     * Ouvre le menu contextuel pour une géométrie.
     * @param {number} index - L'index de la géométrie.
     * @param {Event} event - L'événement de clic.
     */
    openContextMenu(index, event) {
        console.log('[UIManager] Opening context menu for geometry at index:', index);
        if (index < 0 || index >= this.stateManager.geometries.length) {
            console.error('[UIManager] Invalid index in openContextMenu:', index);
            return;
        }

        this.stateManager.selectedIndex = index;
        const geometry = this.stateManager.geometries[index];

        // Remplir les champs du menu contextuel avec les valeurs actuelles de la géométrie
        const colorPicker = document.getElementById('contextColorPicker');
        const lineColorPicker = document.getElementById('contextLineColorPicker');
        const opacitySlider = document.getElementById('contextOpacitySlider');
        const lineDashSelect = document.getElementById('contextLineDash');
        const lineWeightSlider = document.getElementById('contextLineWeight');
        const markerSizeSlider = document.getElementById('contextMarkerSize');

        if (!colorPicker || !lineColorPicker || !opacitySlider || !lineDashSelect || !lineWeightSlider || !markerSizeSlider) {
            console.error('[UIManager] Context menu elements not found in the DOM.');
            return;
        }

        colorPicker.value = geometry.color || "#007bff";
        lineColorPicker.value = geometry.lineColor || "#000000";
        opacitySlider.value = geometry.opacity || 1;
        lineDashSelect.value = geometry.lineDash || "solid";
        lineWeightSlider.value = geometry.lineWeight || 2;
        markerSizeSlider.value = geometry.markerSize || 24;

        // Désactiver les champs si nécessaire
        if (geometry.type !== 'CustomMarker') {
            markerSizeSlider.disabled = true;
            markerSizeSlider.title = "La taille ne peut pas être modifiée pour ce type de géométrie.";
        } else {
            markerSizeSlider.disabled = false;
            markerSizeSlider.title = "";
        }

        // Afficher le menu contextuel
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.top = `${event.clientY}px`;
        } else {
            console.error('[UIManager] Context menu not found in the DOM.');
        }
    }

    /**
     * Ferme le menu contextuel.
     */
    closeContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }

        // Terminer l'édition de la géométrie
        const selectedIndex = this.stateManager.selectedIndex;
        if (selectedIndex !== null) {
            this.stateManager.finishEditingGeometry(selectedIndex);
            this.stateManager.selectedIndex = null; // Réinitialiser l'index sélectionné
        }
    }
}