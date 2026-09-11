# 📄 Fiche Documentaire : `EventManager.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fpaysage/js/modules/mapping/events](index.md) / `EventManager.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpaysage/js/modules/mapping/events](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `EventManager.js`](../../../../../../fpaysage/js/modules/mapping/events/EventManager.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Gestionnaire de propagation et d'écoute des événements cartographiques et interactions de dessin.

### Métadonnées Techniques
- **Emplacement relatif :** `fpaysage/js/modules/mapping/events/EventManager.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 1.76 Ko (1804 octets)
- **Nombre de lignes :** 56 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class EventManager` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `EventManager`

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpaysage/js/modules/mapping/events)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (EventManager.js)](../../../../../../fpaysage/js/modules/mapping/events/EventManager.js)