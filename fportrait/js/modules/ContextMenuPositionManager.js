// ContextMenuPositionManager.js - Gestion du stockage et ajustement de position

export class ContextMenuPositionManager {
    static savePosition(rect) {
        const position = {
            left: rect.left,
            top: rect.top,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };
        try {
            localStorage.setItem('contextMenuPosition', JSON.stringify(position));
        } catch (e) {
            console.error('[ContextMenuPositionManager] Failed to save position:', e);
        }
    }

    static loadSavedPosition() {
        try {
            const saved = localStorage.getItem('contextMenuPosition');
            if (!saved) return null;
            const position = JSON.parse(saved);
            const isValid = position.left >= 0 &&
                position.left <= window.innerWidth &&
                position.top >= 0 &&
                position.top <= window.innerHeight;
            return isValid ? position : null;
        } catch {
            return null;
        }
    }

    static getDefaultPosition() {
        const sidebarWidth = 320;
        const margin = 50;
        return {
            left: sidebarWidth + margin,
            top: window.innerHeight / 2
        };
    }

    static ensureWithinViewport(menuElement) {
        const rect = menuElement.getBoundingClientRect();
        let newLeft = parseFloat(menuElement.style.left) || 0;
        let newTop = parseFloat(menuElement.style.top) || 0;
        let adjusted = false;

        if (rect.left < 10) {
            newLeft = 10;
            adjusted = true;
        } else if (rect.right > window.innerWidth - 10) {
            newLeft = window.innerWidth - rect.width - 10;
            adjusted = true;
        }

        if (rect.top < 10) {
            newTop = 10;
            adjusted = true;
        } else if (rect.bottom > window.innerHeight - 10) {
            newTop = window.innerHeight - rect.height - 10;
            adjusted = true;
        }

        if (adjusted) {
            menuElement.style.left = `${newLeft}px`;
            menuElement.style.top = `${newTop}px`;
            menuElement.style.transform = 'none';
        }
    }
}
