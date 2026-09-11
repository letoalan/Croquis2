// LegendStateStore.js - Gestion des parties et sous-parties de la légende

export class LegendStateStore {
    constructor() {
        this.legendParts = [];
        this.geometryToPart = new Map();
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
            this.legendParts[idx].geometries.forEach(gIdx => this.geometryToPart.delete(gIdx));
            this.legendParts.splice(idx, 1);
        }
    }

    assignGeometryToPart(geomIndex, partId) {
        this.legendParts.forEach(part => {
            part.geometries = part.geometries.filter(i => i !== geomIndex);
        });
        if (partId) {
            const part = this.legendParts.find(p => p.id === partId);
            if (part && !part.geometries.includes(geomIndex)) {
                part.geometries.push(geomIndex);
                this.geometryToPart.set(geomIndex, partId);
            }
        } else {
            this.geometryToPart.delete(geomIndex);
        }
    }

    getGeometryPart(geomIndex) {
        for (const part of this.legendParts) {
            if (part.geometries.includes(geomIndex)) return part.id;
        }
        return null;
    }
}
