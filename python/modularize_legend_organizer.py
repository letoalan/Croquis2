import os

def modularize_legend_organizer():
    targets = [
        'fpaysage/js/modules/mapping/legend/LegendOrganizer.js',
        'fportrait/js/modules/mapping/legend/LegendOrganizer.js',
        'fpromethean/js/modules/mapping/legend/LegendOrganizer.js'
    ]

    touch_handler_code = '''// LegendTouchDragHandler.js - Gestion du glisser-déposer tactile sur mobile/tablette

export class LegendTouchDragHandler {
    constructor(organizer) {
        this.organizer = organizer;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.dragThreshold = 10;
        this.longPressTimer = null;
    }

    setupItemTouch(item) {
        item.addEventListener('touchstart', (e) => {
            if (this.organizer.isInteractiveElement(e.target)) return;
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;

            this.longPressTimer = setTimeout(() => {
                this.startTouchDrag(item, e);
            }, 300);
        }, { passive: false });

        item.addEventListener('touchmove', (e) => {
            if (!this.organizer.isDragging) {
                const diffX = Math.abs(e.touches[0].clientX - this.touchStartX);
                const diffY = Math.abs(e.touches[0].clientY - this.touchStartY);
                if (diffX > this.dragThreshold || diffY > this.dragThreshold) {
                    clearTimeout(this.longPressTimer);
                }
            } else {
                e.preventDefault();
                this.handleTouchMove(item, e);
            }
        }, { passive: false });

        item.addEventListener('touchend', (e) => {
            clearTimeout(this.longPressTimer);
            if (this.organizer.isDragging) {
                e.preventDefault();
                this.endTouchDrag(item, e);
            }
        });

        item.addEventListener('touchcancel', () => {
            clearTimeout(this.longPressTimer);
            if (this.organizer.isDragging) this.cancelTouchDrag(item);
        });
    }

    startTouchDrag(item, e) {
        this.organizer.isDragging = true;
        this.organizer.draggedElement = item;
        this.organizer.draggedGeometryIndex = parseInt(item.getAttribute('data-geometry-index'));

        const dropZone = item.closest('.legend-drop-zone');
        if (dropZone) {
            this.organizer.sourcePartId = dropZone.getAttribute('data-part-id') || dropZone.getAttribute('data-category-id');
        }

        item.classList.add('touch-dragging');
        if (navigator.vibrate) navigator.vibrate(50);
    }

    handleTouchMove(item, e) {
        const touch = e.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropZone = targetElement ? targetElement.closest('.legend-drop-zone') : null;

        document.querySelectorAll('.legend-drop-zone').forEach(z => z.classList.remove('drag-over'));
        if (dropZone && !dropZone.contains(item)) {
            dropZone.classList.add('drag-over');
        }
    }

    endTouchDrag(item, e) {
        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropZone = targetElement ? targetElement.closest('.legend-drop-zone') : null;

        document.querySelectorAll('.legend-drop-zone').forEach(z => z.classList.remove('drag-over'));
        item.classList.remove('touch-dragging');

        if (dropZone && this.organizer.draggedGeometryIndex !== null) {
            const targetPartId = dropZone.getAttribute('data-subpart-id') ||
                dropZone.getAttribute('data-part-id') ||
                dropZone.getAttribute('data-category-id');

            if (targetPartId !== this.organizer.sourcePartId) {
                if (targetPartId === 'unclassified') {
                    this.organizer.stateManager.assignGeometryToPart(this.organizer.draggedGeometryIndex, null);
                } else {
                    this.organizer.stateManager.assignGeometryToPart(this.organizer.draggedGeometryIndex, targetPartId);
                }
            }
        }

        this.organizer.draggedElement = null;
        this.organizer.draggedGeometryIndex = null;
        this.organizer.sourcePartId = null;
        this.organizer.isDragging = false;
    }

    cancelTouchDrag(item) {
        item.classList.remove('touch-dragging');
        document.querySelectorAll('.legend-drop-zone').forEach(z => z.classList.remove('drag-over'));
        this.organizer.draggedElement = null;
        this.organizer.draggedGeometryIndex = null;
        this.organizer.sourcePartId = null;
        this.organizer.isDragging = false;
    }
}
'''

    organizer_code = '''// js/modules/mapping/legend/LegendOrganizer.js
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
        const legendItems = document.querySelectorAll('.legend-item[draggable=\"true\"]');
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
        document.querySelectorAll('.legend-item[draggable=\"true\"]').forEach(item => {
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
'''

    for t in targets:
        dirpath = os.path.dirname(t)
        touch_path = os.path.join(dirpath, 'LegendTouchDragHandler.js')
        with open(touch_path, 'w', encoding='utf-8') as f:
            f.write(touch_handler_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(organizer_code)
        print(f"Modularized {t}")

if __name__ == '__main__':
    modularize_legend_organizer()
