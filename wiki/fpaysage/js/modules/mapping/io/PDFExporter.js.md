# 📄 Fiche Documentaire : `PDFExporter.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fpaysage/js/modules/mapping/io](index.md) / `PDFExporter.js`

> **Interconnexions :**
> - **Dossier Parent :** [fpaysage/js/modules/mapping/io](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `PDFExporter.js`](../../../../../../fpaysage/js/modules/mapping/io/PDFExporter.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Module d'exportation PDF vectoriel/raster haute définition intégrant le cadrage Smart Crop, la capture de légende et l'échelle.

### Métadonnées Techniques
- **Emplacement relatif :** `fpaysage/js/modules/mapping/io/PDFExporter.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 1.55 Ko (1586 octets)
- **Nombre de lignes :** 36 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class PDFExporter` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `PDFExporter`

### Dépendances et Modules Importés
| Module Importé | Symboles Importés |
| :--- | :--- |
| `./pdf_parts/SmartCropEngine.js` | `SmartCropEngine` |
| `./pdf_parts/PdfCanvasComposer.js` | `PdfCanvasComposer` |

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fpaysage/js/modules/mapping/io)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (PDFExporter.js)](../../../../../../fpaysage/js/modules/mapping/io/PDFExporter.js)