// js/modules/mapping/io/ExportImportManager.js

export class ExportImportManager {
    constructor(stateManager, mapManager) {
        if (!stateManager) {
            throw new Error('StateManager is required for ExportImportManager initialization.');
        }
        if (!mapManager) {
            throw new Error('MapManager is required for ExportImportManager initialization.');
        }

        this.stateManager = stateManager;
        this.mapManager = mapManager;
        console.log('[ExportImportManager] Initialized');
    }

    /**
     * ✅ Exporte l'état complet de la carte en JSON
     * ✅ Distinction correcte Circle (rayon mètres) vs CircleMarker (rayon pixels)
     * ✅ CORRECTION : partId récupéré correctement pour géométries dans parties ET sous-parties
     * ✅ CORRECTION : Sauvegarde des sous-parties avec titres et géométries
     * @returns {Object} État complet sérialisable
     */
    exportState() {
        console.log('[ExportImportManager] ========== EXPORT START ==========');

        // 1. Récupérer données carte
        const mapCenter = this.mapManager.map.getCenter();
        const mapBounds = this.mapManager.map.getBounds();

        // 2. Déterminer la couche de tuiles active
        const tileLayer = this.mapManager.tileLayerManager?.getCurrentTileType?.()
            ?? this.mapManager.tileLayerManager?.currentTileType
            ?? 'osm';

        // 3. ✅ CORRECTION : Fonction helper pour trouver le partId (partie OU sous-partie)
        const getGeometryPartId = (geometryIndex) => {
            // Chercher d'abord dans les parties principales
            for (const part of this.stateManager.legendParts) {
                if (part.geometries && part.geometries.includes(geometryIndex)) {
                    return part.id;
                }

                // Chercher ensuite dans les sous-parties
                if (part.subParts) {
                    for (const subPart of part.subParts) {
                        if (subPart.geometries && subPart.geometries.includes(geometryIndex)) {
                            return subPart.id; // ✅ Retourner l'ID de la sous-partie
                        }
                    }
                }
            }
            return null;
        };

        // 4. Exporter les géométries avec leur partId correct
        const exportedGeometries = this.stateManager.geometries.map((geom, index) => {
            const stableId = geom.id; // ✅ Sauvegarder l'ID stable

            // ✅ CORRECTION : Utiliser notre fonction helper
            const partId = getGeometryPartId(index);

            const exported = {
                id: stableId, // ✅ Préserver l'ID stable
                index: index,
                type: geom.type,
                name: geom.name,
                coordinates: this._extractCoordinates(geom),

                // Styles visuels
                color: geom.color,
                lineColor: geom.lineColor,
                opacity: geom.opacity,
                lineDash: geom.lineDash,
                lineWeight: geom.lineWeight,

                // Propriétés spécifiques des marqueurs/formes
                shape: geom.shape,
                markerSize: geom.markerSize,
                arrowType: geom.arrowType,
                lineType: geom.lineType,

                // Données de courbes
                segmentCurves: geom.segmentCurves || null,
                isCurved: geom.isCurved || false,

                // ✅ Assignation à la légende (partie OU sous-partie)
                partId: partId
            };

            // ✅ CRUCIAL : Pour CircleMarker, stocker le rayon À LA RACINE en pixels
            if (geom.type === 'CircleMarker' && geom.layer?.getRadius) {
                exported.radius = geom.layer.getRadius();
                console.log('[ExportImportManager] ✅ CircleMarker radius exported at root:', exported.radius, 'px');
            }

            return exported;
        });

        // 5. Construire l'état complet
        const state = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            mapTitle: this.stateManager.mapTitle || '',

            // Vue cartographique
            mapView: {
                center: {
                    lat: mapCenter.lat,
                    lng: mapCenter.lng
                },
                zoom: this.mapManager.map.getZoom(),
                bounds: {
                    southWest: {
                        lat: mapBounds.getSouthWest().lat,
                        lng: mapBounds.getSouthWest().lng
                    },
                    northEast: {
                        lat: mapBounds.getNorthEast().lat,
                        lng: mapBounds.getNorthEast().lng
                    }
                }
            },

            // Couche de tuiles
            tileLayer: tileLayer,

            // Géométries
            geometries: exportedGeometries,

            // ✅ CORRECTION : Parties de légende avec sous-parties complètes
            legendParts: this.stateManager.legendParts.map(part => ({
                id: part.id,
                title: part.title,
                geometries: [...part.geometries],
                // ✅ AJOUT : Exporter les sous-parties avec leurs titres et géométries
                subParts: part.subParts ? part.subParts.map(subPart => ({
                    id: subPart.id,
                    title: subPart.title,
                    geometries: [...(subPart.geometries || [])]
                })) : []
            })),

            // ✅ AJOUT : Exporter l'état du SymbolPaletteManager
            symbolPalette: this.exportSymbolPaletteState(),
        };

        // 6. Logs de confirmation détaillés
        console.log('[ExportImportManager] ✅ State exported successfully');
        console.log('[ExportImportManager]   - Geometries: ' + state.geometries.length);
        console.log('[ExportImportManager]   - CircleMarkers: ' + state.geometries.filter(g => g.type === 'CircleMarker').length);
        console.log('[ExportImportManager]   - Circles: ' + state.geometries.filter(g => g.type === 'Circle').length);
        console.log('[ExportImportManager]   - Legend parts: ' + state.legendParts.length);

