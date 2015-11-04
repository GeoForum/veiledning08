(function (ol){

    var EPSG_CODE = 'EPSG:32633',
        ZONE = 33,
        R_MINOR = 6356752.3142,
        R_MAJOR = 6378137,
        DEG_TO_RAD = Math.PI / 180,
        RAD_TO_DEG = 180 / Math.PI;

    var projection = new ol.proj.Projection({
        code: EPSG_CODE,
        extent: [-2500000, 3500000, 3045984, 9045984], // Zoom level 0
        units: 'm'
    });

    ol.proj.addProjection(projection);

    ol.proj.addCoordinateTransforms('EPSG:4326', projection,
        function (coordinate) { // project
            var latRad = coordinate[1] * DEG_TO_RAD,
                longRad = coordinate[0] * DEG_TO_RAD,
                longOriginRad = (-183 + (6 * ZONE)) * DEG_TO_RAD,
                eccs = 1 - ((R_MINOR / R_MAJOR) * (R_MINOR / R_MAJOR)),
                k0 = 0.9996,
                eccps = eccs / (1 - eccs),
                n = R_MAJOR / Math.sqrt(1 - eccs * Math.sin(latRad) * Math.sin(latRad)),
                t = Math.tan(latRad) * Math.tan(latRad),
                c = eccps * Math.cos(latRad) * Math.cos(latRad),
                a = Math.cos(latRad) * (longRad - longOriginRad),
                m = R_MAJOR * ((1 - eccs / 4 - 3 * eccs * eccs / 64 - 5 * eccs * eccs * eccs / 256) * latRad
                    - (3 * eccs / 8 + 3 * eccs * eccs / 32 + 45 * eccs * eccs * eccs / 1024) * Math.sin(2 * latRad)
                    + (15 * eccs * eccs / 256 + 45 * eccs * eccs * eccs / 1024) * Math.sin(4 * latRad)
                    - (35 * eccs * eccs * eccs / 3072) * Math.sin(6 * latRad)),
                x = k0 * n * (a + (1 - t + c) * a * a * a / 6 + (5 - 18 * t + t * t + 72 * c - 58 * eccps) * a * a * a * a * a / 120) + 500000.0,
                y = k0 * (m + n * Math.tan(latRad) * (a * a / 2 + (5 - t + 9 * c + 4 * c * c) * a * a * a * a / 24.0 + (61.0 - 58 * t + t * t + 600.0 * c - 330.0 * eccps) * a * a * a * a * a * a / 720));

            return [x, y];
        },
        function (coordinate) { // unproject
            var eccs = 1 - ((R_MINOR / R_MAJOR) * (R_MINOR / R_MAJOR)),
                e1 = (1 - Math.sqrt(1 - eccs)) / (1 + Math.sqrt(1 - eccs)),
                k0 = 0.9996,
                x = coordinate[0] - 500000,
                y = coordinate[1],
                longOrigin = (ZONE - 1) * 6 - 180 + 3,
                eccps = (eccs) / (1 - eccs),
                m = y / k0,
                mu = m / (R_MAJOR * (1 - eccs / 4 - 3 * eccs * eccs / 64 - 5 * eccs * eccs * eccs / 256)),
                phi1Rad = (mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
                + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
                + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu)),
                n1 = R_MAJOR / Math.sqrt(1 - eccs * Math.sin(phi1Rad) * Math.sin(phi1Rad)),
                t1 = Math.tan(phi1Rad) * Math.tan(phi1Rad),
                c1 = eccps * Math.cos(phi1Rad) * Math.cos(phi1Rad),
                r1 = R_MAJOR * (1 - eccs) / Math.pow(1 - eccs * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5),
                d = x / (n1 * k0),
                lng = ((longOrigin * DEG_TO_RAD + ((d - (1 + 2 * t1 + c1) * d * d * d / 6
                + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * eccps + 24 * t1 * t1) * d * d * d * d * d / 120) / Math.cos(phi1Rad))) * RAD_TO_DEG),
                lat = ((phi1Rad - (n1 * Math.tan(phi1Rad) / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * eccps) * d * d * d * d / 24
                + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * eccps - 3 * c1 * c1) * d * d * d * d * d * d / 720)) * RAD_TO_DEG);

            return [lng, lat];
        }
    );

    return projection;

})(ol);