# 📄 Fiche Documentaire : `main.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../index.md) / [📁 Dossier fportrait/js](index.md) / `main.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../index.md)
> - **Code Source Réel :** [💻 Voir `main.js`](../../../fportrait/js/main.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Point d'entrée JavaScript initialisant les gestionnaires, l'écoute des événements DOM et la configuration de l'application.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/main.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 41.79 Ko (42798 octets)
- **Nombre de lignes :** 1042 lignes

## 2. Architecture & Analyse du Code

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./modules/GeometryManager.js` | `GeometryManager` |
| `./modules/utils/SVGUtils.js` | `SVGUtils` |

### Fonctions Clés Définies
- `function calculateBaseWidth()`
- `function getEffectiveZoomLevel()`
- `function diagnoseZoomDetection()`
- `function detectAndAdaptZoom()`
- `function showZoomIndicator()`
- `function monitorZoomChanges()`
- `function initSidebar()`
- `function initFullscreenMode()`
- `function initTextEditor()`
- `function updateButtonStates()`

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fportrait/js)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../index.md)
- [💻 Ouvrir le code source (main.js)](../../../fportrait/js/main.js)