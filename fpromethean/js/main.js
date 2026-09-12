// main.js - Point d'entrée allégé et modulaire
import { GeometryManager } from './modules/GeometryManager.js';
import { SVGUtils } from './modules/utils/SVGUtils.js';
import { ZoomManager } from './modules/utils/ZoomManager.js';
import { DiagnosticsManager } from './modules/utils/DiagnosticsManager.js';
import { TextEditorController } from './modules/utils/TextEditorController.js';

const BASE_VIEWPORT_WIDTH = ZoomManager.calculateBaseWidth();

function initSidebar(sidebarId, toggleId, options = {}) {
    const sidebar = document.getElementById(sidebarId);
    const toggle = document.getElementById(toggleId);
    if (!sidebar || !toggle) return;

    const toggleIcon = toggle.querySelector('.toggle-icon');
    const isRight = options.side === 'right';

    toggle.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        if (toggleIcon) {
            toggleIcon.style.transform = collapsed ? (isRight ? 'rotate(0deg)' : 'rotate(180deg)') : (isRight ? 'rotate(180deg)' : 'rotate(0deg)');
        }
        setTimeout(() => window.map?.invalidateSize({ debounceMoveend: true }), 350);
    });
}

function forceMapResize() {
    window.map?.invalidateSize({ debounceMoveend: true });
}

function initializeApplication() {
    console.log('[main.js] Initializing application...');
    window.SVGUtils = SVGUtils;
    window.geometryManager = new GeometryManager();

    TextEditorController.init();

    window.diagnoseDuplicationIssue = DiagnosticsManager.diagnoseDuplicationIssue;
    window.diagnoseVisualArrows = DiagnosticsManager.diagnoseVisualArrows;
    window.forceArrowRefresh = DiagnosticsManager.forceArrowRefresh;
    window.checkZoom = () => ZoomManager.detectAndAdaptZoom(BASE_VIEWPORT_WIDTH);

    setTimeout(() => {
        ZoomManager.detectAndAdaptZoom(BASE_VIEWPORT_WIDTH);
    }, 500);

    console.log('[main.js] Application ready');
}

document.addEventListener('DOMContentLoaded', initializeApplication);
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(forceMapResize, 250);
});
