# 📄 Fiche Documentaire : `LayerGroupManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fportrait/js/modules/mapping/layers](index.md) / `LayerGroupManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js/modules/mapping/layers](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `LayerGroupManager.js`](../../../../../../fportrait/js/modules/mapping/layers/LayerGroupManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Gestionnaire des groupes de calques Leaflet organisant la superposition des vecteurs et couches cartographiques.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/modules/mapping/layers/LayerGroupManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 2.65 Ko (2714 octets)
- **Nombre de lignes :** 92 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class LayerGroupManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `LayerGroupManager`

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fportrait/js/modules/mapping/layers)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (LayerGroupManager.js)](../../../../../../fportrait/js/modules/mapping/layers/LayerGroupManager.js)