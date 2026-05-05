/* landing.js - Detection & Recommendation Logic */

document.addEventListener('DOMContentLoaded', () => {
    syncLauncher();

    // Listen for orientation and resize changes
    window.addEventListener('resize', syncLauncher);
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', syncLauncher);
    }
});

/**
 * Main function to synchronize UI with current device/viewport state
 */
function syncLauncher() {
    const recommended = detectRecommendedVersion();
    
    updateBackground(recommended);
    updateRecommendation(recommended);
    updateCTA(recommended);
}

/**
 * Heuristic to detect the recommended version
 * Returns 'portrait' or 'paysage'
 */
function detectRecommendedVersion() {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const isNarrow = window.innerWidth < 768;

    // Logic: Portrait or Touch or Narrow -> Portrait version
    // Otherwise -> Landscape version
    return (isPortrait || isTouch || isNarrow) ? "portrait" : "paysage";
}

/**
 * Updates the background image based on recommendation
 */
function updateBackground(version) {
    const bg = document.getElementById('bg');
    if (!bg) return;

    const imgPath = version === 'portrait' ? './assets/cp.jpg' : './assets/cl.jpg';
    bg.style.backgroundImage = `url('${imgPath}')`;
}

/**
 * Updates the recommendation texts and badges
 */
function updateRecommendation(version) {
    const badge = document.getElementById('recommendationBadge');
    const reason = document.getElementById('recommendationReason');
    const footerLabel = document.getElementById('versionLabel');

    if (version === 'portrait') {
        badge.textContent = "Version recommandée : Portrait";
        badge.style.backgroundColor = "#4f46e5"; // Indigo
        reason.textContent = "Appareil tactile ou affichage vertical détecté. Idéal pour mobile.";
        footerLabel.textContent = "Recommandation active : Portrait";
    } else {
        badge.textContent = "Version recommandée : Paysage";
        badge.style.backgroundColor = "#0ea5e9"; // Sky blue
        reason.textContent = "Affichage large ou mode paysage détecté. Idéal pour ordinateur.";
        footerLabel.textContent = "Recommandation active : Paysage";
    }
}

/**
 * Updates the main CTA link and text
 */
function updateCTA(version) {
    const cta = document.getElementById('ctaMain');
    if (!cta) return;

    if (version === 'portrait') {
        cta.href = "fportrait/index.html";
        cta.innerHTML = `Ouvrir la version Portrait <span class="btn-arrow" aria-hidden="true">→</span>`;
    } else {
        cta.href = "fpaysage/index.html";
        cta.innerHTML = `Ouvrir la version Paysage <span class="btn-arrow" aria-hidden="true">→</span>`;
    }
}
