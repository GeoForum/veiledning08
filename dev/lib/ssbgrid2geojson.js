function ssbgrid2geojson (data, options) {
    var ssbid = options.ssbid || 'ssbid',
        size =  options.size  || 1000,
        crs =   options.crs   || L.CRS.EPSG32633;

    var polygons = {
        type: 'FeatureCollection',
        features: []
    };

    var points = {
        type: 'FeatureCollection',
        features: []
    };

    data.forEach(function(d){
        var id = d[ssbid]
            x = parseInt(id.substring(0, 7)) - 2000000, // First seven digits minus false easting
            y = parseInt(id.substring(7, 14)); // Last seven digits

        polygons.features.push({
            type: 'Feature',
            id: id,
            properties: d,
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    unproject(x, y),
                    unproject(x, y + size),
                    unproject(x + size, y + size),
                    unproject(x + size, y),
                    unproject(x, y)
                ]]
            }
        });
    });

    //console.log(polygons);

    function unproject(x, y) {
        var latlng = crs.projection.unproject({x: x, y: y});
        return [latlng.lng, latlng.lat];
    }

    return polygons;
}