# Prolégomène-Contrat de Programmation
## Launcher d’Orientation et d’Entrée — Projet Croquis

---

## 1. Philosophie Directrice

Le fichier racine `index.html` du projet Croquis ne doit pas être conçu comme une landing page de redirection automatique, mais comme un **launcher d’orientation** sobre, lisible et honnête.

Son rôle n’est pas de décider à la place de l’utilisateur quelle version est absolument la bonne, mais de :
1. **détecter des indices d’usage probables** (orientation, largeur, type de pointeur) ;
2. **recommander une version** adaptée (`fpaysage/` ou `fportrait/`) ;
3. **laisser à l’utilisateur la décision finale** par un choix explicite et immédiatement accessible.

Le launcher ne contient **aucune logique métier cartographique**. Il ne prétend pas résoudre la question de la compatibilité fonctionnelle entre paysage et portrait. Cette responsabilité appartient aux applications `fpaysage/` et `fportrait/` elles-mêmes.

En conséquence :
- la **détection vaut recommandation**, non verdict ;
- le **choix utilisateur prime** sur l’automatisme ;
- la page d’entrée doit **orienter sans masquer** l’état réel du projet.

---

## 2. Position dans l’architecture

Le projet Croquis est structuré autour de deux applications distinctes, `fpaysage/` et `fportrait/`, partageant une architecture proche mais destinées à des usages différents. Le launcher racine agit comme **couche d’aiguillage UX**, non comme couche applicative. [file:55]

Architecture cible :

```text
Croquis/
├── index.html              # Launcher d’orientation (point d’entrée unique)
├── css/
│   └── landing.css         # Styles du launcher (≤ 150 lignes)
├── js/
│   └── landing.js          # Détection + recommandation + navigation (≤ 150 lignes)
├── assets/
│   ├── cl.jpg              # Visuel principal paysage
│   └── cp.jpg              # Visuel principal portrait
├── fpaysage/               # Application paysage
└── fportrait/              # Application portrait
```

Le launcher doit rester **autonome**, **léger** et **sans dépendance externe** :
- pas de framework JS ;
- pas de bibliothèque tierce ;
- pas de Leaflet ;
- pas de logique partagée avec les modules métier. [file:55][file:56]

---

## 3. Finalité du launcher

Le launcher remplit quatre fonctions précises :

1. **Accueillir** l’utilisateur avec une identité visuelle claire.
2. **Informer** sur la version recommandée en fonction du contexte de consultation.
3. **Permettre un accès immédiat** à la version recommandée.
4. **Garantir le forçage explicite** de `fpaysage/` ou `fportrait/` à tout moment.

Le launcher ne doit pas :
- imposer une redirection sans consentement explicite ;
- faire croire que la détection est infaillible ;
- compenser artificiellement les limites éventuelles de `fportrait/` ou `fpaysage/`.

---

## 4. Principe de vérité UX

Le document repose sur un principe simple : **mieux vaut recommander clairement que rediriger abusivement**.

La recommandation doit être formulée de manière probabiliste et transparente, par exemple :
- “Version recommandée : Portrait”
- “Version recommandée : Paysage”
- “Appareil tactile ou écran étroit détecté”
- “Affichage large ou usage paysage détecté”

Les formulations à éviter :
- “Version correcte détectée”
- “Mode optimal garanti”
- “Redirection fiable à 100%”

Le launcher doit reconnaître implicitement qu’un même appareil peut relever de plusieurs usages :
- smartphone en paysage ;
- tablette avec clavier ;
- PC tactile ;
- fenêtre desktop étroite ;
- préférence volontaire pour une autre version.

---

## 5. Stratégie de détection

### 5.1 Statut de la détection

La détection est une **heuristique d’orientation**, non un mécanisme de vérité.  
Elle sert à calculer une **version recommandée** et à adapter l’interface du launcher, mais elle n’empêche jamais l’accès aux deux versions.

### 5.2 Critères de détection

La recommandation repose sur trois signaux simples :

- orientation du viewport ;
- largeur disponible ;
- type de pointeur / capacité tactile probable.

Exemple de fonction :

```js
function detectRecommendedVersion() {
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const isNarrow = window.innerWidth < 768;

  return (isPortrait || isTouch || isNarrow) ? "portrait" : "paysage";
}
```

### 5.3 Interprétation

- Si la fonction retourne `portrait`, le launcher recommande `fportrait/index.html`.
- Si la fonction retourne `paysage`, le launcher recommande `fpaysage/index.html`.

Cette recommandation doit rester **réversible** et **non bloquante**.

---

## 6. Politique de navigation

### Règle principale

Le launcher n’effectue **aucune redirection automatique par défaut**.

### Navigation autorisée

