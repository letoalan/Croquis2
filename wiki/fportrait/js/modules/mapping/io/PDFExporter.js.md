# 📄 Fiche Documentaire : `PDFExporter.js`

**Fil d'Ariane :** [🏠 Wiki Central](../../../../../index.md) / [📁 Dossier fportrait/js/modules/mapping/io](index.md) / `PDFExporter.js`

> **Interconnexions :**
> - **Dossier Parent :** [fportrait/js/modules/mapping/io](index.md)
> - **Documentation Technique Globale :** [🗺️ projet.md](../../../../../../projet.md)
> - **Portail Wiki :** [📚 Wiki Central](../../../../../index.md)
> - **Code Source Réel :** [💻 Voir `PDFExporter.js`](../../../../../../fportrait/js/modules/mapping/io/PDFExporter.js)

---

## 1. Vue d'Ensemble et Rôle
**Description fonctionnelle :**  
Module d'exportation PDF vectoriel/raster haute définition intégrant le cadrage Smart Crop, la capture de légende et l'échelle.

### Métadonnées Techniques
- **Emplacement relatif :** `fportrait/js/modules/mapping/io/PDFExporter.js`
- **Type de fichier :** `.js`
- **Poids du fichier :** 34.6 Ko (35426 octets)
- **Nombre de lignes :** 852 lignes

## 2. Architecture & Analyse du Code

### Classes Définies
- `class PDFExporter` : Cœur du composant responsable de la logique métier associée.

### Éléments Exportés
- `PDFExporter`

## 3. Intégration dans le Cycle de Vie du Projet
Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :
1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.
2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).
3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.

---

## 4. Liens et Interconnexions du Wiki
- [📁 Consulter l'index du dossier (fportrait/js/modules/mapping/io)](index.md)
- [🗺️ Consulter la documentation d'architecture globale (projet.md)](../../../../../../projet.md)
- [📚 Revenir à l'accueil du Wiki Central](../../../../../index.md)
- [💻 Ouvrir le code source (PDFExporter.js)](../../../../../../fportrait/js/modules/mapping/io/PDFExporter.js)