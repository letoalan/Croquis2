// js/modules/mapping/controls/ScaleOrientationManager.js

export class ScaleOrientationManager {
    constructor(map) {
        if (!map) {
            throw new Error('Map is required for ScaleOrientationManager initialization.');
        }

        this.map = map;
        this.scaleControl = null;
        this.orientationControl = null;

        console.log('[ScaleOrientationManager] Initializing...');
        this.initScale();
        this.initOrientation();
    }

    /**
     * ✅ Initialise l'échelle graphique
     */
    initScale() {
        // Options de l'échelle
        const scaleOptions = {
            position: 'bottomleft',
            maxWidth: 200, // Largeur maximale en pixels
            metric: true, // Afficher en mètres/kilomètres
            imperial: false, // Désactiver miles/pieds
            updateWhenIdle: false // Mise à jour en temps réel
        };

        // Créer et ajouter l'échelle
        this.scaleControl = L.control.scale(scaleOptions);
        this.scaleControl.addTo(this.map);

        console.log('[ScaleOrientationManager] Scale control added');
    }

    /**
     * ✅ Initialise la rose des vents (orientation)
     */
    initOrientation() {
        const OrientationControl = L.Control.extend({
            options: {
                position: 'topleft' // Position de la rose des vents
            },

            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'orientation-control');

                // ✅ Bloquer les événements de carte
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                // ✅ Créer la rose des vents SVG
                container.innerHTML = `
                    <svg width="60" height="60" viewBox="0 0 60 60" class="compass-rose">
                        <!-- Cercle de fond -->
                        <circle cx="30" cy="30" r="28" fill="rgba(255, 255, 255, 0.9)" 
                                stroke="#333" stroke-width="2"/>
                        
                        <!-- Flèche Nord (rouge) -->
                        <path d="M 30 5 L 25 25 L 30 22 L 35 25 Z" 
                              fill="#e74c3c" stroke="#333" stroke-width="1"/>
                        
                        <!-- Flèche Sud (blanc) -->
                        <path d="M 30 55 L 25 35 L 30 38 L 35 35 Z" 
                              fill="white" stroke="#333" stroke-width="1"/>
                        
                        <!-- Flèche Est (gris) -->
                        <path d="M 55 30 L 35 25 L 38 30 L 35 35 Z" 
                              fill="#95a5a6" stroke="#333" stroke-width="1"/>
                        
                        <!-- Flèche Ouest (gris) -->
                        <path d="M 5 30 L 25 25 L 22 30 L 25 35 Z" 
                              fill="#95a5a6" stroke="#333" stroke-width="1"/>
                        
                        <!-- Lettre N -->
                        <text x="30" y="12" text-anchor="middle" 
                              font-size="10" font-weight="bold" fill="#333">N</text>
                        
                        <!-- Lettre S -->
                        <text x="30" y="53" text-anchor="middle" 
                              font-size="8" fill="#333">S</text>
                        
                        <!-- Lettre E -->
                        <text x="50" y="33" text-anchor="middle" 
                              font-size="8" fill="#333">E</text>
                        
                        <!-- Lettre O (Ouest) -->
                        <text x="10" y="33" text-anchor="middle" 
                              font-size="8" fill="#333">O</text>
                    </svg>
                `;

                console.log('[ScaleOrientationManager] Orientation control created');
                return container;
            }
        });

        this.orientationControl = new OrientationControl();
        this.orientationControl.addTo(this.map);

        console.log('[ScaleOrientationManager] Orientation control added');
    }

    /**
     * ✅ Change la position de l'échelle
     */
    setScalePosition(position) {
        if (this.scaleControl) {
            this.scaleControl.remove();
            this.scaleControl.options.position = position;
            this.scaleControl.addTo(this.map);
            console.log('[ScaleOrientationManager] Scale position changed to:', position);
        }
    }

    /**
     * ✅ Change la position de la rose des vents
     */
    setOrientationPosition(position) {
        if (this.orientationControl) {
            this.orientationControl.remove();
            this.orientationControl.options.position = position;
            this.orientationControl.addTo(this.map);
            console.log('[ScaleOrientationManager] Orientation position changed to:', position);
        }
    }

    /**
     * ✅ Affiche/masque l'échelle
     */
    toggleScale(visible) {
        if (visible && !this.map.hasControl(this.scaleControl)) {
            this.scaleControl.addTo(this.map);
        } else if (!visible && this.map.hasControl(this.scaleControl)) {
            this.scaleControl.remove();
        }
        console.log('[ScaleOrientationManager] Scale visibility:', visible);
    }

    /**
     * ✅ Affiche/masque la rose des vents
     */
    toggleOrientation(visible) {
        if (visible && !this.map.hasControl(this.orientationControl)) {
            this.orientationControl.addTo(this.map);
        } else if (!visible && this.map.hasControl(this.orientationControl)) {
            this.orientationControl.remove();
        }
        console.log('[ScaleOrientationManager] Orientation visibility:', visible);
    }

    /**
     * ✅ Récupère le contrôle d'échelle
     */
    getScaleControl() {
        return this.scaleControl;
    }

    /**
     * ✅ Récupère le contrôle d'orientation
     */
    getOrientationControl() {
        return this.orientationControl;
    }

    /**
     * ✅ Récupère le container d'échelle
     */
    getScaleContainer() {
        return this.scaleControl?._container;
    }

    /**
     * ✅ Récupère le container d'orientation
     */
    getOrientationContainer() {
        return this.orientationControl?._container;
    }

}
