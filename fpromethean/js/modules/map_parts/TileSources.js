// TileSources.js - Définitions des couches et fournisseurs de tuiles cartographiques

export const TILE_SOURCES = {
    // ========================
    // 🌍 MODERNES STANDARDS
    // ========================
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    cartodb: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO'
    },
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO'
    },
    voyager: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Satellite'
    },
    hybrid: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Satellite + Labels',
        labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
    },
    streets: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Streets'
    },

    // ========================
    // ⛰️ TERRAIN & RELIEF
    // ========================
    topo: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Topo'
    },
    openTopo: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap'
    },
    terrain: {
        url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
        attribution: '© Stadia Maps / Stamen Terrain'
    },
    watercolor: {
        url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
        attribution: '© Stadia Maps / Stamen Watercolor'
    },

    // ========================
    // 🗞️ HISTORIQUES / VINTAGE
    // ========================
    toner: {
        url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
        attribution: '© Stadia Maps / Stamen Toner'
    },
    tonerLite: {
        url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png',
        attribution: '© Stadia Maps / Stamen Toner Lite'
    },
    natGeo: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© National Geographic / Esri'
    },
    grayCanvas: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Gray Canvas'
    },
    positron: {
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO Positron'
    },
    humanitarian: {
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '© Humanitarian OpenStreetMap Team'
    },

    // ========================
    // 🇫🇷 FRANCE
    // ========================
    osmFrance: {
        url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap France'
    },
    planIgn: {
        url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
        attribution: '© IGN Plan'
    },
    scanExpress: {
        url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
        attribution: '© IGN Cartes Topo'
    },
    ignOrtho: {
        url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
        attribution: '© IGN Ortho'
    },

    // ========================
    // 🌿 ALTERNATIVES LIBRES
    // ========================
    wikipediaMap: {
        url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
        attribution: '© Wikimedia Maps'
    },
    openHikingMap: {
        url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
        attribution: '© Waymarked Trails'
    },
    openMapsFrTopo: {
        url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        attribution: '© OpenMaps FR Topo'
    }
};
