// GeometryDuplicator.js - Instanciation et duplication de calques Leaflet pour multi-instances
import { SVGUtils } from '../utils/SVGUtils.js';

export class GeometryDuplicator {
    static _offsetCoords(coords, offset) {
        if (!coords) return coords;
        if (Array.isArray(coords)) {
            if (coords.length > 0 && Array.isArray(coords[0])) {
                return coords.map(c => GeometryDuplicator._offsetCoords(c, offset));
            }
            return coords.map(pt => ({
                lat: (pt.lat !== undefined ? pt.lat : pt[0]) + offset.lat,
                lng: (pt.lng !== undefined ? pt.lng : pt[1]) + offset.lng
            }));
        }
        if (coords.lat !== undefined && coords.lng !== undefined) {
            return { lat: coords.lat + offset.lat, lng: coords.lng + offset.lng };
        }
        return coords;
    }

    static _getCentroid(coords) {
        if (!coords) return null;
        if (coords.lat !== undefined && coords.lng !== undefined) return coords;
        if (Array.isArray(coords) && coords.length > 0) {
            let pts = coords;
            if (Array.isArray(coords[0])) pts = coords[0];
            let sumLat = 0, sumLng = 0;
            pts.forEach(p => {
                sumLat += (p.lat !== undefined ? p.lat : p[0]);
                sumLng += (p.lng !== undefined ? p.lng : p[1]);
            });
            return { lat: sumLat / pts.length, lng: sumLng / pts.length };
        }
        return null;
    }

    static createLayerInstance(originalGeom, latlng, map, onClick) {
        if (!originalGeom || !map || !latlng) return null;

        const type = originalGeom.type;
        let newCoords = latlng;
        if (type === 'Polygon' || type === 'Rectangle' || type === 'Polyline') {
            const centroid = GeometryDuplicator._getCentroid(originalGeom.coordinates);
            if (centroid) {
                const offset = { lat: latlng.lat - centroid.lat, lng: latlng.lng - centroid.lng };
                newCoords = GeometryDuplicator._offsetCoords(originalGeom.coordinates, offset);
            }
        }

        let newLayer = null;
        let dashArray = null;
        if (originalGeom.lineDash === 'dashed') dashArray = '6, 6';
        else if (originalGeom.lineDash === 'dotted') dashArray = '2, 6';

        if (type.startsWith('Marker_') || type === 'Marker') {
            const markerType = originalGeom.markerType || (type.startsWith('Marker_') ? type.replace('Marker_', '') : 'circle');
            newLayer = SVGUtils.createMarkerSVG(markerType, newCoords, originalGeom);
            if (newLayer) {
                newLayer._markerType = markerType;
                newLayer.originalOptions = { ...originalGeom };
            }
        } else if (type === 'Polygon' || type === 'Rectangle') {
            newLayer = L.polygon(newCoords, {
                fillColor: originalGeom.color,
                color: originalGeom.lineColor,
                fillOpacity: originalGeom.opacity,
                opacity: originalGeom.opacity,
                weight: originalGeom.lineWeight,
                dashArray: dashArray,
                bubblingMouseEvents: true
            });
        } else if (type === 'Polyline') {
            newLayer = L.polyline(newCoords, {
                color: originalGeom.color,
                opacity: originalGeom.opacity,
                weight: originalGeom.lineWeight,
                dashArray: dashArray
            });
            if (originalGeom.arrowType) {
                newLayer._arrowType = originalGeom.arrowType;
                SVGUtils.addArrowheadsToPolylineSVG(newLayer, originalGeom.arrowType);
            }
        } else if (type === 'Circle' || type === 'CircleMarker') {
            newLayer = L.circleMarker(newCoords, {
                radius: originalGeom.radius || (originalGeom.coordinates?.radius ? originalGeom.coordinates.radius / 1000 : 10),
                fillColor: originalGeom.color,
                color: originalGeom.lineColor,
                fillOpacity: originalGeom.opacity,
                opacity: originalGeom.opacity,
                weight: originalGeom.lineWeight,
                dashArray: dashArray,
                bubblingMouseEvents: true
            });
        }

        if (!newLayer) return null;
        newLayer.addTo(map);

        if (onClick && newLayer.on) {
            newLayer.on('click', onClick);
        }

        return { layer: newLayer, coordinates: newCoords };
    }
}
