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
        this._setupRightNavHandlers();
    }

    /**
     * Active un panneau spécifique par son identifiant court ('project', 'draw', 'legend', 'text', 'export')
     */
    setActivePanel(panelName) {
        const navItems = document.querySelectorAll('.nav-rail-right .nav-item');
        const panelsContainer = document.getElementById('panelsContainer');
        const panels = document.querySelectorAll('.side-panel');
        const targetPanel = document.getElementById(`panel-${panelName}`);
        const targetItem = document.querySelector(`.nav-rail-right .nav-item[data-panel="${panelName}"]`);

        if (!targetPanel) return;

        navItems.forEach(i => i.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        if (targetItem) targetItem.classList.add('active');
        targetPanel.classList.add('active');
        if (panelsContainer) panelsContainer.style.width = 'var(--sidebar-width)';

        if (this.stateManager.mapManager?.map) {
            setTimeout(() => {
                this.stateManager.mapManager.map.invalidateSize({ debounceMoveend: true });
            }, 300);
        }
    }

    /**
     * Gère la navigation par onglets sur le rail DROIT Promethean
     */
    _setupRightNavHandlers() {
        const navItems = document.querySelectorAll('.nav-rail-right .nav-item');
        const panelsContainer = document.getElementById('panelsContainer');
        const panels = document.querySelectorAll('.side-panel');

        // Initialiser la largeur du conteneur si un panneau est déjà actif au chargement
        const initialActivePanel = document.querySelector('.side-panel.active');
        if (initialActivePanel && panelsContainer) {
            panelsContainer.style.width = 'var(--sidebar-width)';
        }

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const panelName = item.dataset.panel;
                const targetPanelId = `panel-${panelName}`;
                const targetPanel = document.getElementById(targetPanelId);

                if (!targetPanel) return;

                const isAlreadyActive = targetPanel.classList.contains('active');

                // 1. Désactiver tous les items et panels
                navItems.forEach(i => i.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));

                if (!isAlreadyActive) {
                    // 2. Activer l'item et le panel cible
                    item.classList.add('active');
                    targetPanel.classList.add('active');
                    if (panelsContainer) panelsContainer.style.width = 'var(--sidebar-width)';
                } else {
                    // Si on clique sur l'onglet déjà ouvert, on ferme
                    if (panelsContainer) panelsContainer.style.width = '0';
                }

                console.log('[UIManager] Switched to panel:', targetPanelId);

                // 3. Redimensionner la carte si nécessaire
                if (this.stateManager.mapManager?.map) {
                    setTimeout(() => {
                        this.stateManager.mapManager.map.invalidateSize({ debounceMoveend: true });
                    }, 400);
                }
            });
        });
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
