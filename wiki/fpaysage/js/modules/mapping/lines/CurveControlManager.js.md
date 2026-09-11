# 📄 Fiche Documentaire : `CurveControlManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fpaysage/js/modules/mapping/lines](index.md) / `CurveControlManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpaysage/js/modules/mapping/lines](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `CurveControlManager.js`](../../../../../../fpaysage/js/modules/mapping/lines/CurveControlManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Contrôleur spécialisé dans la manipulation, le traçage et l'ajustement des propriétés des lignes, courbes ou marqueurs.

### Métadonnées Techniques
- **Emplacement relatif :** `fpaysage/js/modules/mapping/lines/CurveControlManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 7.11 Ko (7279 octets)
- **Nombre de lignes :** 187 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class CurveControlManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `CurveControlManager`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./BezierMath.js` | `BezierMath` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpaysage/js/modules/mapping/lines)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (CurveControlManager.js)](../../../../../../fpaysage/js/modules/mapping/lines/CurveControlManager.js)