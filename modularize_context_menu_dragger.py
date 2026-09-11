import os

def modularize_context_menu_dragger():
    targets = [
        'fpaysage/js/modules/ContextMenuDragger.js',
        'fportrait/js/modules/ContextMenuDragger.js',
        'fpromethean/js/modules/ContextMenuDragger.js'
    ]

    position_manager_code = '''// ContextMenuPositionManager.js - Gestion du stockage et ajustement de position

export class ContextMenuPositionManager {
    static savePosition(rect) {
        const position = {
            left: rect.left,
            top: rect.top,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };
        try {
            localStorage.setItem('contextMenuPosition', JSON.stringify(position));
        } catch (e) {
            console.error('[ContextMenuPositionManager] Failed to save position:', e);
        }
    }

    static loadSavedPosition() {
        try {
            const saved = localStorage.getItem('contextMenuPosition');
            if (!saved) return null;
            const position = JSON.parse(saved);
            const isValid = position.left >= 0 &&
                position.left <= window.innerWidth &&
                position.top >= 0 &&
                position.top <= window.innerHeight;
            return isValid ? position : null;
        } catch {
            return null;
        }
    }

    static getDefaultPosition() {
        const sidebarWidth = 320;
        const margin = 50;
        return {
            left: sidebarWidth + margin,
            top: window.innerHeight / 2
        };
    }

    static ensureWithinViewport(menuElement) {
        const rect = menuElement.getBoundingClientRect();
        let newLeft = parseFloat(menuElement.style.left) || 0;
        let newTop = parseFloat(menuElement.style.top) || 0;
        let adjusted = false;

        if (rect.left < 10) {
            newLeft = 10;
            adjusted = true;
        } else if (rect.right > window.innerWidth - 10) {
            newLeft = window.innerWidth - rect.width - 10;
            adjusted = true;
        }

        if (rect.top < 10) {
            newTop = 10;
            adjusted = true;
        } else if (rect.bottom > window.innerHeight - 10) {
            newTop = window.innerHeight - rect.height - 10;
            adjusted = true;
        }

        if (adjusted) {
            menuElement.style.left = `${newLeft}px`;
            menuElement.style.top = `${newTop}px`;
            menuElement.style.transform = 'none';
        }
    }
}
'''

    dragger_code = '''// js/modules/ContextMenuDragger.js
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
'''

    for t in targets:
        dirpath = os.path.dirname(t)
        pos_path = os.path.join(dirpath, 'ContextMenuPositionManager.js')
        with open(pos_path, 'w', encoding='utf-8') as f:
            f.write(position_manager_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(dragger_code)
        print(f"Modularized {t}")

if __name__ == '__main__':
    modularize_context_menu_dragger()
