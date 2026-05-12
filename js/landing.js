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
}

/**
 * Heuristic to detect the recommended version
 */
function detectRecommendedVersion() {
    const ua = navigator.userAgent;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches || ('ontouchstart' in window);
    const isNarrow = window.innerWidth < 768;
    const isUltraWide = window.innerWidth >= 1900;
    const isPrometheanUA = /ActivPanel|Promethean/i.test(ua);

    if (isPrometheanUA || (isUltraWide && isTouch)) return "promethean";
    return (isPortrait || isTouch || isNarrow) ? "portrait" : "paysage";
}

/**
 * Updates the background image based on recommendation
 */
function updateBackground(version) {
    const bg = document.getElementById('bg');
    if (!bg) return;

    let imgPath = './assets/cl.jpg';
    if (version === 'portrait') imgPath = './assets/cp.jpg';
    if (version === 'promethean') imgPath = './assets/promethean.png';
    
    bg.style.backgroundImage = `url('${imgPath}')`;
}

/**
 * Updates the recommendation texts and badges
 */
function updateRecommendation(version) {
    const badge = document.getElementById('recommendationBadge');
    const reason = document.getElementById('recommendationReason');
    const footerLabel = document.getElementById('versionLabel');

    // Reset cards
    document.querySelectorAll('.choice-card').forEach(card => card.classList.remove('recommended'));

    if (version === 'portrait') {
        badge.textContent = "Version recommandée : Portrait";
        badge.style.backgroundColor = "#4f46e5";
        reason.textContent = "Appareil tactile ou affichage vertical détecté. Idéal pour mobile.";
        footerLabel.textContent = "Recommandation active : Portrait";
        document.getElementById('cardPortrait')?.classList.add('recommended');
    } else if (version === 'promethean') {
        badge.textContent = "Version recommandée : Promethean";
        badge.style.backgroundColor = "#8b5cf6";
        reason.textContent = "Grand écran tactile détecté. Idéal pour le travail collaboratif en classe.";
        footerLabel.textContent = "Recommandation active : Promethean";
        document.getElementById('cardPromethean')?.classList.add('recommended');
    } else {
        badge.textContent = "Version recommandée : Paysage";
        badge.style.backgroundColor = "#0ea5e9";
        reason.textContent = "Affichage large ou mode paysage détecté. Idéal pour ordinateur.";
        footerLabel.textContent = "Recommandation active : Paysage";
        document.getElementById('cardPaysage')?.classList.add('recommended');
    }
}
