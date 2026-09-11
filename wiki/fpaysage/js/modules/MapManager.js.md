# 📄 Fiche Documentaire : `MapManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [📁 Dossier fpaysage/js/modules](index.md) / `MapManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpaysage/js/modules](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../index.md)
> - **Code Source Réel :** [💻 Voir `MapManager.js`](../../../../fpaysage/js/modules/MapManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Pilote cartographique Leaflet & Leaflet-Geoman orchestrant les couches, fonds de carte, projection et événements de dessin.

### Métadonnées Techniques
- **Emplacement relatif :** `fpaysage/js/modules/MapManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 29.13 Ko (29833 octets)
- **Nombre de lignes :** 968 lignes

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
| `./mapping/events/EventManager.js` | `EventManager` |
| `./mapping/events/EventHandlers.js` | `EventHandlers` |
| `./mapping/geometry/GeometryHandler.js` | `GeometryHandler` |
| `./mapping/lines/CurveControlManager.js` | `CurveControlManager` |
| `./mapping/legend/LegendManager.js` | `LegendManager` |
| `./utils/SVGUtils.js` | `SVGUtils` |
| `./mapping/controls/ScaleOrientationManager.js` | `ScaleOrientationManager` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpaysage/js/modules)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../index.md)
- [💻 Ouvrir le code source (MapManager.js)](../../../../fpaysage/js/modules/MapManager.js)