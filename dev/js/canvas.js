console.log("canvas");


// 220 171 celler

var cellSize = 250,
    id = 'ru250m',
    value = 'pop_tot',
    valueFactor = 0.25, // population per km2
    max = 0,
    total = 0,
    bounds = [];

var csv = d3.dsv(';', 'text/plain');
csv('data/ru250m_2015.csv').get(function(error, data) {
    console.log(data.length); // 220171

    // Find geographical bounds and max value
    data.forEach(function(d){
        d.x = parseInt(d[id].substring(0, 7)) - 2000000; // First seven digits minus false easting
        d.y = parseInt(d[id].substring(7, 14)); // Last seven digits
        d.value = parseInt(d[value]);
        total += d.value;

        if (!bounds[0] || d.x < bounds[0]) bounds[0] = d.x;
        if (!bounds[1] || d.y < bounds[1]) bounds[1] = d.y;
        if (!bounds[2] || d.x + cellSize > bounds[2]) bounds[2] = d.x + cellSize;
        if (!bounds[3] || d.y + cellSize > bounds[3]) bounds[3] = d.y + cellSize;
        if (d.value > max) max = d.value;
    });

    console.log(total, max);

    var colorScale = d3.scale.linear()
        .domain([0, max])
        .range(['#fec576', '#E31A1C']);

    var colorScale = d3.scale.linear()
        .domain([0, 5, 10, 20, 100, 2324])
        .range(colorbrewer.YlOrBr[6]);

    // Pixel width and height of canvas
    var width = (bounds[2] - bounds[0]) / cellSize,
        height = (bounds[3] - bounds[1]) / cellSize;

    // Create canvas
    // http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
    var canvas = d3.select('#map'),
        context = canvas.node().getContext('2d'),
        pixel = context.createImageData(1, 1),
        rgba = pixel.data;

    rgba[3] = 255; // Alpha

    canvas.attr('width', width)
        .attr('height', height);

    console.log(data[0].value, d3.rgb(colorScale(data[0].value)));

    data.forEach(function(d){
        var color =  d3.rgb(colorScale(d.value));
        rgba[0] = color.r;
        rgba[1] = color.g;
        rgba[2] = color.b;
        context.putImageData(pixel, (d.x - bounds[0]) / cellSize, height - (d.y - bounds[1]) / cellSize);
    });
});

