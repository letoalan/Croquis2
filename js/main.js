// js/main.js

console.log('Début du chargement de main.js');

import { GeometryManager } from './modules/GeometryManager.js';
import { SVGUtils } from './modules/utils/SVGUtils.js';




// ==================== DÉTECTION ZOOM - MÉTHODE VIEWPORT EFFECTIVE ====================

/**
 * ✅ SOLUTION ROBUSTE ET TRANSVERSALE : Déduit l'échelle effective
 * Mesure la largeur du viewport par rapport à une largeur de référence (ex: 1920px à 100%)
 * Fonctionne sur tous les navigateurs, écrans 4K/Retina et systèmes d'affichage.
 */


function calculateBaseWidth() {
    const physicalWidth = window.screen.width;
    const dpr = window.devicePixelRatio;

    // Estimer la largeur "native" du viewport à 100%
    const nativeWidth = Math.round(physicalWidth / dpr);

    // Calculer la référence à 67%
    const baseWidth = Math.round(nativeWidth * (100 / 67));

    console.log(`📐 Largeur native estimée: ${nativeWidth}px`);
    console.log(`📐 Référence calculée (67%): ${baseWidth}px`);

    return baseWidth;
}

const BASE_VIEWPORT_WIDTH = calculateBaseWidth();


function getEffectiveZoomLevel() {
    if (typeof window === 'undefined') return 100;

    // Utilise la largeur du visualViewport si disponible, sinon innerWidth
    const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;

    // Calcule un "zoom effectif" exprimé comme un pourcentage de la largeur de référence
    const zoomLevel = Math.round((BASE_VIEWPORT_WIDTH / viewportWidth) * 100);
    if (isNaN(zoomLevel) || zoomLevel < 10 || zoomLevel > 500) {
        console.warn('[Zoom] Mesure invalide, fallback à 100%');
        return 100;
    }

    return zoomLevel;
}

/**
 * 🔍 Diagnostic complet des mesures de viewport
 */
function diagnoseZoomDetection() {
    console.log('\n' + '━'.repeat(70));
    console.log('🔬 DIAGNOSTIC COMPLET - DÉTECTION ZOOM (VIEWPORT EFFECTIVE)');
    console.log('━'.repeat(70) + '\n');

    console.log('📊 DONNÉES BRUTES DU NAVIGATEUR:');
    console.log(`   window.innerWidth: ${window.innerWidth}px`);
    console.log(`   window.outerWidth: ${window.outerWidth}px`);
    console.log(`   window.screen.width: ${window.screen.width}px`);
    console.log(`   window.devicePixelRatio: ${window.devicePixelRatio}`);
    if (window.visualViewport) {
        console.log(`   visualViewport.width: ${window.visualViewport.width}px`);
        console.log(`   visualViewport.scale: ${window.visualViewport.scale}\n`);
    }

    const effectiveZoom = getEffectiveZoomLevel();
    console.log('📊 CALCUL EFFECTIF:');
    console.log(`   Référence: ${BASE_VIEWPORT_WIDTH}px`);
    console.log(`   Largeur visible: ${window.innerWidth}px`);
    console.log(`   ➡️ Zoom effectif estimé: ${effectiveZoom}%\n`);

    // Recommandations
    if (effectiveZoom > 80) {
        console.log('⚠️  Zoom trop élevé - interface comprimée');
        console.log(`💡  Diminuez de ${effectiveZoom - 67}% avec Ctrl+Minus`);
    } else if (effectiveZoom < 60) {
        console.log('⚠️  Zoom trop faible - interface trop grande');
        console.log(`💡  Augmentez de ${67 - effectiveZoom}% avec Ctrl+Plus`);
    } else {
        console.log('✅ ZOOM OPTIMAL - Interface parfaitement calibrée!');
    }

    console.log('\n' + '━'.repeat(70));
    console.log(`✅ ZOOM EFFECTIF DÉTECTÉ: ${effectiveZoom}%`);
    console.log('━'.repeat(70) + '\n');

    return effectiveZoom;
}

/**
 * Adapter l’interface en fonction du zoom effectif
 */
function detectAndAdaptZoom() {
    const currentZoom = getEffectiveZoomLevel();

    console.log(`🔍 Zoom effectif détecté: ${currentZoom}%`);
    console.log(`   (Pour diagnostiquer: tapez diagnoseZoomDetection() dans la console)`);

    const sidebarLeft = document.getElementById('editionPanel');
    const sidebarRight = document.getElementById('textEditorPanel');

    if (currentZoom >= 90) {
        console.log('📱 Zoom élevé détecté - sidebars repliées par défaut');
        sidebarLeft?.classList.add('collapsed');
        sidebarRight?.classList.add('collapsed');
        setTimeout(() => window.map?.invalidateSize({ debounceMoveend: true }), 500);
    } else if (currentZoom >= 60 && currentZoom < 80) {
        console.log('✅ Zoom optimal détecté - interface complète affichée');
        sidebarLeft?.classList.remove('collapsed');
        sidebarRight?.classList.remove('collapsed');
    }

    showZoomIndicator(currentZoom);
}

