import os
import re
import sys

PROJECT_ROOT = os.path.abspath('.')
WIKI_ROOT = os.path.join(PROJECT_ROOT, 'wiki')

IGNORE_DIRS = {'.git', '.idea', 'wiki', 'scripts', '__pycache__'}

def get_rel_path(p, start=PROJECT_ROOT):
    return os.path.relpath(p, start).replace('\\', '/')

def analyze_file(abs_path, rel_path):
    filename = os.path.basename(abs_path)
    ext = os.path.splitext(filename)[1].lower()
    size_bytes = os.path.getsize(abs_path)
    
    info = {
        'filename': filename,
        'rel_path': rel_path.replace('\\', '/'),
        'ext': ext,
        'size': size_bytes,
        'exports': [],
        'imports': [],
        'description': '',
        'selectors': [],
        'functions': [],
        'classes': [],
        'lines_count': 0
    }
    
    if ext in ['.js', '.css', '.html', '.md']:
        try:
            with open(abs_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                lines = content.splitlines()
                info['lines_count'] = len(lines)
                
                if ext == '.js':
                    imports = re.findall(r'import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+[\'"]([^\'"]+)[\'"]', content)
                    for imp in imports:
                        src = imp[3]
                        symbols = imp[0] or imp[1] or imp[2]
                        info['imports'].append({'source': src, 'symbols': [s.strip() for s in symbols.split(',') if s.strip()]})
                    
                    classes = re.findall(r'export\s+class\s+(\w+)', content)
                    functions = re.findall(r'export\s+(?:async\s+)?function\s+(\w+)', content)
                    consts = re.findall(r'export\s+const\s+(\w+)', content)
                    info['classes'].extend(classes)
                    info['functions'].extend(functions)
                    info['exports'].extend(classes + functions + consts)
                    
                    if not info['classes']:
                        info['classes'] = re.findall(r'class\s+(\w+)', content)
                    if not info['functions']:
                        info['functions'] = re.findall(r'function\s+(\w+)\s*\(', content)[:10]

                elif ext == '.css':
                    vars_found = re.findall(r'(--[\w-]+)\s*:', content)
                    info['variables'] = list(dict.fromkeys(vars_found))[:20]
                    selectors = re.findall(r'(?:^|\})\s*([.#a-zA-Z0-9_\-\s,:>+~\[\]=]+)\s*\{', content)
                    clean_selectors = []
                    for s in selectors:
                        s_clean = s.strip().replace('\n', ' ')
                        if s_clean and not s_clean.startswith('@') and not s_clean.startswith('/*') and len(s_clean) < 60:
                            clean_selectors.append(s_clean)
                    info['selectors'] = list(dict.fromkeys(clean_selectors))[:15]

                elif ext == '.html':
                    title_m = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
                    info['html_title'] = title_m.group(1).strip() if title_m else 'Document HTML'
                    scripts = re.findall(r'<script[^>]*src=[\'"]([^\'"]+)[\'"]', content)
                    links = re.findall(r'<link[^>]*href=[\'"]([^\'"]+)[\'"]', content)
                    info['scripts'] = scripts
                    info['stylesheets'] = [l for l in links if 'css' in l]

                elif ext == '.md':
                    title_m = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                    info['md_title'] = title_m.group(1).strip() if title_m else filename

        except Exception as e:
            print(f'Error reading {abs_path}: {e}')
    
    info['purpose'] = infer_purpose(info)
    return info

def infer_purpose(info):
    fn = info['filename']
    rel = info['rel_path']
    
    if fn == 'index.html' and ('/' not in rel or rel == 'index.html'):
        return "Page d'accueil et hub de sélection des trois versions spécialisées de l'application Croquis (Paysage Desktop, Portrait Mobile, Promethean TBI)."
    if fn == 'exportpdf.md':
        return "Documentation technique approfondie détaillant le protocole d'exportation PDF, le moteur de rendu mixte (html2canvas/jsPDF), le bypass CORS et l'algorithme 'Smart Crop'."
    if fn == 'projet.md':
        return "Spécification d'architecture globale, modèle de données et guide de référence pour le projet Croquis."
    if fn == 'README.md':
        return "Fiche de présentation principale du projet, fonctionnalités majeures, prise en main et guide d'utilisation."
    
    if 'StateManager' in fn:
        return "Source de vérité unique et gestionnaire d'état réactif centralisant les géométries, sélections, styles et synchronisations."
    if 'MapManager' in fn:
        return "Pilote cartographique Leaflet & Leaflet-Geoman orchestrant les couches, fonds de carte, projection et événements de dessin."
    if 'UIManager' in fn:
        return "Gestionnaire d'interface utilisateur contrôlant les barres d'outils, menus contextuels, panneaux repliables et navigation."
    if 'GeometryManager' in fn:
        return "Orchestrateur principal des formes géométriques reliant les événements utilisateur, le moteur Leaflet et le StateManager."
    if 'GeometryHandler' in fn:
        return "Gestionnaire utilitaire de standardisation des géométries, coordonnées et conversions Leaflet vers l'état interne."
    if 'LegendManager' in fn:
        return "Moteur de rendu et synchronisation de la légende dynamique multi-niveaux (parties, sous-parties, figurés)."
    if 'LegendOrganizer' in fn:
        return "Gestionnaire de glisser-déposer (Drag & Drop) pour la réorganisation interactive de la hiérarchie de la légende."
    if 'PDFExporter' in fn:
        return "Module d'exportation PDF vectoriel/raster haute définition intégrant le cadrage Smart Crop, la capture de légende et l'échelle."
    if 'ExportImportManager' in fn:
        return "Module de sérialisation et désérialisation de l'état du projet au format JSON pour la sauvegarde et restauration."
    if 'SVGUtils' in fn:
        return "Calculateur géométrique et générateur SVG vectoriel pour les flèches dynamiques, pointes orientées et figurés complexes."
    if 'PointerRouter' in fn:
        return "Routeur d'événements tactiles spécialisé pour écrans interactifs (TBI) assurant la distinction doigt / stylet et le rejet de paume."
    if 'ContextMenuDragger' in fn:
        return "Contrôleur de déplacement et positionnement flottant du panneau d'édition de style contextuel."
    if 'ScaleOrientationManager' in fn:
        return "Gestionnaire d'affichage de l'échelle métrique et de la rose des vents sur la carte Leaflet."
    if 'TileSelectorControl' in fn or 'TileLayerManager' in fn:
        return "Gestionnaire et sélecteur interactif des fonds de carte (OpenStreetMap, Satellite, Topo, CartoDB, etc.)."
    if 'LayerGroupManager' in fn:
        return "Gestionnaire des groupes de calques Leaflet organisant la superposition des vecteurs et couches cartographiques."
    if 'EventManager' in fn or 'EventHandlers' in fn:
        return "Gestionnaire de propagation et d'écoute des événements cartographiques et interactions de dessin."
    if 'SymbolPaletteManager' in fn:
        return "Gestionnaire de la palette de symboles et figurés prédéfinis pour l'annotation cartographique."
    if 'LineControlManager' in fn or 'CurveControlManager' in fn or 'MarkerControlManager' in fn:
        return "Contrôleur spécialisé dans la manipulation, le traçage et l'ajustement des propriétés des lignes, courbes ou marqueurs."
    if fn == 'main.js':
        return "Point d'entrée JavaScript initialisant les gestionnaires, l'écoute des événements DOM et la configuration de l'application."
    if fn == 'landing.js':
        return "Script de la page d'accueil gérant les animations, sélecteurs d'environnement et redirections vers les différentes versions."
    
    if 'variables.css' in fn or '_variables.css' in fn:
        return "Définition des variables de thème CSS (couleurs, gradients, typographie, espacements et ombrages globaux)."
    if 'base.css' in fn or '_base.css' in fn:
        return "Styles de base, réinitialisation CSS (reset) et règles typographiques globales de l'application."
    if 'layout.css' in fn or '_layout.css' in fn:
        return "Organisation de la grille et du conteneur d'affichage (carte plein écran, barres latérales, disposition responsive)."
    if 'sidebar.css' in fn or '_sidebar.css' in fn:
        return "Styles des barres latérales d'outils, accordéons de fonctionnalités et conteneurs de navigation."
    if 'context-menu.css' in fn or '_context-menu.css' in fn:
        return "Styles du menu contextuel flottant d'édition de forme, palettes de couleurs et contrôles de géométrie."
    if 'legend.css' in fn or '_legend.css' in fn:
        return "Mise en page des boîtes de légende, parties, sous-parties, poignées de drag & drop et figurés associés."
    if 'map.css' in fn or '_map.css' in fn:
        return "Règles d'intégration et conteneur de la carte Leaflet, curseurs de dessin et éléments superposés."
    if 'buttons.css' in fn or '_buttons.css' in fn:
        return "Styles des boutons d'actions, barres d'outils d'icônes, états actifs et boutons d'export."
    if 'editor.css' in fn or '_editor.css' in fn:
        return "Styles du panneau éditeur de texte synchronisé et zones de saisie documentaire."
    if 'helpers.css' in fn or '_helpers.css' in fn:
        return "Classes utilitaires (visibilité, flexbox, espacements, animations et helpers graphiques)."
    if 'leaflet.css' in fn or '_leaflet.css' in fn:
        return "Surcharges de styles pour la bibliothèque Leaflet et ses composants graphiques intégrés."
    if 'promethean-overrides.css' in fn:
        return "Surcharges spécifiques d'accessibilité et de dimensionnement tactile pour l'affichage sur écrans interactifs TBI."
    if 'styles.css' in fn:
        return "Feuille de styles principale agrégeant les modules CSS ou définissant le style global de la page."
    
    if info['ext'] in ['.png', '.jpg', '.ico']:
        return f"Ressource graphique et illustration ({info['filename']}) utilisée pour l'habillage visuel ou les fonds d'écran."
    
    return f"Fichier technique ({info['filename']}) composant le module {os.path.dirname(info['rel_path'])}."

def get_wiki_dir_path(rel_dir):
    if not rel_dir or rel_dir == '.':
        return WIKI_ROOT
    return os.path.join(WIKI_ROOT, rel_dir.replace('/', os.sep))

def get_rel_link(from_wiki_file, to_target_file):
    rel = os.path.relpath(to_target_file, os.path.dirname(from_wiki_file)).replace('\\', '/')
    return rel

def generate_central_index(all_files, dir_to_files, dir_to_subdirs):
    index_path = os.path.join(WIKI_ROOT, 'index.md')
    rel_projet = get_rel_link(os.path.join('wiki', 'index.md'), 'projet.md')
    rel_exportpdf = get_rel_link(os.path.join('wiki', 'index.md'), 'exportpdf.md')
    rel_readme = get_rel_link(os.path.join('wiki', 'index.md'), 'README.md')
    
    lines = [
        "# 📚 Wiki Central – Documentation de l'Application Croquis",
        "",
        "> Bienvenue sur le Wiki complet de l'application **Croquis**. Ce portail documente de façon exhaustive l'architecture logicielle, les 70 répertoires et les 162 fichiers composants le projet.",
        "",
        "## 🔗 Liens Fondateurs du Projet",
        f"- 🗺️ **[Spécification Globale d'Architecture (projet.md)]({rel_projet})**",
        f"- 📄 **[Dossier Technique Export PDF & Smart Crop (exportpdf.md)]({rel_exportpdf})**",
        f"- 📖 **[Guide Général Utilisateur (README.md)]({rel_readme})**",
        "",
        "---",
        "",
        "## 🏛️ Déclinaisons & Modules Majeurs de l'Application",
        "",
        "Le projet Croquis est partitionné en trois éditions optimisées selon le matériel cible, partageant un socle architectural commun :",
        "",
        "| Module / Édition | Cible d'utilisation | Spécificités Techniques | Documentation Wiki |",
        "| :--- | :--- | :--- | :--- |",
        f"| **`fpaysage/`** | Ordinateurs Desktop / Écrans larges | Ergonomie plein écran, palettes latérales, export A4 paysage | [Explorer fpaysage](fpaysage/index.md) |",
        f"| **`fportrait/`** | Mobiles & Tablettes verticales | Navigation tactile compacte, panneaux modaux repliables | [Explorer fportrait](fportrait/index.md) |",
        f"| **`fpromethean/`** | Tableaux Blancs Interactifs (TBI) | Détection stylet vs doigt (`PointerRouter`), rejet de paume | [Explorer fpromethean](fpromethean/index.md) |",
        f"| **Racine & Communs** | Hub d'accès et landing page | Point d'entrée `index.html`, styles globaux, scripts et assets | [Explorer Fichiers Communs](#-fichiers-à-la-racine) |",
        "",
        "---",
        "",
        "## 📁 Sommaire de l'Arborescence du Projet",
        "",
        "### 1. Version Paysage (`fpaysage/`)",
        "- **[Styles CSS (fpaysage/css)](fpaysage/css/index.md)** : [base](fpaysage/css/base/index.md), [components](fpaysage/css/components/index.md), [layout](fpaysage/css/layout/index.md), [utils](fpaysage/css/utils/index.md), [vendors](fpaysage/css/vendors/index.md)",
        "- **[JavaScript (fpaysage/js)](fpaysage/js/index.md)** : [main.js](fpaysage/js/main.js.md) et [modules](fpaysage/js/modules/index.md)",
        "  - [Modules Cartographie (mapping)](fpaysage/js/modules/mapping/index.md) : [controls](fpaysage/js/modules/mapping/controls/index.md), [events](fpaysage/js/modules/mapping/events/index.md), [geometry](fpaysage/js/modules/mapping/geometry/index.md), [io](fpaysage/js/modules/mapping/io/index.md), [layers](fpaysage/js/modules/mapping/layers/index.md), [legend](fpaysage/js/modules/mapping/legend/index.md), [lines](fpaysage/js/modules/mapping/lines/index.md), [markers](fpaysage/js/modules/mapping/markers/index.md), [utils](fpaysage/js/modules/mapping/utils/index.md)",
        "  - [Modules UI & Utils](fpaysage/js/modules/ui/index.md)",
        "",
        "### 2. Version Portrait (`fportrait/`)",
        "- **[Styles CSS (fportrait/css)](fportrait/css/index.md)** : [base](fportrait/css/base/index.md), [components](fportrait/css/components/index.md), [layout](fportrait/css/layout/index.md), [utils](fportrait/css/utils/index.md), [vendors](fportrait/css/vendors/index.md)",
        "- **[JavaScript (fportrait/js)](fportrait/js/index.md)** : [main.js](fportrait/js/main.js.md) et [modules](fportrait/js/modules/index.md)",
        "  - [Modules Cartographie (mapping)](fportrait/js/modules/mapping/index.md) : [controls](fportrait/js/modules/mapping/controls/index.md), [events](fportrait/js/modules/mapping/events/index.md), [geometry](fportrait/js/modules/mapping/geometry/index.md), [io](fportrait/js/modules/mapping/io/index.md), [layers](fportrait/js/modules/mapping/layers/index.md), [legend](fportrait/js/modules/mapping/legend/index.md), [lines](fportrait/js/modules/mapping/lines/index.md), [markers](fportrait/js/modules/mapping/markers/index.md), [utils](fportrait/js/modules/mapping/utils/index.md)",
        "  - [Modules UI & Utils](fportrait/js/modules/ui/index.md)",
        "",
        "### 3. Version TBI / Promethean (`fpromethean/`)",
        "- **[Styles CSS (fpromethean/css)](fpromethean/css/index.md)** : [base](fpromethean/css/base/index.md), [components](fpromethean/css/components/index.md), [layout](fpromethean/css/layout/index.md), [utils](fpromethean/css/utils/index.md), [vendors](fpromethean/css/vendors/index.md)",
        "- **[JavaScript (fpromethean/js)](fpromethean/js/index.md)** : [main.js](fpromethean/js/main.js.md) et [modules](fpromethean/js/modules/index.md)",
        "  - Spécialisé TBI : [PointerRouter.js](fpromethean/js/modules/PointerRouter.js.md)",
        "  - [Modules Cartographie (mapping)](fpromethean/js/modules/mapping/index.md) : [controls](fpromethean/js/modules/mapping/controls/index.md), [events](fpromethean/js/modules/mapping/events/index.md), [geometry](fpromethean/js/modules/mapping/geometry/index.md), [io](fpromethean/js/modules/mapping/io/index.md), [layers](fpromethean/js/modules/mapping/layers/index.md), [legend](fpromethean/js/modules/mapping/legend/index.md), [lines](fpromethean/js/modules/mapping/lines/index.md), [markers](fpromethean/js/modules/mapping/markers/index.md), [utils](fpromethean/js/modules/mapping/utils/index.md)",
        "  - [Modules UI & Utils](fpromethean/js/modules/ui/index.md)",
        "",
        "### 4. Ressources Communes & Assets",
        "- **[Dossier Assets (images, captures)](assets/index.md)**",
        "- **[Dossier CSS racine](css/index.md)**",
        "- **[Dossier JS racine](js/index.md)**",
        "",
        "---",
        "",
        "## 📄 Fichiers à la Racine",
        "| Fichier | Description | Documentation | Code Source |",
        "| :--- | :--- | :--- | :--- |"
    ]
    
    root_files = dir_to_files.get('', [])
    for rf in root_files:
        fn = rf['filename']
        desc = rf['purpose']
        doc_rel = f"{fn}.md"
        src_rel = get_rel_link(os.path.join('wiki', 'index.md'), rf['rel_path'])
        lines.append(f"| `{fn}` | {desc} | [Fiche Doc]({doc_rel}) | [Source]({src_rel}) |")
        
    lines.extend([
        "",
        "---",
        "",
        "## 📊 Statistiques de la Documentation",
        f"- **Nombre total de répertoires documentés** : {len(dir_to_files)}",
        f"- **Nombre total de fichiers documentés** : {len(all_files)}",
        "- **Interconnexion** : 100% interconnecté (Fichier ↔ Dossier ↔ Projet)",
        "",
        "*(Documentation générée automatiquement pour le projet Croquis)*"
    ])
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def infer_dir_role(rel_dir):
    if not rel_dir:
        return "Répertoire racine du projet Croquis. Il abrite les points d'entrée principaux (`index.html`), les modules d'accueil, la documentation maîtresse et les répertoires des déclinaisons."
    if rel_dir.startswith('fpaysage'):
        if 'css' in rel_dir:
            return "Composants de styles et mise en page spécifiques à la déclinaison classique Desktop (Paysage)."
        if 'js/modules/mapping' in rel_dir:
            return "Modules cartographiques de la version Paysage : contrôles Leaflet, moteurs de dessin vectoriel, géométrie, légende et exports."
        if 'js/modules' in rel_dir:
            return "Cœur applicatif de la version Paysage : gestionnaires d'état (`StateManager`), carte (`MapManager`), interface (`UIManager`)."
        if 'js' in rel_dir:
            return "Scripts d'orchestration JavaScript de la version Paysage."
        return "Version de l'application adaptée aux écrans larges et ordinateurs de bureau (Desktop Landscape)."
    if rel_dir.startswith('fportrait'):
        if 'css' in rel_dir:
            return "Feuilles de styles optimisées pour l'ergonomie mobile, tablettes et écrans verticaux."
        if 'js/modules/mapping' in rel_dir:
            return "Modules de cartographie adaptés aux interactions tactiles et contraintes d'affichage vertical."
        if 'js/modules' in rel_dir:
            return "Gestionnaires d'état et d'interface pour le format mobile/portrait."
        return "Version de l'application adaptée aux terminaux mobiles et tablettes (format Portrait)."
    if rel_dir.startswith('fpromethean'):
        if 'css' in rel_dir:
            return "Feuilles de styles avec cibles tactiles agrandies et surcharges pour écrans tactiles interactifs (TBI Promethean)."
        if 'js/modules/mapping' in rel_dir:
            return "Modules cartographiques enrichis de la gestion des interactions hybrides (stylet, doigt, paume)."
        if 'js/modules' in rel_dir:
            return "Gestionnaires d'état et pilotes d'interface spécialisés pour tableaux interactifs (TBI)."
        return "Version de l'application spécifiquement conçue pour les tableaux blancs interactifs (TBI) et écrans tactiles géants."
    if rel_dir == 'assets':
        return "Ressources graphiques, icônes, illustrations et fonds de page du projet."
    if rel_dir == 'css':
        return "Styles transverses et feuilles de style de la page d'accueil."
    if rel_dir == 'js':
        return "Scripts transverses et interactions de la page d'accueil (landing page)."
    return f"Module technique et organisationnel `{rel_dir}`."

def generate_dir_index(rel_dir, files, subdirs, all_dirs):
    target_dir = get_wiki_dir_path(rel_dir)
    os.makedirs(target_dir, exist_ok=True)
    index_file = os.path.join(target_dir, 'index.md')
    
    wiki_rel_index = os.path.join('wiki', rel_dir, 'index.md') if rel_dir else os.path.join('wiki', 'index.md')
    link_projet = get_rel_link(wiki_rel_index, 'projet.md')
    link_wiki_root = get_rel_link(wiki_rel_index, os.path.join('wiki', 'index.md'))
    
    parent_rel_dir = os.path.dirname(rel_dir).replace('\\', '/') if rel_dir else None
    if parent_rel_dir is not None:
        if parent_rel_dir == '':
            parent_link = get_rel_link(wiki_rel_index, os.path.join('wiki', 'index.md'))
            parent_name = "Racine du Wiki"
        else:
            parent_link = get_rel_link(wiki_rel_index, os.path.join('wiki', parent_rel_dir, 'index.md'))
            parent_name = parent_rel_dir
    else:
        parent_link = None
        parent_name = None

    title = f"📁 Dossier : `{rel_dir if rel_dir else 'Racine du Projet'}`"
    
    lines = [
        f"# {title}",
        "",
        "**Fil d'Ariane :** " + (f"[🏠 Wiki Central]({link_wiki_root}) / " if rel_dir else "") + (f"[Dossier Parent ({parent_name})]({parent_link}) / " if parent_link else "") + f"`{rel_dir if rel_dir else 'Racine'}`",
        "",
        f"> **Interconnexions globales :** [🗺️ Projet Croquis (projet.md)]({link_projet}) | [📚 Wiki Central]({link_wiki_root})",
        "",
        "---",
        "",
        "## 🎯 Rôle et Responsabilité du Dossier",
        ""
    ]
    
    lines.append(infer_dir_role(rel_dir))
    lines.extend([
        "",
        "---",
        "",
        "## 📄 Fichiers Contenus dans ce Dossier",
        "",
        "| Nom du Fichier | Taille | Rôle & Utilité | Documentation Dédiée | Code Source |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])
    
    if not files:
        lines.append("| *(Aucun fichier direct)* | - | - | - | - |")
    else:
        for f in files:
            fn = f['filename']
            kb = f"{round(f['size'] / 1024, 1)} KB" if f['size'] > 1024 else f"{f['size']} B"
            purpose = f['purpose']
            doc_link = f"{fn}.md"
            source_link = get_rel_link(wiki_rel_index, f['rel_path'])
            lines.append(f"| `{fn}` | {kb} | {purpose} | [Consulter la fiche]({doc_link}) | [Code Source]({source_link}) |")
            
    lines.extend([
        "",
        "---",
        "",
        "## 📂 Sous-Dossiers",
        ""
    ])
    
    if not subdirs:
        lines.append("*Ce dossier ne contient aucun sous-dossier direct.*")
    else:
        lines.append("| Sous-Dossier | Description | Lien Wiki |")
        lines.append("| :--- | :--- | :--- |")
        for sd in sorted(subdirs):
            sd_name = os.path.basename(sd)
            sd_wiki_rel = get_rel_link(wiki_rel_index, os.path.join('wiki', sd, 'index.md'))
            sd_role = infer_dir_role(sd).split('\n')[0].replace('**', '').replace('>', '').strip()
            lines.append(f"| `/{sd_name}` | {sd_role} | [Accéder au dossier ({sd_name})]({sd_wiki_rel}) |")

    lines.extend([
        "",
        "---",
        "",
        "### 🔗 Navigation Rapide",
        f"- [Retour au dossier parent]({parent_link if parent_link else link_wiki_root})",
        f"- [Retour au Wiki Central]({link_wiki_root})",
        f"- [Documentation Technique Globale (projet.md)]({link_projet})"
    ])
    
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def generate_file_doc(info):
    rel_p = info['rel_path']
    fn = info['filename']
    rel_dir = os.path.dirname(rel_p).replace('\\', '/')
    
    target_dir = get_wiki_dir_path(rel_dir)
    os.makedirs(target_dir, exist_ok=True)
    doc_path = os.path.join(target_dir, f"{fn}.md")
    
    wiki_rel_file = os.path.join('wiki', rel_dir, f"{fn}.md") if rel_dir else os.path.join('wiki', f"{fn}.md")
    dir_index_rel = get_rel_link(wiki_rel_file, os.path.join('wiki', rel_dir, 'index.md') if rel_dir else os.path.join('wiki', 'index.md'))
    wiki_root_rel = get_rel_link(wiki_rel_file, os.path.join('wiki', 'index.md'))
    projet_rel = get_rel_link(wiki_rel_file, 'projet.md')
    source_rel = get_rel_link(wiki_rel_file, rel_p)
    
    dir_name = rel_dir if rel_dir else "Racine du projet"
    
    lines = [
        f"# 📄 Fiche Documentaire : `{fn}`",
        "",
        f"**Fil d'Ariane :** [🏠 Wiki Central]({wiki_root_rel}) / [📁 Dossier {dir_name}]({dir_index_rel}) / `{fn}`",
        "",
        "> **Interconnexions :**",
        f"> - **Dossier Parent :** [{dir_name}]({dir_index_rel})",
        f"> - **Documentation Technique Globale :** [🗺️ projet.md]({projet_rel})",
        f"> - **Portail Wiki :** [📚 Wiki Central]({wiki_root_rel})",
        f"> - **Code Source Réel :** [💻 Voir `{fn}`]({source_rel})",
        "",
        "---",
        "",
        "## 1. Vue d'Ensemble et Rôle",
        f"**Description fonctionnelle :**  ",
        f"{info['purpose']}",
        "",
        "### Métadonnées Techniques",
        f"- **Emplacement relatif :** `{info['rel_path']}`",
        f"- **Type de fichier :** `{info['ext']}`",
        f"- **Poids du fichier :** {round(info['size'] / 1024, 2)} Ko ({info['size']} octets)",
    ]
    
    if info['lines_count']:
        lines.append(f"- **Nombre de lignes :** {info['lines_count']} lignes")
    lines.append("")
    
    if info['ext'] == '.js':
        lines.extend([
            "## 2. Architecture & Analyse du Code",
            ""
        ])
        if info['classes']:
            lines.append("### Classes Définies")
            for c in info['classes']:
                lines.append(f"- `class {c}` : Cœur du composant responsable de la logique métier associée.")
            lines.append("")
            
        if info['exports']:
            lines.append("### Éléments Exportés")
            for exp in info['exports']:
                lines.append(f"- `{exp}`")
            lines.append("")
            
        if info['imports']:
            lines.append("### Dépendances et Modules Importés")
            lines.append("| Module Importé | Symboles Importés |")
            lines.append("| :--- | :--- |")
            for imp in info['imports']:
                src = imp['source']
                syms = ', '.join([f"`{s}`" for s in imp['symbols']]) if imp['symbols'] else '* (tout)'
                lines.append(f"| `{src}` | {syms} |")
            lines.append("")
            
        if info['functions'] and not info['classes']:
            lines.append("### Fonctions Clés Définies")
            for f in info['functions']:
                lines.append(f"- `function {f}()`")
            lines.append("")

        lines.extend([
            "## 3. Intégration dans le Cycle de Vie du Projet",
            "Ce fichier s'inscrit dans la chaîne réactive de l'application Croquis :",
            "1. **Initialisation** : Instancié ou invoqué lors du démarrage ou de l'interaction utilisateur.",
            "2. **Communication d'état** : Échange avec le `StateManager` et les orchestrateurs (`MapManager`, `UIManager`).",
            "3. **Rendu** : Traduit les interactions de dessin ou de configuration sur la carte et la légende.",
            ""
        ])

    elif info['ext'] == '.css':
        lines.extend([
            "## 2. Analyse des Styles et Sélecteurs",
            ""
        ])
        if info.get('variables'):
            lines.append("### Variables CSS Déclarées")
            for v in info['variables']:
                lines.append(f"- `{v}`")
            lines.append("")
            
        if info.get('selectors'):
            lines.append("### Sélecteurs CSS Majeurs")
            for s in info['selectors']:
                lines.append(f"- `{s}`")
            lines.append("")
            
        lines.extend([
            "## 3. Rôle dans la Charte Graphique",
            "Assure l'ergonomie, la cohérence visuelle et l'adaptation responsive selon le profil de l'édition (desktop, mobile ou TBI).",
            ""
        ])

    elif info['ext'] == '.html':
        lines.extend([
            "## 2. Structure du Document HTML",
            f"- **Titre du document (`<title>`) :** {info.get('html_title', 'Non spécifié')}",
            ""
        ])
        if info.get('stylesheets'):
            lines.append("### Feuilles de Styles Liées")
            for css_link in info['stylesheets']:
                lines.append(f"- `{css_link}`")
            lines.append("")
        if info.get('scripts'):
            lines.append("### Scripts JavaScript Inclus")
            for js_link in info['scripts']:
                lines.append(f"- `{js_link}`")
            lines.append("")

    elif info['ext'] == '.md':
        lines.extend([
            "## 2. Contenu Documentaire",
            f"- **Titre principal :** {info.get('md_title', fn)}",
            "Ce document fournit des spécifications, guides d'utilisation ou méthodologies pour les développeurs et utilisateurs.",
            ""
        ])

    elif info['ext'] in ['.png', '.jpg', '.ico']:
        lines.extend([
            "## 2. Caractéristiques de l'Asset Graphique",
            "Cet élément graphique est utilisé pour l'habillage visuel de l'interface, les fonds d'illustration ou la favicon de l'application.",
            ""
        ])

    lines.extend([
        "---",
        "",
        "## 4. Liens et Interconnexions du Wiki",
        f"- [📁 Consulter l'index du dossier ({dir_name})]({dir_index_rel})",
        f"- [🗺️ Consulter la documentation d'architecture globale (projet.md)]({projet_rel})",
        f"- [📚 Revenir à l'accueil du Wiki Central]({wiki_root_rel})",
        f"- [💻 Ouvrir le code source ({fn})]({source_rel})"
    ])
    
    with open(doc_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def build_wiki():
    print("Collecting files and directories...")
    all_files_info = []
    dir_to_files = {}
    dir_to_subdirs = {}
    
    for root, dnames, fnames in os.walk(PROJECT_ROOT):
        dnames[:] = [d for d in dnames if d not in IGNORE_DIRS]
        rel_dir = os.path.relpath(root, PROJECT_ROOT).replace('\\', '/')
        if rel_dir == '.':
            rel_dir = ''
        
        dir_to_files[rel_dir] = []
        dir_to_subdirs[rel_dir] = []
        
        for f in fnames:
            abs_p = os.path.join(root, f)
            rel_p = os.path.relpath(abs_p, PROJECT_ROOT).replace('\\', '/')
            info = analyze_file(abs_p, rel_p)
            all_files_info.append(info)
            dir_to_files[rel_dir].append(info)
    
    all_dirs = list(dir_to_files.keys())
    for d in all_dirs:
        if d == '':
            continue
        parent = os.path.dirname(d).replace('\\', '/')
        if parent in dir_to_subdirs:
            dir_to_subdirs[parent].append(d)
        else:
            dir_to_subdirs[''].append(d)
            
    print(f"Total files: {len(all_files_info)}, Total directories: {len(all_dirs)}")
    
    os.makedirs(WIKI_ROOT, exist_ok=True)
    
    # 1. Central Wiki Index
    generate_central_index(all_files_info, dir_to_files, dir_to_subdirs)
    
    # 2. Directory Indices
    for d, files in dir_to_files.items():
        generate_dir_index(d, files, dir_to_subdirs.get(d, []), all_dirs)
        
    # 3. File Docs
    for info in all_files_info:
        generate_file_doc(info)
        
    print("Wiki generation complete!")

if __name__ == '__main__':
    build_wiki()
