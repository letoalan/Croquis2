// js/modules/mapping/legend/LegendOrganizer.js

// js/modules/mapping/legend/LegendOrganizer.js

export class LegendOrganizer {
    constructor(stateManager, legendManager) {
        if (!stateManager) throw new Error("StateManager is required for LegendOrganizer initialization.");
        if (!legendManager) throw new Error("LegendManager is required for LegendOrganizer initialization.");

        this.stateManager = stateManager;
        this.legendManager = legendManager;
        this.draggedElement = null;
        this.draggedGeometryIndex = null;
        this.sourcePartId = null;

        // NOUVEAU : Support tactile
        this.isDragging = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.dragThreshold = 10; // pixels de mouvement pour déclencher le drag

        console.log("[LegendOrganizer] Initializing with touch support...");
    }

    // ==================== SETUP PRINCIPAL ====================

    setupDragAndDrop() {
        console.log("[LegendOrganizer] Setting up drag and drop with touch support...");

        // Récupérer tous les items draggables
        const legendItems = document.querySelectorAll('.legend-item[draggable="true"]');
        legendItems.forEach(item => {
            this.setupItemDrag(item);
            this.setupItemTouch(item); // NOUVEAU
        });

        // Récupérer toutes les drop zones
        const dropZones = document.querySelectorAll('.legend-drop-zone');
        dropZones.forEach(zone => {
            this.setupDropZone(zone);
            this.setupDropZoneTouch(zone); // NOUVEAU
        });

        console.log("[LegendOrganizer] Drag and drop setup complete:", legendItems.length, "items,", dropZones.length, "zones");
    }

    // ==================== DRAG SOURIS (original) ====================

    setupItemDrag(item) {
        // Drag start
        item.addEventListener('dragstart', (e) => {
            this.draggedElement = item;
            this.draggedGeometryIndex = parseInt(item.getAttribute('data-geometry-index'));

            // Trouver la partie source
            const dropZone = item.closest('.legend-drop-zone');
            if (dropZone) {
                this.sourcePartId = dropZone.getAttribute('data-part-id') || dropZone.getAttribute('data-category-id');
            }

            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);

            console.log("[LegendOrganizer] Drag started:", {
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

            console.log("[LegendOrganizer] Drag ended");
        });
    }

    // ==================== DRAG TACTILE (NOUVEAU) ====================

    setupItemTouch(item) {
        let longPressTimer = null;

        // Touch start
        item.addEventListener('touchstart', (e) => {
            // Ignorer si on touche un élément interactif
            if (this.isInteractiveElement(e.target)) {
                return;
            }

            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;

            // Long press pour activer le drag (500ms)
            longPressTimer = setTimeout(() => {
                this.startTouchDrag(item, e);
            }, 500);

            e.preventDefault();
        }, { passive: false });

        // Touch move
        item.addEventListener('touchmove', (e) => {
            // Annuler le long press si on bouge avant
            if (longPressTimer && !this.isDragging) {
                const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
                const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);

                if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }

            if (this.isDragging) {
                this.handleTouchMove(item, e);
            }
        }, { passive: false });

        // Touch end
        item.addEventListener('touchend', (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (this.isDragging) {
                this.endTouchDrag(item, e);
            }
        });

        // Touch cancel
        item.addEventListener('touchcancel', (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (this.isDragging) {
                this.cancelTouchDrag(item);
            }
        });
    }

