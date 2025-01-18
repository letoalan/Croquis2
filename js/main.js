// js/main.js
console.log('Début du chargement de main.js');
import { GeometryManager } from './modules/GeometryManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le GeometryManager
    const geometryManager = new GeometryManager();
    geometryManager.init();

    // Exemple d'utilisation : créer un marqueur en SVG
    const exampleMarker = {
        type: 'hexagon',
        coordinates: [48.8566, 2.3522], // Paris
        color: '#007bff',
        lineColor: '#000000',
        opacity: 1,
        lineWeight: 2,
        markerSize: 24,
    };

    // Ajouter le marqueur à la carte
    geometryManager.addGeometry(exampleMarker);
});