# 📄 Fiche Documentaire : `PointerRouter.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [📁 Dossier fpromethean/js/modules](index.md) / `PointerRouter.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpromethean/js/modules](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../index.md)
> - **Code Source Réel :** [💻 Voir `PointerRouter.js`](../../../../fpromethean/js/modules/PointerRouter.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Routeur d'événements tactiles spécialisé pour écrans interactifs (TBI) assurant la distinction doigt / stylet et le rejet de paume.

### Métadonnées Techniques
- **Emplacement relatif :** `fpromethean/js/modules/PointerRouter.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 2.58 Ko (2644 octets)
- **Nombre de lignes :** 84 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class PointerRouter` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `PointerRouter`

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
- [💻 Ouvrir le code source (PointerRouter.js)](../../../../fpromethean/js/modules/PointerRouter.js)