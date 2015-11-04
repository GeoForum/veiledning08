var gridSize = 100,
    epsgCode = 'EPSG:32633', // UTM 33N
    projection = ol.proj.get(epsgCode),
    projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [];

for (var z = 0; z <= 13; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = epsgCode + ':' + z;
}

var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            title: 'Norges grunnkart',
            source: new ol.source.WMTS({
                url: 'http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?',
                layer: 'norges_grunnkart_graatone',
                matrixSet: epsgCode,
                format: 'image/png',
                projection: projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projection.getExtent()),
                    resolutions: resolutions,
                    matrixIds: matrixIds
                }),
                attributions: [new ol.Attribution({
                    html: '<a href="http://kartverket.no/">Kartverket</a>'
                })]
            })
        })
    ],
    view: new ol.View({
        projection: projection,
        center: [262985, 6651604],
        zoom: 11,
        minZoom: 8,
        maxZoom: 13
    })
});

// Column separator used in dataset from SSB
var csv = d3.dsv(' ', 'text/plain');

// Read and convert data to JavaScript array
csv('data/Oslo_bef_100m_2015.csv').get(function(error, data) {

    // Convert to GeoJSON
    var geojson = ssbgrid2geojson(data, gridSize, 'rute_100m');

    // Create vector grid from GeoJSON
    var grid = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(geojson),
        attributions: [new ol.Attribution({
            html: '<a href="http://ssb.no/">SSB</a>'
        })]
    });

    // Create layer form vector grid and style function
    var gridLayer = new ol.layer.Vector({
        source: grid
    });

    // Add grid layer to map
    map.addLayer(gridLayer);
});

// Convert SSBgrid data to GeoJSON
function ssbgrid2geojson (data, size, ssbid) {
    var points = {
        type: 'FeatureCollection',
        features: []
    };

    data.forEach(function(d){
        var id = d[ssbid],
            x = parseInt(id.substring(0, 7)) - 2000000, // First seven digits minus false easting
            y = parseInt(id.substring(7, 14)); // Last seven digits

        points.features.push({
            type: 'Feature',
            id: id,
            properties: d,
            geometry: {
                type: 'Point',
                coordinates: [x + size / 2, y + size / 2]
            }
        });
    });

    return points;
}