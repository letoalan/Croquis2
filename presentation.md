# 🎨 Présentation CSS – Mode Paysage (`fpaysage`)

Ce document documente l'architecture et l'organisation des feuilles de style (CSS) spécifiques à la version **Paysage** (`fpaysage`) du projet Croquis.

L'objectif de cette structure est de garantir une séparation stricte des préoccupations visuelles, facilitant ainsi la maintenance, la lisibilité et l'évolution de l'interface graphique.

## 1. Architecture Globale (Inspirée de ITCSS / SMACSS)

Le point d'entrée principal pour le navigateur est le fichier `styles.css` situé à la racine du dossier `css/`. Ce fichier ne contient aucune règle CSS directe, mais sert d'**index d'importation** (`@import`) pour orchestrer l'ordre de cascade des différents sous-modules CSS.

```css
/* css/styles.css */
@import "base/variables.css";
@import "base/base.css";
@import "layout/layout.css";
@import "components/buttons.css";
/* ... */
```

## 2. Dossiers et Responsabilités

Les styles sont divisés en 5 catégories principales :

### 🗄️ 1. `base/` (Fondations)
- **`variables.css`** : Le cœur de l'identité visuelle. Il définit toutes les *Custom Properties* (variables CSS) telles que la palette de couleurs (primaire, secondaire, fonds, textes), les typographies, les ombres (`box-shadow`), et les variables de z-index. *C'est ici qu'il faut agir pour modifier le thème global.*
- **`base.css`** : Réinitialisation globale (reset/normalize) et styles appliqués directement aux balises HTML nues (`<body>`, `<h1>`, `<p>`, `<a>`) sans classes spécifiques.

### 📐 2. `layout/` (Structure)
- **`layout.css`** : Gère la disposition macroscopique de l'application. Ce fichier contient les règles des conteneurs principaux (la grille globale CSS Grid, les conteneurs Flexbox, l'agencement entre la barre latérale, la carte et l'éditeur).

### 🧩 3. `components/` (Composants isolés)
C'est le dossier le plus riche, chaque fichier gérant un élément spécifique et indépendant de l'interface (composants encapsulés) :
- **`buttons.css`** : Style de tous les boutons interactifs (états `:hover`, `:active`, transitions).
- **`sidebar.css`** : Apparence des panneaux latéraux (outils de dessin, liste des géométries).
- **`map.css`** : Styles spécifiques aux éléments superposés à la carte Leaflet (contrôles personnalisés).
- **`context-menu.css`** : Le menu flottant permettant de modifier les propriétés des formes (couleurs, épaisseur).
- **`legend.css`** : Le panneau de légende dynamique (drag & drop, titres de parties, listes de figurés).
- **`editor.css`** : L'éditeur de texte WYSIWYG permettant l'alignement texte/symboles.

*(Note : On retrouve des versions préfixées par `_` comme `_legend.css` qui peuvent servir de sauvegardes ou de modules partiels selon le bundler utilisé).*

### 🔌 4. `vendors/` (Bibliothèques externes)
- **`leaflet.css`** : Surcharges ou intégrations spécifiques pour harmoniser les contrôles natifs de Leaflet ou Leaflet-Geoman avec le design system de l'application Croquis.

### 🛠️ 5. `utils/` (Utilitaires)
- **`helpers.css`** : Classes utilitaires à usage unique (ex: `.hidden`, `.text-center`, `.flex-center`, `.mt-2`). Ces classes ont généralement un poids important ou des `!important` et servent pour des ajustements rapides dans le HTML sans créer de nouvelles règles dans les composants.

## 3. Bonnes Pratiques pour l'IA et les Développeurs

- **Ne jamais écrire de règles directement dans `styles.css`.**
- **Variables CSS First** : Pour changer une couleur récurrente, modifiez toujours `base/variables.css` plutôt que de coder en dur dans un composant.
- **Séparation spatiale** : Si vous ajoutez un nouveau widget (ex: une modale d'export), créez un nouveau fichier `components/modal.css` et importez-le dans `styles.css`.
- **Z-Index** : L'application faisant appel à une carte Leaflet et de nombreux panneaux flottants (menu contextuel, légende), une attention particulière doit être portée aux règles de z-index (idéalement centralisées via des variables).

---

# 📱 Design et CSS – Mode Portrait (`fportrait`)

La version portrait utilise une approche **Mobile-First** avec des spécificités ergonomiques marquées.

### 1. Organisation des Panneaux (Bottom Sheets)
Les styles dans `layout/layout.css` et `components/bottom-sheet.css` gèrent l'apparition des panneaux par le bas. L'utilisation de `transform: translateY(100%)` et de transitions CSS assure une animation fluide sans impacter les performances.

### 2. Ergonomie Tactile
- **Boutons** : Les tailles minimales des zones cliquables sont fixées à 44x44px pour garantir le confort tactile (Apple/Google Standards).
- **Transparence et Glassmorphism** : La légende et le menu contextuel utilisent `backdrop-filter: blur()` pour rester lisibles tout en laissant deviner la carte en arrière-plan.

### 3. Responsive Adaptatif
Les styles utilisent des unités relatives (`vh`, `vw`) et des variables CSS pour s'adapter dynamiquement à la hauteur de la barre de navigation du navigateur mobile, évitant ainsi le problème classique du "100vh" sur iOS/Android.
