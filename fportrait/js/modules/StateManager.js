// StateManager.js



import { SVGUtils } from './utils/SVGUtils.js';



export class StateManager {



    constructor() {

        console.log('[StateManager] Initializing StateManager...');

        this.geometries = [];

        this.selectedIndex = null;

        this.mapManager = null;

        this.legendManager = null;

        this.mapTitle = '';

        this.isTitlePanelCollapsed = false;

        this.temporarySVGs = new Map();

        this.isEditMarkersMode = false;



        // ✅ Gestion des parties de légende

        this.legendParts = [];

        this.geometryToPart = new Map();

        this.exportImportManager = null;
        this.curveControlManager = null;


    }



    /**

     * Active ou désactive le mode d'édition des marqueurs.

     */

    toggleEditMarkersMode() {

        this.isEditMarkersMode = !this.isEditMarkersMode;

        console.log('[StateManager] Edit Markers mode toggled:', this.isEditMarkersMode);

        if (this.isEditMarkersMode) {

            this.mapManager.enableEditMarkersMode();

        } else {

            this.mapManager.disableEditMarkersMode();

        }

    }



    /**

     * Définit la référence au MapManager.

     */

    setMapManager(mapManager) {

        this.mapManager = mapManager;

        console.log('[StateManager] MapManager set:', mapManager);

    }



    /**

     * Définit la référence au LegendManager.

     */

    setLegendManager(legendManager) {

        this.legendManager = legendManager;

        console.log('[StateManager] LegendManager set:', legendManager);

    }


    addGeometry(geometryObject) {
        // ✅ CORRECTION ARCHITECTURALE : La méthode accepte maintenant un seul objet géométrie.
        if (!geometryObject || !geometryObject.layer || !geometryObject.type) {
            console.error('[StateManager] ❌ addGeometry called with invalid object:', geometryObject);
            return;
        }

        const finalName = geometryObject.name || `Géométrie ${this.geometries.length + 1}`;
        geometryObject.name = finalName;

        // ✅ GÉNÉRER UN ID STABLE
        const stableId = geometryObject.layer._leaflet_id || `geom_${Date.now()}_${this.geometries.length}`;
        if (!geometryObject.layer._leaflet_id) {
            geometryObject.layer._leaflet_id = stableId;
        }

        geometryObject.id = stableId;

        // ✅ CRITIQUE : Copier arrowType depuis layer vers geometry
        if (geometryObject.layer._arrowType) {
            geometryObject.arrowType = geometryObject.layer._arrowType;
            console.log('[StateManager] 🎯 Arrow type detected and copied:', geometryObject.arrowType);
        }

        this.geometries.push(geometryObject);
        console.log('[StateManager] 🆕 Geometry added:', finalName, 'type:', geometryObject.type, 'arrowType:', geometryObject.arrowType || 'none', 'ID:', stableId);

        // ✅ FIX CRITIQUE: Utiliser 'geometryObject' et non 'geometry'
        if (this.symbolPaletteManager) {
            this.symbolPaletteManager.onGeometryAdded(geometryObject);
        }

        this.updateUI();
    }


