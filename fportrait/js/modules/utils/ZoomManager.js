// ZoomManager.js - Détection du zoom viewport et adaptation réactive

export class ZoomManager {
    static calculateBaseWidth() {
        const physicalWidth = window.screen.width;
        const dpr = window.devicePixelRatio || 1;
        const nativeWidth = Math.round(physicalWidth / dpr);
        return Math.round(nativeWidth * (100 / 67));
    }

    static getEffectiveZoomLevel(baseWidth) {
        if (typeof window === 'undefined') return 100;
        const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const zoomLevel = Math.round((baseWidth / viewportWidth) * 90);
        return (isNaN(zoomLevel) || zoomLevel < 10 || zoomLevel > 500) ? 100 : zoomLevel;
    }

    static showZoomIndicator(zoom) {
        const existing = document.getElementById('zoom-indicator');
        if (existing) existing.remove();

        const isOptimal = zoom >= 60 && zoom <= 75;
        const indicator = document.createElement('div');
        indicator.id = 'zoom-indicator';
        indicator.innerHTML = `
            <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;
                background: ${isOptimal ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #ffc107, #ff9800)'};
                color: white; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                font-size: 13px; font-weight: 600; cursor: pointer;" title="Cliquer pour masquer">
                <div>Zoom estimé : ${zoom}% ${isOptimal ? '✅' : '⚠️'}</div>
            </div>`;
        document.body.appendChild(indicator);
        indicator.addEventListener('click', () => indicator.remove());
        if (isOptimal) setTimeout(() => indicator.remove(), 4000);
    }

    static detectAndAdaptZoom(baseWidth) {
        const currentZoom = this.getEffectiveZoomLevel(baseWidth);
        const sidebarLeft = document.getElementById('editionPanel');
        const sidebarRight = document.getElementById('textEditorPanel');

        if (currentZoom >= 90) {
            sidebarLeft?.classList.add('collapsed');
            sidebarRight?.classList.add('collapsed');
            setTimeout(() => window.map?.invalidateSize({ debounceMoveend: true }), 400);
        } else if (currentZoom >= 60 && currentZoom < 80) {
            sidebarLeft?.classList.remove('collapsed');
            sidebarRight?.classList.remove('collapsed');
        }
        this.showZoomIndicator(currentZoom);
    }
}
