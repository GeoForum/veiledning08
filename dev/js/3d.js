var bounds = [230000, 6627000, 280000, 6667000], // UTM 33N left, bottom, right, top
    boundsWidth = bounds[2] - bounds[0],
    boundsHeight = bounds[3] - bounds[1],
    cellSize = 250,
    xCells = boundsWidth / cellSize,
    yCells = boundsHeight / cellSize,
    sceneWidth = 100,
    sceneHeight = 100,
    boxSize = sceneWidth / xCells / 2.5,
    valueFactor = 0.01,
    width  = window.innerWidth,
    height = window.innerHeight,
    color = d3.scale.linear()
        .domain([1, 300, 2324])
        .range(['#FFEDA0', '#FEB24C', '#E31A1C']);

var scene = new THREE.Scene();

//var axes = new THREE.AxisHelper(50);
//scene.add(axes);

var aLight = new THREE.AmbientLight(0x777777); // soft white light
scene.add(aLight);

var dLight = new THREE.DirectionalLight(0xcccccc, 1);
dLight.position.set(-50, -30, 50);
scene.add(dLight);

var camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 1000);
camera.position.set(0, -200, 100);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);

var controls = new THREE.TrackballControls(camera);

document.body.appendChild(renderer.domElement);

function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

var csv = d3.dsv(';', 'text/plain');

csv('data/ru250m_2015.csv').get(function(error, data) { // nor2015pop_1kmruter.csv
    for (var i = 0; i < data.length; i++) {
        var id = data[i].ru250m, // ssbid_1000m
            x = parseInt(id.substring(0, 7)) - 2000000 + cellSize, // First seven digits minus false easting
            y = parseInt(id.substring(7, 14)) + cellSize; // Last seven digits

        if (x > bounds[0] && x < bounds[2] && y > bounds[1] && y < bounds[3]) {
            scene.add(getBoxGeometry(x, y, parseInt(data[i].pop_tot)));
        }
    }
    render();
});

function getBoxGeometry(x, y, value) {
    x = (x - bounds[0]) / (boundsWidth / sceneWidth) - sceneWidth / 2;
    y = (y - bounds[1]) / (boundsHeight / sceneHeight) - sceneHeight / 2;

    var geometry = new THREE.BoxGeometry(boxSize, boxSize, value * valueFactor);

    var material = new THREE.MeshLambertMaterial({
        color: color(value)
    });

    var cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, value * valueFactor / 2);

    return cube;
}

// Min : 1
// Max : 2324
function getColor(d) {
    return d > 1000 ? 0x800026 :
           d > 500  ? 0xBD0026 :
           d > 200  ? 0xE31A1C :
           d > 100  ? 0xFC4E2A :
           d > 50   ? 0xFD8D3C :
           d > 20   ? 0xFEB24C :
           d > 10   ? 0xFED976 :
                      0xFFEDA0;
}
