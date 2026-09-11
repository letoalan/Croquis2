// DiagnosticsManager.js - Diagnostic SVG, duplication de flèches et taille carte

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
