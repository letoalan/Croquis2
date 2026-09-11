// UIActionsHandler.js - Gestionnaires des boutons globaux (export, import, titre)

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
