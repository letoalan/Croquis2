// SmartCropEngine.js - Algorithme de cadrage A4 paysage anti-déformation

export class SmartCropEngine {
    static computeCropWindow(map, vectorData, baseWidth, baseHeight) {
        const bounds = map.getBounds();
        const sw = map.latLngToContainerPoint(bounds.getSouthWest());
        const ne = map.latLngToContainerPoint(bounds.getNorthEast());

        const mapWidth = Math.abs(ne.x - sw.x);
        const mapHeight = Math.abs(sw.y - ne.y);
        const targetRatio = 297 / 210;

        let cropWidth = mapWidth;
        let cropHeight = mapWidth / targetRatio;

        if (cropHeight > mapHeight) {
            cropHeight = mapHeight;
            cropWidth = mapHeight * targetRatio;
        }

        const startX = Math.max(0, (mapWidth - cropWidth) / 2);
        const startY = Math.max(0, (mapHeight - cropHeight) / 2);

        return {
            x: Math.round(startX),
            y: Math.round(startY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight)
        };
    }
}
