import os

def modularize_uimanager():
    targets = [
        'fpaysage/js/modules/UIManager.js',
        'fportrait/js/modules/UIManager.js',
        'fpromethean/js/modules/UIManager.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        ui_dir = os.path.join(dirpath, 'ui_parts')
        os.makedirs(ui_dir, exist_ok=True)

        context_handler_code = '''// ContextMenuHandler.js - Gestion du contenu et des actions du menu contextuel

export class ContextMenuHandler {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.stateManager = uiManager.stateManager;
    }

    setup() {
        const applyBtn = document.getElementById('applyContextBtn');
        const closeBtn = document.getElementById('closeContextBtn');
        const deleteBtn = document.getElementById('deleteContextBtn');

        applyBtn?.addEventListener('click', () => this.applyContextChanges());
        closeBtn?.addEventListener('click', () => this.uiManager.closeContextMenu());
        deleteBtn?.addEventListener('click', () => {
            const idx = this.stateManager.selectedIndex;
            if (idx !== null && confirm('Supprimer cet élément ?')) {
                this.stateManager.deleteGeometry(idx);
                this.uiManager.closeContextMenu();
            }
        });
    }

    applyContextChanges() {
        const idx = this.stateManager.selectedIndex;
        if (idx === null) return;

        const color = document.getElementById('contextColor')?.value;
        const lineColor = document.getElementById('contextLineColor')?.value;
        const opacity = parseFloat(document.getElementById('contextOpacity')?.value || 1);
        const lineDash = document.getElementById('contextLineDash')?.value;
        const lineWeight = parseInt(document.getElementById('contextLineWeight')?.value || 2, 10);
        const markerSize = parseInt(document.getElementById('contextMarkerSize')?.value || 24, 10);

        this.stateManager.applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize);
        this.uiManager.closeContextMenu();
    }

    populateForGeometry(geometry) {
        if (!geometry) return;
        const colorInput = document.getElementById('contextColor');
        const lineColorInput = document.getElementById('contextLineColor');
        const opacityInput = document.getElementById('contextOpacity');
        const lineDashInput = document.getElementById('contextLineDash');
        const lineWeightInput = document.getElementById('contextLineWeight');
        const markerSizeInput = document.getElementById('contextMarkerSize');

        if (colorInput && geometry.color) colorInput.value = geometry.color;
        if (lineColorInput && geometry.lineColor) lineColorInput.value = geometry.lineColor;
        if (opacityInput && geometry.opacity !== undefined) opacityInput.value = geometry.opacity;
        if (lineDashInput && geometry.lineDash) lineDashInput.value = geometry.lineDash;
        if (lineWeightInput && geometry.lineWeight !== undefined) lineWeightInput.value = geometry.lineWeight;
        if (markerSizeInput && geometry.markerSize !== undefined) markerSizeInput.value = geometry.markerSize;
    }
}
'''

        actions_handler_code = '''// UIActionsHandler.js - Gestionnaires des boutons globaux (export, import, titre)

export class UIActionsHandler {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.stateManager = uiManager.stateManager;
    }

    setup() {
        this._setupTitleHandlers();
        this._setupExportImport();
        this._setupPartCreation();
        this._setupSliders();
    }

    _setupTitleHandlers() {
        const toggleIcon = document.getElementById('toggleTitleIcon');
        const titleContent = document.getElementById('titleContent');
        const mapTitleInput = document.getElementById('mapTitle');

        toggleIcon?.addEventListener('click', () => {
            const isCollapsed = titleContent?.classList.toggle('collapsed');
            if (toggleIcon) toggleIcon.textContent = isCollapsed ? '▼' : '▲';
            this.stateManager.isTitlePanelCollapsed = isCollapsed;
        });

        mapTitleInput?.addEventListener('input', (e) => {
            this.stateManager.setMapTitle(e.target.value);
        });
    }

    _setupExportImport() {
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.stateManager.exportImportManager?.downloadJSON();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            this.stateManager.exportImportManager?.importState(data);
                        } catch (err) {
                            alert('Fichier JSON invalide');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });

        document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
            this.uiManager.exportPdf();
        });
    }

    _setupPartCreation() {
        document.getElementById('addPartBtn')?.addEventListener('click', () => {
            const name = prompt('Nom de la nouvelle partie:');
            if (name && name.trim()) {
                this.stateManager.addLegendPart(name.trim());
            }
        });
    }

    _setupSliders() {
        const pairs = [
            ['contextOpacity', 'contextOpacityValue'],
            ['contextLineWeight', 'contextLineWeightValue'],
            ['contextMarkerSize', 'contextMarkerSizeValue']
        ];
        pairs.forEach(([sliderId, valId]) => {
            const slider = document.getElementById(sliderId);
            const val = document.getElementById(valId);
            slider?.addEventListener('input', () => {
                if (val) val.textContent = slider.value;
            });
        });
    }
}
'''

        uimanager_code = '''// js/modules/UIManager.js
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
'''

        with open(os.path.join(ui_dir, 'ContextMenuHandler.js'), 'w', encoding='utf-8') as f:
            f.write(context_handler_code)
        with open(os.path.join(ui_dir, 'UIActionsHandler.js'), 'w', encoding='utf-8') as f:
            f.write(actions_handler_code)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(uimanager_code)
        print(f"Modularized {t}")

if __name__ == '__main__':
    modularize_uimanager()
