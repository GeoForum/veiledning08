// http://openlayersbook.github.io/
// http://openlayers.org/en/v3.10.1/examples/select-features.html
// http://openlayers.org/en/v3.10.1/apidoc/ol.interaction.Select.html

var projection = new ol.proj.Projection({
    code: 'EPSG:32633',
    extent: [-2500000, 3500000, 3045984, 9045984]
});

ol.proj.addProjection(projection);

var projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [];

for (var z = 0; z < 15; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = 'EPSG:32633' + ":" + z;
}

var map = new ol.Map({
    layers: [
        new ol.layer.Tile({
            title: "Norges grunnkart",
            source: new ol.source.WMTS({
                url: "http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?",
                layer: "norges_grunnkart_graatone",
                matrixSet: 'EPSG:32633',
                format: 'image/png',
                projection: projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projection.getExtent()),
                    resolutions: resolutions,
                    matrixIds: matrixIds
                })
            })
        })
    ],
    target: 'map',
    view: new ol.View({
        projection: projection,
        center: [263006, 6651054],
        zoom: 10
    })
});


var csv = d3.dsv(' ', 'text/plain');

csv('data/Oslo_bef_100m_2015.csv').get(function(error, data) {
    var geojson = ssbgrid2geojson(data, {
        size: 100,
        ssbid: 'rute_100m'
    });

    function styleFunction(feature) {
        var coordinates = feature.getGeometry().getCoordinates(),
            x = coordinates[0],
            y = coordinates[1];

        //console.log(parseInt(feature.getProperties().sum));

        return [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    //color: 'rgba(255, 0, 0, 0.5)'
                    //color: [255, 0, 0, 0.5]
                    color: getColor(parseInt(feature.getProperties().sum))
                }),
                geometry: new ol.geom.Polygon([[
                    [x,y], [x, y + 100], [x + 100, y + 100], [x + 100, y]
                ]])
            })
        ];
    }

    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: (new ol.format.GeoJSON()).readFeatures(geojson)
        }),
        style: styleFunction
    });

    map.addLayer(vectorLayer);


    var select = new ol.interaction.Select();

    map.addInteraction(select);

    select.on('select', function(evt) {
        console.log("click", evt.target.getFeatures().getLength());
    });

    /*
    map.on('singleclick', function(evt) {
        console.log("click", evt);
    });
    */




});


function ssbgrid2geojson (data, options) {
    var ssbid = options.ssbid || 'ssbid',
        size =  options.size  || 1000;

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


function getColor(d) {
    return d > 1000 ? '#800026' :
        d > 500  ? '#BD0026' :
        d > 400 ? '#E31A1C' :
        d > 300  ? '#FC4E2A' :
        d > 200   ? '#FD8D3C' :
        d > 100   ? '#FEB24C' :
        d > 10   ? '#FED976' :
                   '#FFEDA0';
}


