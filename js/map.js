var gridSize = 100,          // 100 m
    epsgCode = 'EPSG:32633', // UTM 33N
    projection = ol.proj.get(epsgCode),
    projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [],
    population = 0,
    numberFormat = function (n) { // Thousand seperator
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

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
                    html: 'Utvikling: <a href="http://mastermaps.com/">MasterMaps</a> - Kartdata: <a href="http://kartverket.no/">Kartverket</a>'
                })]
            })
        })
    ],
    target: 'map',
    view: new ol.View({
        projection: projection,
        center: [263006, 6651054],
        zoom: 10,
        minZoom: 8,
        maxZoom: 14
    })
});

var scaleLineControl = new ol.control.ScaleLine();

map.addControl(scaleLineControl);

var colorScale = d3.scale.threshold()
    .domain([20, 50, 100, 200, 300, 400, 500]) // max = 617
    .range(['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026']);

createLegend(colorScale);

var csv = d3.dsv(' ', 'text/plain');

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

    // Create grid style function
    var gridStyle = function (feature) {
        var coordinate = feature.getGeometry().getCoordinates(),
            x = coordinate[0] - gridSize / 2,
            y = coordinate[1] - gridSize / 2,
            pop = parseInt(feature.getProperties().sum),
            rgb = d3.rgb(colorScale(pop));

        return [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [rgb.r, rgb.g, rgb.b, 0.7]
                }),
                geometry: new ol.geom.Polygon([[
                    [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
                ]])
            })
        ];
    };

    // Create grid selection style
    // TODO: Possible to reuse above style?
    var gridSelectStyle = function (feature, resolution) {
        var coordinate = feature.getGeometry().getCoordinates(),
            x = coordinate[0] - gridSize / 2,
            y = coordinate[1] - gridSize / 2,
            pop = parseInt(feature.getProperties().sum),
            rgb = d3.rgb(colorScale(pop));

        return [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#333',
                    width: 10 / resolution
                }),
                fill: new ol.style.Fill({
                    color: [rgb.r, rgb.g, rgb.b, 0.7]
                }),
                geometry: new ol.geom.Polygon([[
                    [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
                ]])
            })
        ];
    };

    // Create layer form vector grid and style function
    var gridLayer = new ol.layer.Vector({
        source: grid,
        style: gridStyle
    });

    // Add grid layer to map
    map.addLayer(gridLayer);

    // Create grid select interaction
    var gridSelect = new ol.interaction.Select({
        style: gridSelectStyle
    });

    // Get selected grid cells collection
    var selectedGridCells = gridSelect.getFeatures();

    selectedGridCells.on('add', function (feature) {
        population += parseInt(feature.element.getProperties().sum);
        showPopulation(population);
    });

    selectedGridCells.on('remove', function (feature) {
        population -= parseInt(feature.element.getProperties().sum);
        showPopulation(population);
    });

    // Add select interaction to map
    map.addInteraction(gridSelect);

    var draw = new ol.interaction.Draw({
        type: 'Polygon'
    });

    draw.on('drawstart', function (evt) {
        selectedGridCells.clear();
    });

    draw.on('drawend', function (evt) {
        var geometry = evt.feature.getGeometry(),
            extent = geometry.getExtent(),
            drawCoords = geometry.getCoordinates()[0];

        map.removeInteraction(draw);
        d3.select('.info .intro').style('display', 'block');
        d3.select('.info .select').style('display', 'none');

        grid.forEachFeatureIntersectingExtent(extent, function(feature) {
            if (pointInPolygon(feature.getGeometry().getCoordinates(), drawCoords)) {
                selectedGridCells.push(feature);
            }
        });

        setTimeout(function(){ // Add delay to avoid deselect
            gridSelect.setActive(true);
        }, 500);
    });

    d3.select('.info a').on('click', function(){
        d3.event.preventDefault();
        selectedGridCells.clear();
        gridSelect.setActive(false);
        map.addInteraction(draw);
        d3.select('.info .intro').style('display', 'none');
        d3.select('.info .select').style('display', 'block');
    });

});


function showPopulation (population) {
    d3.select('.info span').text(numberFormat(population));
}

// Based on http://bl.ocks.org/mbostock/4573883
function createLegend (colorScale) {
    var x = d3.scale.linear()
        .domain([0, 617])
        .range([0, 340]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .tickSize(14)
        .tickValues(colorScale.domain());

    var svg = d3.select('svg.legend');

    svg.selectAll('rect')
        .data(colorScale.range().map(function(color) {
            var d = colorScale.invertExtent(color);
            if (d[0] == null) d[0] = x.domain()[0];
            if (d[1] == null) d[1] = x.domain()[1];
            return d;
        }))
        .enter().append('rect')
        .attr('height', 10)
        .attr("x", function(d) { return x(d[0]); })
        .attr('width', function(d) { return x(d[1]) - x(d[0]); })
        .style('fill', function(d) { return colorScale(d[0]); });

    svg.call(xAxis);
}


// From https://github.com/substack/point-in-polygon, MIT licence
// Ray-casting algorithm based on
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
function pointInPolygon (point, vs) {
    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
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