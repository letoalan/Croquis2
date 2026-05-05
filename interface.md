# 🖥️ Interface Utilisateur – Mode Paysage (`fpaysage`)

Ce document décrit la structure, l'agencement et les fonctionnalités de l'interface graphique de la version **Paysage** du projet Croquis. L'interface est conçue pour optimiser l'espace horizontal, typique des écrans d'ordinateurs ou de tablettes au format paysage.

L'interface se divise en **quatre grandes zones** fonctionnelles :

---

## 1. 🗂️ Panneau Latéral Gauche (Sidebar Gauche)
Ce panneau est rétractable pour maximiser la vue sur la carte. Il contient les outils de gestion globale et la liste des éléments dessinés.

- **Outils d'Export/Import** :
  - **Exporter / Importer** : Boutons permettant de sauvegarder ou restaurer l'état complet du croquis (légende, dessins, styles) au format JSON.
  - **Exporter PDF** : Génère un fichier PDF haute qualité de la carte et de sa légende.
- **Panneau d'édition (Liste des Géométries)** :
  - Un conteneur (`#geometryList`) qui répertorie toutes les formes, lignes et marqueurs tracés sur la carte. C'est le point d'entrée pour sélectionner une forme existante et ouvrir le menu contextuel.

---

## 2. 🌍 Zone Centrale (La Carte)
C'est la zone principale de l'application, propulsée par *Leaflet* et *Leaflet-Geoman*.

- **Outils de Dessin** : La barre d'outils Leaflet-Geoman est présente sur la carte pour dessiner (lignes, polygones, marqueurs).
- **Titre de la Carte** : Un encart flottant et modifiable (`mapTitleContainer`) placé sur la carte permettant de donner un titre au croquis.
- **En-tête de Légende** : Un conteneur dynamique permettant de construire la légende et d'ajouter de nouvelles parties (`#addPartBtn`).

---

## 3. 🎛️ Menu Contextuel Flottant
Lorsqu'un utilisateur sélectionne une figure (soit sur la carte, soit dans le panneau gauche), ce menu flottant, déplaçable (drag & drop), apparaît. Il permet d'affiner le style visuel de la géométrie sélectionnée :

- **Couleurs** : Sélecteurs de couleur de remplissage (`🎨`) et de couleur de contour (`🖊️`).
- **Opacité** : Un slider (`💧`) de 0 à 1 (0% à 100%).
- **Style de trait** : Liste déroulante (`📐`) pour choisir un trait plein, pointillé ou en pointillés espacés.
- **Épaisseur** : Un slider (`📏`) réglable en pixels.
- **Taille du marqueur** : Apparaît conditionnellement (`📍`) si l'objet est un marqueur.
- **Actions** : Boutons *Appliquer*, *Réinitialiser* ou *Supprimer* l'objet.

---

## 4. 📝 Panneau Latéral Droit (Éditeur de Texte)
Ce second panneau rétractable est un outil pédagogique majeur. Il permet de rédiger un texte explicatif (développement construit) en lien direct avec le croquis.

- **Barre de formatage enrichie (WYSIWYG)** :
  - Outils classiques : Gras, Italique, Souligné, Barré, Listes (à puces / numérotées).
  - Outil "Fluo" : Un bouton et un sélecteur de couleur permettant de surligner du texte (typiquement pour lier un concept géographique à une couleur de la carte).
- **Éditeur à double colonne synchronisée** :
  - **Colonne 1 (Symboles)** : Des zones de "drop" permettant de glisser-déposer des figurés de la carte directement face aux lignes de texte correspondantes.
  - **Colonne 2 (Texte)** : La zone de rédaction multilingne (`contenteditable="true"`).
- **Zone de stockage ("Figurés utilisés")** : Une palette répertoriant les symboles employés pour faciliter leur glisser-déposer vers l'éditeur.
- **Outils annexes** : Compteurs de mots/caractères, boutons pour copier, effacer ou exporter le texte au format HTML.

# 📱 Interface Utilisateur – Mode Portrait (`fportrait`)

L'interface **Portrait** est conçue pour une utilisation mobile et tactile, privilégiant l'accessibilité à une main et la clarté visuelle sur petits écrans.

---

## 1. 🧭 Navigation Inférieure (Bottom Nav)
C'est le centre de contrôle principal de la version mobile. Elle permet de basculer entre les différents modes sans encombrer la carte.

- **Légende (Toggle)** : Affiche ou masque la légende interactive directement sur la carte. Contrairement aux autres panneaux, elle peut être superposée temporairement au dessin.
- **Dessin (Draw)** : Ouvre un panneau (`bottom-sheet`) contenant les outils Leaflet-Geoman pour créer de nouveaux figurés.
- **Sauver (Save)** : Regroupe les fonctions d'export (PDF, JSON) et d'import.
- **Éditeur (Editor)** : Ouvre l'éditeur de texte pédagogique pour la rédaction du développement construit.

---

## 2. 📑 Système de "Bottom Sheets"
Pour optimiser l'espace, les outils sont logés dans des panneaux escamotables qui s'ouvrent depuis le bas de l'écran.

- **Gestion intelligente des conflits** : L'activation d'un panneau (via la navigation) ferme automatiquement les autres panneaux ouverts ainsi que la légende pour garantir que l'utilisateur se concentre sur une seule tâche à la fois.
- **Interactivité tactile** : Les panneaux utilisent des transitions fluides et des tailles de boutons adaptées au toucher.

---

## 3. 🗺️ La Carte et le Menu Contextuel
- **Espace Maximal** : La carte occupe 100% de la surface disponible en arrière-plan.
- **Menu Contextuel Mobile** : Lorsqu'un figuré est sélectionné, un menu flottant optimisé apparaît. Il permet de modifier les styles (couleurs, épaisseur) via des contrôles compacts.

---

## 4. 🗃️ Légende Interactive
- **Format flottant** : La légende apparaît comme un overlay transparent sur la carte.
- **Auto-fermeture** : Elle se masque automatiquement dès que l'utilisateur commence une autre opération (dessin, sauvegarde, édition) pour éviter toute surcharge cognitive.
- **Persistance à l'export** : Même si elle est masquée pour le confort de l'utilisateur, elle est systématiquement réactivée par le module d'export pour figurer dans le PDF final.
