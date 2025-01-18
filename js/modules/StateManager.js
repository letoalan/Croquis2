// StateManager.js
import { SVGUtils } from './utils/SVGUtils.js'; // Assurez-vous que le chemin est correct

export class StateManager {
    constructor() {
        this.geometries = []; // Liste des géométries (marqueurs, polygones, etc.)
        this.selectedIndex = null; // Index de la géométrie sélectionnée
        this.mapManager = null; // Référence au MapManager
        this.legendManager = null; // Référence au LegendManager
        this.mapTitle = ''; // Titre de la carte
        this.isTitlePanelCollapsed = false; // État du panneau de titre
        this.temporarySVGs = new Map(); // Stocke les SVG temporaires pendant l'édition
    }

    /**
     * Définit le titre de la carte.
     * @param {string} title - Le nouveau titre de la carte.
     */
    setMapTitle(title) {
        if (typeof title !== 'string') {
            console.error('[StateManager] Invalid title type:', title);
            return;
        }

        this.mapTitle = title; // Mettre à jour le titre de la carte
        this.updateUI(); // Mettre à jour l'interface utilisateur

        console.log('[StateManager] Map title updated:', title);
    }


    /**
     * Définit le MapManager.
     * @param {MapManager} mapManager - L'instance de MapManager.
     */
    setMapManager(mapManager) {
        if (!mapManager) {
            throw new Error('MapManager is required for StateManager initialization.');
        }
        this.mapManager = mapManager;
    }



    /**
     * Définit le LegendManager.
     * @param {LegendManager} legendManager - L'instance de LegendManager.
     */
    setLegendManager(legendManager) {
        if (!legendManager) {
            throw new Error('LegendManager is required for StateManager initialization.');
        }
        this.legendManager = legendManager;
    }

    /**
     * Ajoute une géométrie à la liste.
     * @param {Object} geometry - La géométrie à ajouter.
     */
    // Dans StateManager.js, méthode addGeometry
    addGeometry(geometry) {
        if (!geometry || !geometry.layer) {
            console.error('[StateManager] Geometry or layer is undefined in addGeometry.');
            return;
        }

        // Vérifier si la géométrie existe déjà
        const existingGeometry = this.geometries.find(g => g.layer === geometry.layer);
        if (existingGeometry) {
            console.warn('[StateManager] Geometry already exists:', existingGeometry);
            return;
        }

        // Ajouter la géométrie à la liste
        this.geometries.push(geometry);

        // Mettre à jour la légende et l'interface utilisateur
        if (this.legendManager) {
            this.legendManager.updateLegend();
        }
        this.updateUI();

        console.log('[StateManager] Geometry added:', geometry);
    }


    /**
     * Sélectionne une forme et active l'édition.
     * @param {number} index - L'index de la géométrie à sélectionner.
     */
    selectGeometryForEditing(index) {
        if (index < 0 || index >= this.geometries.length) {
            console.error('[StateManager] Invalid index in selectGeometryForEditing:', index);
            return;
        }

        const geometry = this.geometries[index];
        if (!geometry || !geometry.layer) {
            console.error('[StateManager] Geometry or layer is undefined.');
            return;
        }

        // Activer l'édition sur la forme sélectionnée
        if (geometry.layer.pm) {
            geometry.layer.pm.enable({
                snappable: true,
                snapDistance: 20,
                allowSelfIntersection: true,
                addVertexOn: 'midpoint', // Activation des vertex midpoints
                preventMarkerRemoval: false,
                removeLayerOnEmpty: true,
            });
        }

        // Désactiver l'édition sur toutes les autres formes
        this.mapManager.map.eachLayer((layer) => {
            if (layer !== geometry.layer && layer.pm) {
                layer.pm.disable();
            }
        });

        // Mettre à jour l'interface utilisateur
        this.updateUI();

        console.log('[StateManager] Geometry selected for editing:', geometry);
    }

    /**
     * Supprime une géométrie de la liste.
     * @param {number} index - L'index de la géométrie à supprimer.
     */
    deleteGeometry(index) {
        if (index < 0 || index >= this.geometries.length) {
            console.error('[StateManager] Invalid index in deleteGeometry:', index);
            return;
        }

        const geometry = this.geometries[index];
        if (geometry && geometry.layer) {
            this.mapManager.map.removeLayer(geometry.layer); // Supprimer la couche de la carte
        }

        this.geometries.splice(index, 1); // Supprimer la géométrie de la liste

        if (this.selectedIndex === index) {
            this.selectedIndex = null; // Réinitialiser l'index sélectionné
        } else if (this.selectedIndex > index) {
            this.selectedIndex--; // Ajuster l'index sélectionné si nécessaire
        }

        // Mettre à jour la légende après la suppression de la géométrie
        if (this.legendManager) {
            this.legendManager.updateLegend();
        }

        // Mettre à jour l'interface utilisateur
        this.updateUI();
    }

