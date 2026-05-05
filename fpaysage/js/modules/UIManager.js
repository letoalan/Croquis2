// UIManager.js
import { ContextMenuDragger } from './ContextMenuDragger.js';

export class UIManager {
    constructor(stateManager) {
        if (!stateManager) {
            throw new Error('StateManager is required for UIManager initialization.');
        }
        this.stateManager = stateManager;
        this.contextMenuDragger = null; // AJOUT
    }

    /**
     * ✅ Initialise l'interface utilisateur complète
     */
    initUI() {
        console.log('[UIManager] Initializing UI...');

        // ========================================
        // 1️⃣ INITIALISER LE DRAG & DROP DU MENU CONTEXTUEL
        // ========================================
        this.initContextMenuDrag();
        console.log('[UIManager] ✅ Context menu drag initialized');

        // ========================================
        // 2️⃣ GÉRER LE TITRE DE LA CARTE
        // ========================================
        this._setupTitleHandlers();

        // ========================================
        // 3️⃣ GÉRER LES ÉCOUTEURS D'ÉVÉNEMENT DES SLIDERS
        // ========================================
        this._setupSliderSyncListeners();

        // ========================================
        // 4️⃣ GÉRER LE MENU CONTEXTUEL (Appliquer, Fermer, Supprimer)
        // ========================================
        this._setupContextMenuHandlers();

        // ========================================
        // 5️⃣ GÉRER LES BOUTONS D'ÉDITION DES MARQUEURS
        // ========================================
        this._setupMarkerEditButton();

        // ========================================
        // 6️⃣ GÉRER L'EXPORT/IMPORT JSON
        // ========================================
        this._setupExportImportHandlers();

        // ========================================
        // 7️⃣ GÉRER L'EXPORT PDF
        // ========================================
        this._setupPdfExportHandler();

        // ========================================
        // 8️⃣ FERMER LE MENU AU CLIC EXTERNE
        // ========================================
        this._setupClickOutsideHandler();

        // ========================================
        // 9️⃣ GÉRER LES BOUTONS DE CRÉATION DE PARTIES
        // ========================================
        this._setupPartCreationHandler();
        console.log('[UIManager] ✅ Part creation handler initialized');


        console.log('[UIManager] ✅ UI initialization complete');
    }

