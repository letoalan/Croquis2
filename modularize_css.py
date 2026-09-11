import os
import re

def modularize_css_file(filepath, chunk_size=160):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    if len(lines) <= 200:
        return

    dirpath = os.path.dirname(filepath)
    base_name = os.path.basename(filepath)
    name_no_ext, ext = os.path.splitext(base_name)
    sub_dir_name = name_no_ext.lstrip('_') + '_modules'
    sub_dir_path = os.path.join(dirpath, sub_dir_name)
    os.makedirs(sub_dir_path, exist_ok=True)

    chunks = []
    current_chunk = []
    
    for line in lines:
        current_chunk.append(line)
        # Attempt to split cleanly on rule boundaries
        if len(current_chunk) >= chunk_size:
            stripped = line.strip()
            if stripped in ['}', '};', '*/'] or (stripped == '' and not any(l.rstrip().endswith('{') for l in current_chunk[-3:])):
                chunks.append(current_chunk)
                current_chunk = []
    if current_chunk:
        chunks.append(current_chunk)

    import_statements = []
    for i, chunk in enumerate(chunks, 1):
        part_name = f"part{i}.css"
        part_path = os.path.join(sub_dir_path, part_name)
        with open(part_path, 'w', encoding='utf-8') as pf:
            pf.write(f"/* Module part {i} for {base_name} */\n")
            pf.writelines(chunk)
        import_statements.append(f'@import "{sub_dir_name}/{part_name}";\n')

    # Overwrite main file with imports
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"/* Modular master stylesheet for {base_name} */\n\n")
        f.writelines(import_statements)

    print(f"Modularized {filepath} ({len(lines)} lines) -> {len(chunks)} sub-modules in {sub_dir_name}/")

css_targets = [
    'fpaysage/css/components/context-menu.css',
    'fportrait/css/components/context-menu.css',
    'fpromethean/css/components/context-menu.css',
    'fpaysage/css/components/_context-menu.css',
    'fportrait/css/components/_context-menu.css',
    'fpromethean/css/components/_context-menu.css',
    'fpaysage/css/components/legend.css',
    'fportrait/css/components/legend.css',
    'fpromethean/css/components/legend.css',
    'fpaysage/css/components/_legend.css',
    'fportrait/css/components/_legend.css',
    'fpromethean/css/components/_legend.css',
    'fpaysage/css/components/editor.css',
    'fportrait/css/components/editor.css',
    'fpromethean/css/components/editor.css',
    'fpaysage/css/components/_editor.css',
    'fportrait/css/components/_editor.css',
    'fpromethean/css/components/_editor.css',
    'fpaysage/css/vendors/leaflet.css',
    'fportrait/css/vendors/leaflet.css',
    'fpromethean/css/vendors/leaflet.css',
    'fpaysage/css/vendors/_leaflet.css',
    'fportrait/css/vendors/_leaflet.css',
    'fpromethean/css/vendors/_leaflet.css',
    'css/landing.css',
    'fpromethean/css/promethean-overrides.css'
]

for t in css_targets:
    modularize_css_file(t)

print("All CSS files processed!")
