// js/modules/mapping/ui/SymbolPaletteManager.js

export class SymbolPaletteManager {
    constructor(stateManager, legendManager) {
        if (!stateManager) {
            throw new Error('StateManager is required for SymbolPaletteManager initialization.');
        }
        if (!legendManager) {
            throw new Error('LegendManager is required for SymbolPaletteManager initialization.');
        }

        this.stateManager = stateManager;
        this.legendManager = legendManager;
        this.usedSymbols = new Map();
        this.storagePartContainers = new Map();
        this.dropZonesCount = 0;
        this.dropZoneElements = [];

        console.log('[SymbolPaletteManager] Initialized');

        this.initialize();
    }

    /**
     * ✅ Initialise le gestionnaire
     */
    initialize() {
        console.log('[SymbolPaletteManager] Initializing palette manager...');

        this.initializeDropZones();
        this.initializeSynchronizedScrolls();
        this.setupDragAndDrop();

        // ✅ SYNCHRONISER IMMÉDIATEMENT AVEC LA LÉGENDE
        this.syncWithLegend();

        console.log('[SymbolPaletteManager] ✅ Initialization complete');
    }

    /**
     * ✅ SYNCHRONISE AVEC LA LÉGENDE EXISTANTE
     */
    syncWithLegend() {
        console.log('[SymbolPaletteManager] 🔄 Syncing with legend...');

        // ✅ Parcourir toutes les géométries et les ajouter
        this.stateManager.geometries.forEach(geometry => {
            this.onGeometryAdded(geometry);
        });

        console.log('[SymbolPaletteManager] ✅ Legend sync complete');
    }

    /**
     * ✅ Crée les zones de drop
     */
    initializeDropZones() {
        console.log('[SymbolPaletteManager] Initializing drop zones...');

        const dropZonesContainer = document.getElementById('dropZonesContainer');
        if (!dropZonesContainer) {
            console.error('[SymbolPaletteManager] ❌ Drop zones container not found!');
            return;
        }

        for (let i = 0; i < 10; i++) {
            const dropZone = document.createElement('div');
            dropZone.className = 'symbol-drop-zone';
            dropZone.setAttribute('data-zone-id', i);
            dropZone.setAttribute('data-symbol-id', '');
            dropZone.droppable = true;

            dropZone.addEventListener('dragover', (e) => this.onDragOver(e));
            dropZone.addEventListener('drop', (e) => this.onDrop(e));
            dropZone.addEventListener('dragleave', (e) => this.onDragLeave(e));

            dropZonesContainer.appendChild(dropZone);
            this.dropZoneElements.push(dropZone);
        }

        this.dropZonesCount = 10;
        console.log('[SymbolPaletteManager] ✅ Drop zones initialized');
    }

    /**
     * ✅ Synchronise les scrolls
     */
    initializeSynchronizedScrolls() {
        console.log('[SymbolPaletteManager] Setting up synchronized scrolls...');

        const dropZonesContainer = document.querySelector('.drop-zones-container');
        const textEditorMultiline = document.querySelector('.text-editor-multiline');

        if (!dropZonesContainer || !textEditorMultiline) {
            console.warn('[SymbolPaletteManager] ⚠️ Scroll containers not found');
            return;
        }

        dropZonesContainer.addEventListener('scroll', () => {
            textEditorMultiline.scrollTop = dropZonesContainer.scrollTop;
        });

        textEditorMultiline.addEventListener('scroll', () => {
            dropZonesContainer.scrollTop = textEditorMultiline.scrollTop;
        });

        console.log('[SymbolPaletteManager] ✅ Synchronized scrolls initialized');
    }

    /**
     * ✅ QUAND UNE GÉOMÉTRIE EST AJOUTÉE (une seule fois)
     */
    onGeometryAdded(geometry) {
        console.log('[SymbolPaletteManager] 🆕 Geometry added:', geometry.name || 'Sans nom', 'type:', geometry.type);

        // ✅ UTILISER L'ID STABLE DE LA GÉOMÉTRIE (celui du StateManager, pas du layer)
        const symbolId = geometry.id || geometry.layer?._leaflet_id;

        if (!symbolId) {
            console.error('[SymbolPaletteManager] ❌ ERROR: No stable ID found for', geometry.name);
            return;
        }

        // ✅ Si le symbole EXISTE DÉJÀ, ne pas le recréer
        if (this.usedSymbols.has(symbolId)) {
            console.log('[SymbolPaletteManager] ℹ️ Symbol already tracked:', symbolId);
            return;
        }

        // ✅ Ajouter SEULEMENT s'il n'existe pas
        this.usedSymbols.set(symbolId, {
            id: symbolId,
            name: geometry.name || `Géométrie ${Date.now()}`,
            type: geometry.type,
            color: geometry.color || '#3388ff',
            lineColor: geometry.lineColor || '#000000',
            opacity: geometry.opacity !== undefined ? geometry.opacity : 1,
            lineWeight: geometry.lineWeight || 2,
            lineDash: geometry.lineDash || 'solid',
            geometry: geometry,
            _stableId: symbolId // ✅ Stocker explicitement
        });

        console.log('[SymbolPaletteManager] ✅ Symbol tracked:', geometry.name, 'ID:', symbolId);

        // ✅ Ajouter au conteneur
        this.addSymbolToStorageContainer(geometry, symbolId);
    }

