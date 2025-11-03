// js/modules/mapping/legend/LegendOrganizer.js

export class LegendOrganizer {
    constructor(stateManager, legendManager) {
        if (!stateManager) {
            throw new Error('StateManager is required for LegendOrganizer initialization.');
        }
        if (!legendManager) {
            throw new Error('LegendManager is required for LegendOrganizer initialization.');
        }

        this.stateManager = stateManager;
        this.legendManager = legendManager;
        this.draggedElement = null;
        this.draggedGeometryIndex = null;
        this.sourcePartId = null;

        console.log('[LegendOrganizer] Initializing LegendOrganizer...');
    }

    /**
     * ✅ Ajoute les boutons de gestion des parties et sous-parties
     */
    _createPartManagementControls(container, part, partIndex) {
        const controls = document.createElement('div');
        controls.className = 'part-management-controls';

        // ====== BOUTON : Ajouter une sous-partie ======
        const addSubPartBtn = document.createElement('button');
        addSubPartBtn.textContent = '+ Sous-partie';
        addSubPartBtn.className = 'btn btn-sm btn-info';
        addSubPartBtn.addEventListener('click', () => {
            console.log('[LegendManager] Adding sub-part to part:', part.id);
            const newSubPartCount = part.subParts?.length || 0;
            this.stateManager.addLegendSubPart(part.id, 1);
            this.updateLegend();
        });

        // ====== BOUTON : Renommer la partie ======
        const renamePartBtn = document.createElement('button');
        renamePartBtn.textContent = '✏️ Renommer';
        renamePartBtn.className = 'btn btn-sm btn-warning';
        renamePartBtn.addEventListener('click', () => {
            const newTitle = prompt('Nouveau nom pour la partie:', part.title);
            if (newTitle !== null && newTitle.trim()) {
                console.log('[LegendManager] Renaming part:', part.id, '→', newTitle);
                this.stateManager.updatePartTitle(part.id, newTitle.trim());
                this.updateLegend();
            }
        });

        // ====== BOUTON : Supprimer la partie ======
        const deletePartBtn = document.createElement('button');
        deletePartBtn.textContent = '🗑️ Supprimer';
        deletePartBtn.className = 'btn btn-sm btn-danger';
        deletePartBtn.addEventListener('click', () => {
            if (confirm(`Supprimer la partie "${part.title}" et ses contenus ?`)) {
                console.log('[LegendManager] Deleting part:', part.id);
                this.stateManager.deleteLegendPart(part.id);
                this.updateLegend();
            }
        });

        controls.appendChild(addSubPartBtn);
        controls.appendChild(renamePartBtn);
        controls.appendChild(deletePartBtn);

        return controls;
    }

    /**
     * ✅ Ajoute les contrôles de gestion des sous-parties
     */
    _createSubPartManagementControls(container, part, subPart, subPartIndex) {
        const controls = document.createElement('div');
        controls.className = 'subpart-management-controls';

        // ====== BOUTON : Renommer la sous-partie ======
        const renameSubPartBtn = document.createElement('button');
        renameSubPartBtn.textContent = '✏️ Renommer';
        renameSubPartBtn.className = 'btn btn-sm btn-warning';
        renameSubPartBtn.addEventListener('click', () => {
            const newTitle = prompt('Nouveau nom pour la sous-partie:', subPart.title);
            if (newTitle !== null && newTitle.trim()) {
                console.log('[LegendManager] Renaming sub-part:', subPart.id, '→', newTitle);
                this.stateManager.updateSubPartTitle(part.id, subPart.id, newTitle.trim());
                this.updateLegend();
            }
        });

        // ====== BOUTON : Supprimer la sous-partie ======
        const deleteSubPartBtn = document.createElement('button');
        deleteSubPartBtn.textContent = '🗑️ Supprimer';
        deleteSubPartBtn.className = 'btn btn-sm btn-danger';
        deleteSubPartBtn.addEventListener('click', () => {
            if (confirm(`Supprimer la sous-partie "${subPart.title}" et ses contenus ?`)) {
                console.log('[LegendManager] Deleting sub-part:', subPart.id);
                this.stateManager.deleteLegendSubPart(part.id, subPart.id);
                this.updateLegend();
            }
        });

        controls.appendChild(renameSubPartBtn);
        controls.appendChild(deleteSubPartBtn);

        return controls;
    }


    /**
     * ✅ Initialise tous les événements drag & drop
     */
    setupDragAndDrop() {
        console.log('[LegendOrganizer] Setting up drag and drop...');

        // Récupérer tous les items draggables
        const legendItems = document.querySelectorAll('.legend-item[draggable="true"]');
        legendItems.forEach(item => {
            this._setupItemDrag(item);
        });

        // Récupérer toutes les drop zones
        const dropZones = document.querySelectorAll('.legend-drop-zone');
        dropZones.forEach(zone => {
            this._setupDropZone(zone);
        });

        console.log('[LegendOrganizer] Drag and drop setup complete');
    }