- **Bouton principal** : ouvre la version recommandée.
- **Bouton secondaire 1** : ouvre explicitement `fpaysage/index.html`.
- **Bouton secondaire 2** : ouvre explicitement `fportrait/index.html`.

### Redirection automatique

La redirection automatique n’est pas le comportement nominal.  
Elle peut être :
- absente ;
- ou activée plus tard comme option spécifique, désactivée par défaut.

Si une version future introduit une redirection automatique, elle devra :
- être clairement annoncée ;
- être annulée à la moindre interaction utilisateur ;
- ne jamais empêcher le forçage explicite.

---

## 7. Comportement en cas de changement d’orientation

Tant que l’utilisateur se trouve sur le launcher, un changement d’orientation ou de viewport peut :
- recalculer la version recommandée ;
- mettre à jour le badge de recommandation ;
- changer le visuel de fond ;
- mettre à jour le libellé du bouton principal.

En revanche :
- le launcher **ne doit pas relancer un processus de redirection** ;
- le launcher **ne doit pas voler le focus** ;
- le launcher **ne doit pas produire d’effet intrusif**.

Le changement d’orientation doit être perçu comme une **mise à jour d’information**, non comme une bascule forcée.

---

## 8. Structure HTML (`index.html`)

Le HTML doit rester simple, sémantique et stable.

Structure cible :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Croquis – Choix de version</title>
  <link rel="preload" as="image" href="assets/cl.jpg">
  <link rel="preload" as="image" href="assets/cp.jpg">
  <link rel="stylesheet" href="css/landing.css">
</head>
<body>
  <div id="bg" class="bg-layer" aria-hidden="true"></div>
  <div class="overlay" aria-hidden="true"></div>

  <main class="launcher-content">
    <header class="launcher-header">
      <div class="logo-badge" aria-hidden="true">✏️</div>
      <h1 class="app-title">Croquis</h1>
      <p class="app-tagline">
        Choisissez la version adaptée à votre usage
      </p>
    </header>

    <section class="recommendation-panel" aria-labelledby="recommendationTitle">
      <h2 id="recommendationTitle" class="sr-only">Version recommandée</h2>

      <p id="recommendationBadge" class="recommendation-badge" aria-live="polite">
        Détection en cours…
      </p>

      <p id="recommendationReason" class="recommendation-reason">
        Analyse de l’affichage en cours…
      </p>

      <div class="cta-zone">
        <a id="ctaMain" href="#" class="btn-primary">
          Ouvrir la version recommandée
          <span class="btn-arrow" aria-hidden="true">→</span>
        </a>
      </div>

      <div class="version-switcher">
        <span class="switcher-label">Ou ouvrir directement :</span>
        <a href="fpaysage/index.html" class="btn-secondary">🖥️ Version paysage</a>
        <a href="fportrait/index.html" class="btn-secondary">📱 Version portrait</a>
      </div>

      <details class="help-details">
        <summary>Pourquoi cette recommandation ?</summary>
        <p>
          La recommandation est calculée à partir de l’orientation, de la largeur d’écran
          et du type de pointeur détecté. Elle n’est pas contraignante : vous pouvez
          ouvrir la version de votre choix.
        </p>
      </details>
    </section>
  </main>

  <footer class="version-footer">
    <span id="versionLabel">Recommandation en cours…</span>
  </footer>

  <script src="js/landing.js"></script>
</body>
</html>
```

---

## 9. Contrat visuel (`landing.css`)

Le CSS du launcher doit produire une page :
- légère ;
- contrastée ;
- lisible sur mobile comme sur desktop ;
- cohérente avec l’univers visuel du projet.

### 9.1 Principes visuels

- un visuel plein écran (`cl.jpg` ou `cp.jpg`) ;
- un overlay sombre pour garantir la lisibilité ;
- un bloc central de contenu lisible sans surcharge ;
- un bouton principal immédiatement identifiable ;
- des boutons secondaires présents mais hiérarchiquement inférieurs.

### 9.2 Exigences CSS

- fichier `landing.css` ≤ 150 lignes ;
- aucun style inline ;
- `clamp()` autorisé pour la typographie fluide ;
- `min-height: 48px` sur tous les éléments interactifs ;
- contrastes texte/fond compatibles WCAG AA ;
- animations discrètes uniquement.

### 9.3 Composants visuels attendus

- `.bg-layer` : image de fond plein écran ;
- `.overlay` : filtre de contraste ;
- `.launcher-content` : conteneur centré ;
- `.recommendation-badge` : badge de recommandation ;
- `.btn-primary` : action principale ;
- `.btn-secondary` : accès directs ;
- `.help-details` : explicitation méthodologique ;
- `.version-footer` : rappel discret de la recommandation active.

---

## 10. Contrat JavaScript (`landing.js`)

Le fichier `landing.js` doit rester compact et n’assurer que quatre responsabilités :

1. **Détecter** la version recommandée.
2. **Mettre à jour** le fond, le badge, la raison et le bouton principal.
3. **Réagir** à un changement d’orientation ou de largeur.
4. **Ne jamais forcer** une redirection automatique non demandée.

### 10.1 Fonctions attendues

- `detectRecommendedVersion()`
- `getRecommendationReason(version)`
- `updateBackground(version)`
- `updateRecommendation(version)`
- `updateCTA(version)`
- `syncLauncher()`

### 10.2 Logique minimale

Pseudo-code :

```text
DOMContentLoaded
  └─ syncLauncher()