    /**
     * ✅ Gère la création de nouvelles parties de légende
     */
    _setupPartCreationHandler() {
        const addPartBtn = document.getElementById('addPartBtn');
        if (addPartBtn) {
            addPartBtn.addEventListener('click', () => {
                const partName = prompt('Nom de la nouvelle partie:');
                if (partName !== null && partName.trim()) {
                    console.log('[UIManager] Creating new legend part:', partName);
                    const partId = this.stateManager.addLegendPart(partName.trim());
                    console.log('[UIManager] ✅ New part created with ID:', partId);
                }
            });
            console.log('[UIManager] ✅ Add part button listener attached');
        } else {
            console.warn('[UIManager] ⚠️ Add part button not found');
        }
    }





// ========================================
// 🔧 HELPER: Gestion du titre de la carte
// ========================================
    _setupTitleHandlers() {
        console.log('[UIManager] Setting up title handlers...');

        const toggleTitleIcon = document.getElementById('toggleTitleIcon');
        const mapTitleContainer = document.getElementById('mapTitleContainer');
        const mapTitleInputContainer = document.getElementById('mapTitleInputContainer');
        const mapTitleDisplay = document.getElementById('mapTitleDisplay');
        const saveMapTitleBtn = document.getElementById('saveMapTitleBtn');

        // ✅ Gestionnaire pour le toggle du titre
        if (toggleTitleIcon) {
            toggleTitleIcon.addEventListener('click', () => {
                console.log('[UIManager] Toggling title input container');

                if (mapTitleInputContainer.style.display === 'none') {
                    mapTitleInputContainer.style.display = 'flex';
                    mapTitleDisplay.style.display = 'none';
                    toggleTitleIcon.textContent = '▲';
                    console.log('[UIManager] Title input shown');
                } else {
                    mapTitleInputContainer.style.display = 'none';
                    mapTitleDisplay.style.display = 'block';
                    toggleTitleIcon.textContent = '▼';
                    console.log('[UIManager] Title input hidden');
                }
            });
        }

        // ✅ Gestionnaire pour enregistrer le titre
        if (saveMapTitleBtn) {
            saveMapTitleBtn.addEventListener('click', () => {
                const mapTitleInput = document.getElementById('mapTitleInput');
                if (mapTitleInput) {
                    const newTitle = mapTitleInput.value;
                    this.stateManager.setMapTitle(newTitle);

                    if (mapTitleDisplay) {
                        mapTitleDisplay.textContent = newTitle || 'Sans titre';
                    }

                    if (mapTitleInputContainer) {
                        mapTitleInputContainer.style.display = 'none';
                    }
                    if (mapTitleDisplay) {
                        mapTitleDisplay.style.display = 'block';
                    }
                    if (toggleTitleIcon) {
                        toggleTitleIcon.textContent = '▼';
                    }

                    console.log('[UIManager] ✅ Map title saved:', newTitle);
                }
            });
        }
    }

// ========================================
// 🔧 HELPER: Synchronisation des sliders
// ========================================
    _setupSliderSyncListeners() {
        console.log('[UIManager] Setting up slider sync listeners...');

        // ✅ Synchroniser l'opacité
        const opacitySlider = document.getElementById('contextOpacitySlider');
        const opacityValue = document.getElementById('contextOpacityValue');

        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                opacityValue.textContent = parseFloat(e.target.value).toFixed(1);
            });
            console.log('[UIManager] ✅ Opacity slider listener attached');
        }

        // ✅ Synchroniser l'épaisseur de ligne
        const lineWeightInput = document.getElementById('contextLineWeight');
        const lineWeightValue = document.getElementById('contextLineWeightValue');

        if (lineWeightInput && lineWeightValue) {
            lineWeightInput.addEventListener('input', (e) => {
                lineWeightValue.textContent = e.target.value;
            });
            console.log('[UIManager] ✅ Line weight slider listener attached');
        }

        // ✅ Synchroniser la taille du marqueur
        const markerSizeSlider = document.getElementById('contextMarkerSize');
        const markerSizeValueDisplay = document.getElementById('contextMarkerSizeValue');

        if (markerSizeSlider && markerSizeValueDisplay) {
            markerSizeSlider.addEventListener('input', (e) => {
                markerSizeValueDisplay.textContent = e.target.value;
                console.log('[UIManager] 📏 Marker size preview:', e.target.value, 'px');
            });
            console.log('[UIManager] ✅ Marker size slider listener attached');
        } else {
            console.warn('[UIManager] ⚠️ Marker size elements not found');
        }
    }

// ========================================
// 🔧 HELPER: Gestionnaires du menu contextuel
// ========================================
    _setupContextMenuHandlers() {
        console.log('[UIManager] Setting up context menu handlers...');

        // ✅ Bouton "Appliquer"
        this._setupContextApplyButton();

        // ✅ Bouton "Fermer"
        const contextCloseBtn = document.getElementById('contextCloseBtn');
        if (contextCloseBtn) {
            contextCloseBtn.addEventListener('click', () => {
                console.log('[UIManager] Close button clicked');
                this.closeContextMenu();
            });
        }

        // ✅ Bouton "Supprimer"
        const contextDeleteBtn = document.getElementById('contextDeleteBtn');
        if (contextDeleteBtn) {
            contextDeleteBtn.addEventListener('click', () => {
                console.log('[UIManager] Delete button clicked');
                if (this.stateManager.selectedIndex !== null) {
                    this.stateManager.deleteGeometry(this.stateManager.selectedIndex);
                    this.closeContextMenu();
                }
            });
        }

        // ✅ Bouton "Réinitialiser" (si disponible)
        const contextResetBtn = document.getElementById('contextResetBtn');
        if (contextResetBtn) {
            contextResetBtn.addEventListener('click', () => {
                console.log('[UIManager] Reset button clicked');
                if (this.stateManager.selectedIndex !== null) {
                    const geometry = this.stateManager.geometries[this.stateManager.selectedIndex];
                    if (geometry) {
                        this.populateContextMenuForGeometry(geometry);
                    }
                }
            });
        }
    }