    /**
     * ✅ Configure les événements drag pour un item
     */
    _setupItemDrag(item) {
        // Drag start
        item.addEventListener('dragstart', (e) => {
            this.draggedElement = item;
            this.draggedGeometryIndex = parseInt(item.getAttribute('data-geometry-index'));

            // Trouver la partie source
            const dropZone = item.closest('.legend-drop-zone');
            if (dropZone) {
                this.sourcePartId = dropZone.getAttribute('data-part-id') ||
                    dropZone.getAttribute('data-category-id');
            }

            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);

            console.log('[LegendOrganizer] Drag started:', {
                geometryIndex: this.draggedGeometryIndex,
                sourcePartId: this.sourcePartId
            });
        });

        // Drag end
        item.addEventListener('dragend', (e) => {
            item.classList.remove('dragging');

            // Nettoyer tous les indicateurs de drag-over
            document.querySelectorAll('.legend-drop-zone').forEach(zone => {
                zone.classList.remove('drag-over');
            });

            this.draggedElement = null;
            this.draggedGeometryIndex = null;
            this.sourcePartId = null;

            console.log('[LegendOrganizer] Drag ended');
        });
    }

    /**
     * ✅ Configure les événements drop pour une zone
     */
    _setupDropZone(zone) {
        // Drag over (survol)
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (this.draggedElement && !zone.contains(this.draggedElement)) {
                zone.classList.add('drag-over');
            }
        });

        // Drag enter
        zone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this.draggedElement && !zone.contains(this.draggedElement)) {
                zone.classList.add('drag-over');
            }
        });

        // Drag leave
        zone.addEventListener('dragleave', (e) => {
            // Vérifier qu'on quitte vraiment la zone (pas juste un enfant)
            if (e.target === zone) {
                zone.classList.remove('drag-over');
            }
        });

        // Drop
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            zone.classList.remove('drag-over');

            if (this.draggedElement && this.draggedGeometryIndex !== null) {
                // ✅ Gérer les sous-parties et les parties
                const targetPartId = zone.getAttribute('data-subpart-id') || // Priorité aux sous-parties
                                   zone.getAttribute('data-part-id') ||
                                   zone.getAttribute('data-category-id');

                // Ne rien faire si on drop dans la même zone
                if (targetPartId === this.sourcePartId) {
                    console.log('[LegendOrganizer] Dropped in same zone, no action');
                    return;
                }

                // Assigner à la nouvelle partie
                if (targetPartId === 'unclassified') {
                    // Retirer de toute partie
                    this.stateManager.assignGeometryToPart(this.draggedGeometryIndex, null);
                    console.log('[LegendOrganizer] Geometry moved to unclassified');
                } else {
                    // Assigner à une partie spécifique
                    this.stateManager.assignGeometryToPart(this.draggedGeometryIndex, targetPartId);
                    console.log('[LegendOrganizer] Geometry moved to part:', targetPartId);
                }

                // L'UI sera mise à jour via updateUI() dans StateManager
            }
        });
    }

    /**
     * ✅ Réinitialise tous les listeners (appelé après updateLegend)
     */
    refresh() {
        console.log('[LegendOrganizer] Refreshing drag and drop listeners...');
        this.setupDragAndDrop();
    }

    /**
     * ✅ Désactive temporairement le drag & drop
     */
    disable() {
        const legendItems = document.querySelectorAll('.legend-item[draggable="true"]');
        legendItems.forEach(item => {
            item.setAttribute('draggable', 'false');
        });
        console.log('[LegendOrganizer] Drag and drop disabled');
    }

    /**
     * ✅ Réactive le drag & drop
     */
    enable() {
        const legendItems = document.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.setAttribute('draggable', 'true');
        });
        console.log('[LegendOrganizer] Drag and drop enabled');
    }

    /**
     * ✅ Vérifie si un élément peut être droppé dans une zone
     */
    _canDropInZone(zone) {
        if (!this.draggedElement) return false;

        // Ne pas permettre de dropper dans la zone source
        if (zone.contains(this.draggedElement)) return false;

        return true;
    }

    /**
     * ✅ Annule le drag en cours
     */
    cancelDrag() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
        }

        document.querySelectorAll('.legend-drop-zone').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        this.draggedElement = null;
        this.draggedGeometryIndex = null;
        this.sourcePartId = null;

        console.log('[LegendOrganizer] Drag cancelled');
    }
}
