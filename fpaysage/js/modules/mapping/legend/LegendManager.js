// js/modules/mapping/legend/LegendManager.js

import { LegendOrganizer } from './LegendOrganizer.js';

export class LegendManager {
    constructor(map, stateManager) {
        if (!map) {
            throw new Error('Map is required for LegendManager initialization.');
        }
        if (!stateManager) {
            throw new Error('StateManager is required for LegendManager initialization.');
        }

        this.map = map;
        this.stateManager = stateManager;
        this.legendControl = null;

        // ✅ Initialiser LegendOrganizer
        this.legendOrganizer = new LegendOrganizer(stateManager, this);

        this.initLegend();
        console.log('[LegendManager] LegendManager initialized with drag & drop support');
    }

    /**
     * ✅ VERSION CONCISE : Isolation complète en une ligne
     */
    initLegend() {
        const LegendControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'legend-control');

                L.DomEvent
                    .disableClickPropagation(container)
                    .disableScrollPropagation(container);

                container.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                }, true);

                container.style.cursor = 'default';

                return container;
            }
        });

        this.legendControl = new LegendControl();
        this.map.addControl(this.legendControl);

        // ✅ NOUVEAU : Créer la première partie par défaut à l'initialisation
        if (this.stateManager.legendParts.length === 0) {
            this.stateManager.addLegendPart('I');
            console.log('[LegendManager] Default first part created');
        }

        // Afficher la légende dès l'initialisation
        this.updateLegend();

        console.log('[LegendManager] Legend control initialized and displayed');
    }


    /**
     * ✅ Met à jour la légende avec système de parties en colonnes
     * + Affiche les représentations visuelles des symboles
     * + Affiche le panneau dès l'initialisation (même sans figuré)
     * + Une première partie (I) est toujours présente
     */
    updateLegend() {
        console.log('[LegendManager] ========== updateLegend() START ==========');
        console.log('[LegendManager] Number of parts:', this.stateManager.legendParts.length);
        console.log('[LegendManager] Number of geometries:', this.stateManager.geometries.length);

        const container = this.legendControl.getContainer();

        if (!container) {
            console.error('[LegendManager] Legend container not found.');
            return;
        }

        // ✅ Header avec bouton + Partie (TOUJOURS AFFICHÉ)
        container.innerHTML = `
        <div class="legend-header">
            <span class="legend-title">✏️ Légende</span>
            <div class="legend-header-actions">
                <button class="legend-add-part-btn" id="addPartBtn">+ Partie</button>
            </div>
        </div>
    `;

        // ✅ Listener pour le bouton + Partie
        const addPartBtn = container.querySelector('#addPartBtn');
        if (addPartBtn) {
            addPartBtn.addEventListener('click', () => this._addNewPart());
        }

        // ========================================
        // ÉTAPE 1 : CRÉER LES COLONNES DES PARTIES
        // ========================================
        if (this.stateManager.legendParts && this.stateManager.legendParts.length > 0) {
            console.log('[LegendManager] 📍 Step 1: Creating columns for', this.stateManager.legendParts.length, 'parts...');

            const columnsContainer = document.createElement('div');
            columnsContainer.className = 'legend-columns';

            this.stateManager.legendParts.forEach((part, partIndex) => {
                console.log(`[LegendManager] Creating column for part ${partIndex}:`, part.title);

                const partColumn = document.createElement('div');
                partColumn.className = 'legend-part-column';
                partColumn.setAttribute('data-part-id', part.id);

                // ========================================
                // EN-TÊTE DE LA PARTIE AVEC CONTRÔLES
                // ========================================
                const partHeader = document.createElement('div');
                partHeader.className = 'legend-part-header';

                // Titre
                const titleDiv = document.createElement('div');
                titleDiv.className = 'legend-part-title';
                titleDiv.textContent = part.title || `Partie ${partIndex + 1}`;
                partHeader.appendChild(titleDiv);

                // ===== BOUTONS DE CONTRÔLE =====
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'part-management-controls';

                // Bouton : + Sous-parties (crée 2 sous-parties)
                const addSubPartBtn = document.createElement('button');
                addSubPartBtn.className = 'btn btn-sm btn-info';
                addSubPartBtn.textContent = '+ Sous-parties';
                addSubPartBtn.addEventListener('click', () => {
                    console.log('[LegendManager] Adding 2 sub-parts to:', part.id);
                    this.stateManager.addLegendSubPart(part.id, 2);  // ✅ Créer 2 sous-parties
                    this.updateLegend();
                });

                controlsDiv.appendChild(addSubPartBtn);

                // Bouton : Renommer (✏️)
                const renameBtn = document.createElement('button');
                renameBtn.className = 'btn btn-sm btn-warning';
                renameBtn.textContent = '✏️';
                renameBtn.addEventListener('click', () => {
                    const newName = prompt('Nouveau nom:', part.title);
                    if (newName && newName.trim()) {
                        this.stateManager.updatePartTitle(part.id, newName.trim());
                        this.updateLegend();
                    }
                });
                controlsDiv.appendChild(renameBtn);

                // Bouton : Supprimer (🗑️)
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger';
                deleteBtn.textContent = '🗑️';
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`Supprimer la partie "${part.title}" ?`)) {
                        this.stateManager.deleteLegendPart(part.id);
                        this.updateLegend();
                    }
                });
                controlsDiv.appendChild(deleteBtn);

                partHeader.appendChild(controlsDiv);
                partColumn.appendChild(partHeader);

                // Conteneur des items de la partie
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'legend-part-items';
                itemsContainer.setAttribute('data-part-id', part.id);
                itemsContainer.setAttribute('data-drop-zone', 'true');

                // ========================================
                // ÉTAPE 2 : AJOUTER LES SYMBOLES DE LA PARTIE
                // ========================================
                console.log(`[LegendManager] Part ${partIndex} has geometries:`, part.geometries);

                part.geometries.forEach((geomIndex) => {
                    const geometry = this.stateManager.geometries[geomIndex];

                    if (geometry) {
                        console.log(`[LegendManager]   ✅ Adding geometry ${geomIndex}:`, geometry.name, 'type:', geometry.type);

                        // ✅ CRÉER LA REPRÉSENTATION VISUELLE
                        const legendItem = document.createElement('div');
                        legendItem.className = 'legend-item';
                        legendItem.setAttribute('data-geometry-index', geomIndex);
                        legendItem.draggable = true;

                        // ✅ Créer le symbole SVG/HTML selon le type
                        const symbolElement = this.createLegendSymbol(geometry);
                        legendItem.appendChild(symbolElement);

                        // Ajouter le nom
                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'legend-item-name';
                        nameSpan.textContent = geometry.name || 'Sans nom';
                        legendItem.appendChild(nameSpan);

                        itemsContainer.appendChild(legendItem);
                        console.log(`[LegendManager]   ✅ Legend item added for:`, geometry.name);
                    } else {
                        console.warn(`[LegendManager]   ⚠️ Geometry at index ${geomIndex} not found`);
                    }
                });

                // ========================================
                // ÉTAPE 2B : AFFICHER LES SOUS-PARTIES OU ZONE DE DROP
                // ========================================
                if (part.subParts && part.subParts.length > 0) {
                    console.log(`[LegendManager] Part ${partIndex} has ${part.subParts.length} sub-part(s)`);

                    part.subParts.forEach((subPart, subPartIndex) => {
                        console.log(`[LegendManager]   📍 Creating sub-part: ${subPartIndex}`, subPart.title);

                        // Créer un header pour la sous-partie
                        const subPartHeader = document.createElement('div');
                        subPartHeader.className = 'legend-subpart-header';
                        subPartHeader.textContent = subPart.title || `Sous-partie ${subPartIndex + 1}`;

                        // Créer des contrôles pour la sous-partie
                        const subPartControls = document.createElement('div');
                        subPartControls.className = 'subpart-management-controls';

                        // Bouton renommer sous-partie
                        const renameSubPartBtn = document.createElement('button');
                        renameSubPartBtn.className = 'btn btn-sm btn-warning';
                        renameSubPartBtn.textContent = '✏️';
                        renameSubPartBtn.addEventListener('click', () => {
                            const newName = prompt('Nouveau nom:', subPart.title);
                            if (newName && newName.trim()) {
                                this.stateManager.updateSubPartTitle(part.id, subPart.id, newName.trim());
                                this.updateLegend();
                            }
                        });
                        subPartControls.appendChild(renameSubPartBtn);

                        // Bouton supprimer sous-partie
                        const deleteSubPartBtn = document.createElement('button');
                        deleteSubPartBtn.className = 'btn btn-sm btn-danger';
                        deleteSubPartBtn.textContent = '🗑️';
                        deleteSubPartBtn.addEventListener('click', () => {
                            if (confirm(`Supprimer "${subPart.title}" ?`)) {
                                this.stateManager.deleteLegendSubPart(part.id, subPart.id);
                                this.updateLegend();
                            }
                        });
                        subPartControls.appendChild(deleteSubPartBtn);

                        subPartHeader.appendChild(subPartControls);
                        itemsContainer.appendChild(subPartHeader);

                        // ===== ZONE DE DROP POUR LA SOUS-PARTIE =====
                        const subPartItemsContainer = document.createElement('div');
                        subPartItemsContainer.className = 'legend-subpart-items legend-drop-zone';
                        subPartItemsContainer.setAttribute('data-part-id', part.id);
                        subPartItemsContainer.setAttribute('data-subpart-id', subPart.id);
                        subPartItemsContainer.setAttribute('data-drop-zone', 'true');
                        subPartItemsContainer.style.minHeight = '40px';
                        subPartItemsContainer.style.border = '2px dashed rgba(102, 126, 234, 0.3)';
                        subPartItemsContainer.style.borderRadius = '4px';
                        subPartItemsContainer.style.padding = '8px';
                        subPartItemsContainer.style.marginBottom = '12px';

                        // Ajouter les items de la sous-partie
                        if (subPart.geometries && subPart.geometries.length > 0) {
                            subPart.geometries.forEach((geomIndex) => {
                                const geometry = this.stateManager.geometries[geomIndex];
                                if (geometry) {
                                    const legendItem = document.createElement('div');
                                    legendItem.className = 'legend-item';
                                    legendItem.setAttribute('data-geometry-index', geomIndex);
                                    legendItem.draggable = true;

                                    const symbolElement = this.createLegendSymbol(geometry);
                                    legendItem.appendChild(symbolElement);

                                    const nameSpan = document.createElement('span');
                                    nameSpan.className = 'legend-item-name';
                                    nameSpan.textContent = geometry.name || 'Sans nom';
                                    legendItem.appendChild(nameSpan);

                                    subPartItemsContainer.appendChild(legendItem);
                                    console.log(`[LegendManager]     ✅ Item added to sub-part:`, geometry.name);
                                }
                            });
                        } else {
                            // ✅ Zone vide avec message si pas d'items
                            const emptyMsg = document.createElement('div');
                            emptyMsg.className = 'legend-empty-message';
                            emptyMsg.textContent = '📍 Déposer les géométries ici';
                            emptyMsg.style.fontSize = '11px';
                            emptyMsg.style.color = 'rgba(102, 126, 234, 0.5)';
                            emptyMsg.style.pointerEvents = 'none';
                            subPartItemsContainer.appendChild(emptyMsg);
                        }

                        itemsContainer.appendChild(subPartItemsContainer);
                    });

                } else {
                    // ========================================
                    // ✅ PAS DE SOUS-PARTIES : ZONE DE DROP DIRECTE
                    // ========================================
                    console.log(`[LegendManager] Part ${partIndex} has no sub-parts, creating direct drop zone`);

                    const directDropZone = document.createElement('div');
                    directDropZone.className = 'legend-part-drop-zone legend-drop-zone';
                    directDropZone.setAttribute('data-part-id', part.id);
                    directDropZone.setAttribute('data-drop-zone', 'true');
                    directDropZone.style.minHeight = '60px';
                    directDropZone.style.border = '2px dashed rgba(102, 126, 234, 0.4)';
                    directDropZone.style.borderRadius = '6px';
                    directDropZone.style.padding = '12px';
                    directDropZone.style.marginTop = '8px';
                    directDropZone.style.display = 'flex';
                    directDropZone.style.alignItems = 'center';
                    directDropZone.style.justifyContent = 'center';
                    directDropZone.style.background = 'rgba(102, 126, 234, 0.02)';

                    const dropMsg = document.createElement('div');
                    dropMsg.className = 'legend-empty-message';
                    dropMsg.textContent = '📍 Déposer les géométries ici';
                    dropMsg.style.fontSize = '12px';
                    dropMsg.style.color = 'rgba(102, 126, 234, 0.6)';
                    dropMsg.style.fontStyle = 'italic';
                    dropMsg.style.pointerEvents = 'none';

                    directDropZone.appendChild(dropMsg);
                    itemsContainer.appendChild(directDropZone);
                }

                partColumn.appendChild(itemsContainer);
                columnsContainer.appendChild(partColumn);
            });

            container.appendChild(columnsContainer);
            console.log('[LegendManager] ✅ All columns added to container');
        }
        // ✅ BLOC ELSE SUPPRIMÉ : Une première partie sera toujours créée à l'initialisation

        // ========================================
        // ÉTAPE 3 : SECTION NON CLASSÉS
        // ========================================
        console.log('[LegendManager] 📍 Step 2: Creating Unclassified section...');

        const unclassifiedSection = document.createElement('div');
        unclassifiedSection.className = 'legend-unclassified-section';

        const unclassifiedHeader = document.createElement('div');
        unclassifiedHeader.className = 'legend-unclassified-header';
        unclassifiedHeader.innerHTML = '<span class="legend-folder-icon">📁</span> Non classés';
        unclassifiedSection.appendChild(unclassifiedHeader);

        const unclassifiedContainer = document.createElement('div');
        unclassifiedContainer.className = 'legend-unclassified-items';
        unclassifiedContainer.setAttribute('data-part-id', 'unclassified');
        unclassifiedContainer.setAttribute('data-drop-zone', 'true');

        // ✅ AJOUTER LES GÉOMÉTRIES NON CLASSÉES
        const unclassifiedGeometries = this.stateManager.geometries.filter((geom, index) => {
            return !this.stateManager.geometryToPart.has(index);
        });

        console.log('[LegendManager] Found', unclassifiedGeometries.length, 'unclassified geometries');

        if (unclassifiedGeometries.length > 0) {
            unclassifiedGeometries.forEach((geometry, idx) => {
                const geomIndex = this.stateManager.geometries.indexOf(geometry);
                console.log(`[LegendManager]   ✅ Adding unclassified geometry ${idx}:`, geometry.name, 'index:', geomIndex);

                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                legendItem.setAttribute('data-geometry-index', geomIndex);
                legendItem.draggable = true;

                // ✅ Créer le symbole SVG/HTML selon le type
                const symbolElement = this.createLegendSymbol(geometry);
                legendItem.appendChild(symbolElement);

                // Ajouter le nom
                const nameSpan = document.createElement('span');
                nameSpan.className = 'legend-item-name';
                nameSpan.textContent = geometry.name || 'Sans nom';
                legendItem.appendChild(nameSpan);

                unclassifiedContainer.appendChild(legendItem);
                console.log(`[LegendManager]   ✅ Unclassified legend item added for:`, geometry.name);
            });
        } else {
            // ✅ Message si aucun figuré non classé
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'legend-empty-message';
            emptyMsg.textContent = '📍 Aucun figuré non classé';
            emptyMsg.style.cssText = `
            padding: 16px;
            text-align: center;
            font-size: 11px;
            color: rgba(102, 126, 234, 0.4);
            font-style: italic;
        `;
            unclassifiedContainer.appendChild(emptyMsg);
        }

        unclassifiedSection.appendChild(unclassifiedContainer);
        container.appendChild(unclassifiedSection);
        console.log('[LegendManager] ✅ Unclassified section created');

        // ========================================
        // ÉTAPE 4 : INITIALISER DRAG & DROP
        // ========================================
        console.log('[LegendManager] 📍 Step 3: Setting up drag & drop...');

        // ✅ CRUCIAL : Attendre que le DOM soit bien mis à jour
        setTimeout(() => {
            // Vérifier les items draggables
            const items = container.querySelectorAll('.legend-item[draggable="true"]');
            console.log('[LegendManager] Found', items.length, 'draggable items');

            // Vérifier les drop zones
            const dropZones = container.querySelectorAll('[data-drop-zone="true"]');
            console.log('[LegendManager] Found', dropZones.length, 'drop zones');

            dropZones.forEach((zone, index) => {
                const partId = zone.getAttribute('data-part-id');
                console.log(`[LegendManager] Drop zone ${index}: ${partId}`);
            });

            // Initialiser drag & drop
            try {
                this.legendOrganizer.setupDragAndDrop();
                console.log('[LegendManager] ✅ setupDragAndDrop() completed successfully');
            } catch (error) {
                console.error('[LegendManager] ❌ ERROR in setupDragAndDrop():', error.message);
            }
        }, 100);

        console.log('[LegendManager] ✅ Legend updated with', this.stateManager.legendParts.length, 'parts and', this.stateManager.geometries.length, 'total geometries');
        console.log('[LegendManager] ========== updateLegend() END ==========');
    }



    /**
     * ✅ CRÉE LA REPRÉSENTATION SVG D'UN SYMBOLE POUR LA LÉGENDE
     */
    createLegendSymbol(geometry) {
        console.log('[LegendManager] 🎨 Creating legend symbol for:', geometry.name, 'type:', geometry.type);

        const container = document.createElement('div');
        container.className = 'legend-symbol-wrapper';

        let preview;

        // ========================================
        // CAS 1 : MARQUEURS SVG PERSONNALISÉS (Marker_hexagon, Marker_triangle, etc.)
        // ========================================
        if (geometry.type.startsWith('Marker_')) {
            const markerType = geometry.type.split('_')[1]; // Extraire le type (hexagon, triangle, square, circle)

            preview = document.createElement('div');
            preview.className = 'legend-symbol-preview';
            preview.style.width = '24px';
            preview.style.height = '24px';
            preview.style.display = 'flex';
            preview.style.alignItems = 'center';
            preview.style.justifyContent = 'center';

            const color = geometry.color || '#007bff';
            const lineColor = geometry.lineColor || '#000000';

            // Créer le symbole selon le type de marqueur
            if (markerType === 'hexagon') {
                preview.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" 
                             fill="${color}" stroke="${lineColor}" stroke-width="1" opacity="${geometry.opacity || 1}"/>
                </svg>
            `;
            } else if (markerType === 'triangle') {
                preview.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="12,2 22,20 2,20" 
                             fill="${color}" stroke="${lineColor}" stroke-width="1" opacity="${geometry.opacity || 1}"/>
                </svg>
            `;
            } else if (markerType === 'square') {
                preview.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" 
                          fill="${color}" stroke="${lineColor}" stroke-width="1" opacity="${geometry.opacity || 1}"/>
                </svg>
            `;
            } else if (markerType === 'circle') {
                preview.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" 
                            fill="${color}" stroke="${lineColor}" stroke-width="1" opacity="${geometry.opacity || 1}"/>
                </svg>
            `;
            } else {
                // Fallback: carré par défaut
                preview.style.backgroundColor = color;
                preview.style.borderStyle = 'solid';
                preview.style.borderWidth = '2px';
                preview.style.borderColor = lineColor;
                preview.style.opacity = geometry.opacity || 1;
            }

            console.log('[LegendManager] ✅ Marker symbol created:', markerType);
        }

            // ========================================
            // CAS 2 : POLYGONE
        // ========================================
        else if (geometry.type === 'Polygon') {
            preview = document.createElement('div');
            preview.className = 'legend-symbol-preview';
            preview.style.width = '24px';
            preview.style.height = '24px';
            preview.style.backgroundColor = geometry.color || '#3388ff';
            preview.style.borderStyle = geometry.lineDash === 'dashed' ? 'dashed' : 'solid';
            preview.style.borderWidth = '2px';
            preview.style.borderColor = geometry.lineColor || '#000000';
            preview.style.opacity = geometry.opacity || 1;
            preview.style.borderRadius = '2px';
            preview.style.display = 'flex';
            preview.style.alignItems = 'center';
            preview.style.justifyContent = 'center';

            console.log('[LegendManager] ✅ Polygon symbol created');
        }

            // ========================================
            // CAS 3 : MARQUEUR PERSONNALISÉ (ancien format)
        // ========================================
        else if (geometry.type === 'CustomMarker') {
            preview = document.createElement('div');
            preview.className = 'legend-symbol-preview';
            preview.style.width = '24px';
            preview.style.height = '24px';
            preview.style.backgroundColor = geometry.color || '#3388ff';
            preview.style.borderStyle = 'solid';
            preview.style.borderWidth = '2px';
            preview.style.borderColor = geometry.lineColor || '#000000';
            preview.style.opacity = geometry.opacity || 1;
            preview.style.display = 'flex';
            preview.style.alignItems = 'center';
            preview.style.justifyContent = 'center';

            // Forme selon geometry.shape
            if (geometry.shape === 'circle') {
                preview.style.borderRadius = '50%';
            } else if (geometry.shape === 'triangle') {
                preview.style.width = '0';
                preview.style.height = '0';
                preview.style.borderLeft = '12px solid transparent';
                preview.style.borderRight = '12px solid transparent';
                preview.style.borderBottom = `24px solid ${geometry.color || '#3388ff'}`;
                preview.style.backgroundColor = 'transparent';
                preview.style.borderColor = 'transparent';
            } else if (geometry.shape === 'square') {
                preview.style.borderRadius = '0';
            }

            console.log('[LegendManager] ✅ CustomMarker symbol created:', geometry.shape);
        }

            // ========================================
            // CAS 4 : POLYLINE (ligne ou flèche)
        // ========================================
        else if (geometry.type === 'Polyline' || geometry.arrowType) {
            preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            preview.setAttribute('width', '24');
            preview.setAttribute('height', '24');
            preview.setAttribute('viewBox', '0 0 24 24');
            preview.setAttribute('class', 'legend-symbol-preview');

            // Créer la ligne
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '2');
            line.setAttribute('y1', '12');
            line.setAttribute('x2', '22');
            line.setAttribute('y2', '12');
            line.setAttribute('stroke', geometry.lineColor || '#000000');
            line.setAttribute('stroke-width', Math.min(geometry.lineWeight || 2, 3));

            // Appliquer le style de pointillé
            if (geometry.lineDash === 'dashed') {
                line.setAttribute('stroke-dasharray', '4,4');
            } else if (geometry.lineDash === 'dotted') {
                line.setAttribute('stroke-dasharray', '1,3');
            }

            preview.appendChild(line);

            // ✅ Ajouter une flèche si applicable
            if (geometry.arrowType === 'arrow' || geometry.arrowType === 'doubleArrow') {
                // Flèche avant (droite)
                const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                arrowhead.setAttribute('points', '22,12 18,9 18,15');
                arrowhead.setAttribute('fill', geometry.lineColor || '#000000');
                preview.appendChild(arrowhead);

                // Flèche arrière (gauche) si double
                if (geometry.arrowType === 'doubleArrow') {
                    const arrowhead2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    arrowhead2.setAttribute('points', '2,12 6,9 6,15');
                    arrowhead2.setAttribute('fill', geometry.lineColor || '#000000');
                    preview.appendChild(arrowhead2);
                }
            }

            console.log('[LegendManager] ✅ Polyline/Arrow symbol created:', geometry.arrowType);
        }

            // ========================================
            // CAS PAR DÉFAUT
        // ========================================
        else {
            console.warn('[LegendManager] ⚠️ Unknown geometry type:', geometry.type, '→ using default square');
            preview = document.createElement('div');
            preview.className = 'legend-symbol-preview';
            preview.style.width = '24px';
            preview.style.height = '24px';
            preview.style.backgroundColor = geometry.color || '#3388ff';
            preview.style.borderStyle = 'solid';
            preview.style.borderWidth = '2px';
            preview.style.borderColor = geometry.lineColor || '#000000';
            preview.style.opacity = geometry.opacity || 1;
        }

        container.appendChild(preview);
        return container;
    }


    /**
     * ✅ Configure l'édition du titre par double-clic
     */
    _setupPartTitleEdit(titleElement, partId) {
        console.log('[LegendManager] Setting up title edit for part:', partId);

        // Empêcher le drag & drop sur le titre
        titleElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        titleElement.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        // Double-clic pour activer l'édition
        titleElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();

            console.log('[LegendManager] Double-click on title, entering edit mode');
            console.log('[LegendManager] Disabling drag & drop...');

            // Désactiver temporairement le drag & drop
            this.legendOrganizer.disable();

            titleElement.setAttribute('contenteditable', 'true');
            titleElement.classList.add('editing');
            titleElement.focus();

            // Sélectionner tout le texte
            const range = document.createRange();
            range.selectNodeContents(titleElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            console.log('[LegendManager] Title editing activated');
        });

        // Blur (perte de focus) pour sauvegarder
        titleElement.addEventListener('blur', () => {
            console.log('[LegendManager] Title blur event - saving and re-enabling drag & drop');

            titleElement.setAttribute('contenteditable', 'false');
            titleElement.classList.remove('editing');

            const newTitle = titleElement.textContent.trim();
            if (newTitle) {
                this.stateManager.updatePartTitle(partId, newTitle);
                console.log('[LegendManager] Title updated:', newTitle);
            } else {
                // Restaurer le titre si vide
                const part = this.stateManager.legendParts.find(p => p.id === partId);
                if (part) {
                    titleElement.textContent = part.title;
                }
            }

            // ✅ CRUCIAL : Réactiver le drag & drop
            console.log('[LegendManager] Re-enabling drag & drop...');
            this.legendOrganizer.enable();
            console.log('[LegendManager] Drag & drop should be re-enabled');
        });

        // Gestion des touches clavier
        titleElement.addEventListener('keydown', (e) => {
            // Enter : valider
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('[LegendManager] Enter pressed - triggering blur');
                titleElement.blur();
            }
            // Escape : annuler
            if (e.key === 'Escape') {
                e.preventDefault();
                console.log('[LegendManager] Escape pressed - cancelling edit');
                const part = this.stateManager.legendParts.find(p => p.id === partId);
                if (part) {
                    titleElement.textContent = part.title;
                }
                titleElement.blur();
            }
        });
    }

    /**
     * ✅ Configure l'édition du titre d'une sous-partie
     */
    _setupSubPartTitleEdit(titleElement, partId, subPartId) {
        titleElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            titleElement.setAttribute('contenteditable', 'true');
            titleElement.focus();
        });

        titleElement.addEventListener('blur', () => {
            titleElement.setAttribute('contenteditable', 'false');
            const newTitle = titleElement.textContent.trim();
            if (newTitle) {
                this.stateManager.updateSubPartTitle(partId, subPartId, newTitle);
            }
        });

        titleElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleElement.blur();
            }
        });
    }

    /**
     * ✅ Active le mode édition pour un titre de sous-partie
     */
    _enterSubPartEditMode(titleElement, editIcon, partId, subPartId) {
        console.log('[LegendManager] Entering edit mode for sub-part:', subPartId);

        this.legendOrganizer.disable();
        editIcon.style.display = 'none';

        titleElement.setAttribute('contenteditable', 'true');
        titleElement.classList.add('editing'); // Utiliser la même classe pour un style cohérent
        titleElement.style.cursor = 'text';
        titleElement.focus();

        const range = document.createRange();
        range.selectNodeContents(titleElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const exitEditMode = () => {
            titleElement.setAttribute('contenteditable', 'false');
            titleElement.classList.remove('editing');
            titleElement.style.cursor = 'default';
            editIcon.style.display = '';

            const newTitle = titleElement.textContent.trim();
            if (newTitle) {
                this.stateManager.updateSubPartTitle(partId, subPartId, newTitle);
            }
            this.legendOrganizer.enable();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleElement.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                const part = this.stateManager.legendParts.find(p => p.id === partId);
                const subPart = part?.subParts.find(sp => sp.id === subPartId);
                if (subPart) titleElement.textContent = subPart.title;
                titleElement.blur();
            }
        };

        titleElement.addEventListener('blur', exitEditMode, { once: true });
        titleElement.addEventListener('keydown', handleKeyDown);
        titleElement.addEventListener('blur', () => titleElement.removeEventListener('keydown', handleKeyDown), { once: true });
    }

    /**
     * ✅ Ajoute une nouvelle partie avec numération romaine
     * La première partie (I) est créée à l'initialisation
     * Les clics successifs créent II, III, IV, etc.
     */
    _addNewPart() {
        const partNumber = this.stateManager.legendParts.length + 1;
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        // Utiliser la numérotation romaine, ou fallback si > 10
        const title = romanNumerals[partNumber - 1] || `Partie ${partNumber}`;

        this.stateManager.addLegendPart(title);
        console.log('[LegendManager] New part added:', title);
    }


    /**
     * ✅ Crée la section Non classés
     */
    _createUnclassifiedSection() {
        const unclassifiedSection = document.createElement('div');
        unclassifiedSection.className = 'legend-unclassified';
        unclassifiedSection.innerHTML = '<div class="legend-unclassified-title">📋 Non classés</div>';

        const dropZone = document.createElement('div');
        dropZone.className = 'legend-drop-zone';
        dropZone.setAttribute('data-category-id', 'unclassified');

        // Récupérer les géométries non classées
        const unclassifiedIndices = this.stateManager.getUnclassifiedGeometries();

        if (unclassifiedIndices.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'text-muted small';
            emptyMsg.style.padding = '10px';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.textContent = 'Aucun élément';
            dropZone.appendChild(emptyMsg);
        } else {
            unclassifiedIndices.forEach(index => {
                const geometry = this.stateManager.geometries[index];
                if (geometry) {
                    const item = this._createLegendItem(geometry, index);
                    dropZone.appendChild(item);
                }
            });
        }

        unclassifiedSection.appendChild(dropZone);
        return unclassifiedSection;
    }




    /**
     * ✅ Crée un item de légende
     */
    _createLegendItem(geometry, index) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.dataset.geometryId = geometry.id;
        item.dataset.geometryIndex = index;
        item.draggable = true;
        item.style.display = 'block'; // ✅ AFFICHER

        // Symbole
        const symbol = this.createLegendSymbol(geometry);
        if (symbol) {
            item.appendChild(symbol);
        }

        // Nom de la géométrie (éditable)
        const nameLabel = document.createElement('span');
        nameLabel.className = 'legend-item-name';
        nameLabel.textContent = geometry.name || 'Géométrie sans nom';
        nameLabel.contentEditable = 'true';
        nameLabel.style.cursor = 'text';
        nameLabel.addEventListener('blur', () => {
            geometry.name = nameLabel.textContent;
            this.stateManager.updateUI();
        });

        item.appendChild(nameLabel);

        // Bouton de suppression
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'legend-item-delete';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Supprimer';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.stateManager.deleteGeometry(index);
        });

        item.appendChild(deleteBtn);

        return item;
    }

    /**
     * Crée le symbole selon le type de géométrie
     */
    _createSymbol(geometry) {
        const symbol = document.createElement('div');
        symbol.className = 'legend-symbol';

        // POLYLINES (LIGNES)
        if (geometry.type === 'Polyline') {
            symbol.style.width = '40px';
            symbol.style.height = `${geometry.lineWeight || 2}px`;
            symbol.style.backgroundColor = geometry.lineColor || '#000000';
            symbol.style.border = 'none';
            symbol.style.opacity = geometry.opacity || 1;
            symbol.style.borderRadius = '0';

            // Style de ligne
            if (geometry.lineDash && geometry.lineDash !== 'solid') {
                symbol.style.backgroundImage = this._getLineDashPattern(geometry.lineDash, geometry.lineColor || '#000000');
                symbol.style.backgroundColor = 'transparent';
            }

            // Flèches
            if (geometry.arrowType === 'arrow' || geometry.arrowType === 'doubleArrow') {
                symbol.style.position = 'relative';

                // Flèche de fin
                const endArrow = document.createElement('div');
                endArrow.style.cssText = `
                    position: absolute;
                    right: -5px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: 0;
                    border-left: 5px solid ${geometry.lineColor || '#000000'};
                    border-top: 3px solid transparent;
                    border-bottom: 3px solid transparent;
                `;
                symbol.appendChild(endArrow);

                // Flèche de début (double arrow)
                if (geometry.arrowType === 'doubleArrow') {
                    const startArrow = document.createElement('div');
                    startArrow.style.cssText = `
                        position: absolute;
                        left: -5px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 0;
                        height: 0;
                        border-right: 5px solid ${geometry.lineColor || '#000000'};
                        border-top: 3px solid transparent;
                        border-bottom: 3px solid transparent;
                    `;
                    symbol.appendChild(startArrow);
                }
            }
        }
        // MARQUEURS PERSONNALISÉS
        else if (geometry.type === 'CustomMarker') {
            const markerSize = geometry.markerSize || 24;
            const legendSize = markerSize / 1.5;

            symbol.style.width = `${legendSize}px`;
            symbol.style.height = `${legendSize}px`;
            symbol.style.backgroundColor = geometry.color || '#007bff';
            symbol.style.border = `${geometry.lineWeight || 2}px ${this._getLineStyle(geometry.lineDash)} ${geometry.lineColor || '#000000'}`;
            symbol.style.opacity = geometry.opacity || 1;

            // Formes spécifiques
            symbol.classList.add(geometry.shape || 'circle');
        }
        // AUTRES FORMES (Polygon, Circle, etc.)
        else {
            const height = 24;
            const width = height * 1.5;

            symbol.style.width = `${width}px`;
            symbol.style.height = `${height}px`;
            symbol.style.backgroundColor = geometry.color || '#007bff';
            symbol.style.border = `${geometry.lineWeight || 2}px ${this._getLineStyle(geometry.lineDash)} ${geometry.lineColor || '#000000'}`;
            symbol.style.opacity = geometry.opacity || 1;
            symbol.style.borderRadius = '4px';
        }

        return symbol;
    }

    /**
     * Retourne le style de ligne CSS
     */
    _getLineStyle(lineDash) {
        switch (lineDash) {
            case 'solid': return 'solid';
            case 'dashed': return 'dashed';
            case 'dotted': return 'dotted';
            default: return 'solid';
        }
    }

    /**
     * Retourne le pattern CSS pour les lignes pointillées/tirets
     */
    _getLineDashPattern(lineDash, color) {
        switch (lineDash) {
            case 'dashed':
                return `repeating-linear-gradient(90deg, ${color} 0, ${color} 5px, transparent 5px, transparent 10px)`;
            case 'dotted':
                return `repeating-linear-gradient(90deg, ${color} 0, ${color} 2px, transparent 2px, transparent 6px)`;
            default:
                return 'none';
        }
    }

    /**
     * ✅ Crée une colonne pour une partie avec icône d'édition
     */
    _createPartColumn(part) {
        const column = document.createElement('div');
        column.className = 'legend-part';
        column.setAttribute('data-part-id', part.id);

        // ✅ Container pour titre + icône
        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '8px';

        // Titre éditable (NON draggable)
        const title = document.createElement('div');
        title.className = 'legend-part-title';
        title.textContent = part.title;
        title.setAttribute('contenteditable', 'false');
        title.setAttribute('draggable', 'false');
        title.style.flex = '1';
        title.style.cursor = 'default'; // Pas de cursor text par défaut

        // ✅ Icône d'édition cliquable
        const editIcon = document.createElement('span');
        editIcon.className = 'legend-part-edit-icon';
        editIcon.textContent = '✏️';
        editIcon.title = 'Cliquer pour éditer le titre';
        editIcon.style.cursor = 'pointer';
        editIcon.style.fontSize = '14px';
        editIcon.style.opacity = '0.6';
        editIcon.style.transition = 'opacity 0.2s';

        editIcon.addEventListener('mouseenter', () => {
            editIcon.style.opacity = '1';
        });

        editIcon.addEventListener('mouseleave', () => {
            editIcon.style.opacity = '0.6';
        });

        // ✅ Clic sur l'icône pour activer l'édition
        editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('[LegendManager] Edit icon clicked for part:', part.id);
            this._enterEditMode(title, editIcon, part.id);
        });

        // Bouton pour ajouter une sous-partie
        const addSubPartBtn = document.createElement('button');
        addSubPartBtn.className = 'legend-add-subpart-btn';
        addSubPartBtn.textContent = '+';
        addSubPartBtn.title = 'Ajouter une sous-partie';
        addSubPartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Si c'est la première fois, on en crée deux
            const count = part.subParts.length === 0 ? 2 : 1;
            this.stateManager.addLegendSubPart(part.id, count);
        });

        titleContainer.appendChild(title);
        titleContainer.appendChild(editIcon);

        // Bouton supprimer
        const controls = document.createElement('div');
        controls.className = 'legend-part-controls';
        controls.innerHTML = `
        <button class="legend-part-delete-btn" data-part-id="${part.id}" title="Supprimer cette partie">🗑️</button>
    `;
        controls.prepend(addSubPartBtn); // Ajouter le bouton '+'

        const deleteBtn = controls.querySelector('.legend-part-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Supprimer la partie "${part.title}" ?\nLes figurés retourneront dans "Non classés".`)) {
                this.stateManager.deleteLegendPart(part.id);
            }
        });

        column.appendChild(titleContainer);
        column.appendChild(controls);

        // ✅ Gérer l'affichage des sous-parties ou de la zone de dépôt principale
        if (part.subParts && part.subParts.length > 0) {
            const subPartsContainer = document.createElement('div');
            subPartsContainer.className = 'legend-subparts-container';
            part.subParts.forEach(subPart => {
                const subPartDiv = document.createElement('div');
                subPartDiv.className = 'legend-subpart';

                // ✅ Conteneur pour le titre et l'icône d'édition
                const subPartTitleContainer = document.createElement('div');
                subPartTitleContainer.className = 'legend-subpart-title-container';

                const subPartTitleElement = document.createElement('div');
                subPartTitleElement.className = 'legend-subpart-title';
                subPartTitleElement.textContent = subPart.title;

                const subPartEditIcon = document.createElement('span');
                subPartEditIcon.className = 'legend-part-edit-icon'; // Réutiliser le style de l'icône principale
                subPartEditIcon.textContent = '✏️';
                subPartEditIcon.title = 'Éditer le titre de la sous-partie';
                subPartEditIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._enterSubPartEditMode(subPartTitleElement, subPartEditIcon, part.id, subPart.id);
                });

                const subPartDropZone = document.createElement('div');
                subPartDropZone.className = 'legend-drop-zone';
                subPartDropZone.setAttribute('data-subpart-id', subPart.id); // ID de sous-partie

                subPart.geometries.forEach(geomIndex => {
                    const item = this._createLegendItem(this.stateManager.geometries[geomIndex], geomIndex);
                    subPartDropZone.appendChild(item);
                });

                subPartTitleContainer.appendChild(subPartTitleElement);
                subPartTitleContainer.appendChild(subPartEditIcon);
                subPartDiv.appendChild(subPartTitleContainer);
                subPartDiv.appendChild(subPartDropZone);
                subPartsContainer.appendChild(subPartDiv);
            });
            column.appendChild(subPartsContainer);
        } else {
            // S'il n'y a pas de sous-parties, on affiche la zone de dépôt principale
            const mainDropZone = document.createElement('div');
            mainDropZone.className = 'legend-drop-zone';
            mainDropZone.setAttribute('data-part-id', part.id); // ID de partie

            if (part.geometries && part.geometries.length > 0) {
                part.geometries.forEach(geomIndex => {
                    const item = this._createLegendItem(this.stateManager.geometries[geomIndex], geomIndex);
                    mainDropZone.appendChild(item);
                });
            } else {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'text-muted small legend-empty-message';
                emptyMsg.textContent = 'Vide';
                mainDropZone.appendChild(emptyMsg);
            }
            column.appendChild(mainDropZone);
        }

        console.log('[LegendManager] Part column created with edit icon:', part.id);

        return column;
    }

    /**
     * ✅ Active le mode édition du titre
     */
    _enterEditMode(titleElement, editIcon, partId) {
        console.log('[LegendManager] Entering edit mode for part:', partId);

        // Désactiver drag & drop temporairement
        this.legendOrganizer.disable();

        // Masquer l'icône d'édition
        editIcon.style.display = 'none';

        // Activer l'édition
        titleElement.setAttribute('contenteditable', 'true');
        titleElement.classList.add('editing');
        titleElement.style.cursor = 'text';
        titleElement.focus();

        // Sélectionner tout le texte
        const range = document.createRange();
        range.selectNodeContents(titleElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        console.log('[LegendManager] Title edit mode activated');

        // ✅ Gérer la sortie du mode édition
        const exitEditMode = () => {
            console.log('[LegendManager] Exiting edit mode');

            titleElement.setAttribute('contenteditable', 'false');
            titleElement.classList.remove('editing');
            titleElement.style.cursor = 'default';

            // Réafficher l'icône
            editIcon.style.display = '';

            const newTitle = titleElement.textContent.trim();
            if (newTitle) {
                this.stateManager.updatePartTitle(partId, newTitle);
                console.log('[LegendManager] Title updated:', newTitle);
            } else {
                // Restaurer le titre si vide
                const part = this.stateManager.legendParts.find(p => p.id === partId);
                if (part) {
                    titleElement.textContent = part.title;
                }
            }

            // Réactiver drag & drop
            this.legendOrganizer.enable();
            console.log('[LegendManager] Drag & drop re-enabled');
        };

        // Blur : sauvegarder
        titleElement.addEventListener('blur', exitEditMode, { once: true });

        // Enter : valider
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleElement.blur();
            }
            // Escape : annuler
            if (e.key === 'Escape') {
                e.preventDefault();
                const part = this.stateManager.legendParts.find(p => p.id === partId);
                if (part) {
                    titleElement.textContent = part.title;
                }
                titleElement.blur();
            }
        };

        titleElement.addEventListener('keydown', handleKeyDown);

        // Nettoyer le listener après blur
        titleElement.addEventListener('blur', () => {
            titleElement.removeEventListener('keydown', handleKeyDown);
        }, { once: true });
    }

    /**
     * ✅ Configure le drag and drop
     */
    setupDragAndDrop() {
        const legendContainer = document.getElementById('legend');
        if (!legendContainer) {
            console.warn('[LegendManager] Legend container not found for drag setup');
            return;
        }

        const draggableItems = legendContainer.querySelectorAll('.legend-item[draggable="true"]');
        const dropZones = legendContainer.querySelectorAll('.legend-items-list');

        console.log('[LegendManager] Found', draggableItems.length, 'draggable items');
        console.log('[LegendManager] Found', dropZones.length, 'drop zones');

        // ✅ Configurer les items draggables
        draggableItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('itemId', item.dataset.geometryId);
                item.style.opacity = '0.5';
                console.log('[LegendManager] Drag start:', item.dataset.geometryId);
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });
        });

        // ✅ Configurer les zones de dépôt
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
            });

            zone.addEventListener('dragleave', (e) => {
                if (e.target === zone) {
                    zone.style.backgroundColor = '';
                }
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const itemId = e.dataTransfer.getData('itemId');
                const partName = zone.closest('.legend-part')?.dataset.partName || 'unclassified';

                console.log('[LegendManager] Drop detected: item', itemId, '→ part', partName);

                const geometry = this.stateManager.geometries.find(g => g.id === parseInt(itemId));
                if (geometry) {
                    this.stateManager.geometryToPart.set(geometry.id, partName);
                    console.log('[LegendManager] ✅ Geometry moved to part:', partName);
                    this.updateLegend();
                }

                zone.style.backgroundColor = '';
            });
        });

        console.log('[LegendManager] ✅ setupDragAndDrop() completed successfully');
    }

    /**
     * ✅ Méthode publique pour rafraîchir le drag & drop
     */
    refreshDragAndDrop() {
        this.legendOrganizer.refresh();
    }

    /**
     * ✅ Méthode publique pour désactiver le drag & drop
     */
    disableDragAndDrop() {
        this.legendOrganizer.disable();
    }

    /**
     * ✅ Réactive le drag & drop avec logs
     */
    enable() {
        console.log('[LegendOrganizer] ========== enable() START ==========');

        const legendItems = document.querySelectorAll('.legend-item');
        console.log('[LegendOrganizer] Found', legendItems.length, 'items to enable');

        legendItems.forEach((item, index) => {
            const wasDraggable = item.getAttribute('draggable');
            item.setAttribute('draggable', 'true');
            const nowDraggable = item.getAttribute('draggable');
            console.log(`[LegendOrganizer] Item ${index}: ${wasDraggable} → ${nowDraggable}`);
        });

        console.log('[LegendOrganizer] Drag and drop enabled');
        console.log('[LegendOrganizer] ========== enable() END ==========');
    }

}