        // ✅ AJOUT : Log du nombre total de sous-parties exportées
        const totalSubParts = state.legendParts.reduce((sum, part) => sum + (part.subParts?.length || 0), 0);
        console.log('[ExportImportManager]   - Legend sub-parts: ' + totalSubParts);

        // ✅ AJOUT : Log des géométries assignées
        const assignedGeometries = state.geometries.filter(g => g.partId !== null).length;
        console.log('[ExportImportManager]   - Assigned geometries: ' + assignedGeometries + '/' + state.geometries.length);

        console.log('[ExportImportManager]   - Symbol palette items: ' + (state.symbolPalette?.usedSymbols?.length || 0));
        console.log('[ExportImportManager] ========== EXPORT END ==========');

        return state;
    }



    /**
     * ✅ Extrait les coordonnées d'une géométrie selon son type
     * Distinction STRICTE entre CircleMarker (pixels) et Circle (mètres)
     */
    _extractCoordinates(geometry) {
        if (!geometry.layer) {
            return geometry.coordinates || [];
        }

        const layer = geometry.layer;

        // 🔍 DEBUG - Afficher le type détecté
        console.log('[ExportImportManager] Detecting layer type for:', geometry.type);
        console.log('[ExportImportManager] layer instanceof L.CircleMarker:', layer instanceof L.CircleMarker);
        console.log('[ExportImportManager] layer instanceof L.Circle:', layer instanceof L.Circle);

        // ✅ CircleMarker : TESTER EN PREMIER (avant Circle car hérite de Circle)
        // IMPORTANT : !(layer instanceof L.Circle) exclut L.Circle
        if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
            const latlng = layer.getLatLng();
            console.log('[ExportImportManager] ✅ CircleMarker detected - coordinates SANS rayon:', latlng);
            return { lat: latlng.lat, lng: latlng.lng };
        }

        // ✅ Circle : APRÈS CircleMarker (rayon en mètres)
        if (layer instanceof L.Circle) {
            const center = layer.getLatLng();
            const radius = layer.getRadius();
            console.log('[ExportImportManager] ✅ Circle detected - coordinates AVEC rayon (mètres):', radius);
            return {
                center: { lat: center.lat, lng: center.lng },
                radius: radius
            };
        }

        // ✅ Marker simple (sans rayon)
        if (layer.getLatLng && !layer.getRadius) {
            const latlng = layer.getLatLng();
            console.log('[ExportImportManager] ✅ Marker detected - simple coordinates');
            return { lat: latlng.lat, lng: latlng.lng };
        }

        // ✅ Polyline/Polygon
        if (layer.getLatLngs) {
            const latlngs = layer.getLatLngs();
            console.log('[ExportImportManager] Extracting coordinates for:', geometry.type);
            console.log('[ExportImportManager] Raw latlngs:', latlngs);

            // Polygon
            if (layer instanceof L.Polygon) {
                console.log('[ExportImportManager] ✅ Detected L.Polygon instance');

                // Cas 1 : Polygon avec trous - [[ring1], [ring2], ...]
                if (Array.isArray(latlngs[0]) && Array.isArray(latlngs[0][0])) {
                    console.log('[ExportImportManager] Polygon with holes');
                    return latlngs.map(ring =>
                        ring.map(point => ({ lat: point.lat, lng: point.lng }))
                    );
                }

                // Cas 2 : Polygon simple - [point1, point2, ...]
                if (Array.isArray(latlngs[0]) && latlngs[0].lat !== undefined) {
                    console.log('[ExportImportManager] Simple polygon - extracting first ring');
                    return latlngs.map(point => ({ lat: point.lat, lng: point.lng }));
                }

                // Cas 3 : Structure imbriquée standard pour polygon
                console.log('[ExportImportManager] Polygon - accessing first ring [0]');
                if (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
                    return latlngs[0].map(point => ({ lat: point.lat, lng: point.lng }));
                }
            }

            // Polyline (exclure Polygon car hérite de Polyline)
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                console.log('[ExportImportManager] ✅ Detected L.Polyline instance');
                if (Array.isArray(latlngs) && latlngs[0] && latlngs[0].lat !== undefined) {
                    return latlngs.map(point => ({ lat: point.lat, lng: point.lng }));
                }
            }

            // Fallback générique
            console.warn('[ExportImportManager] Using fallback extraction');
            if (Array.isArray(latlngs) && latlngs.length > 0) {
                if (latlngs[0].lat !== undefined) {
                    return latlngs.map(point => ({ lat: point.lat, lng: point.lng }));
                } else if (Array.isArray(latlngs[0])) {
                    return latlngs[0].map(point => ({ lat: point.lat, lng: point.lng }));
                }
            }
        }

        console.warn('[ExportImportManager] ⚠️ No extraction method found for:', geometry.type, layer.constructor.name);
        return [];
    }

    /**
     * Exporte l'état complet du SymbolPaletteManager
     * 🔴 CRITICAL : Capture aussi où les symboles sont DÉPOSÉS dans les drop zones
     */
    exportSymbolPaletteState() {
        if (!this.stateManager.symbolPaletteManager) {
            console.warn('[ExportImportManager] ⚠️ SymbolPaletteManager not available for export');
            return { usedSymbols: [], droppedSymbols: [] };
        }

        const manager = this.stateManager.symbolPaletteManager;

        // Exporter tous les symboles utilisés (dans le stockage ET déposés)
        const usedSymbols = [];
        manager.usedSymbols.forEach((symbol, symbolId) => {
            usedSymbols.push({
                symbolId: symbolId,
                name: symbol.name,
                type: symbol.type,
                color: symbol.color,
                lineColor: symbol.lineColor,
                opacity: symbol.opacity,
                lineWeight: symbol.lineWeight,
                lineDash: symbol.lineDash,
                dropped: symbol.dropped || false,
                dropZoneId: symbol.dropZoneId || null,
                stableId: symbol.stableId // ✅ Conserver l'ID stable
            });
        });

        console.log('[ExportImportManager] 📤 Exported symbols:', usedSymbols.length);
        console.log('[ExportImportManager] 📤 Dropped symbols:', usedSymbols.filter(s => s.dropped).length);
        console.log('[ExportImportManager] 📤 Storage symbols:', usedSymbols.filter(s => !s.dropped).length);

        return {
            usedSymbols: usedSymbols,
            dropZonesState: this.captureDropZonesState() // ✅ NOUVEAU : Capturer l'état des drop zones
        };
    }

    /**
     * Capture l'état COMPLET des drop zones (qui est rempli, avec quel symbole)
     */
    captureDropZonesState() {
        if (!this.stateManager.symbolPaletteManager) {
            return [];
        }

        const manager = this.stateManager.symbolPaletteManager;
        const zonesState = [];

        manager.dropZoneElements.forEach((dropZone, zoneIndex) => {
            const symbolId = dropZone.getAttribute('data-symbol-id');
            const isFilled = dropZone.classList.contains('filled');

            zonesState.push({
                zoneIndex: zoneIndex,
                symbolId: symbolId ? parseInt(symbolId) : null,
                isFilled: isFilled,
                position: zoneIndex // ✅ Position dans la colonne
            });

            if (isFilled && symbolId) {
                console.log('[ExportImportManager] 📍 Zone', zoneIndex, 'contains symbol', symbolId);
            }
        });

        console.log('[ExportImportManager] 📊 Drop zones state captured:', zonesState);
        return zonesState;
    }




    /**
     * ✅ Télécharge l'état en fichier JSON
     */
    downloadJSON() {
        const state = this.exportState();
        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Créer un nom de fichier avec date
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `carte_${this.stateManager.mapTitle || 'export'}_${timestamp}.json`;

        // Télécharger
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[ExportImportManager] JSON downloaded:', filename);
    }

    /**
     * Restaure l'état complet depuis JSON
     * ✅ CORRECTION : Gère les sous-parties et l'assignation des géométries
     * ✅ CORRECTION : Appel syncWithLegend() immédiatement après géométries
     * ✅ Restaure ensuite le SymbolPaletteManager avec les bons IDs
     */
    importState(state) {
        console.log('[ExportImportManager] ========== IMPORT START ==========');
        console.log('[ExportImportManager] Importing state version:', state.version);
        console.log('[ExportImportManager] Map title to restore:', state.mapTitle);

        try {
            // ÉTAPE 0 : Désactiver complètement Leaflet.PM
            console.log('[ExportImportManager] 🔒 Disabling Leaflet.PM...');
            this.mapManager.map.pm.disableGlobalEditMode();
            this.mapManager.map.pm.disableDraw?.();

            // 1. Nettoyer l'état actuel
            console.log('[ExportImportManager] Clearing current state...');
            this.stateManager.geometries = [];
            this.stateManager.legendParts = [];
            console.log('[ExportImportManager] State cleared');

            // 2. Restaurer la vue de la carte
            if (state.mapView) {
                this.mapManager.map.setView(
                    [state.mapView.center.lat, state.mapView.center.lng],
                    state.mapView.zoom
                );
                console.log('[ExportImportManager] Map view restored');
            }

            // 3. Restaurer la couche de tuiles
            if (state.tileLayer) {
                if (this.mapManager.tileLayerManager) {
                    this.mapManager.tileLayerManager.setTileLayer(state.tileLayer);
                }
                console.log('[ExportImportManager] Tile layer restored:', state.tileLayer);
            }

            // 4. ✅ CORRECTION : Restaurer les parties de légende AVEC sous-parties
            if (state.legendParts) {
                state.legendParts.forEach(part => {
                    this.stateManager.legendParts.push({
                        id: part.id,
                        title: part.title,
                        geometries: [], // Sera rempli plus tard
                        // ✅ AJOUT : Restaurer les sous-parties avec leur structure complète
                        subParts: part.subParts ? part.subParts.map(subPart => ({
                            id: subPart.id,
                            title: subPart.title,
                            geometries: [] // Sera rempli lors de l'assignation
                        })) : []
                    });
                });
                console.log('[ExportImportManager] Legend parts restored:', state.legendParts.length);

                // ✅ LOG : Afficher le nombre de sous-parties restaurées
                const totalSubParts = this.stateManager.legendParts.reduce(
                    (sum, part) => sum + (part.subParts?.length || 0), 0
                );
                console.log('[ExportImportManager] Legend sub-parts restored:', totalSubParts);
            }

            // 5. Restaurer les géométries
            if (state.geometries) {
                state.geometries.forEach(geomData => {
                    this._recreateGeometry(geomData);
                });
                console.log('[ExportImportManager] Geometries restored:', state.geometries.length);
            }

            // ✅ ÉTAPE CRITIQUE : Forcer syncWithLegend() maintenant que les géométries existent
            if (this.stateManager.symbolPaletteManager) {
                console.log('[ExportImportManager] 🔄 Forcing syncWithLegend() immediately...');
                this.stateManager.symbolPaletteManager.syncWithLegend();
                console.log('[ExportImportManager] ✅ syncWithLegend() completed - symbols ready in usedSymbols');
            }

            // 6. Mettre à jour l'interface
            this.stateManager.updateUI();

            // ✅ Restaurer le SymbolPaletteManager
            if (state.symbolPalette) {
                this.restoreSymbolPaletteState(state.symbolPalette);
                console.log('[ExportImportManager] ✅ Symbol palette state restored');
            }

            // 7. Restaurer le titre EN DERNIER
            if (state.mapTitle !== undefined) {
                this.stateManager.mapTitle = state.mapTitle;

                const possibleIds = ['map-title-input', 'mapTitle', 'title-input', 'carte-titre'];
                let titleUpdated = false;

                for (const id of possibleIds) {
                    const input = document.getElementById(id);
                    if (input) {
                        input.value = state.mapTitle;
                        console.log('[ExportImportManager] Title input id updated to:', state.mapTitle);
                        titleUpdated = true;
                        break;
                    }
                }

                if (!titleUpdated) {
                    const inputByName = document.querySelector('input[name="mapTitle"]');
                    const inputByClass = document.querySelector('.map-title-input');

                    if (inputByName) {
                        inputByName.value = state.mapTitle;
                        console.log('[ExportImportManager] Title input by name updated');
                        titleUpdated = true;
                    } else if (inputByClass) {
                        inputByClass.value = state.mapTitle;
                        console.log('[ExportImportManager] Title input by class updated');
                        titleUpdated = true;
                    }
                }

                if (typeof this.stateManager.setMapTitle === 'function') {
                    this.stateManager.setMapTitle(state.mapTitle);
                }

                console.log('[ExportImportManager] Title restored:', state.mapTitle);
            }

            // ÉTAPE FINALE : Forcer un redessin propre
            setTimeout(() => {
                console.log('[ExportImportManager] 🔄 Invalidating map size to ensure final render...');
                this.mapManager.map.invalidateSize(true);
                console.log('[ExportImportManager] ✅ Map refresh triggered.');
            }, 250);

            console.log('[ExportImportManager] ========== IMPORT SUCCESS ==========');
            return true;

        } catch (error) {
            console.error('[ExportImportManager] Import failed:', error);
            alert('Erreur lors de l\'importation: ' + error.message);
            return false;
        }
    }






    /**
     * ✅ Nettoie l'état actuel
     */
    _clearCurrentState() {
        console.log('[ExportImportManager] Clearing current state...');

        // Supprimer toutes les géométries
        const geometryCount = this.stateManager.geometries.length;
        for (let i = geometryCount - 1; i >= 0; i--) {
            this.stateManager.deleteGeometry(i);
        }

        // Supprimer toutes les parties de légende
        const partIds = this.stateManager.legendParts.map(p => p.id);
        partIds.forEach(id => this.stateManager.deleteLegendPart(id));

        console.log('[ExportImportManager] State cleared');
    }


    /**
     * ✅ Recrée une géométrie depuis les données exportées
     * AVEC ID STABLE préservé
     */
    _recreateGeometry(geomData) {
        console.log('[ExportImportManager] Recreating geometry:', geomData.type, geomData.name);
        let layer = null;

        try {
            // ✅ Support complet de tous les types
            if (geomData.type.startsWith('Marker_')) {
                const markerType = geomData.type.replace('Marker_', '');
                layer = this._recreateMarker(geomData, markerType);
            }
            else {
                switch (geomData.type) {
                    case 'CustomMarker':
                        layer = this._recreateMarker(geomData);
                        break;
                    case 'Polyline':
                        layer = this._recreatePolyline(geomData);
                        break;
                    case 'Polygon':
                        layer = this._recreatePolygon(geomData);
                        break;
                    case 'Circle':
                        layer = this._recreateCircle(geomData);
                        break;
                    case 'CircleMarker':
                        layer = this._recreateCircleMarker(geomData);
                        break;
                    default:
                        console.warn('[ExportImportManager] Unknown geometry type:', geomData.type);
                        return;
                }
            }

            if (!layer) {
                console.error('[ExportImportManager] Failed to create layer for:', geomData.name);
                return;
            }

            // ✅ Créer l'objet geometry AVEC L'ID PRÉSERVÉ
            const geometry = {
                id: geomData.id, // 🔴 CRITICAL : utiliser l'ID du fichier exporté
                type: geomData.type,
                name: geomData.name,
                coordinates: geomData.coordinates,
                layer: layer,
                color: geomData.color,
                lineColor: geomData.lineColor,
                opacity: geomData.opacity,
                lineDash: geomData.lineDash,
                lineWeight: geomData.lineWeight,
                shape: geomData.shape,
                markerSize: geomData.markerSize,
                arrowType: geomData.arrowType,
                lineType: geomData.lineType,
                segmentCurves: geomData.segmentCurves || null,
                isCurved: geomData.isCurved || false
            };

            console.log('[ExportImportManager] 🔴 Geometry created with ID:', geometry.id, 'Name:', geometry.name); // ✅ LOG pour déboguer

            // Ajouter au state
            this.stateManager.geometries.push(geometry);
            const newIndex = this.stateManager.geometries.length - 1;

            // Ajouter au LayerGroup
            if (this.mapManager.layerGroupManager) {
                this.mapManager.layerGroupManager.addLayer(layer);
            }

            // Assigner à la partie de légende
            if (geomData.partId) {
                this.stateManager.assignGeometryToPart(newIndex, geomData.partId);
            }

            console.log('[ExportImportManager] Geometry recreated successfully:', geomData.type, geomData.name, 'ID:', geometry.id);

        } catch (error) {
            console.error('[ExportImportManager] Error recreating geometry:', error);
            console.error('[ExportImportManager] Geometry data:', geomData);
        }
    }

    /**
     * Restaure l'état COMPLET du SymbolPaletteManager
     * 🔴 CRITICAL : Restaure aussi les drop zones avec les bons symboles aux bons endroits
     * ✅ Utilise SEULEMENT les méthodes qui existent réellement
     */
    restoreSymbolPaletteState(paletteState) {
        if (!this.stateManager.symbolPaletteManager) {
            console.warn('[ExportImportManager] ⚠️ SymbolPaletteManager not available for restore');
            return;
        }

        const manager = this.stateManager.symbolPaletteManager;

        console.log('[ExportImportManager] 🔄 Restoring symbol palette...');
        console.log('[ExportImportManager] 📥 Total symbols to restore:', paletteState.usedSymbols?.length || 0);

        if (!paletteState.usedSymbols || paletteState.usedSymbols.length === 0) {
            console.warn('[ExportImportManager] ⚠️ No symbols to restore');
            return;
        }

        // ÉTAPE 1 : Vérifier la correspondance entre symboles et géométries
        console.log('[ExportImportManager] 📋 STEP 1: Verifying symbol-geometry correspondence...');
        const symbolGeometryMap = new Map();

        paletteState.usedSymbols.forEach(exportedSymbol => {
            const symbolId = exportedSymbol.symbolId;
            const symbol = manager.usedSymbols.get(symbolId);

            if (!symbol) {
                console.warn('[ExportImportManager] ⚠️ Symbol not found after sync:', symbolId, exportedSymbol.name);
                return;
            }

            symbolGeometryMap.set(symbolId, symbol.geometry);
            console.log('[ExportImportManager] ✅ Symbol-Geometry link confirmed:', exportedSymbol.name, '(ID:', symbolId, ')');
        });

        // ÉTAPE 2 : Restaurer la VISIBILITÉ des symboles dans le conteneur de stockage
        console.log('[ExportImportManager] 📋 STEP 2: Restoring storage container visibility...');
        paletteState.usedSymbols.forEach(exportedSymbol => {
            const symbolId = exportedSymbol.symbolId;
            const symbol = manager.usedSymbols.get(symbolId);

            if (!symbol) return;

            // ✅ Trouver l'élément DOM du symbole dans le stockage
            // Structure : data-symbol-id="XXX" dans le conteneur de stockage
            const symbolElement = document.querySelector(`[data-symbol-id="${symbolId}"]`);

            if (!symbolElement) {
                console.warn('[ExportImportManager] ⚠️ Symbol element not found in DOM:', symbolId);
                return;
            }

            // Si le symbole a été déposé, le masquer dans le stockage
            if (exportedSymbol.dropped) {
                symbolElement.style.display = 'none';
                console.log('[ExportImportManager] 👁️ Storage: Symbol hidden:', exportedSymbol.name);
            } else {
                // Si le symbole n'a pas été déposé, l'afficher dans le stockage
                symbolElement.style.display = '';
                console.log('[ExportImportManager] 👁️ Storage: Symbol shown:', exportedSymbol.name);
            }
        });

        // ÉTAPE 3 : Restaurer les drop zones avec les bons symboles aux bons endroits
        console.log('[ExportImportManager] 📋 STEP 3: Restoring drop zones...');
        if (paletteState.dropZonesState && paletteState.dropZonesState.length > 0) {
            paletteState.dropZonesState.forEach(zoneState => {
                const dropZone = manager.dropZoneElements[zoneState.zoneIndex];

                if (!dropZone) {
                    console.warn('[ExportImportManager] ⚠️ Drop zone not found at index', zoneState.zoneIndex);
                    return;
                }

                // Vider la zone d'abord
                dropZone.innerHTML = '';
                dropZone.removeAttribute('data-symbol-id');
                dropZone.classList.remove('filled');

                // Si la zone était remplie
                if (zoneState.isFilled && zoneState.symbolId !== null) {
                    const symbolId = zoneState.symbolId;
                    const symbol = manager.usedSymbols.get(symbolId);

                    if (!symbol) {
                        console.warn('[ExportImportManager] ⚠️ Symbol not found for drop zone:', symbolId);
                        return;
                    }

                    console.log('[ExportImportManager] 📍 Restoring drop zone', zoneState.zoneIndex, 'with symbol:', symbol.name);

                    // Marquer le symbole comme déposé
                    symbol.dropped = true;
                    symbol.dropZoneId = zoneState.zoneIndex;

                    // Créer l'aperçu dans la drop zone
                    const previewWrapper = document.createElement('div');
                    previewWrapper.className = 'dropped-symbol-wrapper';
                    previewWrapper.style.width = '100%';
                    previewWrapper.style.height = '100%';
                    previewWrapper.style.display = 'flex';
                    previewWrapper.style.alignItems = 'center';
                    previewWrapper.style.justifyContent = 'center';

                    // Adapter l'aperçu selon le type
                    const geometry = symbol.geometry;
                    if (geometry.type && geometry.type.startsWith('Marker_')) {
                        // Pour les marqueurs, créer un carré simple avec les couleurs
                        const markerPreview = document.createElement('div');
                        markerPreview.className = 'marker-preview';
                        markerPreview.style.width = '30px';
                        markerPreview.style.height = '30px';
                        markerPreview.style.backgroundColor = geometry.color || '#3388ff';
                        markerPreview.style.borderColor = geometry.lineColor || '#000000';
                        markerPreview.style.borderWidth = '2px';
                        markerPreview.style.opacity = geometry.opacity || 1;
                        markerPreview.title = symbol.name;
                        previewWrapper.appendChild(markerPreview);
                    } else if (geometry.arrowType && geometry.arrowType !== 'none') {
                        // Pour les flèches, créer une ligne avec les couleurs
                        const arrowPreview = document.createElement('div');
                        arrowPreview.className = 'arrow-preview';
                        arrowPreview.style.width = '50px';
                        arrowPreview.style.height = `${geometry.lineWeight || 3}px`;
                        arrowPreview.style.backgroundColor = geometry.lineColor || '#3388ff';
                        arrowPreview.style.opacity = geometry.opacity || 1;
                        arrowPreview.title = symbol.name;
                        previewWrapper.appendChild(arrowPreview);
                    } else {
                        // Pour les autres types (polygon, circle, polyline)
                        const preview = document.createElement('div');
                        preview.className = 'dropped-symbol';
                        preview.style.width = '40px';
                        preview.style.height = '40px';
                        preview.style.backgroundColor = geometry.color || '#3388ff';
                        preview.style.borderColor = geometry.lineColor || '#000000';
                        preview.style.borderWidth = `${geometry.lineWeight || 2}px`;
                        preview.style.opacity = geometry.opacity || 1;
                        preview.title = symbol.name;

                        if (geometry.lineDash === 'dashed') {
                            preview.style.borderStyle = 'dashed';
                        } else if (geometry.lineDash === 'dotted') {
                            preview.style.borderStyle = 'dotted';
                        } else {
                            preview.style.borderStyle = 'solid';
                        }

                        previewWrapper.appendChild(preview);
                    }

                    dropZone.appendChild(previewWrapper);
                    dropZone.setAttribute('data-symbol-id', symbolId);
                    dropZone.classList.add('filled');

                    console.log('[ExportImportManager] ✅ Drop zone', zoneState.zoneIndex, 'filled with', symbol.name);
                } else {
                    console.log('[ExportImportManager] ⭕ Drop zone', zoneState.zoneIndex, 'remains empty');
                }
            });
        }

        // ÉTAPE 4 : Rapport final de synchronisation
        console.log('[ExportImportManager] 📊 Symbol palette restoration COMPLETE:');
        console.log('[ExportImportManager]   - Total symbols:', paletteState.usedSymbols.length);
        console.log('[ExportImportManager]   - Dropped symbols:', paletteState.usedSymbols.filter(s => s.dropped).length);
        console.log('[ExportImportManager]   - Storage symbols:', paletteState.usedSymbols.filter(s => !s.dropped).length);
        console.log('[ExportImportManager] ✅ Symbol palette restoration complete');
    }




    /**
     * ✅ Recrée un cercle Leaflet (L.Circle) en mètres
     */
    _recreateCircle(geomData) {
        console.log('[ExportImportManager] 🌍 Recreating Circle (meters):', geomData.name);

        if (!geomData.coordinates) {
            console.error('[ExportImportManager] Missing coordinates for Circle');
            return null;
        }

        let latlng;

        // ✅ Récupérer le centre
        if (geomData.coordinates.center) {
            latlng = L.latLng(geomData.coordinates.center.lat, geomData.coordinates.center.lng);
            console.log('[ExportImportManager] Center from coordinates.center');
        } else if (geomData.coordinates.lat !== undefined && geomData.coordinates.lng !== undefined) {
            latlng = L.latLng(geomData.coordinates.lat, geomData.coordinates.lng);
            console.log('[ExportImportManager] Center from coordinates (lat/lng)');
        } else {
            console.error('[ExportImportManager] Invalid Circle coordinates:', geomData.coordinates);
            return null;
        }

        // ✅ Récupérer le rayon en MÈTRES
        let radius = 50000; // Défaut : 50 km
        if (geomData.coordinates.radius !== undefined && geomData.coordinates.radius > 0) {
            radius = geomData.coordinates.radius;
            console.log('[ExportImportManager] Radius from coordinates.radius (meters):', radius);
        } else if (geomData.radius !== undefined && geomData.radius > 0) {
            radius = geomData.radius;
            console.log('[ExportImportManager] Radius from geomData.radius (meters):', radius);
        }

        // ✅ Créer les options
        const options = {
            color: geomData.lineColor || '#3388ff',
            fillColor: geomData.color || '#3388ff',
            weight: geomData.lineWeight || 3,
            fillOpacity: geomData.opacity !== undefined ? geomData.opacity : 0.2,
            radius: radius
        };

        // ✅ Gérer le style de ligne
        if (geomData.lineDash === 'dashed') {
            options.dashArray = '10, 10';
        } else if (geomData.lineDash === 'dotted') {
            options.dashArray = '2, 6';
        }

        try {
            const circle = L.circle(latlng, options);
            console.log('[ExportImportManager] ✅ Circle recreated:', geomData.name, 'Radius:', radius, 'm');
            return circle;
        } catch (error) {
            console.error('[ExportImportManager] Failed to create Circle:', error);
            return null;
        }
    }


    /**
     * Recrée un CircleMarker Leaflet à partir d'un objet de données exporté.
     * Recherche toujours le rayon (`radius`) à la racine (au bon format pixel).
     * Compatible avec les exports standards GeometryHandler.js (radius à la racine).
     */
    _recreateCircleMarker(geomData) {
        // 1. Extraction des coordonnées (point ou objet {center})
        let latlng = null;
        if (geomData.coordinates) {
            if (geomData.coordinates.center) {
                latlng = L.latLng(geomData.coordinates.center.lat, geomData.coordinates.center.lng);
            } else if (
                typeof geomData.coordinates.lat === 'number' &&
                typeof geomData.coordinates.lng === 'number'
            ) {
                latlng = L.latLng(geomData.coordinates.lat, geomData.coordinates.lng);
            }
        }
        if (!latlng) {
            console.error('[ExportImportManager] Invalid CircleMarker coordinates', geomData.coordinates);
            return null;
        }

        // 2. Extraction du rayon (pixels exclusivement)
        let radius = 10; // Valeur par défaut raisonnable
        if (typeof geomData.radius === 'number' && geomData.radius > 0 && geomData.radius < 200) {
            radius = geomData.radius;
        } else if (
            typeof geomData.markerSize === 'number' &&
            geomData.markerSize > 0 &&
            geomData.markerSize < 200
        ) {
            radius = geomData.markerSize;
        }
        // Jamais de conversion mètres→pixels ici : réservé à L.Circle uniquement

        // 3. Options graphiques du cercle
        const options = {
            color: geomData.lineColor || '#3388ff',
            fillColor: geomData.color || '#3388ff',
            weight: geomData.lineWeight || 3,
            fillOpacity: typeof geomData.opacity === 'number' ? geomData.opacity : 0.2,
            radius: radius
        };
        if (geomData.lineDash === 'dashed') options.dashArray = '10, 10';
        if (geomData.lineDash === 'dotted') options.dashArray = '2, 6';

        try {
            const circleMarker = L.circleMarker(latlng, options);
            console.log('[ExportImportManager] ✅ CircleMarker recreated:', geomData.name, 'Radius:', radius);
            return circleMarker;
        } catch (error) {
            console.error('[ExportImportManager] Failed to create CircleMarker:', error);
            return null;
        }
    }




    /**
     * ✅ CORRIGÉ - Recrée un marqueur avec support du type SVG
     */
    _recreateMarker(geomData, markerType = null) {
        const latlng = L.latLng(geomData.coordinates.lat, geomData.coordinates.lng);
        const shapeType = markerType || geomData.shape || 'circle';

        if (!window.SVGUtils) {
            console.error('[ExportImportManager] SVGUtils not available globally!');
            throw new Error('SVGUtils must be exposed globally for marker recreation');
        }

        const marker = window.SVGUtils.createMarkerSVG(
            shapeType,
            latlng,
            {
                color: geomData.color || '#007bff',
                lineColor: geomData.lineColor || '#000000',
                opacity: geomData.opacity !== undefined ? geomData.opacity : 1,
                lineDash: geomData.lineDash || 'solid',
                lineWeight: geomData.lineWeight || 2,
                markerSize: geomData.markerSize || 24
            }
        );

        // ✅ Ajouter immédiatement à la carte
        marker.addTo(this.mapManager.map);
        console.log('[ExportImportManager] ✅ Marker added to map:', shapeType);

        return marker;
    }






    /**
     * ✅ Recrée une polyligne avec flèches et courbes
     * EXACTE MÊME LOGIQUE que LineControlManager.js
     * AVEC FIX pour l'affichage des flèches à l'import
     */
    _recreatePolyline(geomData) {
        console.log('[ExportImportManager] 🔨 Recreating polyline:', geomData.name, 'type:', geomData.arrowType);

        if (!geomData.coordinates || !Array.isArray(geomData.coordinates)) {
            console.error('[ExportImportManager] Invalid polyline coordinates:', geomData);
            return null;
        }

        if (geomData.coordinates.length === 0) {
            console.error('[ExportImportManager] Empty polyline coordinates');
            return null;
        }

        const firstCoord = geomData.coordinates[0];
        if (!firstCoord || firstCoord.lat === undefined || firstCoord.lng === undefined) {
            console.error('[ExportImportManager] Invalid coordinate structure:', firstCoord);
            return null;
        }

        // Créer les LatLng objects
        const latlngs = geomData.coordinates.map(c => {
            if (c.lat === undefined || c.lng === undefined) {
                console.warn('[ExportImportManager] Skipping invalid coordinate:', c);
                return null;
            }
            return L.latLng(c.lat, c.lng);
        }).filter(ll => ll !== null);

        if (latlngs.length === 0) {
            console.error('[ExportImportManager] No valid coordinates after filtering');
            return null;
        }

        const options = {
            color: geomData.lineColor || '#3388ff',
            weight: geomData.lineWeight || 3,
            opacity: geomData.opacity !== undefined ? geomData.opacity : 1,
            // ✅ LA CORRECTION : Forcer le rendu SVG pour que les flèches soient synchronisées
            renderer: L.svg()
        };

        // Gérer le style de ligne
        if (geomData.lineDash === 'dashed') {
            options.dashArray = '10, 10';
        } else if (geomData.lineDash === 'dotted') {
            options.dashArray = '2, 6';
        }

        try {
            const polyline = L.polyline(latlngs, options);
            console.log('[ExportImportManager] 📍 Polyline created, ID:', polyline._leaflet_id);

            // ✅ IMPORTANT : Ajouter à la carte EN PREMIER
            this.mapManager.map.addLayer(polyline);
            console.log('[ExportImportManager] ✅ Polyline added to map');

            // ✅ PUIS créer les flèches en utilisant la même fonction que la création normale
            if (geomData.arrowType && window.SVGUtils) {
                console.log('[ExportImportManager] 🎯 Creating arrows:', geomData.arrowType);

                // ✅ Utiliser EXACTEMENT la même fonction que LineControlManager
                window.SVGUtils.addArrowheadsToPolylineSVG(polyline, geomData.arrowType);

                console.log('[ExportImportManager] ✅ Arrows created for polyline');
            }

            // ✅ Restaurer les données de courbe
            if (geomData.isCurved && geomData.segmentCurves) {
                console.log('[ExportImportManager] 📍 Restoring curved segments...');
                polyline._isCurved = true;
                polyline._segmentCurves = geomData.segmentCurves;
            }

            console.log('[ExportImportManager] ✅ Polyline fully recreated');

            // ✅ NOUVELLE APPROCHE - Marquer le polyline pour refresh après import
            polyline._needsArrowRefreshOnImport = true;

            return polyline;
        } catch (error) {
            console.error('[ExportImportManager] Failed to create polyline:', error);
            console.error('[ExportImportManager] Error details:', error.message, error.stack);
            return null;
        }
    }


    /**
     * ✅ Recrée un polygone
     */
    _recreatePolygon(geomData) {
        if (!geomData.coordinates || !Array.isArray(geomData.coordinates)) {
            console.error('[ExportImportManager] Invalid polygon coordinates:', geomData);
            return null;
        }

        if (geomData.coordinates.length === 0) {
            console.error('[ExportImportManager] Empty polygon coordinates');
            return null;
        }

        let latlngs;

        // Gérer les polygones avec trous (tableau de tableaux)
        if (Array.isArray(geomData.coordinates[0]) &&
            geomData.coordinates[0][0] &&
            geomData.coordinates[0][0].lat !== undefined) {
            latlngs = geomData.coordinates.map(ring =>
                ring.map(c => {
                    if (c.lat === undefined || c.lng === undefined) {
                        console.warn('[ExportImportManager] Invalid coordinate in ring:', c);
                        return null;
                    }
                    return L.latLng(c.lat, c.lng);
                }).filter(ll => ll !== null)
            );
        } else {
            latlngs = geomData.coordinates.map(c => {
                if (c.lat === undefined || c.lng === undefined) {
                    console.warn('[ExportImportManager] Invalid coordinate:', c);
                    return null;
                }
                return L.latLng(c.lat, c.lng);
            }).filter(ll => ll !== null);
        }

        if (latlngs.length === 0 || (Array.isArray(latlngs[0]) && latlngs[0].length === 0)) {
            console.error('[ExportImportManager] No valid coordinates for polygon');
            return null;
        }

        const options = {
            color: geomData.lineColor || '#3388ff',
            fillColor: geomData.color || '#3388ff',
            weight: geomData.lineWeight || 3,
            fillOpacity: geomData.opacity !== undefined ? geomData.opacity : 0.2
        };

        if (geomData.lineDash === 'dashed') {
            options.dashArray = '10, 10';
        } else if (geomData.lineDash === 'dotted') {
            options.dashArray = '2, 6';
        }

        try {
            return L.polygon(latlngs, options);
        } catch (error) {
            console.error('[ExportImportManager] Failed to create polygon:', error);
            return null;
        }
    }



    /**
     * ✅ Ouvre un sélecteur de fichier et importe le JSON
     */
    uploadJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const state = JSON.parse(event.target.result);
                    this.importState(state);
                    alert('Carte importée avec succès !');
                } catch (error) {
                    console.error('[ExportImportManager] JSON parse error:', error);
                    alert('Fichier JSON invalide.');
                }
            };

            reader.readAsText(file);
        });

        input.click();
    }
}
