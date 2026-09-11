# 📄 Fiche Documentaire : `main.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../index.md) / [📁 Dossier fpromethean/js](index.md) / `main.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpromethean/js](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../index.md)
> - **Code Source Réel :** [💻 Voir `main.js`](../../../fpromethean/js/main.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Point d'entrée JavaScript initialisant les gestionnaires, l'écoute des événements DOM et la configuration de l'application.

### Métadonnées Techniques
- **Emplacement relatif :** `fpromethean/js/main.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 35.25 Ko (36092 octets)
- **Nombre de lignes :** 883 lignes

## 2. Architecture & Analyse du Code

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./modules/GeometryManager.js` | `GeometryManager` |
| `./modules/utils/SVGUtils.js` | `SVGUtils` |

### Fonctions Clés Définies
- `function detectAndAdaptZoom()`
- `function showZoomIndicator()`
- `function monitorZoomChanges()`
- `function initSidebar()`
- `function initFullscreenMode()`
- `function initTextEditor()`
- `function initEditorModal()`
- `function initFormattingButtons()`
- `function initClearButton()`
- `function initCopyButton()`

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpromethean/js)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../index.md)
- [💻 Ouvrir le code source (main.js)](../../../fpromethean/js/main.js)