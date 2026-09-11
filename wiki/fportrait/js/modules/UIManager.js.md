# 📄 Fiche Documentaire : `UIManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [📁 Dossier fportrait/js/modules](index.md) / `UIManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js/modules](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../index.md)
> - **Code Source Réel :** [💻 Voir `UIManager.js`](../../../../fportrait/js/modules/UIManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Gestionnaire d'interface utilisateur contrôlant les barres d'outils, menus contextuels, panneaux repliables et navigation.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/modules/UIManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 32.03 Ko (32795 octets)
- **Nombre de lignes :** 771 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class UIManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `UIManager`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./ContextMenuDragger.js` | `ContextMenuDragger` |

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
- [💻 Ouvrir le code source (UIManager.js)](../../../../fportrait/js/modules/UIManager.js)