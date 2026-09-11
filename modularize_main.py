import os, re

def modularize_main_js():
    targets = [
        'fpaysage/js/main.js',
        'fportrait/js/main.js',
        'fpromethean/js/main.js'
    ]

    for t in targets:
        dirpath = os.path.dirname(t)
        utils_dir = os.path.join(dirpath, 'modules', 'utils')
        os.makedirs(utils_dir, exist_ok=True)

        zoom_code = '''// ZoomManager.js - Détection du zoom viewport et adaptation réactive

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
'''

        diag_code = '''// DiagnosticsManager.js - Diagnostic SVG, duplication de flèches et taille carte

export class DiagnosticsManager {
    static diagnoseDuplicationIssue() {
        console.log('--- DIAGNOSTIC DUPLICATION ARROWS ---');
        const svgContainer = document.getElementById('arrow-svg-container');
        if (!svgContainer) {
            console.log('❌ SVG container non trouvé');
            return;
        }
        const paths = svgContainer.querySelectorAll('path[data-polyline-id]');
        console.log(`Total arrow paths: ${paths.length}`);
    }

    static diagnoseVisualArrows() {
        console.log('--- DIAGNOSTIC VISUEL FLÈCHES ---');
        const svg = document.getElementById('arrow-svg-container');
        if (!svg) return console.log('❌ No SVG container');
        console.log('SVG container dimensions:', svg.getAttribute('width'), 'x', svg.getAttribute('height'));
    }

    static forceArrowRefresh() {
        if (!window.map) return;
        window.map.eachLayer(layer => {
            if (layer instanceof L.Polyline && layer._arrowType && layer._svgPath) {
                const coords = layer.getLatLngs();
                let d = '';
                coords.forEach((ll, i) => {
                    const pt = window.map.latLngToLayerPoint(ll);
                    d += (i === 0 ? `M${pt.x},${pt.y}` : ` L${pt.x},${pt.y}`);
                });
                layer._svgPath.setAttribute('d', d);
            }
        });
        console.log('✅ Arrow refresh complete');
    }
}
'''

        editor_code = '''// TextEditorController.js - Gestionnaire du composant éditeur WYSIWYG

export class TextEditorController {
    static init() {
        const textEditor = document.getElementById('textEditor');
        const formatButtons = document.querySelectorAll('.format-btn');
        const clearBtn = document.getElementById('clearTextBtn');
        const copyBtn = document.getElementById('copyTextBtn');
        const exportBtn = document.getElementById('exportTextBtn');

        formatButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.command;
                const val = btn.dataset.value;
                if (cmd === 'highlight') {
                    document.execCommand('hiliteColor', false, btn.dataset.color || '#FFFF00');
                } else if (cmd === 'removeFormat') {
                    document.execCommand('removeFormat', false, null);
                } else {
                    document.execCommand(cmd, false, val);
                }
                textEditor?.focus();
            });
        });

        clearBtn?.addEventListener('click', () => {
            if (confirm('Effacer le texte ?')) {
                if (textEditor) textEditor.innerHTML = '';
            }
        });

        copyBtn?.addEventListener('click', () => {
            if (textEditor) navigator.clipboard.writeText(textEditor.innerText || '');
        });

        exportBtn?.addEventListener('click', () => {
            if (!textEditor) return;
            const blob = new Blob([`<html><body>${textEditor.innerHTML}</body></html>`], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'texte.html';
            a.click();
        });
    }
}
'''

        with open(os.path.join(utils_dir, 'ZoomManager.js'), 'w', encoding='utf-8') as f:
            f.write(zoom_code)
        with open(os.path.join(utils_dir, 'DiagnosticsManager.js'), 'w', encoding='utf-8') as f:
            f.write(diag_code)
        with open(os.path.join(utils_dir, 'TextEditorController.js'), 'w', encoding='utf-8') as f:
            f.write(editor_code)

        main_modular_code = '''// main.js - Point d'entrée allégé et modulaire
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
    initSidebar('editionPanel', 'sidebarToggle', { side: 'left' });
    initSidebar('textEditorPanel', 'textEditorToggle', { side: 'right' });

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
'''
        with open(t, 'w', encoding='utf-8') as f:
            f.write(main_modular_code)
        print(f"Modularized {t}")

if __name__ == '__main__':
    modularize_main_js()