    /**
     * Met à jour le nom d'une géométrie.
     * @param {number} index - L'index de la géométrie à mettre à jour.
     * @param {string} newName - Le nouveau nom de la géométrie.
     */
    updateGeometryName(index, newName) {
        if (index < 0 || index >= this.geometries.length) {
            console.error('[StateManager] Invalid index in updateGeometryName:', index);
            return;
        }

        const geometry = this.geometries[index];
        if (geometry) {
            geometry.name = newName; // Mettre à jour le nom de la géométrie
            this.updateUI(); // Mettre à jour l'interface utilisateur
            if (this.legendManager) {
                this.legendManager.updateLegend(); // Rafraîchir la légende
            }
        }
    }

    /**
     * Applique les styles à la géométrie sélectionnée.
     * @param {string} color - La couleur de remplissage.
     * @param {string} lineColor - La couleur de la ligne.
     * @param {number} opacity - L'opacité.
     * @param {string} lineDash - Le style de ligne (solid, dashed, dotted).
     * @param {number} lineWeight - L'épaisseur de la ligne.
     * @param {number} markerSize - La taille du marqueur (si applicable).
     * @param {string} shape - La forme du marqueur (si applicable).
     */
    applyStyle(color, lineColor, opacity, lineDash, lineWeight, markerSize) {
        if (this.selectedIndex === null || this.selectedIndex < 0 || this.selectedIndex >= this.geometries.length) {
            console.error('[StateManager] No geometry selected or invalid index.');
            return;
        }

        const geometry = this.geometries[this.selectedIndex];
        if (!geometry || !geometry.layer) {
            console.error('[StateManager] Geometry or layer is undefined.');
            return;
        }

        // Appliquer les styles à la couche Leaflet
        const style = {
            color: lineColor,
            fillColor: color,
            fillOpacity: opacity,
            weight: lineWeight,
            dashArray: lineDash === 'dashed' ? '5,5' : lineDash === 'dotted' ? '2,2' : ''
        };

        if (geometry.layer.setStyle) {
            geometry.layer.setStyle(style);
        } else if (geometry.type === 'CustomMarker') {
            // Mise à jour du style pour les marqueurs SVG
            SVGUtils.updateMarkerStyle(geometry.layer, {
                color: color,
                lineColor: lineColor,
                lineWeight: lineWeight,
                opacity: opacity,
                markerSize: markerSize // Ajouter la taille du marqueur
            });
        } else {
            console.error('[StateManager] Layer does not support setStyle method:', geometry.layer);
        }

        // Mettre à jour les propriétés de la géométrie
        geometry.color = color;
        geometry.lineColor = lineColor;
        geometry.opacity = opacity;
        geometry.lineDash = lineDash;
        geometry.lineWeight = lineWeight;

        // Si c'est un marqueur personnalisé, mettre à jour la taille
        if (geometry.type === 'CustomMarker') {
            geometry.markerSize = markerSize;
        }

        // Mettre à jour la légende et l'interface utilisateur
        if (this.legendManager) {
            this.legendManager.updateLegend();
        }
        this.updateUI();
    }

    /**
     * Termine l'édition d'une géométrie.
     * @param {number} index - L'index de la géométrie à finaliser.
     */
    finishEditingGeometry(index) {
        if (index < 0 || index >= this.geometries.length) {
            console.error('[StateManager] Invalid index in finishEditingGeometry:', index);
            return;
        }

        const geometry = this.geometries[index];
        if (!geometry || !geometry.layer) {
            console.error('[StateManager] Geometry or layer is undefined.');
            return;
        }

        // Désactiver l'édition de la couche si nécessaire
        if (geometry.layer.pm) {
            geometry.layer.pm.disable();
        }

        // Mettre à jour l'interface utilisateur
        this.updateUI();

        console.log('[StateManager] Editing finished for geometry at index:', index);
    }

    /**
     * Met à jour l'interface utilisateur.
     */
    updateUI() {
        console.log('[StateManager] Updating UI');

        // Mettre à jour l'affichage du titre de la carte
        const mapTitleDisplay = document.getElementById('mapTitleDisplay');
        if (mapTitleDisplay) {
            mapTitleDisplay.textContent = this.mapTitle;
        }

        // Mettre à jour la liste des géométries dans la sidebar
        this.updateList();

        // Mettre à jour la carte avec les géométries actuelles
        if (this.mapManager && this.mapManager.updateMap) {
            this.mapManager.updateMap();
        } else {
            console.error('[StateManager] mapManager.updateMap is not a function');
        }

        console.log('[StateManager] UI update complete');
    }

