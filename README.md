# Befolkningsdata på rutenett

Laget av <a href="http://mastermaps.com/">Bjørn Sandvik</a>

<a href="http://www.ssb.no/">Statistisk sentralbyrå (SSB)</a> har <a href="https://www.ssb.no/statistikkbanken">en rekke statistikker</a> som egner seg til visning på kart. Det vanligste er å koble statistikk til fylker, kommuner eller <a href="http://kartverket.no/Kart/Kartdata/Grenser/Produktark-for-grunnkretser/">grunnkretser</a> - som er den minste statistiske inndelingen i Norge. Hvordan du kan koble statistikk til administrative enheter eller grunnkretser er forklart i <a href="https://github.com/GeoForum/veiledning02">veiledning 2</a>. Her skal vi derimot se på annen type visualisering på kart; statistikk på rutenett. 

![Befolkningskart for Oslo](img/oslopop.gif)

Bildet over viser kartet vi skal lage. Vi skal legge befolkningsdata i ruter på 100 x 100 m oppå bakgrunnskart fra Kartverket. Brukeren kan selv markere et område for å se antall innbyggere. I Oslo har det vært stor diskusjon rundt bilfritt sentrum, og med dette kartet kan du selv se hvor mange personer som bor i de berørte områdene. 

<a href="http://geoforum.github.io/veiledning08/">Gå til det ferdige kartet</a>

### Hvorfor statistikk på rutenett?
Det er utviklet en <a href="https://www.ssb.no/natur-og-miljo/artikler-og-publikasjoner/statistical-grids-for-norway">nasjonal standard for statistikk på rutenett</a>. Et standardisert rutenett gjør det enklere å sammenstille data fra ulike kilder. Rutenettet kan være grovt, som 5 x 5 km, eller finmasket med 100 x 100 meter som er brukt i dette eksempelet. Av personvernhensyn får du kun tak i befolkningsdata ned 250 x 250 meter for hele landet, men det er mulig å få tak i mer detaljerte data for Oslo.  

Statistikk på rutenett kan gjøre geografiske analyser enklere. Her kan du lese <a href="https://nrkbeta.no/2015/06/25/slik-undersokte-nrk-radonkartene/">hvordan NRK brukte SSB-data på rutenett for å finne befolkning og bygningsmasse i områder med høy radonfare</a>. Tilsvarende kan befolkningsdata brukes til å analysere kundegrunnlaget for butikker, finne beste lokalisering av holdeplasser eller dekningsgrad for mobiltelefoni. Rutenett vil ofte vil være mer detaljert enn andre enheter som kommuner og bydeler. Det kan også være bedre til å vise endringer over tid siden rutenettet ikke påvirkes av kommunesammenslåinger etc. 
  
### OpenLayers med bakgrunnskart fra Kartverket
Rutenettet fra SSB er i kartprojeksjonen UTM 33N som du kan lese mer om i <a href="https://github.com/GeoForum/veiledning05">veiledning 5</a>. For å sikre at rutene viser rett skal vi bruke samme projeksjon i vårt kart. Kartverket tilbyr <a href="http://kartverket.no/Kart/Gratis-kartdata/Cache-tjenester/">flere kart</a> i denne projeksjonen, og de har også lagt ut <a href="https://github.com/kartverket/example-clients">eksempler på bruk for ulike verktøy</a>. Her skal vi bruke <a href="http://openlayers.org/">OpenLayers 3</a>, som er blant kartbibliotekene med best støtte for ulike projeksjoner.  

[![Bakgrunnskart for Oslo](img/basemap.png)](http://geoforum.github.io/veiledning08/kartverket.html)

<a href="http://geoforum.github.io/veiledning08/kartverket.html">Kartet over</a> heter "Norges grunnkart gråtone" blir lasta direkte fra Kartverkets servere. Det er valgt gråtoner for at befolkningsdataene skal komme tydligere frem. 

Vi må legge til en definisjon av UTM 33N for at den skal støttes av OpenLayers. Denne <a href="https://github.com/MasterMaps/OpenLayers.UTM33N">definisjonen finner du her</a>, og <a href="https://github.com/MasterMaps/OpenLayers.UTM33N/blob/master/ol.proj.UTM33N.js">scriptet</a> lastes inn etter OpenLayers-biblioteket. Vi får da støtte for UTM-koordinater i OpenLayers:

```javascript
var epsgCode = 'EPSG:32633', // UTM 33N
    projection = ol.proj.get(epsgCode),
    projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [];

for (var z = 0; z <= 13; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = epsgCode + ':' + z;
}

var map = new ol.Map({
    target: 'map',
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
                    html: '<a href="http://kartverket.no/">Kartverket</a>'
                })]
            })
        })
    ],
    view: new ol.View({
        projection: projection,
        center: [263006, 6651054],
        zoom: 11,
        minZoom: 8,
        maxZoom: 13
    })
});
```

Kort forklaring av <a href="https://github.com/GeoForum/veiledning08/blob/gh-pages/js/kartverket.js">koden</a> over:
- "<a href="http://epsg.io/32633">EPSG:32633</a>" er en standardisert måte å angi UTM 33N på. 
- Vi laster inn bakgrunnskartet "norges_grunnkart_graatone" som <a href="http://kartverket.no/Kart/Gratis-kartdata/Cache-tjenester/">pregenererte kartfliser</a> (tiles på engelsk) på 256x256 pixler i predefinerte målestokker (zoomnivåer).
- Til slutt definerer hva som skal være utgangsposisjonen i kartet i form av et senterpunkt og et zoomnivå. Senterpunktet er angitt i UTM 33-koordinater  

![UTM 33-koordinater for Oslo](img/norgeskart.png)