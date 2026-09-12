// StateSerializer.js - Sérialisation JSON de l'état applicatif complet avec support multi-instances

export class StateSerializer {
    static serialize(stateManager, mapManager) {
        const center = mapManager.map.getCenter();
        const bounds = mapManager.map.getBounds();
        const tileType = mapManager.tileLayerManager?.getCurrentTileType?.() || 'osm';

        const geometries = stateManager.geometries.map((geom, idx) => ({
            id: geom.id || `geom_${idx}`,
            type: geom.type,
            name: geom.name,
            coordinates: geom.coordinates,
            coordinatesList: geom.coordinatesList || [geom.coordinates],
            color: geom.color,
            lineColor: geom.lineColor,
            opacity: geom.opacity,
            lineDash: geom.lineDash,
            lineWeight: geom.lineWeight,
            markerSize: geom.markerSize,
            arrowType: geom.arrowType,
            partId: stateManager.getGeometryPart?.(idx) ?? null
        }));

        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            mapTitle: stateManager.mapTitle || '',
            mapState: {
                center: { lat: center.lat, lng: center.lng },
                zoom: mapManager.map.getZoom(),
                bounds: bounds,
                tileLayer: tileType
            },
            legendParts: stateManager.legendParts || [],
            geometries: geometries
        };
    }
}
