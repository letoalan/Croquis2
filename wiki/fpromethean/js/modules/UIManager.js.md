# 📄 Fiche Documentaire : `UIManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [📁 Dossier fpromethean/js/modules](index.md) / `UIManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpromethean/js/modules](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../index.md)
> - **Code Source Réel :** [💻 Voir `UIManager.js`](../../../../fpromethean/js/modules/UIManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Gestionnaire d'interface utilisateur contrôlant les barres d'outils, menus contextuels, panneaux repliables et navigation.

### Métadonnées Techniques
- **Emplacement relatif :** `fpromethean/js/modules/UIManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 1.9 Ko (1943 octets)
- **Nombre de lignes :** 55 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class UIManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `UIManager`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./ContextMenuDragger.js` | `ContextMenuDragger` |
| `./ui_parts/ContextMenuHandler.js` | `ContextMenuHandler` |
| `./ui_parts/UIActionsHandler.js` | `UIActionsHandler` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpromethean/js/modules)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../index.md)
- [💻 Ouvrir le code source (UIManager.js)](../../../../fpromethean/js/modules/UIManager.js)