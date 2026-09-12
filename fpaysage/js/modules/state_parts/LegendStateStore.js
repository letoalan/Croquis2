// LegendStateStore.js - Gestion des parties et sous-parties de la légende

export class LegendStateStore {
    constructor() {
        this.legendParts = [];
        this.geometryToPart = new Map(); // geomIndex → partId or subPartId
    }

    addPart(title = 'Nouvelle partie') {
        const id = `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        this.legendParts.push({ id, title, geometries: [], subParts: [] });
        return id;
    }

    updatePartTitle(partId, newTitle) {
        const part = this.legendParts.find(p => p.id === partId);
        if (part) part.title = newTitle;
    }

    deletePart(partId) {
        const idx = this.legendParts.findIndex(p => p.id === partId);
        if (idx !== -1) {
            const part = this.legendParts[idx];
            part.geometries.forEach(gIdx => this.geometryToPart.delete(gIdx));
            (part.subParts || []).forEach(sub => {
                sub.geometries.forEach(gIdx => this.geometryToPart.delete(gIdx));
            });
            this.legendParts.splice(idx, 1);
        }
    }

    addSubPart(partId, title = 'Nouvelle sous-partie') {
        const part = this.legendParts.find(p => p.id === partId);
        if (!part) return null;
        const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        if (!part.subParts) part.subParts = [];
        part.subParts.push({ id, title, geometries: [] });
        return id;
    }

    updateSubPartTitle(subPartId, newTitle) {
        for (const part of this.legendParts) {
            const sub = (part.subParts || []).find(s => s.id === subPartId);
            if (sub) { sub.title = newTitle; return; }
        }
    }

    deleteSubPart(subPartId) {
        for (const part of this.legendParts) {
            const idx = (part.subParts || []).findIndex(s => s.id === subPartId);
            if (idx !== -1) {
                part.subParts[idx].geometries.forEach(gIdx => this.geometryToPart.delete(gIdx));
                part.subParts.splice(idx, 1);
                return;
            }
        }
    }

    assignGeometryToPart(geomIndex, partId) {
        // Retirer de toute partie ou sous-partie
        this.legendParts.forEach(part => {
            part.geometries = part.geometries.filter(i => i !== geomIndex);
            (part.subParts || []).forEach(sub => {
                sub.geometries = sub.geometries.filter(i => i !== geomIndex);
            });
        });
        if (partId) {
            // Chercher dans les parties principales
            let target = this.legendParts.find(p => p.id === partId);
            if (target && !target.geometries.includes(geomIndex)) {
                target.geometries.push(geomIndex);
                this.geometryToPart.set(geomIndex, partId);
                return;
            }
            // Chercher dans les sous-parties
            for (const part of this.legendParts) {
                const sub = (part.subParts || []).find(s => s.id === partId);
                if (sub && !sub.geometries.includes(geomIndex)) {
                    sub.geometries.push(geomIndex);
                    this.geometryToPart.set(geomIndex, partId);
                    return;
                }
            }
        } else {
            this.geometryToPart.delete(geomIndex);
        }
    }

    getGeometryPart(geomIndex) {
        for (const part of this.legendParts) {
            if (part.geometries.includes(geomIndex)) return part.id;
            for (const sub of (part.subParts || [])) {
                if (sub.geometries.includes(geomIndex)) return sub.id;
            }
        }
        return null;
    }
}
