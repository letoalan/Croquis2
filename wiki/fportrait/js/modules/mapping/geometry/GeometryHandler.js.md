# 📄 Fiche Documentaire : `GeometryHandler.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fportrait/js/modules/mapping/geometry](index.md) / `GeometryHandler.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js/modules/mapping/geometry](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `GeometryHandler.js`](../../../../../../fportrait/js/modules/mapping/geometry/GeometryHandler.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Gestionnaire utilitaire de standardisation des géométries, coordonnées et conversions Leaflet vers l'état interne.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/modules/mapping/geometry/GeometryHandler.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 1.23 Ko (1259 octets)
- **Nombre de lignes :** 37 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class GeometryHandler` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `GeometryHandler`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./GeometryObjectFactory.js` | `GeometryObjectFactory` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fportrait/js/modules/mapping/geometry)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (GeometryHandler.js)](../../../../../../fportrait/js/modules/mapping/geometry/GeometryHandler.js)