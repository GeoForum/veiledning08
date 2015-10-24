var bounds = [[59.895, 10.65], [59.955, 10.85]];

var map = L.map('map', {
    crs: L.CRS.EPSG32633
}); //.fitBounds(bounds);

/*
L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=norges_grunnkart&zoom={z}&x={x}&y={y}', {
    attribution: 'Kartverket'
}).addTo(map);
*/

L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?REQUEST=GetTile&VERSION=1.0.0&LAYER=norges_grunnkart&TILEMATRIXSET=EPSG%3A32633&TILEMATRIX=EPSG%3A32633%3A{z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fpng', {
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

var csv = d3.dsv(';', 'text/plain');

csv('data/ru250m_2015.csv').get(function(error, data) {
//csv('data/nor2015pop_1kmruter.csv').get(function(error, data) {
    //console.log(rows);

    var ssbgrid = L.ssbgrid(data, {
        gridSize: '250m',
        ssbId: 'ru250m',
        bounds: [[247800, 6635000], [275000, 6664000]],
        style: {
            stroke: false,
            fillOpacity: 0.8
        }
    }).addTo(map);

    map.fitBounds(ssbgrid.getBounds());
    //map.fitBounds(bounds);

});