    /**
     * ✅ QUAND UNE GÉOMÉTRIE EST SUPPRIMÉE
     */
    onGeometryRemoved(geometry) {
        console.log('[SymbolPaletteManager] 🗑️ Geometry removed:', geometry.name || 'Sans nom');

        const symbolId = geometry._leaflet_id || geometry.layer?._leaflet_id;

        if (!symbolId) {
            console.error('[SymbolPaletteManager] ❌ ERROR: No stable ID found for removal');
            return;
        }

        if (this.usedSymbols.has(symbolId)) {
            this.usedSymbols.delete(symbolId);
            console.log('[SymbolPaletteManager] 📍 Symbol untracked:', symbolId);
        }

        // ✅ RETIRER DU CONTENEUR DE STOCKAGE
        this.removeSymbolFromStorageContainer(symbolId);
    }

    /**
     * ✅ QUAND LES STYLES CHANGENT - MET À JOUR AUSSI LES DROPPED SYMBOLS
     */
    onGeometryUpdated(geometry) {
        console.log('[SymbolPaletteManager] 🔄 Geometry updated:', geometry.name || 'Sans nom');

        const symbolId = geometry.id;
        if (!symbolId) return;

        if (this.usedSymbols.has(symbolId)) {
            const symbol = this.usedSymbols.get(symbolId);
            symbol.color = geometry.color || symbol.color;
            symbol.lineColor = geometry.lineColor || symbol.lineColor;
            symbol.opacity = geometry.opacity !== undefined ? geometry.opacity : symbol.opacity;
            symbol.lineWeight = geometry.lineWeight || symbol.lineWeight;
            symbol.lineDash = geometry.lineDash || symbol.lineDash;
            symbol.name = geometry.name || symbol.name;
            symbol.geometry = geometry;

            // ✅ METTRE À JOUR DANS LE STOCKAGE (s'il n'est pas déposé)
            if (!symbol.dropped) {
                this.updateSymbolInStorageContainer(symbolId);
            }

            // ✅ METTRE À JOUR DANS LES DROP ZONES (s'il est déposé)
            if (symbol.dropped && symbol.dropZoneId !== undefined) {
                this.updateDroppedSymbolPreview(symbolId, symbol);
            }

            console.log('[SymbolPaletteManager] ✅ Symbol updated everywhere:', geometry.name);
        }
    }