    deleteGeometry(index) {
        console.log('[StateManager] deleteGeometry START');
        console.log('[StateManager] Deleting geometry at index', index);

        if (index < 0 || index >= this.geometries.length) {
            console.warn('[StateManager] Invalid geometry index', index);
            console.log('[StateManager] deleteGeometry END');
            return;
        }

        const geometry = this.geometries[index];
        const geometryName = geometry.name || 'Sans nom';
        const geometryType = geometry.type;

        console.log('[StateManager] Geometry to delete:', geometryName, 'type:', geometryType);

        // ✅ ÉTAPE 0 (NOUVEAU): NETTOYER LES FLÈCHES SVG AVANT TOUT
        console.log('[StateManager] Step 0: Cleaning up arrow SVG elements...');
        if (geometry.layer && (geometry.arrowType || geometry.layer.arrowType)) {
            console.log('[StateManager] Arrow detected - calling SVGUtils.cleanupArrowheads');
            try {
                SVGUtils.cleanupArrowheads(geometry.layer);
                console.log('[StateManager] ✅ Arrow SVG elements cleaned');
            } catch (error) {
                console.error('[StateManager] ❌ Error cleaning arrow SVG:', error.message);
            }
        }

        // ÉTAPE 1: NOTIFIER LE SYMBOL PALETTE MANAGER
        console.log('[StateManager] Step 1: Notifying SymbolPaletteManager...');
        if (this.symbolPaletteManager && geometry) {
            console.log('[StateManager] Calling onGeometryRemoved');
            this.symbolPaletteManager.onGeometryRemoved(geometry);
            console.log('[StateManager] SymbolPaletteManager notified');
        }

        // ÉTAPE 2: RETIRER LA LAYER DE LA CARTE
        console.log('[StateManager] Step 2: Removing layer from map...');
        if (geometry.layer) {
            // Retirer du LayerGroupManager
            if (this.mapManager && this.mapManager.layerGroupManager) {
                this.mapManager.layerGroupManager.removeLayer(geometry.layer);
                console.log('[StateManager] Layer removed from LayerGroupManager');
            }

            // Retirer de la carte Leaflet
            if (this.mapManager && this.mapManager.map) {
                if (this.mapManager.map.hasLayer(geometry.layer)) {
                    this.mapManager.map.removeLayer(geometry.layer);
                    console.log('[StateManager] Layer removed from Leaflet map');
                }
            }
        }

        // ÉTAPE 3: RETIRER DE LA LÉGENDE
        console.log('[StateManager] Step 3: Removing from legend parts...');
        if (this.geometryToPart.has(index)) {
            const partId = this.geometryToPart.get(index);
            const part = this.legendParts.find(p => p.id === partId);

            if (part) {
                const oldLength = part.geometries.length;
                part.geometries = part.geometries.filter(i => i !== index);
                console.log('[StateManager] Removed from part', part.title, oldLength, '->', part.geometries.length);
            }

            this.geometryToPart.delete(index);
            console.log('[StateManager] Removed from geometryToPart mapping');
        }

        // ÉTAPE 4: SUPPRIMER DU TABLEAU PRINCIPAL
        console.log('[StateManager] Step 4: Removing from geometries array...');
        this.geometries.splice(index, 1);
        console.log('[StateManager] Geometry removed from array');

        // ÉTAPE 5: RÉINDEXER geometryToPart
        console.log('[StateManager] Step 5: Reindexing geometryToPart...');
        const updatedMap = new Map();
        this.geometryToPart.forEach((partId, geomIndex) => {
            if (geomIndex > index) {
                updatedMap.set(geomIndex - 1, partId);
            } else if (geomIndex < index) {
                updatedMap.set(geomIndex, partId);
            }
        });
        this.geometryToPart = updatedMap;

        // ÉTAPE 6: RÉINDEXER LES PARTIES
        console.log('[StateManager] Step 6: Reindexing legend parts...');
        this.legendParts.forEach(part => {
            part.geometries = part.geometries
                .filter(i => i !== index)
                .map(i => i > index ? i - 1 : i);
        });

        // ÉTAPE 7: METTRE À JOUR L'INTERFACE
        console.log('[StateManager] Step 7: Updating UI...');
        this.updateUI();

        console.log('[StateManager] Geometry deleted successfully:', geometryName);
        console.log('[StateManager] deleteGeometry END');
    }




    /**

     * Sélectionne une géométrie pour l'édition.

     */

    selectGeometry(index) {

        this.selectedIndex = index;

        console.log('[StateManager] Geometry selected for editing:', this.geometries[index]);

        this.openContextMenu(index);

    }

    /**
     * ✅ POINT D'ENTRÉE UNIQUE pour la mise à jour d'une géométrie.
     * Gère la mise à jour des coordonnées et la reconstruction des flèches.
     * @param {number} index - L'index de la géométrie.
     * @param {L.LatLng[]} newCoords - Les nouvelles coordonnées.
     */
    updateGeometry(index, newCoords) {
        if (index < 0 || index >= this.geometries.length) return;

        const geometry = this.geometries[index];
        console.log(`[StateManager] 🔄 updateGeometry called for index ${index}`);

        // 1. Mettre à jour les coordonnées dans l'état
        geometry.coordinates = newCoords;
        if (geometry.layer) {
            geometry.layer.setLatLngs(newCoords);
        }
        console.log(`   -> Coordonnées mises à jour pour le layer ${geometry.layer?._leaflet_id}`);

        // 2. Si c'est une flèche, la reconstruire proprement
        if (geometry.arrowType && geometry.layer) {
            console.log(`   -> C'est une flèche, reconstruction...`);

            // A. Nettoyer complètement l'ancienne flèche (SVG et écouteurs)
            SVGUtils.cleanupArrowheads(geometry.layer);
            // B. Utiliser requestAnimationFrame pour une reconstruction fluide
            requestAnimationFrame(() => {
                // C. Recréer la flèche SVG avec les styles actuels
                SVGUtils.addArrowheadsToPolylineSVG(geometry.layer, geometry.arrowType);

                // D. S'assurer que la polyline native est masquée et la SVG visible
                if (geometry.layer._path) {
                    geometry.layer._path.style.display = 'none';
                }
                if (geometry.layer._svgPath) {
                    geometry.layer._svgPath.style.display = '';
                }
                console.log(`   -> [rAF] Flèche reconstruite pour le layer ${geometry.layer._leaflet_id}`);
            });
        }

        // 3. Déclencher une mise à jour de l'UI si nécessaire (pour la légende, etc.)
        // On peut utiliser un debounce plus court ici car c'est une mise à jour légère.
        this.updateUI(100);
    }







