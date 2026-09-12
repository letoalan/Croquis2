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
        const mapTitleInput = document.getElementById('mapTitleInput') || document.getElementById('mapTitle');
        const saveMapTitleBtn = document.getElementById('saveMapTitleBtn');
        const mapTitleDisplay = document.getElementById('mapTitleDisplay');

        const toggleTitleEdit = () => {
            if (this.uiManager?.setActivePanel) {
                const navItemProject = document.querySelector('.nav-item[data-panel="project"]');
                navItemProject?.click();
                return;
            }
            const container = document.getElementById('mapTitleContainer') || titleContent;
            const inputContainer = document.getElementById('mapTitleInputContainer');
            if (inputContainer) {
                const isEditing = inputContainer.style.display !== 'none';
                inputContainer.style.display = isEditing ? 'none' : 'flex';
                if (mapTitleDisplay) mapTitleDisplay.style.display = isEditing ? 'block' : 'none';
                if (!isEditing && mapTitleInput) {
                    mapTitleInput.value = this.stateManager.mapTitle || '';
                    setTimeout(() => mapTitleInput.focus(), 50);
                }
                if (toggleIcon) toggleIcon.textContent = isEditing ? '▼' : '▲';
                if (container) container.classList.toggle('editing', !isEditing);
            } else if (container) {
                const isCollapsed = container.classList.toggle('collapsed');
                if (toggleIcon) toggleIcon.textContent = isCollapsed ? '▼' : '▲';
                this.stateManager.isTitlePanelCollapsed = isCollapsed;
            }
        };

        toggleIcon?.addEventListener('click', toggleTitleEdit);
        mapTitleDisplay?.addEventListener('click', toggleTitleEdit);

        const updateTitle = (val) => {
            const title = val.trim() || 'Sans titre';
            this.stateManager.setMapTitle(title);
            if (mapTitleDisplay) mapTitleDisplay.textContent = title;
            const inputContainer = document.getElementById('mapTitleInputContainer');
            if (inputContainer && !this.uiManager?.setActivePanel) {
                inputContainer.style.display = 'none';
                if (mapTitleDisplay) mapTitleDisplay.style.display = 'block';
                if (toggleIcon) toggleIcon.textContent = '▼';
            }
        };

        saveMapTitleBtn?.addEventListener('click', () => {
            if (mapTitleInput) updateTitle(mapTitleInput.value);
        });

        mapTitleInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') updateTitle(e.target.value);
        });

        mapTitleInput?.addEventListener('input', (e) => {
            this.stateManager.setMapTitle(e.target.value);
            if (mapTitleDisplay) mapTitleDisplay.textContent = e.target.value || 'Sans titre';
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
            ['contextOpacitySlider', 'contextOpacityValue'],
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
