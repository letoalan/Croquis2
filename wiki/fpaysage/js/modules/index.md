# 📁 Dossier : `fpaysage/js/modules`

**Fil d'Ariane :** [🏠 Wiki Central](../../../index.md) / [Dossier Parent (fpaysage/js)](../index.md) / `fpaysage/js/modules`

> **Interconnexions globales :** [🗺️ Projet Croquis (projet.md)](../../../../projet.md) | [📚 Wiki Central](../../../index.md)

---

## 🎯 Rôle et Responsabilité du Dossier

Cœur applicatif de la version Paysage : gestionnaires d'état (`StateManager`), carte (`MapManager`), interface (`UIManager`).

---

## 📄 Fichiers Contenus dans ce Dossier

| Nom du Fichier | Taille | Rôle & Utilité | Documentation Dédiée | Code Source |
| :--- | :--- | :--- | :--- | :--- |
| `ContextMenuDragger.js` | 9.3 KB | Contrôleur de déplacement et positionnement flottant du panneau d'édition de style contextuel. | [Consulter la fiche](ContextMenuDragger.js.md) | [Code Source](../../../../fpaysage/js/modules/ContextMenuDragger.js) |
| `GeometryManager.js` | 5.1 KB | Orchestrateur principal des formes géométriques reliant les événements utilisateur, le moteur Leaflet et le StateManager. | [Consulter la fiche](GeometryManager.js.md) | [Code Source](../../../../fpaysage/js/modules/GeometryManager.js) |
| `MapManager.js` | 29.1 KB | Pilote cartographique Leaflet & Leaflet-Geoman orchestrant les couches, fonds de carte, projection et événements de dessin. | [Consulter la fiche](MapManager.js.md) | [Code Source](../../../../fpaysage/js/modules/MapManager.js) |
| `StateManager.js` | 44.1 KB | Source de vérité unique et gestionnaire d'état réactif centralisant les géométries, sélections, styles et synchronisations. | [Consulter la fiche](StateManager.js.md) | [Code Source](../../../../fpaysage/js/modules/StateManager.js) |
| `UIManager.js` | 26.7 KB | Gestionnaire d'interface utilisateur contrôlant les barres d'outils, menus contextuels, panneaux repliables et navigation. | [Consulter la fiche](UIManager.js.md) | [Code Source](../../../../fpaysage/js/modules/UIManager.js) |

---

## 📂 Sous-Dossiers

| Sous-Dossier | Description | Lien Wiki |
| :--- | :--- | :--- |
| `/mapping` | Modules cartographiques de la version Paysage : contrôles Leaflet, moteurs de dessin vectoriel, géométrie, légende et exports. | [Accéder au dossier (mapping)](mapping/index.md) |
| `/ui` | Cœur applicatif de la version Paysage : gestionnaires d'état (`StateManager`), carte (`MapManager`), interface (`UIManager`). | [Accéder au dossier (ui)](ui/index.md) |
| `/utils` | Cœur applicatif de la version Paysage : gestionnaires d'état (`StateManager`), carte (`MapManager`), interface (`UIManager`). | [Accéder au dossier (utils)](utils/index.md) |

---

### 🔗 Navigation Rapide
- [Retour au dossier parent](../index.md)
- [Retour au Wiki Central](../../../index.md)
- [Documentation Technique Globale (projet.md)](../../../../projet.md)