// ========================================
// 🔧 HELPER: Bouton "Appliquer" du menu contextuel
// ========================================
    _setupContextApplyButton() {
        const contextApplyBtn = document.getElementById('contextApplyBtn');

        if (!contextApplyBtn) {
            console.warn('[UIManager] ⚠️ Context Apply button not found');
            return;
        }

        contextApplyBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            console.log('[UIManager] ➡️ Context menu Apply button clicked');

            // ✅ Récupérer toutes les valeurs du formulaire
            const fillColor = document.getElementById('contextColorPicker')?.value;
            const lineColor = document.getElementById('contextLineColorPicker')?.value;
            const opacity = parseFloat(document.getElementById('contextOpacitySlider')?.value);
            const lineDash = document.getElementById('contextLineDash')?.value;
            const lineWeight = parseInt(document.getElementById('contextLineWeight')?.value);
            const markerSize = parseInt(document.getElementById('contextMarkerSize')?.value);

            // ✅ Vérifier que les valeurs sont valides
            if (!fillColor || !lineColor || isNaN(opacity) || !lineDash || isNaN(lineWeight)) {
                console.warn('[UIManager] ⚠️ Invalid form values:', { fillColor, lineColor, opacity, lineDash, lineWeight });
                return;
            }

            console.log('[UIManager] 📋 Collected form values:', {
                fillColor,
                lineColor,
                opacity,
                lineDash,
                lineWeight,
                markerSize: isNaN(markerSize) ? 'N/A' : markerSize
            });

            // ✅ Appliquer les styles
            try {
                this.stateManager.applyStyle(
                    fillColor,
                    lineColor,
                    opacity,
                    lineDash,
                    lineWeight,
                    markerSize || 24
                );
                console.log('[UIManager] ✅ Style applied successfully');
            } catch (error) {
                console.error('[UIManager] ❌ ERROR applying style:', error.message);
                return;
            }

            // ✅ Fermer le menu contextuel
            this.closeContextMenu();
            console.log('[UIManager] 🔒 Context menu closed');
        });

        console.log('[UIManager] ✅ Context Apply button listener attached');
    }

// ========================================
// 🔧 HELPER: Remplir le menu avec les valeurs de la géométrie
// ========================================
    populateContextMenuForGeometry(geometry) {
        if (!geometry) {
            console.warn('[UIManager] ⚠️ No geometry provided to populate context menu');
            return;
        }

        console.log('[UIManager] 📝 Populating context menu for:', geometry.name, 'type:', geometry.type);

        // Récupérer les éléments du formulaire
        const colorPicker = document.getElementById('contextColorPicker');
        const lineColorPicker = document.getElementById('contextLineColorPicker');
        const opacitySlider = document.getElementById('contextOpacitySlider');
        const opacityValue = document.getElementById('contextOpacityValue');
        const lineDashSelect = document.getElementById('contextLineDash');
        const lineWeightInput = document.getElementById('contextLineWeight');
        const lineWeightValue = document.getElementById('contextLineWeightValue');
        const markerSizeSlider = document.getElementById('contextMarkerSize');
        const markerSizeValueDisplay = document.getElementById('contextMarkerSizeValue');
        const markerSizeContainer = document.getElementById('contextMarkerSizeContainer');

        // ========================================
        // 1️⃣ Initialiser les couleurs
        // ========================================
        if (colorPicker) {
            colorPicker.value = geometry.color || '#3388ff';
            console.log('[UIManager] ✅ Fill color initialized:', colorPicker.value);
        }

        if (lineColorPicker) {
            lineColorPicker.value = geometry.lineColor || '#000000';
            console.log('[UIManager] ✅ Line color initialized:', lineColorPicker.value);
        }

        // ========================================
        // 2️⃣ Initialiser l'opacité
        // ========================================
        if (opacitySlider) {
            opacitySlider.value = geometry.opacity || 1;
            if (opacityValue) {
                opacityValue.textContent = (geometry.opacity || 1).toFixed(1);
            }
            console.log('[UIManager] ✅ Opacity initialized:', opacitySlider.value);
        }

        // ========================================
        // 3️⃣ Initialiser le style de ligne
        // ========================================
        if (lineDashSelect) {
            lineDashSelect.value = geometry.lineDash || 'solid';
            console.log('[UIManager] ✅ Line dash initialized:', lineDashSelect.value);
        }

        // ========================================
        // 4️⃣ Initialiser l'épaisseur de ligne
        // ========================================
        if (lineWeightInput) {
            lineWeightInput.value = geometry.lineWeight || 2;
            if (lineWeightValue) {
                lineWeightValue.textContent = geometry.lineWeight || 2;
            }
            console.log('[UIManager] ✅ Line weight initialized:', lineWeightInput.value);
        }

        // ========================================
        // 5️⃣ Gérer la taille du marqueur (conditionnel)
        // ========================================
        if (geometry.type && geometry.type.startsWith('Marker_')) {
            console.log('[UIManager] 📍 Marker type detected:', geometry.type);

            const markerSize = geometry.markerSize || 24;

            // ✅ Afficher le conteneur
            if (markerSizeContainer) {
                markerSizeContainer.style.display = 'block';
                console.log('[UIManager] ✅ Marker size container shown');
            }

            // ✅ Initialiser le slider
            if (markerSizeSlider) {
                markerSizeSlider.value = markerSize;
                console.log('[UIManager] ✅ Marker size slider set to:', markerSize, 'px');
            }

            // ✅ Initialiser l'affichage de la valeur
            if (markerSizeValueDisplay) {
                markerSizeValueDisplay.textContent = markerSize;
                console.log('[UIManager] ✅ Marker size value display set to:', markerSize, 'px');
            }
        } else {
            // ✅ Masquer le conteneur pour les autres géométries
            console.log('[UIManager] 📍 Non-marker geometry:', geometry.type);

            if (markerSizeContainer) {
                markerSizeContainer.style.display = 'none';
                console.log('[UIManager] ✅ Marker size container hidden');
            }
        }

        console.log('[UIManager] ✅ Context menu populated successfully');
    }

