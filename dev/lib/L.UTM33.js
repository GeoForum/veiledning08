L.Projection.UTM33 = {

    ZONE: 33,
    R_MINOR: 6356752.3142,
    R_MAJOR: 6378137,
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI,

    // http://www.statkart.no/Kart/Gratis-kartdata/Cache-tjenester/
    bounds: L.bounds([-2500000, 3500000], [3045984, 9045984]),

    project: function (latlng) {
        var latRad = latlng.lat * this.DEG_TO_RAD,
            longRad = latlng.lng * this.DEG_TO_RAD,
            longOriginRad = (-183 + (6 * this.ZONE)) * this.DEG_TO_RAD,
            eccs = 1 - ((this.R_MINOR / this.R_MAJOR) * (this.R_MINOR / this.R_MAJOR)),
            k0 = 0.9996,
            eccps = eccs / (1 - eccs),
            n = this.R_MAJOR / Math.sqrt(1 - eccs * Math.sin(latRad) * Math.sin(latRad)),
            t = Math.tan(latRad) * Math.tan(latRad),
            c = eccps * Math.cos(latRad) * Math.cos(latRad),
            a = Math.cos(latRad) * (longRad - longOriginRad),
            m = this.R_MAJOR * ((1 - eccs / 4 - 3 * eccs * eccs / 64 - 5 * eccs * eccs * eccs / 256) * latRad
                - (3 * eccs / 8 + 3 * eccs * eccs / 32 + 45 * eccs * eccs * eccs / 1024) * Math.sin(2 * latRad)
                + (15 * eccs * eccs / 256 + 45 * eccs * eccs * eccs / 1024) * Math.sin(4 * latRad)
                - (35 * eccs * eccs * eccs / 3072) * Math.sin(6 * latRad)),
            x = k0 * n * (a + (1 - t + c) * a * a * a / 6 + (5 - 18 * t + t * t + 72 * c - 58 * eccps) * a * a * a * a * a / 120) + 500000.0,
            y = k0 * (m + n * Math.tan(latRad) * (a * a / 2 + (5 - t + 9 * c + 4 * c * c) * a * a * a * a / 24.0 + (61.0 - 58 * t + t * t + 600.0 * c - 330.0 * eccps) * a * a * a * a * a * a / 720));

        return new L.Point(x, y);
    },

    unproject: function (point) {
        var eccs = 1 - ((this.R_MINOR / this.R_MAJOR) * (this.R_MINOR / this.R_MAJOR)),
            e1 = (1 - Math.sqrt(1 - eccs)) / (1 + Math.sqrt(1 - eccs)),
            k0 = 0.9996,
            x = point.x - 500000,
            y = point.y,
            longOrigin = (this.ZONE - 1) * 6 - 180 + 3,
            eccps = (eccs) / (1 - eccs),
            m = y / k0,
            mu = m / (this.R_MAJOR * (1 - eccs / 4 - 3 * eccs * eccs / 64 - 5 * eccs * eccs * eccs / 256)),
            phi1Rad = (mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
            + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
            + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu)),
            n1 = this.R_MAJOR / Math.sqrt(1 - eccs * Math.sin(phi1Rad) * Math.sin(phi1Rad)),
            t1 = Math.tan(phi1Rad) * Math.tan(phi1Rad),
            c1 = eccps * Math.cos(phi1Rad) * Math.cos(phi1Rad),
            r1 = this.R_MAJOR * (1 - eccs) / Math.pow(1 - eccs * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5),
            d = x / (n1 * k0),
            lng = ((longOrigin * this.DEG_TO_RAD + ((d - (1 + 2 * t1 + c1) * d * d * d / 6
            + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * eccps + 24 * t1 * t1) * d * d * d * d * d / 120) / Math.cos(phi1Rad))) * this.RAD_TO_DEG),
            lat = ((phi1Rad - (n1 * Math.tan(phi1Rad) / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * eccps) * d * d * d * d / 24
            + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * eccps - 3 * c1 * c1) * d * d * d * d * d * d / 720)) * this.RAD_TO_DEG);

        return new L.LatLng(lat, lng);
    }
};

L.CRS.EPSG32633 = L.extend({}, L.CRS.Earth, {
    code: 'EPSG:32633',
    projection: L.Projection.UTM33,
    // http://www.statkart.no/Kart/Gratis-kartdata/Cache-tjenester/
    transformation: new L.Transformation(1, 2500000, -1, 9045984),
    scale: function (zoom) {
        return 1 / ( 21664 / Math.pow(2, zoom));
    }
});