    startTouchDrag(item, e) {
        console.log("[LegendOrganizer] Touch drag started");

        this.isDragging = true;
        this.draggedElement = item;
        this.draggedGeometryIndex = parseInt(item.getAttribute('data-geometry-index'));

        // Trouver la partie source
        const dropZone = item.closest('.legend-drop-zone');
        if (dropZone) {
            this.sourcePartId = dropZone.getAttribute('data-part-id') ||
                dropZone.getAttribute('data-subpart-id') ||
                dropZone.getAttribute('data-category-id');
        }

        item.classList.add('dragging');

        // Feedback visuel
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    handleTouchMove(item, e) {
        e.preventDefault();

        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Trouver la drop zone sous le doigt
        const elementBelow = document.elementFromPoint(touchX, touchY);
        const dropZone = elementBelow?.closest('.legend-drop-zone');

        // Nettoyer tous les drag-over
        document.querySelectorAll('.legend-drop-zone').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        // Ajouter drag-over à la zone actuelle
        if (dropZone && dropZone !== item.closest('.legend-drop-zone')) {
            dropZone.classList.add('drag-over');
        }
    }

    endTouchDrag(item, e) {
        console.log("[LegendOrganizer] Touch drag ended");

        if (!this.isDragging) return;

        const touch = e.changedTouches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Trouver la drop zone sous le doigt
        const elementBelow = document.elementFromPoint(touchX, touchY);
        const dropZone = elementBelow?.closest('.legend-drop-zone');

        if (dropZone && this.draggedGeometryIndex !== null) {
            // Gerer le drop
            const targetPartId = dropZone.getAttribute('data-subpart-id') || // Priorité aux sous-parties
                dropZone.getAttribute('data-part-id') ||
                dropZone.getAttribute('data-category-id');

            // Ne rien faire si on drop dans la même zone
            if (targetPartId !== this.sourcePartId) {
                console.log("[LegendOrganizer] Touch drop:", {
                    geometryIndex: this.draggedGeometryIndex,
                    from: this.sourcePartId,
                    to: targetPartId
                });

                // Assigner la nouvelle partie
                if (targetPartId === 'unclassified') {
                    this.stateManager.assignGeometryToPart(this.draggedGeometryIndex, null);
                } else {
                    this.stateManager.assignGeometryToPart(this.draggedGeometryIndex, targetPartId);
                }

                // Feedback vibration succès
                if (navigator.vibrate) {
                    navigator.vibrate([50, 100, 50]);
                }
            }
        }

        // Cleanup
        item.classList.remove('dragging');
        document.querySelectorAll('.legend-drop-zone').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        this.isDragging = false;
        this.draggedElement = null;
        this.draggedGeometryIndex = null;
        this.sourcePartId = null;
    }

    cancelTouchDrag(item) {
        console.log("[LegendOrganizer] Touch drag cancelled");

        item.classList.remove('dragging');
        document.querySelectorAll('.legend-drop-zone').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        this.isDragging = false;
        this.draggedElement = null;
        this.draggedGeometryIndex = null;
        this.sourcePartId = null;
    }

    // ==================== DROP ZONES (original + améliorations) ====================

    setupDropZone(zone) {
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
                const targetPartId = zone.getAttribute('data-subpart-id') ||
                    zone.getAttribute('data-part-id') ||
                    zone.getAttribute('data-category-id');

                if (targetPartId !== this.sourcePartId) {
                    if (targetPartId === 'unclassified') {
                        this.stateManager.assignGeometryToPart(this.draggedGeometryIndex, null);
                    } else {
                        this.stateManager.assignGeometryToPart(this.draggedGeometryIndex, targetPartId);
                    }
                }
            }
        });
    }

    setupDropZoneTouch(zone) {
        // Les événements touch sont déjà gérés via elementFromPoint dans handleTouchMove
        // Mais on peut ajouter un feedback visuel supplémentaire
        zone.style.transition = 'background-color 0.2s, border-color 0.2s';
    }

    // ==================== UTILITAIRES ====================

    isInteractiveElement(element) {
        const interactiveTags = ['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'];
        return interactiveTags.includes(element.tagName) ||
            element.closest('button') ||
            element.closest('input') ||
            element.closest('select');
    }

    refresh() {
        console.log("[LegendOrganizer] Refreshing drag and drop listeners...");
        this.setupDragAndDrop();
    }

    disable() {
        const legendItems = document.querySelectorAll('.legend-item[draggable="true"]');
        legendItems.forEach(item => {
            item.setAttribute('draggable', 'false');
        });
        console.log("[LegendOrganizer] Drag and drop disabled");
    }

    enable() {
        const legendItems = document.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.setAttribute('draggable', 'true');
        });
        console.log("[LegendOrganizer] Drag and drop enabled");
    }

    cancelDrag() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            document.querySelectorAll('.legend-drop-zone').forEach(zone => {
                zone.classList.remove('drag-over');
            });

            this.draggedElement = null;
            this.draggedGeometryIndex = null;
            this.sourcePartId = null;
            this.isDragging = false;

            console.log("[LegendOrganizer] Drag cancelled");
        }
    }
}
