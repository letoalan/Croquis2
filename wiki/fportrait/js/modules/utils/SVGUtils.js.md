# 📄 Fiche Documentaire : `SVGUtils.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../index.md) / [📁 Dossier fportrait/js/modules/utils](index.md) / `SVGUtils.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js/modules/utils](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../index.md)
> - **Code Source Réel :** [💻 Voir `SVGUtils.js`](../../../../../fportrait/js/modules/utils/SVGUtils.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Calculateur géométrique et générateur SVG vectoriel pour les flèches dynamiques, pointes orientées et figurés complexes.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/modules/utils/SVGUtils.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 2.97 Ko (3043 octets)
- **Nombre de lignes :** 85 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class SVGUtils` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `SVGUtils`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./svg_parts/ArrowRenderer.js` | `ArrowRenderer` |
| `./svg_parts/MarkerSVGFactory.js` | `MarkerSVGFactory` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fportrait/js/modules/utils)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../index.md)
- [💻 Ouvrir le code source (SVGUtils.js)](../../../../../fportrait/js/modules/utils/SVGUtils.js)