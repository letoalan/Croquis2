# 📄 Fiche Documentaire : `MapManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [📁 Dossier fportrait/js/modules](index.md) / `MapManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js/modules](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../index.md)
> - **Code Source Réel :** [💻 Voir `MapManager.js`](../../../../fportrait/js/modules/MapManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Pilote cartographique Leaflet & Leaflet-Geoman orchestrant les couches, fonds de carte, projection et événements de dessin.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/modules/MapManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 3.55 Ko (3634 octets)
- **Nombre de lignes :** 84 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class MapManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `MapManager`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./mapping/layers/TileLayerManager.js` | `TileLayerManager` |
| `./mapping/layers/TileSelectorControl.js` | `TileSelectorControl` |
| `./mapping/layers/LayerGroupManager.js` | `LayerGroupManager` |
| `./mapping/markers/MarkerControlManager.js` | `MarkerControlManager` |
| `./mapping/lines/LineControlManager.js` | `LineControlManager` |
| `./mapping/lines/CurveControlManager.js` | `CurveControlManager` |
| `./mapping/geometry/GeometryHandler.js` | `GeometryHandler` |
| `./mapping/controls/ScaleOrientationManager.js` | `ScaleOrientationManager` |
| `./mapping/io/PDFExporter.js` | `PDFExporter` |
| `./utils/SVGUtils.js` | `SVGUtils` |
| `./map_parts/TileSources.js` | `TILE_SOURCES` |
| `./map_parts/MapEditingEvents.js` | `MapEditingEvents` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fportrait/js/modules)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../index.md)
- [💻 Ouvrir le code source (MapManager.js)](../../../../fportrait/js/modules/MapManager.js)