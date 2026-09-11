// js/modules/ContextMenuDragger.js
import { ContextMenuPositionManager } from './ContextMenuPositionManager.js';

export class ContextMenuDragger {
    constructor() {
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.initialLeft = 0;
        this.initialTop = 0;
        this.contextMenu = null;
        this.contextMenuHeader = null;
        this.init();
    }

    init() {
        this.contextMenu = document.getElementById('contextMenu');
        this.contextMenuHeader = document.getElementById('contextMenuHeader');
        if (!this.contextMenu || !this.contextMenuHeader) return;

        this.addDragHandle();
        this.setupEventListeners();
        this.loadPosition();
    }

    addDragHandle() {
        if (this.contextMenuHeader.querySelector('.drag-handle')) return;
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⠿';
        dragHandle.title = 'Déplacer le menu';
        this.contextMenuHeader.insertBefore(dragHandle, this.contextMenuHeader.firstChild);
    }

    setupEventListeners() {
        this.contextMenuHeader.addEventListener('mousedown', this.handleDragStart.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));

        this.contextMenuHeader.addEventListener('touchstart', this.handleDragStart.bind(this));
        document.addEventListener('touchmove', this.handleDrag.bind(this));
        document.addEventListener('touchend', this.handleDragEnd.bind(this));
        this.contextMenuHeader.addEventListener('selectstart', (e) => e.preventDefault());
    }

    handleDragStart(e) {
        if (this.isInteractiveElement(e.target)) return;
        if (!e.target.closest('.context-menu-header')) return;

        this.isDragging = true;
        this.contextMenu.classList.add('dragging');
        const rect = this.contextMenu.getBoundingClientRect();
        this.initialLeft = rect.left;
        this.initialTop = rect.top;

        const isTouch = e.type === 'touchstart';
        this.startX = isTouch ? e.touches[0].clientX : e.clientX;
        this.startY = isTouch ? e.touches[0].clientY : e.clientY;

        this.contextMenu.style.transition = 'none';
        this.contextMenu.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        e.stopPropagation();

        const isTouch = e.type === 'touchmove';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        const newLeft = this.initialLeft + (clientX - this.startX);
        const newTop = this.initialTop + (clientY - this.startY);

        this.contextMenu.style.left = `${newLeft}px`;
        this.contextMenu.style.top = `${newTop}px`;
        this.contextMenu.style.transform = 'none';
    }

    handleDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.contextMenu.classList.remove('dragging');
        this.contextMenu.style.cursor = '';
        this.contextMenu.style.transition = '';
        this.savePosition();
    }

    isInteractiveElement(element) {
        const interactive = ['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'];
        return interactive.includes(element.tagName) || element.closest('button') || element.closest('input');
    }

    savePosition() {
        ContextMenuPositionManager.savePosition(this.contextMenu.getBoundingClientRect());
    }

    loadPosition() {
        const pos = ContextMenuPositionManager.loadSavedPosition();
        if (pos) {
            this.contextMenu.style.left = `${pos.left}px`;
            this.contextMenu.style.top = `${pos.top}px`;
            this.contextMenu.style.transform = 'none';
        } else {
            this.setDefaultPosition();
        }
    }

    setDefaultPosition() {
        const def = ContextMenuPositionManager.getDefaultPosition();
        this.contextMenu.style.left = `${def.left}px`;
        this.contextMenu.style.top = `${def.top}px`;
        this.contextMenu.style.transform = 'translateY(-50%)';
    }

    resetPosition() {
        this.setDefaultPosition();
        localStorage.removeItem('contextMenuPosition');
    }

    addResetButton() {
        const footer = document.querySelector('.context-menu-footer');
        if (!footer || footer.querySelector('.btn-context-reset')) return;
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'btn btn-context-reset';
        resetBtn.innerHTML = '🔄 Position par défaut';
        resetBtn.onclick = (e) => {
            e.preventDefault();
            this.resetPosition();
        };
        footer.appendChild(resetBtn);
    }

    onMenuShow() {
        this.ensureVisibility();
    }

    onMenuHide() {
        if (this.isDragging) this.handleDragEnd();
    }

    ensureVisibility() {
        ContextMenuPositionManager.ensureWithinViewport(this.contextMenu);
    }
}
