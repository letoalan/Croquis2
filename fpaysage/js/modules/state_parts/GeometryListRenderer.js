// GeometryListRenderer.js - Rendu du panneau latéral listant les géométries

export class GeometryListRenderer {
    static render(geometries, selectedIndex, onSelect, onDelete, onDuplicate) {
        const list = document.getElementById('geometryList');
        if (!list) return;
        list.innerHTML = '';

        geometries.forEach((geom, idx) => {
            const item = document.createElement('div');
            item.className = `list-item ${selectedIndex === idx ? 'selected' : ''}`;

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = geom.name || `Figuré ${idx + 1}`;
            nameInput.onclick = (e) => e.stopPropagation();
            nameInput.onchange = () => { geom.name = nameInput.value; };

            const actions = document.createElement('div');
            actions.className = 'item-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary';
            editBtn.textContent = '✏️';
            editBtn.title = 'Éditer';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                onSelect(idx);
            };

            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn btn-sm btn-outline-secondary';
            copyBtn.textContent = '📋';
            copyBtn.title = 'Tamponner (dupliquer en continu)';
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                onDuplicate?.(idx);
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-outline-danger';
            delBtn.textContent = '🗑️';
            delBtn.title = 'Supprimer toutes les copies';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Supprimer ce figuré et toutes ses copies ?')) {
                    onDelete(idx);
                }
            };

            actions.appendChild(editBtn);
            actions.appendChild(copyBtn);
            actions.appendChild(delBtn);
            item.appendChild(nameInput);
            item.appendChild(actions);

            item.onclick = () => onSelect(idx);
            list.appendChild(item);
        });
    }
}
