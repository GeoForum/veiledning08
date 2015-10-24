// https://github.com/kartverket/example-clients/blob/master/openlayers3/wmts_utm33.html
// http://kartverket.no/Kart/Gratis-kartdata/Cache-tjenester/


var sProjection = 'EPSG:32633';

var extent = {
    'EPSG:3857': [20037508.34, 20037508.34, 20037508.34, 20037508.34],
    'EPSG:32633': [-2500000, 3500000, 3045984, 9045984]
};

var projection = new ol.proj.Projection({
    code: sProjection,
    extent: extent[sProjection]
});

var view = new ol.View({
    projection: projection,
    center: [263006, 6651054],
    zoom: 10
});

ol.proj.addProjection(projection);

var projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [];

for (var z = 0; z < 21; ++z) {//Max 18?
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = sProjection+":"+z;
}

var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            title: "Norges grunnkart",
            source: new ol.source.WMTS({
                url: "http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?",
                layer: "norges_grunnkart",
                matrixSet: sProjection,
                format: 'image/png',
                projection: projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projection.getExtent()),
                    resolutions: resolutions,
                    matrixIds: matrixIds
                }),
                style: 'default'
            })
        })
    ],
    view: view
});