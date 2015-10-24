L.SSBgrid = L.FeatureGroup.extend({

    options: {
        gridSize: 1000, // default grid size 1 km
        ssbId: 'ssbid',
        crs: L.CRS.EPSG32633,
        bounds: null,
        style: {
            weight: 1,
            smoothFactor: 0
        }
    },

    grids: {
        '100m': 100,
        '125m': 125,
        '250m': 250,
        '500m': 500,
        '1km': 1000,
        '5km': 5000,
        '10km': 10000,
        '25km': 25000,
        '50km': 50000,
        '100km': 100000,
        '250km': 250000,
        '500km': 500000
    },

    initialize: function (gridCells, options) {
        if (options.style) {
            options.style = L.extend(this.options.style, options.style);
        }

        options = L.setOptions(this, options);

        if (typeof options.gridSize === 'string') {
            options.gridSize = this.grids[options.gridSize];
        }

        this._layers = {};

        if (gridCells) {
            this.addData(gridCells);
        }
    },

    addData: function (gridCells) {
        if (Array.isArray(gridCells)) {
            for (var i = 0; i < gridCells.length; i++) {
                this.addGridCell(gridCells[i][this.options.ssbId], gridCells[i]);
            }
        } else {
            for (var id in gridCells) {
                if (gridCells.hasOwnProperty(id)) {
                    this.addGridCell(id, gridCells[id]);
                }
            }
        }
    },

    addGridCell: function (id, data) {
        id = id.toString();

        if (id.length === 14) {
            var x1 = parseInt(id.substring(0, 7)) - 2000000, // First seven digits minus false easting
                y1 = parseInt(id.substring(7, 14)), // Laste seven digits
                x2 = x1 + this.options.gridSize,
                y2 = y1 + this.options.gridSize,
                projection = this.options.crs.projection,
                bounds = this.options.bounds;

            //console.log("bounds", bounds);
            if (!bounds || (x1 >= bounds[0][0] && x2 <= bounds[1][0] && y1 >= bounds[0][1] && y2 <= bounds[1][1])) {
                var layer = L.polygon([
                    projection.unproject({x: x1, y: y1}),
                    projection.unproject({x: x1, y: y2}),
                    projection.unproject({x: x2, y: y2}),
                    projection.unproject({x: x2, y: y1})
                ], this.options.style);

                return this.addLayer(layer);
            }
        }
    }
});

L.ssbgrid = function (gridCells, options) {
    return new L.SSBgrid(gridCells, options);
};