    /**
     * Met à jour la liste des géométries dans l'interface utilisateur.
     */
    updateList() {
        console.log('[StateManager] Updating geometry list');
        const container = document.getElementById('geometryList');
        if (!container) {
            console.error('[StateManager] Geometry list container not found in the DOM.');
            return;
        }

        container.innerHTML = '';

        // Supprimer les géométries obsolètes
        this.geometries = this.geometries.filter(geometry => geometry && geometry.type && geometry.layer);

        // Renommer les géométries pour éviter les doublons
        this.geometries.forEach((geometry, index) => {
            geometry.name = geometry.name || `Geometry ${index + 1}`; // Utiliser un nom par défaut si aucun nom n'est défini
        });

        // Afficher les géométries dans la sidebar
        this.geometries.forEach((geometry, index) => {
            const item = document.createElement('div');
            item.className = `list-item ${this.selectedIndex === index ? 'selected' : ''}`;
            const nameContainer = document.createElement('div');
            nameContainer.className = 'd-flex align-items-center flex-grow-1';

            // Ajouter un champ d'édition de texte pour le nom
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'form-control me-2';
            nameInput.value = geometry.name || `Geometry ${index + 1}`;
            nameInput.addEventListener('change', (e) => {
                const newName = e.target.value;
                this.updateGeometryName(index, newName); // Mettre à jour le nom dans le StateManager
            });

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning btn-sm me-2';
            editBtn.textContent = 'Éditer';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.openContextMenu(index, e);
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.onclick = () => {
                this.deleteGeometry(index); // Appeler la méthode deleteGeometry du StateManager
            };

            nameContainer.appendChild(nameInput);
            item.appendChild(nameContainer);
            item.appendChild(editBtn);
            item.appendChild(deleteBtn);
            container.appendChild(item);
        });
    }

    /**
     * Ouvre le menu contextuel pour une géométrie spécifique.
     * @param {number} index - L'index de la géométrie.
     * @param {Event} event - L'événement de clic.
     */
    openContextMenu(index, event) {
        console.log('[StateManager] Opening context menu for geometry at index:', index);

        if (index < 0 || index >= this.geometries.length) {
            console.error('[StateManager] Invalid index in openContextMenu:', index);
            return;
        }

        const geometry = this.geometries[index];
        if (!geometry) {
            console.error('[StateManager] Geometry not found at index:', index);
            return;
        }

        this.selectedIndex = index;

        // Vérifiez si tous les éléments du menu contextuel existent
        const requiredElements = [
            'contextColorPicker', 'contextLineColorPicker', 'contextOpacitySlider',
            'contextLineDash', 'contextLineWeight', 'contextMarkerSize'
        ];

        const contextElements = requiredElements.reduce((elements, id) => {
            const el = document.getElementById(id);
            if (!el) console.warn(`[StateManager] Missing element: ${id}`);
            elements[id] = el;
            return elements;
        }, {});

        // Si des éléments requis sont manquants, arrêtez l'exécution
        if (Object.values(contextElements).some(el => !el)) {
            console.error('[StateManager] Some context menu elements are missing.');
            return;
        }

        // Remplissez les champs du menu contextuel avec les valeurs actuelles
        contextElements.contextColorPicker.value = geometry.color || "#000000";
        contextElements.contextLineColorPicker.value = geometry.lineColor || "#000000";
        contextElements.contextOpacitySlider.value = geometry.opacity || 1;
        contextElements.contextLineDash.value = geometry.lineDash || "solid";
        contextElements.contextLineWeight.value = geometry.lineWeight || 2;
        contextElements.contextMarkerSize.value = geometry.markerSize || 24;


        // Désactivez les champs si nécessaire
        if (geometry.type !== 'CustomMarker') {
            contextElements.contextMarkerSize.disabled = true;
            contextElements.contextMarkerSize.title = "La taille ne peut pas être modifiée pour ce type de géométrie.";
        } else {
            contextElements.contextMarkerSize.disabled = false;
            contextElements.contextMarkerSize.title = "";
        }

        // Affichez le menu contextuel
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.top = `${event.clientY}px`;
        } else {
            console.error('[StateManager] Context menu not found in the DOM.');
        }
    }
}