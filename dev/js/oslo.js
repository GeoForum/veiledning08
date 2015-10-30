var bounds = [[59.895, 10.65], [59.955, 10.85]];

var map = L.map('map', {
    crs: L.CRS.EPSG32633
}); //.fitBounds(bounds);

/*
 L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=norges_grunnkart&zoom={z}&x={x}&y={y}', {
 attribution: 'Kartverket'
 }).addTo(map);
 */

L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?REQUEST=GetTile&VERSION=1.0.0&LAYER=norges_grunnkart_graatone&TILEMATRIXSET=EPSG%3A32633&TILEMATRIX=EPSG%3A32633%3A{z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fpng', {
    attribution: 'Kartverket'
}).addTo(map);

//L.rectangle(bounds, {color: "#ff7800", weight: 1, fill: false}).addTo(map);

/*
 var ssbgrid = L.ssbgrid({
 19250006616000: 10,
 19250006617000: 146,
 19250006618000: 27,
 19260006617000: 23
 }, { gridSize: '1km' }).addTo(map);
 */

//map.fitBounds(ssbgrid.getBounds());

var csv = d3.dsv(' ', 'text/plain');

var total = 0;

csv('data/Oslo_bef_100m_2015.csv').get(function(error, data) {
//csv('data/nor2015pop_1kmruter.csv').get(function(error, data) {
    //console.log(rows);

    L.geoJson(ssbgrid2geojson(data, {
        size: 100,
        ssbid: 'rute_100m'
    })).addTo(map);

    var ssbgrid = L.ssbgrid(data, {
        gridSize: '100m',
        ssbId: 'rute_100m',
        //bounds: [[240000, 6627000], [280000, 6667000]],
        style: function (data){
            data.sum = parseInt(data.sum);
            total += data.sum;
            return {
                color: getColor(data.sum),
                stroke: false,
                fillOpacity: 0.8
            };
        }
    }).addTo(map);

    console.log(total, ssbgrid._geojson);

    map.fitBounds(ssbgrid.getBounds());
    //map.fitBounds(bounds);

    var polygons = {
        type: 'FeatureCollection',
        features: [{
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [10.73445709, 59.9073584],
                    [10.73445709, 59.91179045],
                    [10.75017639, 59.91179045],
                    [10.75017639, 59.9073584],
                    [10.73445709, 59.9073584]
                ]]
            }
        }]
    };

    L.geoJson(polygons).addTo(map);

    var aggregated = turf.sum(polygons, ssbgrid._geojson, 'sum', 'sum');

    console.log(aggregated.features[0].properties.sum);

});

// Max : 2324
// Min : 1
function getColor(d) {
    return d > 1000 ? '#800026' :
        d > 500  ? '#BD0026' :
            d > 200  ? '#E31A1C' :
                d > 100  ? '#FC4E2A' :
                    d > 50   ? '#FD8D3C' :
                        d > 20   ? '#FEB24C' :
                            d > 10   ? '#FED976' :
                                '#FFEDA0';
}