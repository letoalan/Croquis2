// js/modules/UIManager.js - Orchestrateur UI Mode Portrait Mobile (Option B)
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
        this.activeSheetId = null;
    }

    initUI() {
        console.log('[UIManager] Initializing modular UI...');
        this.initContextMenuDrag();
        this.contextMenuHandler.setup();
        this.actionsHandler.setup();
        this._setupClickOutside();
        this._setupBottomNav();
        this._setupSheetCloseButtons();
        this._setupTileGrid();
        this._setupFab();
    }

    initContextMenuDrag() {
        this.contextMenuDragger = new ContextMenuDragger();
    }

    _setupBottomNav() {
        const navButtons = document.querySelectorAll('#bottom-nav .nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.getAttribute('data-panel');
                this.setActiveNav(panel);
            });
        });
    }

    setActiveNav(panel) {
        const navButtons = document.querySelectorAll('#bottom-nav .nav-item');
        navButtons.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-panel') === panel);
        });

        if (panel === 'editor') {
            this.closeAllSheets();
            const modal = document.getElementById('modal-editor');
            if (modal) {
                if (typeof modal.showModal === 'function') modal.showModal();
                else modal.setAttribute('open', 'true');
            }
            return;
        }

        const panelSheetMap = {
            map: 'sheet-map',
            draw: 'sheet-draw',
            legend: 'sheet-legend',
            save: 'sheet-save'
        };

        const targetSheetId = panelSheetMap[panel];
        if (targetSheetId) {
            const targetSheet = document.getElementById(targetSheetId);
            const isCurrentlyOpen = targetSheet && targetSheet.getAttribute('aria-hidden') === 'false';
            if (isCurrentlyOpen) {
                this.closeAllSheets();
            } else {
                this.openSheet(targetSheetId);
            }
        } else {
            this.closeAllSheets();
        }
    }

    openSheet(sheetId) {
        this.closeAllSheets();
        const sheet = document.getElementById(sheetId);
        if (sheet) {
            sheet.setAttribute('aria-hidden', 'false');
            this.activeSheetId = sheetId;
            if (sheetId === 'sheet-legend') {
                this.stateManager.legendManager?.updateLegend?.();
            }
            if (sheetId === 'sheet-map') {
                this.refreshTileGridActive();
            }
        }
    }

    closeAllSheets() {
        document.querySelectorAll('.bottom-sheet').forEach(sheet => {
            sheet.setAttribute('aria-hidden', 'true');
        });
        this.activeSheetId = null;
        this.updateFabState();
    }

    _setupSheetCloseButtons() {
        document.querySelectorAll('.bottom-sheet .sheet-close, .bottom-sheet .btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sheet = btn.closest('.bottom-sheet');
                if (sheet) {
                    sheet.setAttribute('aria-hidden', 'true');
                    this.updateFabState();
                }
            });
        });
    }

    _setupFab() {
        const fab = document.getElementById('fab-context');
        if (!fab) return;
        fab.addEventListener('click', () => {
            const contextSheet = document.getElementById('sheet-context');
            if (contextSheet && contextSheet.getAttribute('aria-hidden') === 'false') {
                this.contextMenuHandler.applyContextChanges();
            }
        });
    }

    updateFabState() {
        const fab = document.getElementById('fab-context');
        if (!fab) return;
        const contextSheet = document.getElementById('sheet-context');
        const isOpen = contextSheet && contextSheet.getAttribute('aria-hidden') === 'false';
        fab.classList.toggle('hidden', !isOpen);
    }

    _setupTileGrid() {
        const grid = document.getElementById('tile-options-grid');
        const tileManager = this.stateManager.mapManager?.tileLayerManager;
        if (!grid || !tileManager) return;

        const sources = tileManager.getTileSources();
        grid.innerHTML = '';

        Object.keys(sources).forEach(key => {
            const card = document.createElement('div');
            card.className = 'tile-option-card';
            card.setAttribute('data-tile-key', key);
            card.innerHTML = `
                <span class="tile-icon">🗺️</span>
                <span class="tile-label">${key}</span>
            `;
            card.addEventListener('click', () => {
                tileManager.setTileLayer(key);
                this.refreshTileGridActive();
            });
            grid.appendChild(card);
        });
        this.refreshTileGridActive();
    }

    refreshTileGridActive() {
        const tileManager = this.stateManager.mapManager?.tileLayerManager;
        const activeType = tileManager?.getCurrentTileType?.();
        document.querySelectorAll('.tile-option-card').forEach(card => {
            const k = card.getAttribute('data-tile-key');
            card.classList.toggle('active', k === activeType);
        });
    }

    _setupClickOutside() {
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('sheet-context');
            if (!menu || menu.getAttribute('aria-hidden') === 'true') return;
            if (!menu.contains(e.target) && !e.target.closest('.list-item') && !e.target.closest('.legend-item') && !e.target.closest('#fab-context')) {
                this.closeContextMenu();
            }
        });
    }

    populateContextMenuForGeometry(geometry) {
        this.contextMenuHandler.populateForGeometry(geometry);
        this.updateFabState();
    }

    closeContextMenu() {
        const menu = document.getElementById('sheet-context');
        if (menu) menu.setAttribute('aria-hidden', 'true');
        this.contextMenuDragger?.onMenuHide();
        this.updateFabState();
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
