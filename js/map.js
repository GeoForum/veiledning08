// http://openlayersbook.github.io/
// http://openlayers.org/en/v3.10.1/examples/select-features.html
// http://openlayers.org/en/v3.10.1/apidoc/ol.interaction.Select.html

var gridSize = 100,          // 100 m
    epsgCode = 'EPSG:32633'; // UTM 33N

var projection = new ol.proj.Projection({
    code: epsgCode,
    extent: [-2500000, 3500000, 3045984, 9045984],
    units: 'm'
});

ol.proj.addProjection(projection);

var projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [];

for (var z = 0; z < 15; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = epsgCode + ':' + z;
}

var map = new ol.Map({
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
                    html: '&copy; <a href="http://kartverket.no/">Kartverket</a>'
                })]
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

/* Scale control krever Proj4
var scaleControl = new ol.control.ScaleLine({
    //units: 'degrees',
    //minWidth: 100
});

map.addControl(scaleControl);
*/

/*
var attributionControl = new ol.control.Attribution({
    collapsed: false
});

map.addControl(attributionControl);
*/

var csv = d3.dsv(' ', 'text/plain');

csv('data/Oslo_bef_100m_2015.csv').get(function(error, data) {
    var geojson = ssbgrid2geojson(data, gridSize, 'rute_100m');

    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: (new ol.format.GeoJSON()).readFeatures(geojson),
            attributions: [new ol.Attribution({
                html: '<a href="http://ssb.no/">SSB</a>'
            })]
        }),
        style: gridStyle
    });

    map.addLayer(vectorLayer);

    var select = new ol.interaction.Select({
        style: function (feature, resolution) {
            var coordinate = feature.getGeometry().getCoordinates(),
                x = coordinate[0],
                y = coordinate[1],
                pop = parseInt(feature.getProperties().sum);

            console.log(pop);

            return [ // TODO: Possible to reuse styøe
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#333',
                        width: 5 / resolution
                    }),
                    fill: new ol.style.Fill({
                        color: getColor(pop)
                    }),
                    //
                    geometry: new ol.geom.Polygon([[
                        [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
                    ]])
                })
            ];

        }
    });

    map.addInteraction(select);

    select.on('select', function(evt) {
        var feature = evt.target.getFeatures().getLength();
        //console.log("click", feature);

    });
});

function gridStyle (feature) {
    var coordinate = feature.getGeometry().getCoordinates(),
        x = coordinate[0],
        y = coordinate[1];

    //var geom = feature.getGeometry();
    //if (geom.getType() == 'Point') {
    //console.log("#", geom.getType());

    return [
        new ol.style.Style({
            fill: new ol.style.Fill({
                //color: 'rgba(255, 0, 0, 0.5)'
                //color: [255, 0, 0, 0.5]
                color: getColor(parseInt(feature.getProperties().sum))
            }),
            //
            geometry: new ol.geom.Polygon([[
                [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
            ]])
        })
    ];
}


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


function getColor(d) {
    return d > 500 ? '#800026' :
        d > 400  ? '#BD0026' :
        d > 300  ? '#E31A1C' :
        d > 200  ? '#FC4E2A' :
        d > 100  ? '#FD8D3C' :
        d > 50   ? '#FEB24C' :
        d > 20   ? '#FED976' :
                   '#FFEDA0';
}