// ========================================
// 🔧 HELPER: Bouton édition des marqueurs
// ========================================
    _setupMarkerEditButton() {
        const editMarkersBtn = document.getElementById('editMarkersBtn');
        if (editMarkersBtn) {
            editMarkersBtn.addEventListener('click', () => {
                console.log('[UIManager] Edit markers button clicked');
                this.stateManager.toggleEditMarkersMode();
            });
            console.log('[UIManager] ✅ Edit markers button listener attached');
        }
    }

// ========================================
// 🔧 HELPER: Export/Import JSON
// ========================================
    _setupExportImportHandlers() {
        console.log('[UIManager] Setting up export/import handlers...');

        // ✅ Bouton Exporter
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('[UIManager] Export button clicked');
                if (this.stateManager.exportImportManager) {
                    this.stateManager.exportImportManager.downloadJSON();
                }
            });
            console.log('[UIManager] ✅ Export button listener attached');
        }

        // ✅ Bouton Importer
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                console.log('[UIManager] Import button clicked');
                if (this.stateManager.exportImportManager) {
                    this.stateManager.exportImportManager.uploadJSON();
                }
            });
            console.log('[UIManager] ✅ Import button listener attached');
        }

        // ✅ Gestionnaire pour le champ d'import de fichier
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('[UIManager] File selected for import:', file.name);
                    this.importData(file);
                }
            });
            console.log('[UIManager] ✅ Import file input listener attached');
        }
    }

