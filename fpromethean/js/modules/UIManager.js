// js/modules/UIManager.js
import { ContextMenuDragger } from './ContextMenuDragger.js';
import { ContextMenuHandler } from './ui_parts/ContextMenuHandler.js';
import { UIActionsHandler } from './ui_parts/UIActionsHandler.js';

export class UIManager {
    constructor(stateManager) {
        if (!stateManager) throw new Error('StateManager is required for UIManager initialization.');
        this.stateManager = stateManager;
        this.contextMenuDragger = null;
        this.contextMenuHandler = new ContextMenuHandler(this);
        this.actionsHandler = new UIActionsHandler(this);
    }

    initUI() {
        console.log('[UIManager] Initializing modular UI...');
        this.initContextMenuDrag();
        this.contextMenuHandler.setup();
        this.actionsHandler.setup();
        this._setupClickOutside();
    }

    initContextMenuDrag() {
        this.contextMenuDragger = new ContextMenuDragger();
    }

    _setupClickOutside() {
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('contextMenu');
            if (!menu || menu.style.display === 'none') return;
            if (!menu.contains(e.target) && !e.target.closest('.list-item') && !e.target.closest('.legend-item')) {
                this.closeContextMenu();
            }
        });
    }

    populateContextMenuForGeometry(geometry) {
        this.contextMenuHandler.populateForGeometry(geometry);
    }

    closeContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) menu.style.display = 'none';
        this.contextMenuDragger?.onMenuHide();
    }

    async exportPdf() {
        const exporter = this.stateManager.mapManager?.pdfExporter;
        if (exporter) {
            await exporter.exportPDF();
        } else {
            console.warn('[UIManager] PDFExporter non disponible');
        }
    }
}
