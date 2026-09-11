// js/modules/mapping/legend/LegendOrganizer.js
import { LegendTouchDragHandler } from './LegendTouchDragHandler.js';

export class LegendOrganizer {
    constructor(stateManager, legendManager) {
        if (!stateManager) throw new Error("StateManager is required for LegendOrganizer initialization.");
        if (!legendManager) throw new Error("LegendManager is required for LegendOrganizer initialization.");

        this.stateManager = stateManager;
        this.legendManager = legendManager;
        this.draggedElement = null;
        this.draggedGeometryIndex = null;
        this.sourcePartId = null;
        this.isDragging = false;
        this.touchHandler = new LegendTouchDragHandler(this);
    }

    setupDragAndDrop() {
        const legendItems = document.querySelectorAll('.legend-item[draggable="true"]');
        legendItems.forEach(item => {
            this.setupItemDrag(item);
            this.touchHandler.setupItemTouch(item);
        });

        const dropZones = document.querySelectorAll('.legend-drop-zone');
        dropZones.forEach(zone => {
            this.setupDropZone(zone);
        });
    }

    setupItemDrag(item) {
        item.addEventListener('dragstart', (e) => {
            this.draggedElement = item;
            this.draggedGeometryIndex = parseInt(item.getAttribute('data-geometry-index'));
            const dropZone = item.closest('.legend-drop-zone');
            if (dropZone) {
                this.sourcePartId = dropZone.getAttribute('data-part-id') || dropZone.getAttribute('data-category-id');
            }
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.legend-drop-zone').forEach(zone => {
                zone.classList.remove('drag-over');
            });
            this.draggedElement = null;
            this.draggedGeometryIndex = null;
            this.sourcePartId = null;
        });
    }

    setupDropZone(zone) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        zone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this.draggedElement && !zone.contains(this.draggedElement)) {
                zone.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', (e) => {
            if (e.target === zone) zone.classList.remove('drag-over');
        });

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

    isInteractiveElement(element) {
        const tags = ['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'];
        return tags.includes(element.tagName) || element.closest('button') || element.closest('input') || element.closest('select');
    }

    refresh() {
        this.setupDragAndDrop();
    }

    disable() {
        document.querySelectorAll('.legend-item[draggable="true"]').forEach(item => {
            item.setAttribute('draggable', 'false');
        });
    }

    enable() {
        document.querySelectorAll('.legend-item').forEach(item => {
            item.setAttribute('draggable', 'true');
        });
    }

    cancelDrag() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            document.querySelectorAll('.legend-drop-zone').forEach(z => z.classList.remove('drag-over'));
            this.draggedElement = null;
            this.draggedGeometryIndex = null;
            this.sourcePartId = null;
            this.isDragging = false;
        }
    }
}