// ========================================
// 🔧 HELPER: Export PDF
// ========================================
    _setupPdfExportHandler() {
        console.log('[UIManager] Setting up PDF export handler...');

        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', async () => {
                console.log('[UIManager] Export PDF button clicked');

                // ✅ Vérifier que les bibliothèques sont chargées
                if (typeof html2canvas === 'undefined') {
                    console.error('[UIManager] html2canvas not loaded!');
                    alert('Erreur : La bibliothèque html2canvas n\'est pas chargée.');
                    return;
                }

                if (typeof window.jspdf === 'undefined') {
                    console.error('[UIManager] jsPDF not loaded!');
                    alert('Erreur : La bibliothèque jsPDF n\'est pas chargée.');
                    return;
                }

                console.log('[UIManager] ✅ Libraries loaded successfully');

                // ✅ Vérifier que geometryManager existe
                if (!window.geometryManager) {
                    console.error('[UIManager] window.geometryManager not found!');
                    alert('Erreur : GeometryManager non initialisé.');
                    return;
                }

                console.log('[UIManager] ✅ GeometryManager found');

                // ✅ Vérifier que getPDFExporter existe
                if (!window.geometryManager.getPDFExporter) {
                    console.error('[UIManager] getPDFExporter method not found!');
                    alert('Erreur : PDFExporter non initialisé.');
                    return;
                }

                console.log('[UIManager] ✅ PDFExporter method found');

                // ✅ Appeler l'export
                try {
                    const pdfExporter = window.geometryManager.getPDFExporter();
                    console.log('[UIManager] PDFExporter instance:', pdfExporter);

                    if (!pdfExporter) {
                        console.error('[UIManager] PDFExporter instance is null!');
                        alert('Erreur : PDFExporter non disponible.');
                        return;
                    }

                    console.log('[UIManager] Starting PDF export...');
                    await pdfExporter.exportPDF();
                    console.log('[UIManager] ✅ PDF export completed');

                } catch (error) {
                    console.error('[UIManager] PDF export error:', error);
                    alert('Erreur lors de l\'export PDF : ' + error.message);
                }
            });

            console.log('[UIManager] ✅ Export PDF button listener attached');
        } else {
            console.warn('[UIManager] ⚠️ Export PDF button not found');
        }
    }

// ========================================
// 🔧 HELPER: Fermer le menu au clic externe
// ========================================
    _setupClickOutsideHandler() {
        document.addEventListener('click', (event) => {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && contextMenu.style.display === 'block') {
                if (!contextMenu.contains(event.target)) {
                    // Appeler la méthode de nettoyage du drag manager
                    if (this.contextMenuDragger) {
                        this.contextMenuDragger.onMenuHide();
                    }
                    contextMenu.style.display = 'none';
                    console.log('[UIManager] Context menu closed (click outside)');
                }
            }
        });

        console.log('[UIManager] ✅ Click outside handler attached');
    }


    initContextMenuDrag() {
        try {
            this.contextMenuDragger = new ContextMenuDragger();
            this.contextMenuDragger.addResetButton();

            // Exposer globalement pour y accéder depuis StateManager
            window.contextMenuDragger = this.contextMenuDragger;

            console.log('[UIManager] Context menu drag initialized');
        } catch (error) {
            console.error('[UIManager] Error initializing context menu drag:', error);
        }
    }


    /**
     * Ferme le menu contextuel.
     */
    closeContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }

        const selectedIndex = this.stateManager.selectedIndex;
        if (selectedIndex !== null) {
            this.stateManager.finishEditingGeometry(selectedIndex);
            this.stateManager.selectedIndex = null;
        }
    }

    /**
     * Exporte les données.
     */
    exportData() {
        console.log('[UIManager] Exporting data...');
        const data = {
            mapTitle: this.stateManager.mapTitle,
            geometries: this.stateManager.geometries.map(g => ({
                type: g.type,
                coordinates: g.coordinates,
                color: g.color,
                lineColor: g.lineColor,
                opacity: g.opacity,
                lineWeight: g.lineWeight,
                lineDash: g.lineDash,
                name: g.name,
                shape: g.shape,
                markerSize: g.markerSize,
                arrowType: g.arrowType
            }))
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'carte.json';
        link.click();
        URL.revokeObjectURL(url);
        console.log('[UIManager] Data exported');
    }

    /**
     * Importe les données.
     */
    importData(file) {
        console.log('[UIManager] Importing data...');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Importer le titre
                if (data.mapTitle) {
                    this.stateManager.setMapTitle(data.mapTitle);
                }

                // Importer les géométries
                if (data.geometries) {
                    // Nettoyer les géométries existantes
                    this.stateManager.geometries.forEach((g, index) => {
                        this.stateManager.deleteGeometry(0);
                    });

                    // Ajouter les nouvelles géométries
                    data.geometries.forEach(g => {
                        // Recréer les géométries sur la carte
                        // Cette partie dépend de ton implémentation
                        console.log('[UIManager] Importing geometry:', g);
                    });
                }

                console.log('[UIManager] Data imported successfully');
            } catch (error) {
                console.error('[UIManager] Error importing data:', error);
            }
        };
        reader.readAsText(file);
    }
}