    /**
     * ✅ MET À JOUR L'APERÇU DU SYMBOLE DANS LA DROP ZONE
     */
    updateDroppedSymbolPreview(symbolId, symbol) {
        console.log('[SymbolPaletteManager] 🔄 Updating dropped symbol preview:', symbolId);

        // ✅ Chercher la drop zone
        const dropZone = document.querySelector(`[data-symbol-id="${symbolId}"]`);
        if (!dropZone || !dropZone.classList.contains('filled')) {
            console.warn('[SymbolPaletteManager] ⚠️ Drop zone not found or empty');
            return;
        }

        // ✅ Vider et recréer l'aperçu
        dropZone.innerHTML = '';
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'dropped-symbol-wrapper';
        previewWrapper.style.width = '100%';
        previewWrapper.style.height = '100%';
        previewWrapper.style.display = 'flex';
        previewWrapper.style.alignItems = 'center';
        previewWrapper.style.justifyContent = 'center';

        const geometry = symbol.geometry;
        if (geometry.type && geometry.type.startsWith('Marker_')) {
            this._createMarkerPreview(previewWrapper, geometry);
        } else if (geometry.arrowType && geometry.arrowType !== 'none') {
            this._createArrowPreview(previewWrapper, geometry);
        } else {
            const preview = document.createElement('div');
            preview.className = 'dropped-symbol';
            preview.style.backgroundColor = geometry.color || '#3388ff';
            preview.style.borderColor = geometry.lineColor || '#000000';
            preview.style.borderWidth = (geometry.lineWeight || 2) + 'px';
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
        console.log('[SymbolPaletteManager] 🔄 ✅ Dropped symbol preview updated');
    }

    /**
     * ✅ AJOUTE UN SYMBOLE AU CONTENEUR DE STOCKAGE
     */
    addSymbolToStorageContainer(geometry, symbolId) {
        console.log('[SymbolPaletteManager] ➕ Adding symbol to storage:', geometry.name || 'Sans nom', 'with ID:', symbolId);

        const storageContainer = document.getElementById('usedSymbolsStorage');
        if (!storageContainer) {
            console.error('[SymbolPaletteManager] ❌ Storage container not found!');
            return;
        }

        // ✅ Déterminer la partie (catégorie)
        const geometryIndex = this.stateManager.geometries.indexOf(geometry);
        const partId = this.stateManager.getGeometryPart(geometryIndex);
        const partTitle = partId ?
            (this.stateManager.legendParts.find(p => p.id === partId)?.title || 'Unclassified') :
            'Unclassified';

        // ✅ Chercher ou créer le conteneur de la partie
        let partContainer = storageContainer.querySelector(`[data-part-id="${partId}"]`);

        if (!partContainer) {
            console.log('[SymbolPaletteManager] 📦 Creating new storage part:', partTitle);

            partContainer = document.createElement('div');
            partContainer.className = 'storage-symbol-part';
            partContainer.setAttribute('data-part-id', partId);

            const header = document.createElement('div');
            header.className = 'storage-symbol-part-header';
            header.textContent = partTitle;

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'storage-symbol-items-container';

            partContainer.appendChild(header);
            partContainer.appendChild(itemsContainer);
            storageContainer.appendChild(partContainer);

            this.storagePartContainers.set(partId, partContainer);
        }

        // ✅ Créer l'élément du symbole
        const symbolElement = this.createStorageSymbolElement(geometry, symbolId);

        // ✅ Ajouter au conteneur
        const itemsContainer = partContainer.querySelector('.storage-symbol-items-container');
        itemsContainer.appendChild(symbolElement);

        console.log('[SymbolPaletteManager] ✅ Symbol added to storage:', geometry.name || 'Sans nom');
    }

    /**
     * ✅ CRÉE UN ÉLÉMENT DE SYMBOLE AVEC APERÇU ADAPTÉ AU TYPE DE GÉOMÉTRIE
     */
    createStorageSymbolElement(geometry, symbolId) {
        console.log('[SymbolPaletteManager] 🎨 createStorageSymbolElement START');
        console.log('[SymbolPaletteManager] 🎨  - symbolId:', symbolId);
        console.log('[SymbolPaletteManager] 🎨  - geometry.type:', geometry.type);
        console.log('[SymbolPaletteManager] 🎨  - geometry.arrowType:', geometry.arrowType);
        console.log('[SymbolPaletteManager] 🎨  - geometry.markerType:', geometry.markerType);

        const symbolElement = document.createElement('div');
        symbolElement.className = 'storage-symbol-item';
        symbolElement.setAttribute('data-symbol-id', symbolId);
        symbolElement.setAttribute('data-geometry-type', geometry.type);
        symbolElement.draggable = true;

        // ✅ CONTENEUR DE L'APERÇU (adaptable selon le type)
        const previewContainer = document.createElement('div');
        previewContainer.className = 'storage-symbol-preview-container';

        // ✅ ADAPTER SELON LE TYPE DE GÉOMÉTRIE
        console.log('[SymbolPaletteManager] 🔍 Checking geometry type...');

        if (geometry.type && geometry.type.startsWith('Marker_')) {
            console.log('[SymbolPaletteManager] 📍 MARKER DETECTED → Creating marker preview');
            this._createMarkerPreview(previewContainer, geometry);
        } else if (geometry.arrowType && geometry.arrowType !== 'none') {
            console.log('[SymbolPaletteManager] ➡️ ARROW DETECTED (type:', geometry.arrowType, ') → Creating arrow preview');
            this._createArrowPreview(previewContainer, geometry);
        } else {
            console.log('[SymbolPaletteManager] ⬜ SHAPE DETECTED → Creating shape preview');
            this._createShapePreview(previewContainer, geometry);
        }

        // ✅ NOM DU SYMBOLE
        const name = document.createElement('span');
        name.className = 'storage-symbol-name';
        name.textContent = geometry.name || 'Sans nom';

        symbolElement.appendChild(previewContainer);
        symbolElement.appendChild(name);

        // ✅ DRAG & DROP
        symbolElement.addEventListener('dragstart', (e) => {
            console.log('[SymbolPaletteManager] 🎯 Dragging:', geometry.name);
            this.onStorageSymbolDragStart(e, geometry);
        });
        symbolElement.addEventListener('dragend', (e) => this.onStorageSymbolDragEnd(e));

        console.log('[SymbolPaletteManager] 🎨 createStorageSymbolElement COMPLETE');
        return symbolElement;
    }

    /**
     * ✅ APERÇU POUR LES SHAPES (carrés colorés)
     */
    _createShapePreview(container, geometry) {
        console.log('[SymbolPaletteManager] ⬜ _createShapePreview - color:', geometry.color, 'lineColor:', geometry.lineColor);

        const preview = document.createElement('div');
        preview.className = 'storage-symbol-preview shape-preview';
        preview.style.backgroundColor = geometry.color || '#3388ff';
        preview.style.borderColor = geometry.lineColor || '#000000';
        preview.style.opacity = geometry.opacity !== undefined ? geometry.opacity : 1;
        preview.style.borderWidth = (geometry.lineWeight || 2) + 'px';

        // ✅ Appliquer le style de ligne
        if (geometry.lineDash === 'dashed') {
            preview.style.borderStyle = 'dashed';
            console.log('[SymbolPaletteManager] ⬜ Dashed style applied');
        } else if (geometry.lineDash === 'dotted') {
            preview.style.borderStyle = 'dotted';
            console.log('[SymbolPaletteManager] ⬜ Dotted style applied');
        } else {
            preview.style.borderStyle = 'solid';
            console.log('[SymbolPaletteManager] ⬜ Solid style applied');
        }

        container.appendChild(preview);
        console.log('[SymbolPaletteManager] ✅ Shape preview created');
    }

    /**
     * ✅ APERÇU POUR LES MARKERS SVG - VERSION CORRIGÉE
     */
    _createMarkerPreview(container, geometry) {
        console.log('[SymbolPaletteManager] 📍 _createMarkerPreview START');
        console.log('[SymbolPaletteManager] 📍  - geometry.type:', geometry.type);
        console.log('[SymbolPaletteManager] 📍  - markerSize:', geometry.markerSize);

        const preview = document.createElement('div');
        preview.className = 'storage-symbol-preview marker-preview';
        preview.style.display = 'flex';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';
        preview.style.backgroundColor = '#f5f5f5';
        preview.style.border = '1px solid #ccc';
        preview.style.borderRadius = '2px';

        // ✅ Déterminer le type de marqueur
        const markerType = geometry.type.replace('Marker_', '');
        console.log('[SymbolPaletteManager] 📍 markerType:', markerType);

        // ✅ Créer une petite version du SVG du marqueur
        try {
            const markerSize = geometry.markerSize || 24;
            const scaledSize = Math.max(16, Math.min(24, markerSize / 2)); // Réduit pour l'aperçu
            console.log('[SymbolPaletteManager] 📍 Original size:', markerSize, '→ Scaled size:', scaledSize);

            // ✅ Utiliser SVGUtils pour créer le marqueur
            if (window.SVGUtils && window.SVGUtils.generateMarkerSVG) {
                console.log('[SymbolPaletteManager] 📍 SVGUtils.generateMarkerSVG available → Creating marker');

                // ✅ Générer le SVG du marqueur directement
                const markerSvgUrl = window.SVGUtils.generateMarkerSVG(markerType, {
                    color: geometry.color || '#007bff',
                    lineColor: geometry.lineColor || '#000000',
                    opacity: geometry.opacity !== undefined ? geometry.opacity : 1,
                    lineWeight: geometry.lineWeight || 2,
                    lineDash: geometry.lineDash || 'solid',
                    markerSize: scaledSize
                });

                console.log('[SymbolPaletteManager] 📍 Marker SVG URL generated');

                // ✅ Créer l'image du marqueur
                const iconElement = document.createElement('img');
                iconElement.src = markerSvgUrl;
                iconElement.style.width = scaledSize + 'px';
                iconElement.style.height = scaledSize + 'px';
                iconElement.style.objectFit = 'contain';
                iconElement.style.pointerEvents = 'none';

                iconElement.addEventListener('load', () => {
                    console.log('[SymbolPaletteManager] 📍 ✅ Marker image loaded successfully');
                });
                iconElement.addEventListener('error', (e) => {
                    console.error('[SymbolPaletteManager] 📍 ❌ Marker image failed to load:', e);
                    // Fallback
                    iconElement.textContent = '?';
                    iconElement.style.fontSize = '14px';
                });

                preview.appendChild(iconElement);
                console.log('[SymbolPaletteManager] 📍 ✅ Marker image appended');
            } else if (window.SVGUtils && window.SVGUtils.createMarkerSVG) {
                console.log('[SymbolPaletteManager] 📍 ⚠️ Using fallback createMarkerSVG method');

                // ✅ Fallback: Créer un SVG simple comme aperçu
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.style.width = scaledSize + 'px';
                svg.style.height = scaledSize + 'px';
                svg.style.display = 'inline-block';

                // ✅ Créer une simple représentation selon le type
                const shape = this._createMarkerShape(markerType, geometry, scaledSize);
                svg.appendChild(shape);
                preview.appendChild(svg);
                console.log('[SymbolPaletteManager] 📍 ✅ Fallback marker shape created');
            } else {
                console.warn('[SymbolPaletteManager] 📍 ⚠️ SVGUtils NOT available');
                const fallback = document.createElement('div');
                fallback.textContent = '📍';
                fallback.style.fontSize = '16px';
                preview.appendChild(fallback);
            }
        } catch (error) {
            console.error('[SymbolPaletteManager] 📍 ❌ Error creating marker preview:', error.message);
            console.error('[SymbolPaletteManager] 📍 Stack:', error.stack);
            const fallback = document.createElement('div');
            fallback.textContent = '⚠️';
            fallback.style.fontSize = '14px';
            preview.appendChild(fallback);
        }

        container.appendChild(preview);
        console.log('[SymbolPaletteManager] 📍 _createMarkerPreview COMPLETE');
    }

    /**
     * ✅ CRÉE UNE FORME SVG SIMPLE POUR LES MARQUEURS (fallback)
     */
    _createMarkerShape(markerType, geometry, size) {
        const color = geometry.color || '#007bff';
        const lineColor = geometry.lineColor || '#000000';
        const lineWeight = geometry.lineWeight || 2;

        console.log('[SymbolPaletteManager] 🎨 Creating marker shape:', markerType);

        switch (markerType) {
            case 'circle': {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', '12');
                circle.setAttribute('cy', '12');
                circle.setAttribute('r', '8');
                circle.setAttribute('fill', color);
                circle.setAttribute('stroke', lineColor);
                circle.setAttribute('stroke-width', lineWeight);
                return circle;
            }
            case 'square': {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', '4');
                rect.setAttribute('y', '4');
                rect.setAttribute('width', '16');
                rect.setAttribute('height', '16');
                rect.setAttribute('fill', color);
                rect.setAttribute('stroke', lineColor);
                rect.setAttribute('stroke-width', lineWeight);
                return rect;
            }
            case 'triangle': {
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '12,2 20,20 4,20');
                polygon.setAttribute('fill', color);
                polygon.setAttribute('stroke', lineColor);
                polygon.setAttribute('stroke-width', lineWeight);
                return polygon;
            }
            case 'hexagon': {
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '12,2 20,6 20,14 12,18 4,14 4,6');
                polygon.setAttribute('fill', color);
                polygon.setAttribute('stroke', lineColor);
                polygon.setAttribute('stroke-width', lineWeight);
                return polygon;
            }
            case 'diamond': {
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '12,2 22,12 12,22 2,12');
                polygon.setAttribute('fill', color);
                polygon.setAttribute('stroke', lineColor);
                polygon.setAttribute('stroke-width', lineWeight);
                return polygon;
            }
            case 'star': {
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '12,2 15,10 23,10 17,15 20,23 12,18 4,23 7,15 1,10 9,10');
                polygon.setAttribute('fill', color);
                polygon.setAttribute('stroke', lineColor);
                polygon.setAttribute('stroke-width', lineWeight);
                return polygon;
            }
            case 'pin': {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M12,2 C7,2 3,6 3,11 C3,16 12,23 12,23 C12,23 21,16 21,11 C21,6 17,2 12,2 Z');
                path.setAttribute('fill', color);
                path.setAttribute('stroke', lineColor);
                path.setAttribute('stroke-width', lineWeight);
                return path;
            }
            default: {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', '12');
                circle.setAttribute('cy', '12');
                circle.setAttribute('r', '6');
                circle.setAttribute('fill', color);
                circle.setAttribute('stroke', lineColor);
                circle.setAttribute('stroke-width', lineWeight);
                return circle;
            }
        }
    }


    /**
     * ✅ APERÇU POUR LES ARROWS (flèches) - VERSION AMÉLIORÉE
     */
    _createArrowPreview(container, geometry) {
        console.log('[SymbolPaletteManager] ➡️ _createArrowPreview START');
        console.log('[SymbolPaletteManager] ➡️  - arrowType:', geometry.arrowType);
        console.log('[SymbolPaletteManager] ➡️  - lineColor:', geometry.lineColor);
        console.log('[SymbolPaletteManager] ➡️  - lineWeight:', geometry.lineWeight);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 120 80');
        svg.setAttribute('class', 'storage-symbol-preview arrow-preview');
        svg.style.width = '50px';
        svg.style.height = '32px';
        svg.style.display = 'inline-block';
        svg.style.pointerEvents = 'none';

        // ✅ Ajouter un fond de couleur légère
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '120');
        background.setAttribute('height', '80');
        background.setAttribute('fill', '#f9f9f9');
        background.setAttribute('stroke', '#e0e0e0');
        background.setAttribute('stroke-width', '1');
        svg.appendChild(background);

        // ✅ Récupérer les paramètres de la flèche
        const lineColor = geometry.lineColor || '#000000';
        const lineWeight = geometry.lineWeight || 2;
        const arrowType = geometry.arrowType;
        const dashArray = this._convertDashToArray(geometry.lineDash || 'solid');

        console.log('[SymbolPaletteManager] ➡️  - dashArray:', dashArray);

        // ✅ Ligne horizontale représentant la flèche (plus longue et visible)
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '15');
        line.setAttribute('y1', '40');
        line.setAttribute('x2', '105');
        line.setAttribute('y2', '40');
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', lineWeight + 1); // Légèrement plus épais
        if (dashArray) line.setAttribute('stroke-dasharray', dashArray);
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-linejoin', 'round');

        svg.appendChild(line);

        // ✅ Taille des arrowheads (adaptée à la visibilité)
        const arrowSize = 8;

        // ✅ Créer les arrowheads selon le type
        if (arrowType === 'simple' || arrowType === 'line') {
            console.log('[SymbolPaletteManager] ➡️ Adding right arrow (simple)');
            // Flèche droite →
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', `105,40 ${105 - arrowSize},${40 - arrowSize} ${105 - arrowSize},${40 + arrowSize}`);
            polygon.setAttribute('fill', lineColor);
            svg.appendChild(polygon);
        }

        if (arrowType === 'both' || arrowType === 'doubleArrow') {
            console.log('[SymbolPaletteManager] ➡️ Adding both arrows (double)');
            // Flèche droite →
            const rightArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            rightArrow.setAttribute('points', `105,40 ${105 - arrowSize},${40 - arrowSize} ${105 - arrowSize},${40 + arrowSize}`);
            rightArrow.setAttribute('fill', lineColor);
            svg.appendChild(rightArrow);

            // Flèche gauche ←
            const leftArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            leftArrow.setAttribute('points', `15,40 ${15 + arrowSize},${40 - arrowSize} ${15 + arrowSize},${40 + arrowSize}`);
            leftArrow.setAttribute('fill', lineColor);
            svg.appendChild(leftArrow);
        }

        if (arrowType === 'reverse') {
            console.log('[SymbolPaletteManager] ➡️ Adding left arrow (reverse)');
            // Flèche gauche ←
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', `15,40 ${15 + arrowSize},${40 - arrowSize} ${15 + arrowSize},${40 + arrowSize}`);
            polygon.setAttribute('fill', lineColor);
            svg.appendChild(polygon);
        }

        // ✅ Ajouter une étiquette du type de flèche
        const typeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeLabel.setAttribute('x', '60');
        typeLabel.setAttribute('y', '70');
        typeLabel.setAttribute('text-anchor', 'middle');
        typeLabel.setAttribute('font-size', '10');
        typeLabel.setAttribute('fill', '#666');
        typeLabel.setAttribute('font-family', 'Arial, sans-serif');

        // ✅ Texte selon le type
        let typeText = '';
        if (arrowType === 'simple' || arrowType === 'line') {
            typeText = '→';
        } else if (arrowType === 'both' || arrowType === 'doubleArrow') {
            typeText = '↔';
        } else if (arrowType === 'reverse') {
            typeText = '←';
        }

        typeLabel.textContent = typeText;
        svg.appendChild(typeLabel);

        console.log('[SymbolPaletteManager] ➡️ Arrow type label:', typeText);

        container.appendChild(svg);
        console.log('[SymbolPaletteManager] ➡️ _createArrowPreview COMPLETE');
    }


    /**
     * ✅ MET À JOUR UN SYMBOLE EXISTANT (avec logs complets)
     */
    updateSymbolInStorageContainer(symbolId) {
        console.log('[SymbolPaletteManager] 🔄 updateSymbolInStorageContainer START - ID:', symbolId);

        const storageContainer = document.getElementById('usedSymbolsStorage');
        if (!storageContainer) {
            console.error('[SymbolPaletteManager] 🔄 ❌ Storage container not found');
            return;
        }

        const symbolElement = storageContainer.querySelector(`[data-symbol-id="${symbolId}"]`);
        if (!symbolElement) {
            console.warn('[SymbolPaletteManager] 🔄 ⚠️ Symbol element not found for ID:', symbolId);
            return;
        }

        const symbol = this.usedSymbols.get(symbolId);
        if (!symbol) {
            console.warn('[SymbolPaletteManager] 🔄 ⚠️ Symbol data not found:', symbolId);
            return;
        }

        console.log('[SymbolPaletteManager] 🔄 Geometry type:', symbol.geometry.type);
        console.log('[SymbolPaletteManager] 🔄 Arrow type:', symbol.geometry.arrowType);

        // ✅ Recréer le conteneur de l'aperçu (pour adapter au type)
        const oldPreviewContainer = symbolElement.querySelector('.storage-symbol-preview-container');
        if (oldPreviewContainer) {
            console.log('[SymbolPaletteManager] 🔄 Removing old preview container');
            oldPreviewContainer.remove();
        }

        const previewContainer = document.createElement('div');
        previewContainer.className = 'storage-symbol-preview-container';

        // ✅ Adapter selon le type
        const geometry = symbol.geometry;
        if (geometry.type && geometry.type.startsWith('Marker_')) {
            console.log('[SymbolPaletteManager] 🔄 Updating MARKER preview');
            this._createMarkerPreview(previewContainer, geometry);
        } else if (geometry.arrowType && geometry.arrowType !== 'none') {
            console.log('[SymbolPaletteManager] 🔄 Updating ARROW preview');
            this._createArrowPreview(previewContainer, geometry);
        } else {
            console.log('[SymbolPaletteManager] 🔄 Updating SHAPE preview');
            this._createShapePreview(previewContainer, geometry);
        }

        // ✅ Insérer avant le nom
        const name = symbolElement.querySelector('.storage-symbol-name');
        symbolElement.insertBefore(previewContainer, name);

        // ✅ Mettre à jour le nom
        if (name) {
            name.textContent = symbol.name;
        }

        console.log('[SymbolPaletteManager] 🔄 updateSymbolInStorageContainer COMPLETE');
    }

    /**
     * ✅ CONVERTIR LE TYPE DE TIRET EN FORMAT SVG
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
     * ✅ RETIRE UN SYMBOLE DU CONTENEUR
     */
    removeSymbolFromStorageContainer(symbolId) {
        console.log('[SymbolPaletteManager] ➖ Removing symbol from storage:', symbolId);

        const storageContainer = document.getElementById('usedSymbolsStorage');
        if (!storageContainer) return;

        const symbolElement = storageContainer.querySelector(`[data-symbol-id="${symbolId}"]`);
        if (symbolElement) {
            const partContainer = symbolElement.closest('.storage-symbol-part');
            symbolElement.remove();

            // ✅ Si la partie est vide, la supprimer aussi
            if (partContainer && !partContainer.querySelector('.storage-symbol-item')) {
                partContainer.remove();
            }
        }

        console.log('[SymbolPaletteManager] ✅ Symbol removed from storage');
    }

    /**
     * ✅ DRAG DU SYMBOLE DEPUIS LE STOCKAGE - VERSION CORRIGÉE
     */
    onStorageSymbolDragStart(e, geometry) {
        console.log('[SymbolPaletteManager] 🎯 DRAG START - storage symbol');
        console.log('[SymbolPaletteManager] 🎯  - geometry.name:', geometry.name);
        console.log('[SymbolPaletteManager] 🎯  - geometry.id:', geometry.id);

        // ✅ UTILISER L'ID STABLE DU STATEMANAGER (pas _leaflet_id!)
        const stableId = geometry.id;

        if (!stableId) {
            console.error('[SymbolPaletteManager] 🎯 ❌ ERROR: No stable ID found');
            return;
        }

        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', stableId.toString());
        e.currentTarget.classList.add('dragging');

        // ✅ Ajouter une image de drag custom
        const dragImage = document.createElement('div');
        dragImage.textContent = geometry.name || 'Symbole';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-9999px';
        dragImage.style.padding = '5px 10px';
        dragImage.style.backgroundColor = '#007bff';
        dragImage.style.color = 'white';
        dragImage.style.borderRadius = '4px';
        dragImage.style.fontSize = '12px';
        dragImage.style.fontWeight = 'bold';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => dragImage.remove(), 0);

        console.log('[SymbolPaletteManager] 🎯 ✅ Dragging:', geometry.name, '(ID:', stableId + ')');
    }

    /**
     * ✅ FIN DU DRAG
     */
    onStorageSymbolDragEnd(e) {
        console.log('[SymbolPaletteManager] 🎯 DRAG END');
        e.currentTarget.classList.remove('dragging');
        console.log('[SymbolPaletteManager] 🎯 ✅ Drag ended');
    }

    /**
     * ✅ SURVOL D'UNE ZONE DE DROP
     */
    onDragOver(e) {
        console.log('[SymbolPaletteManager] 📥 DRAG OVER - drop zone');
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    }

    /**
     * ✅ SORTIE D'UNE ZONE DE DROP
     */
    onDragLeave(e) {
        console.log('[SymbolPaletteManager] 📤 DRAG LEAVE - drop zone');
        e.currentTarget.classList.remove('drag-over');
    }

    onDrop(e) {
        console.log('[SymbolPaletteManager] 📍 DROP EVENT START');
        e.preventDefault();
        e.stopPropagation();

        const dropZone = e.currentTarget;
        dropZone.classList.remove('drag-over');

        // ✅ Récupérer et convertir l'ID
        let symbolId = e.dataTransfer.getData('text/plain');
        const numSymbolId = parseInt(symbolId, 10);

        let symbol = this.usedSymbols.get(numSymbolId) || this.usedSymbols.get(symbolId);

        if (!symbol) {
            console.error('[SymbolPaletteManager] ❌ Symbol not found');
            return;
        }

        // ✅ MARQUER LE SYMBOLE COMME "DÉPOSÉ"
        symbol.dropped = true;
        symbol.dropZoneId = dropZone.getAttribute('data-zone-id');
        console.log('[SymbolPaletteManager] 📍 ✅ Symbol marked as dropped:', symbol.name);

        // ✅ MASQUER LE SYMBOLE DU CONTENEUR DE STOCKAGE
        this.hideSymbolInStorageContainer(numSymbolId || symbolId);

        // ✅ CRÉER L'APERÇU DANS LA DROP ZONE
        dropZone.innerHTML = '';
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'dropped-symbol-wrapper';
        previewWrapper.style.width = '100%';
        previewWrapper.style.height = '100%';
        previewWrapper.style.display = 'flex';
        previewWrapper.style.alignItems = 'center';
        previewWrapper.style.justifyContent = 'center';

        const geometry = symbol.geometry;
        if (geometry.type && geometry.type.startsWith('Marker_')) {
            this._createMarkerPreview(previewWrapper, geometry);
        } else if (geometry.arrowType && geometry.arrowType !== 'none') {
            this._createArrowPreview(previewWrapper, geometry);
        } else {
            const preview = document.createElement('div');
            preview.className = 'dropped-symbol';
            preview.style.backgroundColor = geometry.color || symbol.color || '#3388ff';
            preview.style.borderColor = geometry.lineColor || symbol.lineColor || '#000000';
            preview.style.borderWidth = (geometry.lineWeight || symbol.lineWeight || 2) + 'px';
            preview.style.opacity = geometry.opacity !== undefined ? geometry.opacity : (symbol.opacity || 1);
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
        dropZone.setAttribute('data-symbol-id', numSymbolId || symbolId);
        dropZone.classList.add('filled');

        console.log('[SymbolPaletteManager] 📍 ✅ DROP COMPLETE - Symbol installed:', symbol.name);
    }

    /**
     * ✅ MASQUE UN SYMBOLE DU CONTENEUR DE STOCKAGE (jusqu'à ce qu'il soit "déposé" ailleurs)
     */
    hideSymbolInStorageContainer(symbolId) {
        console.log('[SymbolPaletteManager] 👁️ Hiding symbol in storage:', symbolId);

        const storageContainer = document.getElementById('usedSymbolsStorage');
        if (!storageContainer) return;

        const symbolElement = storageContainer.querySelector(`[data-symbol-id="${symbolId}"]`);
        if (symbolElement) {
            symbolElement.style.display = 'none';
            symbolElement.classList.add('hidden');
            console.log('[SymbolPaletteManager] 👁️ ✅ Symbol hidden:', symbolId);
        }
    }

    /**
     * ✅ AFFICHE UN SYMBOLE DANS LE CONTENEUR DE STOCKAGE
     */
    showSymbolInStorageContainer(symbolId) {
        console.log('[SymbolPaletteManager] 👁️ Showing symbol in storage:', symbolId);

        const storageContainer = document.getElementById('usedSymbolsStorage');
        if (!storageContainer) return;

        const symbolElement = storageContainer.querySelector(`[data-symbol-id="${symbolId}"]`);
        if (symbolElement) {
            symbolElement.style.display = 'flex';
            symbolElement.classList.remove('hidden');
            console.log('[SymbolPaletteManager] 👁️ ✅ Symbol shown:', symbolId);
        }
    }



    /**
     * ✅ INITIALISATION DU DRAG & DROP
     */
    setupDragAndDrop() {
        console.log('[SymbolPaletteManager] 🔧 setupDragAndDrop START');
        console.log('[SymbolPaletteManager] 🔧  - Connecting drop zone handlers...');

        // ✅ Attacher les événements à toutes les zones de drop
        this.dropZoneElements.forEach((dropZone, index) => {
            console.log('[SymbolPaletteManager] 🔧  - Drop zone', index, 'ID:', dropZone.id || 'N/A');

            dropZone.addEventListener('dragover', (e) => this.onDragOver(e));
            dropZone.addEventListener('dragleave', (e) => this.onDragLeave(e));
            dropZone.addEventListener('drop', (e) => this.onDrop(e));
        });

        console.log('[SymbolPaletteManager] 🔧 ✅ Drag & drop configured for', this.dropZoneElements.length, 'zones');
    }

}
