# 📄 Fiche Documentaire : `TileSelectorControl.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fpromethean/js/modules/mapping/layers](index.md) / `TileSelectorControl.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpromethean/js/modules/mapping/layers](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `TileSelectorControl.js`](../../../../../../fpromethean/js/modules/mapping/layers/TileSelectorControl.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Gestionnaire et sélecteur interactif des fonds de carte (OpenStreetMap, Satellite, Topo, CartoDB, etc.).

### Métadonnées Techniques
- **Emplacement relatif :** `fpromethean/js/modules/mapping/layers/TileSelectorControl.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 7.96 Ko (8148 octets)
- **Nombre de lignes :** 180 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class TileSelectorControl` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `TileSelectorControl`

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpromethean/js/modules/mapping/layers)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (TileSelectorControl.js)](../../../../../../fpromethean/js/modules/mapping/layers/TileSelectorControl.js)