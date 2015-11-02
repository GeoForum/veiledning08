// http://openlayersbook.github.io/
// http://openlayers.org/en/v3.10.1/examples/select-features.html
// http://openlayers.org/en/v3.10.1/apidoc/ol.interaction.Select.html

var gridSize = 100,          // 100 m
    epsgCode = 'EPSG:32633', // UTM 33N
    projection = ol.proj.get(epsgCode),
    projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [],
    population = 0,
    numCells = 0,
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
                    html: 'Kartdata: <a href="http://kartverket.no/">Kartverket</a>'
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
    // http://openlayers.org/en/v3.10.1/apidoc/ol.interaction.Select.html
    // http://openlayers.org/en/v3.10.1/apidoc/ol.events.condition.html
    var gridSelect = new ol.interaction.Select({
        // http://openlayers.org/en/v3.10.1/apidoc/ol.events.condition.html
        condition: ol.events.condition.never, // ol.events.condition.doubleClick, // singleClick
        //toggleCondition: ol.interaction.condition.shiftKeyOnly,
        style: gridSelectStyle
    });

    // Get selected grid cells collection
    var selectedGridCells = gridSelect.getFeatures();

    selectedGridCells.on('add', function (feature) {
        population += parseInt(feature.element.getProperties().sum);
        showPopulation(population, ++numCells);
    });

    selectedGridCells.on('remove', function (feature) {
        population -= parseInt(feature.element.getProperties().sum);
        showPopulation(population, --numCells);
    });

    // Add select interaction to map
    map.addInteraction(gridSelect);

    gridSelect.on('select', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        //var feature = evt.target.getFeatures().getLength();
        console.log("click");

    });

    // http://openlayers.org/en/v3.10.1/apidoc/ol.interaction.Draw.html
    var draw = new ol.interaction.Draw({
        type: 'Polygon'
    });

    map.addInteraction(draw);

    draw.on('drawstart', function (evt) {
        selectedGridCells.clear();
    });


    // http://openlayersbook.github.io/ch08-interacting-with-your-map/example-07.html
    // TODO: Possible to get coordinates while drawing?
    draw.on('drawend', function (evt) {
        var geometry = evt.feature.getGeometry(),
            extent = geometry.getExtent(),
            drawCoords = geometry.getCoordinates()[0];

        grid.forEachFeatureIntersectingExtent(extent, function(feature) {
            if (pointInPolygon(feature.getGeometry().getCoordinates(), drawCoords)) {
                selectedGridCells.push(feature);
            }
        });
    });

});


function showPopulation (population, numCells) {
    d3.select('.legend span').text(numberFormat(population) + ' (' + numCells * 0.01 + ' km²)');
}

// Based on http://bl.ocks.org/mbostock/4573883
function createLegend (colorScale) {
    var x = d3.scale.linear()
        .domain([0, 617])
        .range([0, 300]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .tickSize(14)
        .tickValues(colorScale.domain());

    var svg = d3.select('.legend').append("svg")
        .attr('width', 300)
        .attr('height', 25);

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

    //var total = 0;
    //var max = 0;

    data.forEach(function(d){
        var id = d[ssbid],
            x = parseInt(id.substring(0, 7)) - 2000000, // First seven digits minus false easting
            y = parseInt(id.substring(7, 14)); // Last seven digits

        //total += parseInt(d.sum);
        //if (parseInt(d.sum) > max) max = parseInt(d.sum);
        // console.log(max, parseInt(d.sum));

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

    //console.log("max", max);

    return points;
}