/**
 * Indicateur visuel du zoom effectif
 */
function showZoomIndicator(zoom) {
    const existing = document.getElementById('zoom-indicator');
    if (existing) existing.remove();

    const isOptimal = zoom >= 60 && zoom <= 75;

    const indicator = document.createElement('div');
    indicator.id = 'zoom-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: ${isOptimal
        ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
        : 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-size: 13px;
            font-weight: 600;
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s;
        " title="Cliquez pour masquer">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🔍</span>
                <div style="flex: 1;">
                    <div style="font-size: 11px; opacity: 0.9;">Zoom visuel estimé</div>
                    <div style="font-size: 16px; font-weight: 700;">${zoom}%</div>
                    <div style="font-size: 10px; opacity: 0.85; margin-top: 2px;">
                        ${isOptimal
        ? '✅ Zoom optimal pour cette interface'
        : '⚠️ Optimal: 67% (Ctrl +/- ou molette)'}
                    </div>
                </div>
                ${isOptimal ? '<span style="font-size: 20px;">✅</span>' : '<span style="font-size: 20px;">⚠️</span>'}
            </div>
            ${zoom >= 80 ? `
                <button id="collapse-sidebars-btn" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all 0.2s;
                    width: 100%;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    📱 Replier les panneaux pour voir la carte
                </button>
            ` : ''}
            <div style="font-size: 9px; opacity: 0.7; text-align: center; margin-top: 2px;">
                Diagnostic: diagnoseZoomDetection()
            </div>
        </div>
    `;

    document.body.appendChild(indicator);

    indicator.addEventListener('click', (e) => {
        if (e.target.id !== 'collapse-sidebars-btn') {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(20px)';
            setTimeout(() => indicator.remove(), 300);
        }
    });

    const collapseBtn = document.getElementById('collapse-sidebars-btn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.hideAllPanes) window.hideAllPanes();
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
            if (window.showNotification)
                showNotification('Panneaux repliés - carte agrandie', 'success');
        });
    }

    if (isOptimal) {
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 300);
            }
        }, 5000);
    }
}

/**
 * Surveille les changements de zoom effectif
 */
function monitorZoomChanges() {
    let lastZoom = getEffectiveZoomLevel();

    setInterval(() => {
        const currentZoom = getEffectiveZoomLevel();
        if (Math.abs(currentZoom - lastZoom) >= 5) {
            console.log(`🔍 Zoom effectif changé: ${lastZoom}% → ${currentZoom}%`);
            lastZoom = currentZoom;
            detectAndAdaptZoom();
            setTimeout(() => window.map?.invalidateSize({ debounceMoveend: true }), 100);
        }
    }, 500);
}

/**
 * Diagnostic rapide
 */
window.checkZoom = function() {
    const zoom = getEffectiveZoomLevel();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNOSTIC ZOOM RAPIDE (VIEWPORT)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Zoom visuel estimé: ${zoom}%`);
    console.log(`Méthode: Largeur du viewport / Référence (${BASE_VIEWPORT_WIDTH}px)`);
    console.log(`─────────────────────────────────`);
    console.log(`Zone optimale: 60–75% (recommandé: 67%)`);
    console.log(`Statut: ${zoom >= 60 && zoom <= 75 ? '✅ Optimal' : '⚠️ Non optimal'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (zoom > 75) console.log(`💡 Diminuer de ${zoom - 67}% avec Ctrl+Minus\n`);
    else if (zoom < 60) console.log(`💡 Augmenter de ${67 - zoom}% avec Ctrl+Plus\n`);
    else console.log('✅ Zoom parfait - interface optimale !\n');

    console.log('📊 Pour un diagnostic complet: diagnoseZoomDetection()\n');
    detectAndAdaptZoom();
};

// Exposer globalement
window.diagnoseZoomDetection = diagnoseZoomDetection;
window.getEffectiveZoomLevel = getEffectiveZoomLevel;

// ==================== INITIALISATION ====================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        detectAndAdaptZoom();
        monitorZoomChanges();
    }, 500);
});

console.log('\n📋 COMMANDES DE DIAGNOSTIC ZOOM:');
console.log('   checkZoom()             - Diagnostic rapide');
console.log('   diagnoseZoomDetection() - Diagnostic complet avec toutes les méthodes\n');


// ==================== GESTION DES SIDEBARS ====================


function initSidebar(sidebarId, toggleId, options = {}) {
    const sidebar = document.getElementById(sidebarId);
    const toggle  = document.getElementById(toggleId);
    if (!sidebar || !toggle) return;

    const toggleIcon = toggle.querySelector('.toggle-icon');
    const isRight    = options.side === 'right';
    const mapSync    = options.mapSync !== false;

    toggle.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');

        // rotate arrow
        toggleIcon.style.transform =
            collapsed ? (isRight ? 'rotate(0deg)' : 'rotate(180deg)')
                : (isRight ? 'rotate(180deg)' : 'rotate(0deg)');

        // Redimensionner la carte après la transition
        if (mapSync && window.map && typeof window.map.invalidateSize === 'function') {
            setTimeout(() => {
                window.map.invalidateSize({ debounceMoveend: true });
            }, 350);
        }

        // Écouter la fin de la transition CSS
        const onTransitionEnd = () => {
            if (mapSync && window.map && typeof window.map.invalidateSize === 'function') {
                window.map.invalidateSize({ debounceMoveend: true });
            }
            sidebar.removeEventListener('transitionend', onTransitionEnd);
        };
        sidebar.addEventListener('transitionend', onTransitionEnd);
    });
}

// ==================== MODE PLEIN ÉCRAN ====================

function initFullscreenMode() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;

    fullscreenBtn.addEventListener('click', () => {
        const textEditor = document.getElementById('textEditor');
        if (!textEditor) return;

        if (textEditor.classList.contains('fullscreen')) {
            // Quitter le mode plein écran
            textEditor.classList.remove('fullscreen');
            fullscreenBtn.textContent = '⛶';
            document.exitFullscreen?.().catch(() => {});
        } else {
            // Activer le mode plein écran
            textEditor.classList.add('fullscreen');
            fullscreenBtn.textContent = '⛷';
            textEditor.requestFullscreen?.().catch(() => {});
        }
    });

    // Gérer la sortie du mode plein écran via la touche Échap
    document.addEventListener('fullscreenchange', () => {
        const textEditor = document.getElementById('textEditor');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (!document.fullscreenElement && textEditor) {
            textEditor.classList.remove('fullscreen');
            if (fullscreenBtn) {
                fullscreenBtn.textContent = '⛶';
            }
        }
    });
}

// ==================== ÉDITEUR DE TEXTE WYSIWYG ====================
function initTextEditor() {
    const textEditor = document.getElementById('textEditor');
    const textEditorPanel = document.getElementById('textEditorPanel');
    const formatButtons = document.querySelectorAll('.format-btn');
    const clearTextBtn = document.getElementById('clearTextBtn');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const exportTextBtn = document.getElementById('exportTextBtn');

    // Corrige le panneau si replié par défaut
    if (textEditorPanel && textEditorPanel.classList.contains('collapsed')) {
        textEditorPanel.classList.remove('collapsed');
    }

    // ✅ INITIALISER LE SÉLECTEUR DE COULEUR FLUO
    initHighlightColorPicker();

    // --- Formatage texte ---
    formatButtons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.dataset.command;
            const value = button.dataset.value;

            if (command === 'highlight') {
                // ✅ Utiliser la couleur sélectionnée au lieu de 'yellow' en dur
                const color = button.dataset.color || '#FFFF00';
                applyCustomHighlight(color);
            } else if (command === 'removeFormat') {
                document.execCommand('removeFormat', false, null);
                document.execCommand('unlink', false, null);
            } else {
                document.execCommand(command, false, value);
            }
            textEditor.focus();
            updateButtonStates();
        });
    });

    function updateButtonStates() {
        formatButtons.forEach(button => {
            const command = button.dataset.command;
            if (command && !['highlight', 'removeFormat'].includes(command)) {
                button.classList.toggle('active', document.queryCommandState(command));
            }
        });
    }

    // --- Effacer ---
    if (clearTextBtn) {
        clearTextBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment effacer tout le texte ?')) {
                textEditor.innerHTML = '';
                textEditor.focus();
            }
        });
    }

    // --- Copier ---
    if (copyTextBtn) {
        copyTextBtn.addEventListener('click', async () => {
            const htmlContent = textEditor.innerHTML;
            const plainText = textEditor.innerText || textEditor.textContent;
            try {
                if (navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/html': new Blob([htmlContent], { type: 'text/html' }),
                            'text/plain': new Blob([plainText], { type: 'text/plain' })
                        })
                    ]);
                    showNotification('Texte copié avec le formatage !', 'success');
                } else {
                    await navigator.clipboard.writeText(plainText);
                    showNotification('Texte copié !', 'success');
                }
            } catch {
                fallbackCopyText(plainText);
            }
        });
    }

    function fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Texte copié !', 'success');
    }

    // --- Export HTML ---
    if (exportTextBtn) {
        exportTextBtn.addEventListener('click', () => {
            const htmlContent = textEditor.innerHTML;
            const blob = new Blob([`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Texte exporté</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        [style*="background-color"] { padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>${htmlContent}</body>
</html>`], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `texte-${new Date().toISOString().split('T')[0]}.html`;
            link.click();
            URL.revokeObjectURL(url);
        });
    }
}

// ✅ FONCTION : INITIALISER LE SÉLECTEUR DE COULEUR FLUO
function initHighlightColorPicker() {
    console.log('[TextEditor] 🖍️ Initializing highlight color picker');

    const colorPicker = document.getElementById('highlightColorPicker');
    const highlightBtn = document.querySelector('[data-command="highlight"]');
    const colorDisplay = document.getElementById('highlightColorDisplay');

    if (!colorPicker || !highlightBtn || !colorDisplay) {
        console.warn('[TextEditor] ⚠️ Highlight color elements not found');
        return;
    }

    /**
     * ✅ Met à jour la couleur de fluo
     */
    function updateHighlightColor(color) {
        console.log('[TextEditor] 🖍️ Updating highlight color:', color);

        // Mettre à jour le bouton avec gradient
        highlightBtn.style.background = `linear-gradient(to right, ${color} 0%, ${color} 100%)`;

        // Calculer la couleur de texte contrastée
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = brightness > 128 ? '#000000' : '#FFFFFF';

        const span = highlightBtn.querySelector('span');
        if (span) {
            span.style.color = textColor;
            span.style.textShadow = brightness > 128
                ? '0 0 2px rgba(255,255,255,0.8)'
                : '0 0 2px rgba(0,0,0,0.8)';
        }

        // Mettre à jour l'affichage de la couleur
        colorDisplay.style.background = color;
        colorDisplay.style.color = textColor;
        colorDisplay.textContent = color.toUpperCase();

        // Stocker la couleur pour utilisation
        highlightBtn.dataset.color = color;

        console.log('[TextEditor] 🖍️ ✅ Color updated:', color);
    }

    // Événement change (final)
    colorPicker.addEventListener('change', (e) => {
        updateHighlightColor(e.target.value);
    });

    // Événement input (temps réel)
    colorPicker.addEventListener('input', (e) => {
        updateHighlightColor(e.target.value);
    });

    // Initialiser avec la couleur par défaut
    updateHighlightColor(colorPicker.value);

    console.log('[TextEditor] 🖍️ ✅ Highlight color picker initialized');
}

// ✅ FONCTION : APPLIQUE UNE SURBRILLANCE PERSONNALISÉE
function applyCustomHighlight(color) {
    console.log('[TextEditor] 🖍️ Applying custom highlight:', color);

    const textEditor = document.getElementById('textEditor');
    const selection = window.getSelection();

    if (!selection.rangeCount || selection.isCollapsed) {
        console.warn('[TextEditor] ⚠️ No text selected');
        return;
    }

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.style.padding = '2px 4px';
    span.style.borderRadius = '2px';

    try {
        range.surroundContents(span);
        console.log('[TextEditor] 🖍️ ✅ Highlight applied with color:', color);
        textEditor.focus();
    } catch (e) {
        console.error('[TextEditor] ❌ Error applying highlight:', e.message);
    }
}


// ==================== NOTIFICATIONS & OUTILS ====================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 20px;
        border-radius: 6px; color: white; font-weight: 600;
        z-index: 10000; transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.style.background =
        type === 'success'
            ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
            : type === 'error'
                ? 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => (notification.style.transform = 'translateX(0)'), 10);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// js/main.js

// ==================== GESTION DU REDIMENSIONNEMENT DE LA CARTE ====================

/**
 * ✅ Redimensionne la carte avec debounce pour éviter la duplication
 */
let forceMapResizeTimeout = null;
let lastForceMapResizeCall = 0;
const FORCE_MAP_RESIZE_MIN_INTERVAL = 500;  // Intervalle minimum en ms

function forceMapResize() {
    const now = Date.now();

    // ✅ DÉBOUNCE : ignorer si trop d'appels rapides
    if (now - lastForceMapResizeCall < FORCE_MAP_RESIZE_MIN_INTERVAL) {
        console.log('[forceMapResize] ⏱️ Débounced - trop d\'appels rapides');
        return;
    }

    lastForceMapResizeCall = now;

    if (window.map && typeof window.map.invalidateSize === 'function') {
        console.log('[forceMapResize] 🔄 Redimensionnement de la carte...');

        // ✅ Nettoyer le timeout précédent pour éviter l'accumulation
        clearTimeout(forceMapResizeTimeout);

        // ✅ UN SEUL appel à invalidateSize (pas deux!)
        // debounceMoveend: true évite les appels multiples aux événements zoom/move
        window.map.invalidateSize({ debounceMoveend: true });

        console.log('[forceMapResize] ✅ Redimensionnement complet');
    } else {
        console.warn('[forceMapResize] ⚠️ window.map non disponible', {
            mapExists: !!window.map,
            invalidateSizeType: window.map ? typeof window.map.invalidateSize : 'no map'
        });
    }
}


// ==================== INITIALISATION PRINCIPALE ====================

function initializeApplication() {
    console.log('[main.js] DOM Content Loaded - Initializing application...');

    // ✅ Exposer SVGUtils globalement AVANT l'initialisation
    window.SVGUtils = SVGUtils;
    console.log('[main.js] SVGUtils exposed globally');

    // Initialiser le GeometryManager (tout est géré automatiquement)
    const geometryManager = new GeometryManager();

    // Exposer geometryManager globalement pour debug en console
    window.geometryManager = geometryManager;

    // Initialiser l'éditeur de texte
    initTextEditor();

    console.log('[main.js] Application initialized successfully');
    console.log('[main.js] Access managers via: window.geometryManager');

    // Initialiser les sidebars APRÈS l'initialisation de la carte
    initSidebar('editionPanel', 'sidebarToggle', { side: 'left' });
    initSidebar('textEditorPanel', 'textEditorToggle', { side: 'right' });

    // Logs d'information pour l'utilisateur
    console.log('%c🗺️ Cartographie Interactive v1.0', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
    console.log('%cCommandes disponibles:', 'color: #2196F3; font-weight: bold;');
    console.log('  • window.geometryManager.getStateManager()');
    console.log('  • window.geometryManager.getMapManager()');
    console.log('  • window.geometryManager.getLegendManager()');
    console.log('  • window.geometryManager.getExportImportManager()');
    console.log('  • window.geometryManager.getScaleOrientationManager()');
    console.log('%cExemples:', 'color: #FF9800; font-weight: bold;');
    console.log('  geometryManager.getExportImportManager().downloadJSON() // Exporter');
    console.log('  geometryManager.getExportImportManager().uploadJSON()   // Importer');

    // Vérification finale que l'éditeur de texte est visible
    setTimeout(() => {
        const textEditorPanel = document.getElementById('textEditorPanel');
        if (textEditorPanel && textEditorPanel.classList.contains('collapsed')) {
            console.warn('L\'éditeur de texte est toujours rétracté - correction manuelle');
            textEditorPanel.classList.remove('collapsed');
        }
    }, 1000);

    // ==================== FONCTIONS UTILITAIRES GLOBALES ====================
    // Définir ces fonctions APRÈS l'initialisation de l'application

    // Fonction pour vérifier l'état de l'interface
    window.checkInterfaceState = function() {
        const sidebarLeft = document.getElementById('editionPanel');
        const sidebarRight = document.getElementById('textEditorPanel');

        console.log('=== ÉTAT DE L\'INTERFACE ===');
        console.log('Sidebar gauche:', sidebarLeft ? (sidebarLeft.classList.contains('collapsed') ? 'RÉTRACTÉE' : 'VISIBLE') : 'NON TROUVÉE');
        console.log('Sidebar droite:', sidebarRight ? (sidebarRight.classList.contains('collapsed') ? 'RÉTRACTÉE' : 'VISIBLE') : 'NON TROUVÉE');
        console.log('Carte Leaflet:', window.map ? 'INITIALISÉE' : 'NON INITIALISÉE');
        console.log('GeometryManager:', window.geometryManager ? 'INITIALISÉ' : 'NON INITIALISÉ');
        console.log('============================');
    };

    // Fonction pour forcer l'affichage des sidebars
    window.showAllPanes = function() {
        const sidebarLeft = document.getElementById('editionPanel');
        const sidebarRight = document.getElementById('textEditorPanel');

        if (sidebarLeft && sidebarLeft.classList.contains('collapsed')) {
            sidebarLeft.classList.remove('collapsed');
        }

        if (sidebarRight && sidebarRight.classList.contains('collapsed')) {
            sidebarRight.classList.remove('collapsed');
        }

        // Redimensionner la carte avec un délai pour la transition CSS
        setTimeout(() => {
            forceMapResize();
        }, 350);

        console.log('Tous les panneaux affichés');
    };

    // Fonction pour masquer tous les panneaux
    window.hideAllPanes = function() {
        const sidebarLeft = document.getElementById('editionPanel');
        const sidebarRight = document.getElementById('textEditorPanel');

        if (sidebarLeft && !sidebarLeft.classList.contains('collapsed')) {
            sidebarLeft.classList.add('collapsed');
        }

        if (sidebarRight && !sidebarRight.classList.contains('collapsed')) {
            sidebarRight.classList.add('collapsed');
        }

        // Redimensionner la carte avec un délai pour la transition CSS
        setTimeout(() => {
            forceMapResize();
        }, 350);

        console.log('Tous les panneaux masqués');
    };

    // Fonction de diagnostic pour vérifier les dimensions
    window.diagnoseMapSize = function() {
        const mapElement = document.getElementById('map');
        const mapContainer = document.querySelector('.map');

        console.log('=== DIAGNOSTIC TAILLE CARTE ===');
        console.log('Élément map:', mapElement?.offsetWidth + 'x' + mapElement?.offsetHeight);
        console.log('Conteneur map:', mapContainer?.offsetWidth + 'x' + mapContainer?.offsetHeight);
        console.log('Fenêtre:', window.innerWidth + 'x' + window.innerHeight);
        console.log('Carte Leaflet initialisée:', !!window.map);
        console.log('window.map type:', typeof window.map);
        console.log('invalidateSize exists:', window.map ? typeof window.map.invalidateSize : 'N/A');
        console.log('==============================');

        if (window.map && typeof window.map.invalidateSize === 'function') {
            setTimeout(() => {
                window.map.invalidateSize({ debounceMoveend: true });
            }, 100);
        } else {
            console.warn('Impossible de redimensionner la carte: window.map ou invalidateSize non disponible');
        }
    };

    // Appeler le diagnostic au chargement - avec plus de délai
    setTimeout(() => {
        window.diagnoseMapSize();
    }, 3000);

    // Exposer les fonctions globales
    console.log('%c🔧 Fonctions de débogage disponibles:', 'color: #9C27B0; font-weight: bold;');
    console.log('  • checkInterfaceState() - Vérifier l\'état de l\'interface');
    console.log('  • showAllPanes() - Afficher tous les panneaux');
    console.log('  • hideAllPanes() - Masquer tous les panneaux');
    console.log('  • diagnoseMapSize() - Diagnostiquer la taille de la carte');
}

/**
 * ✅ Diagnostic complet des polylines et SVG paths
 */
function diagnoseDuplicationIssue() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNOSTIC COMPLET - DUPLICATION ISSUE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1️⃣ SVG CONTAINER
    console.log('📊 1️⃣ SVG CONTAINER STATE');
    console.log('────────────────────────────────────────────────────────────────');
    const svgContainer = document.getElementById('arrow-svg-container');
    if (!svgContainer) {
        console.log('❌ SVG container NOT FOUND');
    } else {
        console.log('✅ SVG container found');
        console.log('   Position:', {
            left: svgContainer.style.left,
            top: svgContainer.style.top,
            zIndex: svgContainer.style.zIndex
        });
        console.log('   Size:', {
            width: svgContainer.getAttribute('width'),
            height: svgContainer.getAttribute('height')
        });
        console.log('   Cache size:', svgContainer._arrowheadsCache?.size || 'NO CACHE');
    }

    // 2️⃣ LEAFLET POLYLINES
    console.log('\n📊 2️⃣ LEAFLET POLYLINES');
    console.log('────────────────────────────────────────────────────────────────');
    if (window.geometryManager) {
        const geometries = window.geometryManager.getStateManager().geometries;
        console.log(`Total geometries: ${geometries.length}`);

        geometries.forEach((geom, idx) => {
            if (geom.type === 'Polyline' && geom.layer) {
                console.log(`\n  Polyline ${idx}:`);
                console.log(`    ID: ${geom.layer._leaflet_id}`);
                console.log(`    Arrow type: ${geom.arrowType || 'NONE'}`);
                console.log(`    Style - Opacity: ${geom.layer.options.opacity}, FillOpacity: ${geom.layer.options.fillOpacity}`);
                console.log(`    Has _svgPath: ${!!geom.layer._svgPath}`);
                console.log(`    _svgPath connected to DOM: ${geom.layer._svgPath?.isConnected || 'N/A'}`);
                console.log(`    Has _arrowUpdateHandler: ${!!geom.layer._arrowUpdateHandler}`);

                // ✅ Vérifier si visible
                const isVisible = geom.layer.options.opacity > 0 || geom.layer.options.fillOpacity > 0;
                console.log(`    Visible on map: ${isVisible ? '✅' : '❌'}`);
            }
        });
    } else {
        console.log('❌ window.geometryManager NOT FOUND');
    }

    // 3️⃣ SVG PATHS DANS LE DOM
    console.log('\n📊 3️⃣ SVG PATHS IN DOM');
    console.log('────────────────────────────────────────────────────────────────');
    if (svgContainer) {
        const allPaths = svgContainer.querySelectorAll('path');
        console.log(`Total paths in SVG: ${allPaths.length}`);

        allPaths.forEach((path, idx) => {
            console.log(`\n  Path ${idx}:`);
            console.log(`    ID: ${path.getAttribute('id')}`);
            console.log(`    data-polyline-id: ${path.getAttribute('data-polyline-id')}`);
            console.log(`    Stroke: ${path.getAttribute('stroke')}`);
            console.log(`    Opacity: ${path.getAttribute('opacity')}`);
            console.log(`    d (first 100 chars): ${path.getAttribute('d')?.substring(0, 100)}`);
            console.log(`    Connected to DOM: ${path.isConnected}`);
            console.log(`    marker-start: ${path.getAttribute('marker-start')}`);
            console.log(`    marker-end: ${path.getAttribute('marker-end')}`);
        });
    }

    // 4️⃣ DUPLICATES CHECK
    console.log('\n📊 4️⃣ DUPLICATE PATHS CHECK');
    console.log('────────────────────────────────────────────────────────────────');
    if (svgContainer && window.geometryManager) {
        const geometries = window.geometryManager.getStateManager().geometries;
        let hasDuplicates = false;

        geometries.forEach((geom, idx) => {
            if (geom.type === 'Polyline' && geom.layer) {
                const polylineId = geom.layer._leaflet_id;
                const pathsForThisPolyline = svgContainer.querySelectorAll(`path[data-polyline-id="${polylineId}"]`);

                if (pathsForThisPolyline.length > 1) {
                    console.log(`❌ POLYLINE ${polylineId}: ${pathsForThisPolyline.length} paths found (DUPLICATE!)`);
                    hasDuplicates = true;

                    pathsForThisPolyline.forEach((p, pidx) => {
                        console.log(`   Path ${pidx}: ${p.getAttribute('id')}`);
                    });
                } else if (pathsForThisPolyline.length === 1) {
                    console.log(`✅ POLYLINE ${polylineId}: 1 path found (OK)`);
                } else {
                    console.log(`⚠️ POLYLINE ${polylineId}: 0 paths found (MISSING!)`);
                }
            }
        });

        if (!hasDuplicates) {
            console.log('\n✅ NO DUPLICATES DETECTED');
        }
    }

    // 5️⃣ LEAFLET MAP LAYERS
    console.log('\n📊 5️⃣ LEAFLET MAP LAYERS');
    console.log('────────────────────────────────────────────────────────────────');
    if (window.map) {
        const layers = [];
        window.map.eachLayer(layer => {
            if (layer instanceof L.Polyline) {
                layers.push({
                    id: layer._leaflet_id,
                    type: layer instanceof L.Polygon ? 'Polygon' : 'Polyline',
                    opacity: layer.options.opacity,
                    visible: layer.options.opacity > 0,
                    hasArrows: !!layer._arrowType
                });
            }
        });

        console.log(`Total Polyline/Polygon layers: ${layers.length}`);
        layers.forEach((layer, idx) => {
            console.log(`  Layer ${idx}: ID=${layer.id}, Type=${layer.type}, Visible=${layer.visible}, HasArrows=${layer.hasArrows}`);
        });
    }

    // 6️⃣ RÉSUMÉ FINAL
    console.log('\n📊 6️⃣ FINAL SUMMARY');
    console.log('────────────────────────────────────────────────────────────────');
    if (svgContainer && window.map && window.geometryManager) {
        const geometries = window.geometryManager.getStateManager().geometries;
        const polylineCount = geometries.filter(g => g.type === 'Polyline' && g.arrowType).length;
        const realPaths = svgContainer.querySelectorAll('path[data-polyline-id]');
        const pathsCount = realPaths.length;

        console.log(`Expected paths: ${polylineCount} (1 per polyline with arrows)`);
        console.log(`Actual paths: ${pathsCount}`);
        console.log(`Real arrow-paths in DOM: ${pathsCount}`);

        if (pathsCount > polylineCount) {
            console.log(`❌ MORE PATHS THAN EXPECTED - DUPLICATION DETECTED`);
        } else if (pathsCount < polylineCount) {
            console.log(`⚠️ FEWER PATHS THAN EXPECTED - MISSING ARROWS`);
        } else {
            console.log(`✅ PATHS MATCH POLYLINES - OK`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
}

/**
 * 🔍 Diagnostic visuel détaillé des flèches SVG
 */
function diagnoseVisualArrows() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DIAGNOSTIC VISUEL - FLÈCHES SVG');
    console.log('='.repeat(70) + '\n');

    const svg = document.getElementById('arrow-svg-container');

    if (!svg) {
        console.error('❌ SVG container NOT FOUND!');
        return;
    }

    console.log('✅ SVG Container found');
    console.log('   Position:', svg.style.position);
    console.log('   Left:', svg.style.left);
    console.log('   Top:', svg.style.top);
    console.log('   Z-Index:', svg.style.zIndex);
    console.log('   Display:', svg.style.display || '(empty = visible)');
    console.log('   Visibility:', svg.style.visibility || '(empty = visible)');
    console.log('   Pointer Events:', svg.style.pointerEvents);
    console.log('   Width:', svg.getAttribute('width'));
    console.log('   Height:', svg.getAttribute('height'));
    console.log('   ViewBox:', svg.getAttribute('viewBox'));

    // Vérifier le positionnement
    const rect = svg.getBoundingClientRect();
    console.log('   Bounding Rect:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
    });

    console.log('\n📊 SVG PATHS:');
    const paths = svg.querySelectorAll('path[data-polyline-id]');
    console.log('   Total paths:', paths.length);

    paths.forEach((path, i) => {
        console.log(`\n   Path ${i + 1}:`);
        console.log('      ID:', path.id);
        console.log('      Data-polyline-id:', path.getAttribute('data-polyline-id'));
        console.log('      Display:', path.style.display || '(empty = visible)');
        console.log('      Visibility:', path.style.visibility || '(empty = visible)');
        console.log('      Opacity:', path.getAttribute('opacity'));
        console.log('      Stroke:', path.getAttribute('stroke'));
        console.log('      Stroke-width:', path.getAttribute('stroke-width'));
        console.log('      d (path data):', path.getAttribute('d')?.substring(0, 100) + '...');
        console.log('      marker-start:', path.getAttribute('marker-start'));
        console.log('      marker-end:', path.getAttribute('marker-end'));
        console.log('      Connected to DOM:', path.isConnected);

        const pathRect = path.getBoundingClientRect();
        console.log('      Bounding Rect:', {
            top: pathRect.top,
            left: pathRect.left,
            width: pathRect.width,
            height: pathRect.height,
            visible: pathRect.width > 0 && pathRect.height > 0
        });

        // ✅ Diagnostic approfondi si invisible
        if (pathRect.width === 0 || pathRect.height === 0) {
            console.log('      ⚠️ PATH IS INVISIBLE - Possible causes:');
            if (!path.getAttribute('d') || path.getAttribute('d') === '') {
                console.log('         - Empty d attribute (no coordinates)');
            }
            if (path.style.display === 'none') {
                console.log('         - display: none');
            }
            if (path.style.visibility === 'hidden') {
                console.log('         - visibility: hidden');
            }
            if (path.getAttribute('opacity') === '0') {
                console.log('         - opacity: 0');
            }
        }
    });

    console.log('\n📊 LEAFLET POLYLINES:');
    let polylineCount = 0;
    window.map.eachLayer(layer => {
        if (layer instanceof L.Polyline && layer._arrowType) {
            polylineCount++;
            console.log(`\n   Polyline ${polylineCount}:`);
            console.log('      ID:', layer._leaflet_id);
            console.log('      Arrow Type:', layer._arrowType);
            console.log('      Has _svgPath:', !!layer._svgPath);
            console.log('      _svgPath connected:', layer._svgPath?.isConnected);
            console.log('      Leaflet path display:', layer._path?.style.display || '(visible)');
            console.log('      Coordinates:', layer.getLatLngs().length, 'points');

            if (layer._svgPath) {
                const svgRect = layer._svgPath.getBoundingClientRect();
                console.log('      SVG Path rect:', {
                    top: svgRect.top,
                    left: svgRect.left,
                    width: svgRect.width,
                    height: svgRect.height,
                    visible: svgRect.width > 0 && svgRect.height > 0
                });

                // ✅ Vérifier la conversion des coordonnées
                const coords = layer.getLatLngs();
                console.log('      Sample coordinate conversion:');
                if (coords.length > 0) {
                    const firstPoint = window.map.latLngToLayerPoint(coords[0]);
                    console.log(`         LatLng [${coords[0].lat}, ${coords[0].lng}] → Pixel [${firstPoint.x}, ${firstPoint.y}]`);
                }
            } else {
                console.log('      ❌ NO SVG PATH ATTACHED!');
            }
        }
    });

    console.log('\n   Total polylines with arrows:', polylineCount);

    console.log('\n📊 DEFS (Markers):');
    const defs = svg.querySelector('defs');
    if (defs) {
        const markers = defs.querySelectorAll('marker');
        console.log('   Total markers:', markers.length);
        markers.forEach((marker, i) => {
            console.log(`   Marker ${i + 1}:`, marker.id);
            const markerPath = marker.querySelector('path');
            if (markerPath) {
                console.log(`      - Path d: ${markerPath.getAttribute('d')}`);
                console.log(`      - Fill: ${markerPath.getAttribute('fill')}`);
            }
        });
    } else {
        console.log('   ❌ No <defs> found!');
    }

    // Test de visibilité
    console.log('\n🎯 VISIBILITY TEST:');
    const allPaths = svg.querySelectorAll('path');
    const visiblePaths = Array.from(allPaths).filter(p => {
        const rect = p.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && p.getAttribute('d');
    });
    console.log('   Paths with valid geometry:', visiblePaths.length, '/', allPaths.length);

    if (visiblePaths.length === 0 && allPaths.length > 0) {
        console.log('   ❌ NO VISIBLE PATHS - All paths have zero dimensions!');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🔍 FIN DU DIAGNOSTIC');
    console.log('='.repeat(70) + '\n');
}

/**
 * 🔄 Force le rafraîchissement visuel des flèches
 */
function forceArrowRefresh() {
    console.log('🔄 Forcing arrow refresh...');

    let refreshCount = 0;

    window.map.eachLayer(layer => {
        if (layer instanceof L.Polyline && layer._arrowType && layer._svgPath) {
            console.log(`   Refreshing polyline: ${layer._leaflet_id}`);

            // Forcer la mise à jour
            const coords = layer.getLatLngs();
            let pathData = '';
            coords.forEach((latlng, i) => {
                const point = window.map.latLngToLayerPoint(latlng);
                pathData += (i === 0 ? `M${point.x},${point.y}` : ` L${point.x},${point.y}`);
            });

            layer._svgPath.setAttribute('d', pathData);
            layer._svgPath.style.display = '';
            layer._svgPath.style.visibility = 'visible';
            layer._svgPath.setAttribute('opacity', '1');

            // Masquer la polyline Leaflet
            if (layer._path) {
                layer._path.style.display = 'none';
            }

            console.log(`   ✅ Refreshed - Path data: ${pathData.substring(0, 50)}...`);
            refreshCount++;
        }
    });

    if (refreshCount === 0) {
        console.log('   ⚠️ No polylines with arrows found to refresh');
    } else {
        console.log(`✅ Refresh complete - ${refreshCount} polyline(s) updated`);
    }
}

// ✅ Exposer les fonctions globalement
window.diagnoseDuplicationIssue = diagnoseDuplicationIssue;
window.diagnoseVisualArrows = diagnoseVisualArrows;
window.forceArrowRefresh = forceArrowRefresh;

// Message d'aide
console.log('\n📋 COMMANDES DE DIAGNOSTIC DISPONIBLES:');
console.log('   diagnoseDuplicationIssue() - Vérifier les duplications');
console.log('   diagnoseVisualArrows()     - Diagnostic visuel complet');
console.log('   forceArrowRefresh()        - Forcer le rafraîchissement\n');

// ==================== GESTION DES ÉVÉNEMENTS ====================

document.addEventListener('DOMContentLoaded', initializeApplication);

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    // Attendre un peu pour éviter les appels multiples
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        forceMapResize();
    }, 250);
});

// Empêcher le comportement par défaut du drag & drop de fichiers
document.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
});
