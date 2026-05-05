// js/modules/ContextMenuDragger.js

export class ContextMenuDragger {
    constructor() {
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.initialLeft = 0;
        this.initialTop = 0;

        this.contextMenu = null;
        this.contextMenuHeader = null;

        this.init();
    }

    init() {
        this.contextMenu = document.getElementById('contextMenu');
        this.contextMenuHeader = document.getElementById('contextMenuHeader');

        if (!this.contextMenu || !this.contextMenuHeader) {
            console.warn('[ContextMenuDragger] Context menu elements not found');
            return;
        }

        this.addDragHandle();
        this.setupEventListeners();
        this.loadPosition();

        console.log('[ContextMenuDragger] Initialized successfully');
    }

    addDragHandle() {
        if (this.contextMenuHeader.querySelector('.drag-handle')) return;

        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⠿';
        dragHandle.title = 'Déplacer le menu';

        this.contextMenuHeader.insertBefore(dragHandle, this.contextMenuHeader.firstChild);
    }

    setupEventListeners() {
        // Souris
        this.contextMenuHeader.addEventListener('mousedown', this.handleDragStart.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));

        // Touch
        this.contextMenuHeader.addEventListener('touchstart', this.handleDragStart.bind(this));
        document.addEventListener('touchmove', this.handleDrag.bind(this));
        document.addEventListener('touchend', this.handleDragEnd.bind(this));

        // Empêcher la sélection de texte pendant le drag
        this.contextMenuHeader.addEventListener('selectstart', (e) => e.preventDefault());
    }

    handleDragStart(e) {
        // Ignorer si on clique sur un élément interactif
        if (this.isInteractiveElement(e.target)) return;

        if (e.target.closest('.context-menu-header')) {
            this.isDragging = true;
            this.contextMenu.classList.add('dragging');

            // Obtenir les coordonnées de départ
            const rect = this.contextMenu.getBoundingClientRect();
            this.initialLeft = rect.left;
            this.initialTop = rect.top;

            if (e.type === 'touchstart') {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
            } else {
                this.startX = e.clientX;
                this.startY = e.clientY;
            }

            // Désactiver les transitions pendant le drag
            this.contextMenu.style.transition = 'none';
            this.contextMenu.style.cursor = 'grabbing';

            e.preventDefault();
            e.stopPropagation();

            console.log('[ContextMenuDragger] Drag started', {
                startX: this.startX,
                startY: this.startY,
                initialLeft: this.initialLeft,
                initialTop: this.initialTop
            });
        }
    }

    handleDrag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculer le déplacement
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;

        // Nouvelle position absolue
        const newLeft = this.initialLeft + deltaX;
        const newTop = this.initialTop + deltaY;

        // Appliquer la nouvelle position
        this.contextMenu.style.left = `${newLeft}px`;
        this.contextMenu.style.top = `${newTop}px`;
        this.contextMenu.style.transform = 'none'; // Supprimer les transformations

        console.log('[ContextMenuDragger] Dragging', {
            clientX, clientY, deltaX, deltaY, newLeft, newTop
        });
    }

    handleDragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.contextMenu.classList.remove('dragging');
        this.contextMenu.style.cursor = '';

        // Réactiver les transitions
        this.contextMenu.style.transition = '';

        // Sauvegarder la position finale
        this.savePosition();

        console.log('[ContextMenuDragger] Drag ended');
    }

    isInteractiveElement(element) {
        const interactiveTags = ['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'];
        return interactiveTags.includes(element.tagName) ||
            element.closest('button') ||
            element.closest('input') ||
            element.closest('select');
    }

    savePosition() {
        const rect = this.contextMenu.getBoundingClientRect();
        const position = {
            left: rect.left,
            top: rect.top,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };

        localStorage.setItem('contextMenuPosition', JSON.stringify(position));
        console.log('[ContextMenuDragger] Position saved:', position);
    }

    loadPosition() {
        const saved = localStorage.getItem('contextMenuPosition');
        if (saved) {
            try {
                const position = JSON.parse(saved);

                // Vérifier si la position est toujours dans la fenêtre
                const isValidPosition = position.left >= 0 &&
                    position.left <= window.innerWidth &&
                    position.top >= 0 &&
                    position.top <= window.innerHeight;

                if (isValidPosition) {
                    this.contextMenu.style.left = `${position.left}px`;
                    this.contextMenu.style.top = `${position.top}px`;
                    this.contextMenu.style.transform = 'none';
                    console.log('[ContextMenuDragger] Position loaded:', position);
                } else {
                    console.log('[ContextMenuDragger] Saved position is outside viewport, using default');
                    this.setDefaultPosition();
                }
            } catch (error) {
                console.error('[ContextMenuDragger] Error loading position:', error);
                this.setDefaultPosition();
            }
        } else {
            this.setDefaultPosition();
        }
    }

    setDefaultPosition() {
        // Position par défaut : mi-chemin entre le panneau et le centre
        const sidebarWidth = 320;
        const margin = 50;
        const defaultLeft = sidebarWidth + margin;
        const defaultTop = window.innerHeight / 2;

        this.contextMenu.style.left = `${defaultLeft}px`;
        this.contextMenu.style.top = `${defaultTop}px`;
        this.contextMenu.style.transform = 'translateY(-50%)';
    }

    resetPosition() {
        this.setDefaultPosition();
        localStorage.removeItem('contextMenuPosition');
        console.log('[ContextMenuDragger] Position reset to default');
    }

    addResetButton() {
        const contextMenuFooter = document.querySelector('.context-menu-footer');
        if (!contextMenuFooter) return;

        if (contextMenuFooter.querySelector('.btn-context-reset')) return;

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'btn btn-context-reset';
        resetBtn.innerHTML = '🔄 Position par défaut';
        resetBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.resetPosition();
        };

        contextMenuFooter.appendChild(resetBtn);
    }

    onMenuShow() {
        // S'assurer que le menu est visible dans la fenêtre
        this.ensureVisibility();
    }

    onMenuHide() {
        if (this.isDragging) {
            this.handleDragEnd(new Event('force-end'));
        }
    }

    ensureVisibility() {
        const rect = this.contextMenu.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let needsAdjustment = false;
        let newLeft = parseFloat(this.contextMenu.style.left) || 0;
        let newTop = parseFloat(this.contextMenu.style.top) || 0;

        // Vérifier les bords
        if (rect.left < 10) {
            newLeft = 10;
            needsAdjustment = true;
        } else if (rect.right > viewport.width - 10) {
            newLeft = viewport.width - rect.width - 10;
            needsAdjustment = true;
        }

        if (rect.top < 10) {
            newTop = 10;
            needsAdjustment = true;
        } else if (rect.bottom > viewport.height - 10) {
            newTop = viewport.height - rect.height - 10;
            needsAdjustment = true;
        }

        if (needsAdjustment) {
            this.contextMenu.style.left = `${newLeft}px`;
            this.contextMenu.style.top = `${newTop}px`;
            this.contextMenu.style.transform = 'none';
            this.savePosition();
        }
    }
}