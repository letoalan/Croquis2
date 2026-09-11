# 📄 Fiche Documentaire : `GeometryManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [📁 Dossier fpaysage/js/modules](index.md) / `GeometryManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpaysage/js/modules](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../index.md)
> - **Code Source Réel :** [💻 Voir `GeometryManager.js`](../../../../fpaysage/js/modules/GeometryManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Orchestrateur principal des formes géométriques reliant les événements utilisateur, le moteur Leaflet et le StateManager.

### Métadonnées Techniques
- **Emplacement relatif :** `fpaysage/js/modules/GeometryManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 5.09 Ko (5215 octets)
- **Nombre de lignes :** 130 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class GeometryManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `GeometryManager`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./MapManager.js` | `MapManager` |
| `./StateManager.js` | `StateManager` |
| `./mapping/legend/LegendManager.js` | `LegendManager` |
| `./UIManager.js` | `UIManager` |
| `./mapping/io/ExportImportManager.js` | `ExportImportManager` |
| `./mapping/controls/ScaleOrientationManager.js` | `ScaleOrientationManager` |
| `./mapping/io/PDFExporter.js` | `PDFExporter` |
| `./ui/SymbolPaletteManager.js` | `SymbolPaletteManager` |

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
- [💻 Ouvrir le code source (GeometryManager.js)](../../../../fpaysage/js/modules/GeometryManager.js)