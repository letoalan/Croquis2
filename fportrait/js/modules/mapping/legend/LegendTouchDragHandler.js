// LegendTouchDragHandler.js - Gestion du glisser-déposer tactile sur mobile/tablette

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