    /**
     * ✅ VERSION FINALE OPTIMISÉE - Gère flèches ET géométries standards
     * - Reconstruction complète pour les flèches (arrows)
     * - Application directe des styles pour polygones, cercles, etc.
     * - Mise à jour des marqueurs SVG personnalisés
     */
    applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize) {
        console.log('[StateManager] ========== applyStyle() START ==========');
        console.log('[StateManager] selectedIndex:', this.selectedIndex);

        if (this.selectedIndex === null) {
            console.warn('[StateManager] ⚠️ No geometry selected');
            return;
        }

        const geometry = this.geometries[this.selectedIndex];

        if (!geometry) {
            console.error('[StateManager] ❌ ERROR: Geometry missing');
            return;
        }

        console.log('[StateManager] 📝 Geometry:', geometry.name, 'type:', geometry.type, 'arrowType:', geometry.arrowType || 'none');

        // ========================================
        // ÉTAPE 1 : Sauvegarder les nouveaux styles
        // ========================================
        geometry.color = color;
        geometry.lineColor = lineColor;
        geometry.opacity = opacity;
        geometry.lineDash = lineDash;
        geometry.lineWeight = lineWeight;
        console.log('[StateManager] ✅ Styles saved:', {
            color,
            lineColor,
            opacity,
            lineDash,
            lineWeight
        });

        // ========================================
        // ÉTAPE 2 : GESTION DES MARQUEURS SVG PERSONNALISÉS
        // ========================================
        if (geometry.type && geometry.type.startsWith('Marker_')) {
            console.log('[StateManager] 📏 Marker detected - processing markerSize:', markerSize);
            geometry.markerSize = markerSize || 24;

            // Mettre à jour le marqueur SVG
            if (geometry.layer) {
                const markerType = geometry.type.replace('Marker_', '');

                try {
                    const updatedMarker = SVGUtils.createMarkerSVG(markerType, geometry.layer.getLatLng(), {
                        color: color,
                        lineColor: lineColor,
                        opacity: opacity,
                        lineWeight: lineWeight,
                        lineDash: lineDash,
                        markerSize: markerSize
                    });

                    geometry.layer.setIcon(updatedMarker.getIcon());
                    console.log('[StateManager] ✅ Marker style updated');
                } catch (error) {
                    console.error('[StateManager] ❌ ERROR updating marker:', error.message);
                }
            }
        }

        // ========================================
        // ÉTAPE 2.5 : 🔥 RECONSTRUCTION COMPLÈTE DES FLÈCHES
        // ========================================
        console.log('[StateManager] 🔍 Checking arrow conditions:');
        console.log('[StateManager]    - geometry.arrowType:', geometry.arrowType);
        console.log('[StateManager]    - geometry.layer:', !!geometry.layer);
        console.log('[StateManager]    - this.mapManager:', !!this.mapManager);
        console.log('[StateManager]    - Should rebuild:', !!(geometry.arrowType && geometry.layer && this.mapManager));

        if (geometry.arrowType && geometry.layer && this.mapManager) {
            console.log('[StateManager] 🎯 ARROW DETECTED - Full reconstruction');
            console.log('[StateManager] Arrow type:', geometry.arrowType);

            try {
                const map = this.mapManager.map;
                const oldLayer = geometry.layer;
                const arrowType = geometry.arrowType;
                const coords = oldLayer.getLatLngs();
                const wasEditable = oldLayer.pm?.enabled() || false;

                console.log('[StateManager] 📍 Coordinates:', coords.length, 'points');
                console.log('[StateManager] 📍 Was editable:', wasEditable);

                // ✅ A : Désactiver l'édition si active
                if (wasEditable) {
                    oldLayer.pm.disable();
                    console.log('[StateManager] ✅ Editing disabled on old layer');
                }

                // ✅ B : Nettoyer complètement l'ancienne flèche
                SVGUtils.cleanupArrowheads(oldLayer);
                console.log('[StateManager] ✅ SVG artifacts cleaned');

                // ✅ C : Retirer du LayerGroupManager
                if (this.mapManager.layerGroupManager) {
                    this.mapManager.layerGroupManager.removeLayer(oldLayer);
                    console.log('[StateManager] ✅ Removed from LayerGroupManager');
                }

                // ✅ D : Retirer de la carte
                if (oldLayer._map) {
                    map.removeLayer(oldLayer);
                    console.log('[StateManager] ✅ Old layer removed from map');
                }

                // ✅ E : Créer la nouvelle polyline avec les nouveaux styles
                const newOptions = {
                    color: lineColor,
                    weight: lineWeight,
                    opacity: opacity,
                    dashArray: this._convertDashToArray(lineDash),
                    lineJoin: 'round',
                    lineCap: 'round',
                    smoothFactor: 1.0
                };

                console.log('[StateManager] 🔨 Creating new polyline:', newOptions);

                const newLayer = L.polyline(coords, newOptions);

                // ✅ F : Copier les métadonnées critiques
                newLayer._arrowType = arrowType;
                newLayer._leaflet_id = oldLayer._leaflet_id; // ✅ Conserver l'ID stable
                geometry.layer = newLayer; // ✅ Mettre à jour immédiatement

                // ✅ G : Ajouter à la carte
                newLayer.addTo(map);
                console.log('[StateManager] ✅ New polyline added to map');

                // ✅ H : Réenregistrer dans le LayerGroupManager
                if (this.mapManager.layerGroupManager) {
                    this.mapManager.layerGroupManager.addLayer(newLayer);
                    console.log('[StateManager] ✅ Re-registered in LayerGroupManager');
                }

                // ✅ I : Réactiver l'édition si nécessaire
                if (wasEditable) {
                    newLayer.pm.enable({
                        snappable: true,
                        snapDistance: 20
                    });
                    console.log('[StateManager] ✅ Editing re-enabled on new layer');
                }

                // ✅ J : Régénérer les flèches SVG avec requestAnimationFrame
                requestAnimationFrame(() => {
                    console.log('[StateManager] 🔄 [rAF] Building arrow SVG...');

                    const success = SVGUtils.addArrowheadsToPolylineSVG(newLayer, arrowType);

                    if (success) {
                        // Masquer la polyline native
                        if (newLayer._path) {
                            newLayer._path.style.display = 'none';
                        }
                        console.log('[StateManager] ✅ [rAF] Arrow SVG built and native path hidden');
                    } else {
                        console.error('[StateManager] ❌ [rAF] Failed to build arrow SVG');
                    }
                });

                console.log('[StateManager] ✅ Arrow reconstruction complete');

            } catch (error) {
                console.error('[StateManager] ❌ ERROR in arrow rebuild:', error.message);
                console.error('[StateManager] Stack:', error.stack);
            }
        }
            // ========================================
            // ÉTAPE 2.6 : 🎨 APPLICATION DES STYLES POUR LES NON-FLÈCHES
        // ========================================
        else if (geometry.layer && !geometry.arrowType) {
            console.log('[StateManager] 🎨 NON-ARROW geometry detected - Applying styles directly');

            try {
                const layer = geometry.layer;

                // Vérifier si c'est un marqueur (pas de setStyle)
                const isMarker = geometry.type.startsWith('Marker_') || layer instanceof L.Marker;

                if (isMarker) {
                    console.log('[StateManager] 📍 Marker detected - styles already applied in ÉTAPE 2');
                } else {
                    // Construire les options de style pour Polygones, Cercles, etc.
                    const styleOptions = {
                        color: lineColor,
                        fillColor: color,
                        fillOpacity: opacity,
                        weight: lineWeight,
                        opacity: opacity,
                        dashArray: this._convertDashToArray(lineDash)
                    };

                    console.log('[StateManager] 🎨 Applying styles:', styleOptions);

                    // Appliquer le style
                    if (layer.setStyle && typeof layer.setStyle === 'function') {
                        layer.setStyle(styleOptions);
                        console.log('[StateManager] ✅ Styles applied to layer');
                    } else {
                        console.warn('[StateManager] ⚠️ Layer does not support setStyle');
                    }
                }

            } catch (error) {
                console.error('[StateManager] ❌ ERROR applying styles:', error.message);
            }
        }

        // ========================================
        // ÉTAPE 3 : SYNCHRONISER SymbolPaletteManager
        // ========================================
        console.log('[StateManager] 📍 Step 3: Syncing with SymbolPaletteManager...');

        if (this.symbolPaletteManager) {
            try {
                this.symbolPaletteManager.onGeometryUpdated(geometry);
                console.log('[StateManager] ✅ SymbolPaletteManager updated');
            } catch (error) {
                console.error('[StateManager] ❌ ERROR:', error.message);
            }
        }

        // ========================================
        // ÉTAPE 4 : RAFRAÎCHIR LA LÉGENDE
        // ========================================
        console.log('[StateManager] 📍 Step 4: Refreshing legend...');

        if (this.legendManager) {
            try {
                this.legendManager.updateLegend();
                console.log('[StateManager] ✅ Legend refreshed');
            } catch (error) {
                console.error('[StateManager] ❌ ERROR:', error.message);
            }
        }

        console.log('[StateManager] ✅ Style applied successfully');
        console.log('[StateManager] ========== applyStyle() END ==========');
    }
    updateGeometryCoordinates(index, newCoords) {
        this.updateGeometry(index, newCoords);
    }


    /**
     * ✅ Utilitaire : Convertir le type de tiret en format dashArray Leaflet
     */
    _convertDashToArray(lineDash) {
        switch (lineDash) {
            case 'dashed':
                return '10, 10';
            case 'dotted':
                return '2, 6';
            case 'solid':
            default:
                return null;
        }
    }










    /**

     * ✅ Debounce global pour updateUI - évite les appels multiples

     */

    static updateUITimeout = null;

    static updateUIInProgress = false;

    static UPDATE_UI_DEBOUNCE = 100;  // ms



    /**
     * ✅ Met à jour l'interface utilisateur avec debounce
     * ÉTAPES : Géométries → Carte → Légende → SymbolPalette
     */
    updateUI() {
        console.log('[StateManager] ========== updateUI() START ==========');
        console.log('[StateManager] 📍 updateUI called');

        // ✅ DÉBOUNCE : ignorer si déjà en cours
        if (StateManager.updateUIInProgress) {
            console.log('[StateManager] ⏱️ updateUI debounced - already in progress');
            return;
        }

        // ✅ Annuler le timeout précédent
        clearTimeout(StateManager.updateUITimeout);

        // ✅ Marquer comme en cours
        console.log(`[StateManager] ⏳ Démarrage du debounce de ${StateManager.UPDATE_UI_DEBOUNCE}ms pour updateUI.`);
        StateManager.updateUIInProgress = true;

        // ✅ Exécuter après le délai
        StateManager.updateUITimeout = setTimeout(() => {
            console.log('[StateManager] 🔄 Executing updateUI...');

            try {
                // ========================================
                // ÉTAPE 1 : Mettre à jour la liste de géométries
                // ========================================
                console.log('[StateManager] 📍 Step 1: Updating geometry list...');
                try {
                    this.updateGeometryList();
                    console.log('[StateManager] ✅ Geometry list updated');
                } catch (error) {
                    console.error('[StateManager] ❌ Error in updateGeometryList():', error.message);
                }

                // ========================================
                // ÉTAPE 2 : Mettre à jour la carte (redessiner toutes les layers)
                // ========================================
                console.log('[StateManager] 📍 Step 2: Updating map...');
                if (this.mapManager) {
                    try {
                        // ✅ IMPORTANT : Appeler updateMap() SANS paramètres
                        // (les géométries sont déjà dans this.geometries)
                        this.mapManager.updateMap();
                        console.log('[StateManager] ✅ Map updated');
                    } catch (error) {
                        console.error('[StateManager] ❌ Error in MapManager.updateMap():', error.message);
                    }
                } else {
                    console.warn('[StateManager] ⚠️ MapManager not available');
                }

                // ========================================
                // ÉTAPE 3 : Mettre à jour la légende
                // ========================================
                console.log('[StateManager] 📍 Step 3: Updating legend...');
                if (this.legendManager) {
                    try {
                        this.legendManager.updateLegend();
                        console.log('[StateManager] ✅ Legend updated');
                    } catch (error) {
                        console.error('[StateManager] ❌ Error in LegendManager.updateLegend():', error.message);
                    }
                } else {
                    console.warn('[StateManager] ⚠️ LegendManager not available');
                }

                // ========================================
                // ÉTAPE 4 : Mettre à jour le conteneur de symboles (optionnel)
                // ========================================
                console.log('[StateManager] 📍 Step 4: Syncing symbol palette...');
                if (this.symbolPaletteManager) {
                    try {
                        // ✅ Optionnel : refaire la sync si nécessaire
                        console.log('[StateManager] ✅ Symbol palette in sync');
                    } catch (error) {
                        console.error('[StateManager] ❌ Error in SymbolPaletteManager:', error.message);
                    }
                }

                console.log('[StateManager] ✅ UI update complete');
            } catch (error) {
                console.error('[StateManager] ❌ Error during updateUI:', error.message);
                console.error('[StateManager] Stack:', error.stack);
            } finally {
                // ✅ Marquer comme terminé
                console.log('[StateManager] 📍 Resetting updateUI lock');
                StateManager.updateUIInProgress = false;
                console.log('[StateManager] ========== updateUI() END ==========');
            }

        }, StateManager.UPDATE_UI_DEBOUNCE);
    }





    /**

     * ✅ Met à jour la liste des géométries dans le panneau latéral.

     */

    updateGeometryList() {

        console.log('[StateManager] Updating geometry list');

        const geometryList = document.getElementById('geometryList');

        if (!geometryList) {

            console.error('[StateManager] geometryList element not found.');

            return;

        }



        // Vider la liste

        geometryList.innerHTML = '';



        // Créer les éléments pour chaque géométrie

        this.geometries.forEach((geometry, index) => {

            // Créer le conteneur principal

            const listItem = document.createElement('div');

            listItem.className = 'list-item';



            // Input pour le nom

            const nameInput = document.createElement('input');

            nameInput.type = 'text';

            nameInput.className = 'form-control';

            nameInput.value = geometry.name || `Geometry ${index + 1}`;

            nameInput.dataset.index = index;



            // Conteneur des boutons

            const btnGroup = document.createElement('div');

            btnGroup.className = 'btn-group';



            // Bouton Éditer

            const editButton = document.createElement('button');

            editButton.className = 'btn btn-light btn-sm btn-edit';

            editButton.dataset.index = index;

            editButton.title = 'Éditer';

            editButton.textContent = '✏️';



            // Bouton Supprimer

            const deleteButton = document.createElement('button');

            deleteButton.className = 'btn btn-danger btn-sm btn-delete';

            deleteButton.dataset.index = index;

            deleteButton.title = 'Supprimer';

            deleteButton.textContent = '🗑️';



            // Assembler les éléments

            btnGroup.appendChild(editButton);

            btnGroup.appendChild(deleteButton);

            listItem.appendChild(nameInput);

            listItem.appendChild(btnGroup);

            geometryList.appendChild(listItem);



            // ✅ Événements

            nameInput.addEventListener('change', (e) => {

                e.stopPropagation();

                this.geometries[index].name = e.target.value;

                this.updateUI();

                console.log('[StateManager] Geometry renamed:', e.target.value);

            });



            editButton.addEventListener('click', (e) => {

                e.stopPropagation();

                e.preventDefault();

                this.selectGeometry(index);

                console.log('[StateManager] Edit button clicked for geometry:', index);

            });



            deleteButton.addEventListener('click', (e) => {

                e.stopPropagation();

                e.preventDefault();



                if (confirm(`Voulez-vous vraiment supprimer "${geometry.name || 'Geometry ' + (index + 1)}" ?`)) {

                    this.deleteGeometry(index);

                    console.log('[StateManager] Geometry deleted via list button:', index);

                }

            });



            // Empêcher le drag & drop sur les éléments de contrôle

            nameInput.addEventListener('mousedown', (e) => e.stopPropagation());

            editButton.addEventListener('mousedown', (e) => e.stopPropagation());

            deleteButton.addEventListener('mousedown', (e) => e.stopPropagation());

        });



        console.log('[StateManager] Geometry list updated with', this.geometries.length, 'items');

    }



    /**
     * Ouvre le menu contextuel pour éditer une géométrie.
     */
    openContextMenu(index) {
        console.log('[StateManager] Opening context menu for geometry at index:', index);

        const geometry = this.geometries[index];
        const contextMenu = document.getElementById('sheet-context');

        if (!contextMenu) {
            console.error('[StateManager] sheet-context element not found.');
            return;
        }

        // ========================================
        // 1️⃣ AFFICHER LE MENU
        // ========================================
        contextMenu.setAttribute('aria-hidden', 'false');
        
        // S'assurer que le bouton de la Bottom Nav correspondante s'active
        const contextNavBtn = document.querySelector('.bottom-nav .nav-item[data-panel="draw"]');
        if(contextNavBtn) {
            document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
            contextNavBtn.classList.add('active');
        }

        // Notifier le drag manager que le menu est affiché (désactivé sur mobile)
        if (window.contextMenuDragger) {
            // window.contextMenuDragger.onMenuShow();
        }

        console.log('[StateManager] ✅ Context menu displayed');

        // ========================================
        // 2️⃣ APPELER LA MÉTHODE DE REMPLISSAGE
        // ========================================
        if (this.uiManager && typeof this.uiManager.populateContextMenuForGeometry === 'function') {
            console.log('[StateManager] 📝 Calling UIManager.populateContextMenuForGeometry()');
            this.uiManager.populateContextMenuForGeometry(geometry);
            console.log('[StateManager] ✅ Context menu populated');
        } else {
            console.warn('[StateManager] ⚠️ UIManager not available or method not found');

            // ✅ FALLBACK : Remplir manuellement si UIManager n'est pas disponible
            console.log('[StateManager] 🔄 Fallback: Manual fill of context menu');

            const elements = {
                contextColorPicker: document.getElementById('contextColorPicker'),
                contextLineColorPicker: document.getElementById('contextLineColorPicker'),
                contextOpacitySlider: document.getElementById('contextOpacitySlider'),
                contextOpacityValue: document.getElementById('contextOpacityValue'),
                contextLineDash: document.getElementById('contextLineDash'),
                contextLineWeight: document.getElementById('contextLineWeight'),
                contextLineWeightValue: document.getElementById('contextLineWeightValue'),
                contextMarkerSize: document.getElementById('contextMarkerSize'),
                contextMarkerSizeValue: document.getElementById('contextMarkerSizeValue'),
                contextMarkerSizeContainer: document.getElementById('contextMarkerSizeContainer')
            };

            // Vérifier les éléments manquants
            const missingElements = Object.entries(elements)
                .filter(([key, element]) => !element)
                .map(([key]) => key);

            if (missingElements.length > 0) {
                missingElements.forEach(key => {
                    console.warn('[StateManager] Missing element:', key);
                });
            }

            // ========================================
            // Remplir les couleurs
            // ========================================
            if (elements.contextColorPicker) {
                elements.contextColorPicker.value = geometry.color || '#3388ff';
            }
            if (elements.contextLineColorPicker) {
                elements.contextLineColorPicker.value = geometry.lineColor || '#000000';
            }

            // ========================================
            // Remplir l'opacité
            // ========================================
            if (elements.contextOpacitySlider) {
                elements.contextOpacitySlider.value = geometry.opacity || 1;
                if (elements.contextOpacityValue) {
                    elements.contextOpacityValue.textContent = (geometry.opacity || 1).toFixed(1);
                }
            }

            // ========================================
            // Remplir le style de ligne
            // ========================================
            if (elements.contextLineDash) {
                elements.contextLineDash.value = geometry.lineDash || 'solid';
            }

            // ========================================
            // Remplir l'épaisseur de ligne
            // ========================================
            if (elements.contextLineWeight) {
                elements.contextLineWeight.value = geometry.lineWeight || 2;
                if (elements.contextLineWeightValue) {
                    elements.contextLineWeightValue.textContent = geometry.lineWeight || 2;
                }
            }

            // ========================================
            // ✅ GESTION SPÉCIALE : Marqueurs
            // ========================================
            if (geometry.type && geometry.type.startsWith('Marker_')) {
                console.log('[StateManager] 📍 Marker geometry detected:', geometry.type);

                const markerSize = geometry.markerSize || 24;

                // Afficher le conteneur
                if (elements.contextMarkerSizeContainer) {
                    elements.contextMarkerSizeContainer.style.display = 'block';
                    console.log('[StateManager] ✅ Marker size container shown');
                }

                // Remplir le slider
                if (elements.contextMarkerSize) {
                    elements.contextMarkerSize.value = markerSize;
                    console.log('[StateManager] ✅ Marker size slider set to:', markerSize);
                }

                // Remplir l'affichage de la valeur
                if (elements.contextMarkerSizeValue) {
                    elements.contextMarkerSizeValue.textContent = markerSize;
                    console.log('[StateManager] ✅ Marker size value display set to:', markerSize);
                }
            } else {
                // Masquer le conteneur pour les autres géométries
                console.log('[StateManager] 📍 Non-marker geometry:', geometry.type);

                if (elements.contextMarkerSizeContainer) {
                    elements.contextMarkerSizeContainer.style.display = 'none';
                    console.log('[StateManager] ✅ Marker size container hidden');
                }
            }

            console.log('[StateManager] ✅ Context menu populated manually');
        }
    }



    /**

     * Définit le titre de la carte.

     */

    setMapTitle(title) {

        if (typeof title !== 'string') {

            console.error('[StateManager] Invalid title type:', title);

            return;

        }



        this.mapTitle = title;



        const titleInput = document.getElementById('mapTitleInput');

        if (titleInput) {

            titleInput.value = title;

            console.log('[StateManager] Title input updated to:', title);

        }



        const titleDisplay = document.getElementById('mapTitleDisplay');

        if (titleDisplay) {

            titleDisplay.textContent = title || 'Sans titre';

            console.log('[StateManager] Title display updated');

        }



        this.updateUI();

        console.log('[StateManager] Map title updated:', title);

    }



    /**

     * Active l'édition d'une géométrie en préservant son marqueur SVG original.

     */

    startEditingGeometry(index) {

        const geometry = this.geometries[index];

        if (geometry && geometry.type === 'CustomMarker' && geometry.layer) {

            const originalIcon = geometry.layer.getIcon();

            this.temporarySVGs.set(index, originalIcon);



            const defaultIcon = L.icon({

                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

                iconSize: [25, 41],

                iconAnchor: [12, 41]

            });

            geometry.layer.setIcon(defaultIcon);

            console.log('[StateManager] SVG temporarily replaced for editing at index:', index);

        }

    }



    /**

     * Termine l'édition d'une géométrie et restaure son marqueur SVG original.

     */

    finishEditingGeometry(index) {

        const geometry = this.geometries[index];

        if (geometry && this.temporarySVGs.has(index)) {

            const originalIcon = this.temporarySVGs.get(index);

            if (geometry.layer && originalIcon) {

                geometry.layer.setIcon(originalIcon);

                console.log('[StateManager] Original SVG restored at index:', index);

            }

            this.temporarySVGs.delete(index);

        }

    }



    // ==================== MÉTHODES POUR LES PARTIES DE LÉGENDE ====================



    addLegendPart(title = 'Nouvelle partie') {

        const partId = `part-${Date.now()}`;

        // ✅ Chaque partie a maintenant un tableau pour les sous-parties
        const part = { id: partId, title: title, geometries: [], subParts: [] };
        this.legendParts.push(part);

        this.updateUI();

        console.log('[StateManager] Legend part added:', part);

        return partId;

    }



    updatePartTitle(partId, newTitle) {

        const part = this.legendParts.find(p => p.id === partId);

        if (part) {

            part.title = newTitle;

            this.updateUI();

            console.log('[StateManager] Part title updated:', partId, newTitle);

        }

    }



    deleteLegendPart(partId) {

        const partIndex = this.legendParts.findIndex(p => p.id === partId);

        if (partIndex !== -1) {

            this.legendParts[partIndex].geometries.forEach(geomIndex => {

                this.geometryToPart.delete(geomIndex);

            });

            this.legendParts.splice(partIndex, 1);

            this.updateUI();

            console.log('[StateManager] Part deleted:', partId);

        }

    }



    assignGeometryToPart(geometryIndex, partId) {
        // ✅ Logique améliorée pour gérer les sous-parties
        const oldPartId = this.geometryToPart.get(geometryIndex);
        if (oldPartId) {
            // Retirer de l'ancienne position (partie ou sous-partie)
            for (const part of this.legendParts) {
                if (part.id === oldPartId) {
                    part.geometries = part.geometries.filter(i => i !== geometryIndex);
                    break;
                }
                const subPart = part.subParts.find(sp => sp.id === oldPartId);
                if (subPart) {
                    subPart.geometries = subPart.geometries.filter(i => i !== geometryIndex);
                    break;
                }
            }
        }

        if (partId) {
            this.geometryToPart.set(geometryIndex, partId);
            // Ajouter à la nouvelle position (partie ou sous-partie)
            let assigned = false;
            for (const part of this.legendParts) {
                if (part.id === partId) {
                    if (!part.geometries.includes(geometryIndex)) part.geometries.push(geometryIndex);
                    assigned = true;
                    break;
                }
                const subPart = part.subParts.find(sp => sp.id === partId);
                if (subPart) {
                    if (!subPart.geometries.includes(geometryIndex)) subPart.geometries.push(geometryIndex);
                    assigned = true;
                    break;
                }
            }
        } else {
            this.geometryToPart.delete(geometryIndex);
        }

        this.updateUI();
        console.log(`[StateManager] Geometry ${geometryIndex} assigned to target ID:`, partId);
    }

    // ==================== NOUVELLES MÉTHODES POUR LES SOUS-PARTIES ====================

    addLegendSubPart(partId, count = 1) {
        const part = this.legendParts.find(p => p.id === partId);
        if (!part) return;

        for (let i = 0; i < count; i++) {
            const subPartId = `subpart-${Date.now()}-${i}`;
            const subPartTitle = String.fromCharCode(65 + part.subParts.length); // A, B, C...
            part.subParts.push({ id: subPartId, title: subPartTitle, geometries: [] });
        }

        this.updateUI();
        console.log(`[StateManager] ${count} sub-part(s) added to part:`, partId);
    }

    updateSubPartTitle(partId, subPartId, newTitle) {
        const part = this.legendParts.find(p => p.id === partId);
        if (part) {
            const subPart = part.subParts.find(sp => sp.id === subPartId);
            if (subPart) {
                subPart.title = newTitle;
                this.updateUI();
                console.log(`[StateManager] Sub-part title updated: ${subPartId} -> ${newTitle}`);
            }
        }
    }

    /**
     * ✅ Supprime une sous-partie complètement
     */
    deleteLegendSubPart(partId, subPartId) {
        const part = this.legendParts.find(p => p.id === partId);
        if (!part) return;

        const subPartIndex = part.subParts.findIndex(sp => sp.id === subPartId);
        if (subPartIndex !== -1) {
            // Récupérer tous les géométries de la sous-partie
            const subPart = part.subParts[subPartIndex];
            subPart.geometries.forEach(geomIndex => {
                this.geometryToPart.delete(geomIndex);
            });

            // Supprimer la sous-partie
            part.subParts.splice(subPartIndex, 1);
            this.updateUI();
            console.log('[StateManager] Sub-part deleted:', subPartId);
        }
    }



    getGeometryPart(geometryIndex) {

        for (const part of this.legendParts) {

            if (part.geometries && part.geometries.includes(geometryIndex)) {

                return part.id;

            }

        }

        return null;

    }



    getUnclassifiedGeometries() {

        return this.geometries

            .map((_, index) => index)

            .filter(index => !this.geometryToPart.has(index));

    }



    movePartOrder(partId, direction) {

        const currentIndex = this.legendParts.findIndex(p => p.id === partId);

        if (currentIndex === -1) return;



        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;



        if (newIndex >= 0 && newIndex < this.legendParts.length) {

            const part = this.legendParts.splice(currentIndex, 1)[0];

            this.legendParts.splice(newIndex, 0, part);

            this.updateUI();

            console.log('[StateManager] Part moved:', partId, direction);

        }

    }



    setExportImportManager(exportImportManager) {

        this.exportImportManager = exportImportManager;

        console.log('[StateManager] ExportImportManager set');

    }

    /**
     * ✅ Passer le SymbolPaletteManager au StateManager
     */
    setSymbolPaletteManager(symbolPaletteManager) {
        if (!symbolPaletteManager) {
            console.warn('[StateManager] Attempted to set null SymbolPaletteManager');
            return;
        }

        this.symbolPaletteManager = symbolPaletteManager;
        console.log('[StateManager] SymbolPaletteManager set');
    }


}