syncLauncher()
  └─ version = detectRecommendedVersion()
  └─ updateBackground(version)
  └─ updateRecommendation(version)
  └─ updateCTA(version)

orientationChange / resize
  └─ syncLauncher()
```

### 10.3 Règles JS

- pas de timer de redirection par défaut ;
- pas de stockage local obligatoire ;
- pas de cookie ;
- pas de dépendance externe ;
- pas de logique métier issue des applications.

---

## 11. Contenu textuel recommandé

Le texte affiché doit être bref, informatif et non trompeur.

Exemples valides :

- **Badge** : `Version recommandée : Portrait`
- **Raison** : `Appareil tactile ou affichage étroit détecté.`
- **Footer** : `Recommandation active : Portrait`

Exemples alternatifs :

- **Badge** : `Version recommandée : Paysage`
- **Raison** : `Affichage large ou orientation paysage détectée.`

Le texte doit éviter toute affirmation absolue.  
La recommandation doit rester compréhensible sans vocabulaire trop technique.

---

## 12. Accessibilité et ergonomie

Le launcher doit intégrer les points suivants :

- `aria-live="polite"` sur le badge de recommandation ;
- cibles tactiles ≥ 48px ;
- focus visible au clavier ;
- contraste suffisant en toutes conditions ;
- navigation fonctionnelle sans JavaScript dégradé si possible ;
- contenu central lisible sans scroll sur la plupart des terminaux courants.

Le composant `<details>` est recommandé pour expliquer la logique sans encombrer la page.

---

## 13. Contraintes techniques

- zéro dépendance externe ;
- pas de framework ;
- pas de CDN ;
- fichiers séparés : `index.html`, `landing.css`, `landing.js` ;
- préchargement des deux images de fond ;
- poids léger ;
- comportement stable sur mobile portrait, mobile paysage, desktop, tablette.

Le launcher doit être **facile à maintenir** et **sans couplage fort** avec `fpaysage/` ou `fportrait/`.

---

## 14. Séquençage des tâches

1. Créer `index.html` racine comme point d’entrée unique.
2. Créer `css/landing.css`.
3. Créer `js/landing.js`.
4. Précharger `assets/cl.jpg` et `assets/cp.jpg`.
5. Implémenter la détection heuristique.
6. Implémenter la recommandation visuelle.
7. Implémenter le CTA principal vers la version recommandée.
8. Ajouter les deux accès directs explicites.
9. Tester les changements d’orientation et de largeur.
10. Vérifier accessibilité, contraste et ergonomie.

---

## 15. Critères de validation

- [ ] Le launcher s’affiche correctement sans dépendance externe.
- [ ] Le badge annonce une **version recommandée**, et non une vérité absolue.
- [ ] Le bouton principal ouvre la version recommandée.
- [ ] Les boutons secondaires ouvrent explicitement `fpaysage/` et `fportrait/`.
- [ ] La recommandation se met à jour lors d’un changement d’orientation ou de viewport.
- [ ] Le fond visuel bascule entre `cl.jpg` et `cp.jpg` sans dégrader la lisibilité.
- [ ] Aucun automatisme ne redirige l’utilisateur sans action explicite.
- [ ] Les éléments interactifs respectent un touch target ≥ 48px.
- [ ] Le contraste texte/fond est compatible WCAG AA.
- [ ] `landing.css` et `landing.js` restent chacun ≤ 150 lignes.
- [ ] Le launcher reste fonctionnel sur smartphone, tablette et ordinateur.

---

## 16. Limite assumée

Le launcher ne résout pas les enjeux de fond liés à la conversion fonctionnelle mobile du projet Croquis.  
Il ne remplace ni la refonte tactile de `fportrait`, ni la question de la parité entre les modules paysage et portrait. [file:52][file:55]

Sa fonction est plus modeste et plus juste :
- **orienter** ;
- **expliquer** ;
- **laisser choisir**.

---

*Ce contrat constitue le document de référence pour l’implémentation du launcher d’orientation racine du projet Croquis. Il est conçu pour être transmis à une IA ou à un développeur comme cadre de travail clair, compact et non ambigu. Il organise l’entrée dans le projet sans surpromettre ce que la détection technique peut réellement garantir.*