/**
 * PointerRouter.js
 * 
 * Orchestre les interactions pour les écrans géants Promethean.
 * Filtre les entrées par type (stylet, doigt, paume) et relaie
 * vers les gestionnaires appropriés.
 */

export class PointerRouter {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.palmThreshold = 40; // Seuil configurable en pixels (width/height)
        this.activePointers = new Map();
        this.debug = true;

        this.init();
    }

    init() {
        // Écoute globale des événements pointer sur le document
        document.addEventListener('pointerdown', (e) => this.handlePointerDown(e), true);
        document.addEventListener('pointermove', (e) => this.handlePointerMove(e), true);
        document.addEventListener('pointerup', (e) => this.handlePointerUp(e), true);
        document.addEventListener('pointercancel', (e) => this.handlePointerUp(e), true);
    }

    /**
     * Analyse et classifie l'entrée
     */
    classifyPointer(e) {
        // 1. Rejet de paume (contact large)
        if (e.width > this.palmThreshold || e.height > this.palmThreshold) {
            return 'palm';
        }

        // 2. Distinction par type natif
        if (e.pointerType === 'pen') return 'pen';
        if (e.pointerType === 'touch') return 'touch';
        if (e.pointerType === 'mouse') return 'mouse';

        return 'unknown';
    }

    handlePointerDown(e) {
        const type = this.classifyPointer(e);
        this.activePointers.set(e.pointerId, { type, event: e });

        if (this.debug) console.log(`[PointerRouter] Down: ${type} (ID: ${e.pointerId}, Size: ${e.width}x${e.height})`);

        if (type === 'palm') {
            e.stopPropagation();
            return;
        }

        // Relaie vers l'UI Manager pour d'éventuels ajustements d'interface immédiats
        if (this.uiManager && this.uiManager.onPointerEvent) {
            this.uiManager.onPointerEvent('down', type, e);
        }
    }

    handlePointerMove(e) {
        const pointerData = this.activePointers.get(e.pointerId);
        if (!pointerData) return;

        if (pointerData.type === 'palm') {
            e.stopPropagation();
            return;
        }
    }

    handlePointerUp(e) {
        const pointerData = this.activePointers.get(e.pointerId);
        if (!pointerData) return;

        const type = pointerData.type;
        this.activePointers.delete(e.pointerId);

        if (this.debug) console.log(`[PointerRouter] Up: ${type}`);

        if (this.uiManager && this.uiManager.onPointerEvent) {
            this.uiManager.onPointerEvent('up', type, e);
        }
    }
}
