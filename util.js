console.log(typeof "is this thing on")

const MAP_CONFIG = {
    lat: "",
    lng: "",
    zoom: "",
    mapID: "map"
};

// lat float
// lng float
// zoom  int
// number ^js
function initMap({lat,lng,zoom,mapID="map"}) {
    if (typeof lat != "number" || typeof lng != "number" || zoom != "number") {
        throw new Error("Missing require lat/lng and zoom values");
    }
    return L.map(mapID).setView([lat,lng], zoom);
}

const map = initMap(MAP_CONFIG);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);

// trim -> - co<int>
let targetRoutes = [];

// static -> int based on troutes len
function getColor(route) {
    const colors = [
        'blue', 'red', 'green', 'purple', 'orange', 'darkblue', 'darkred', 'darkgreen', 'pink'
    ];
    const index = targetRoutes.indexOf(route) % colors.length;
    return colors[index];
}

let uspsGeoJSON = L.geoJson().addTo(map);

// GeoJSON from USPS EDDM API username=EDDM
const ZIP_CODE = ""
let apiUrl = `https://gis.usps.com/arcgis/rest/services/EDDM/selectZIP/GPServer/routes/execute?f=json&env:outSR=4326&ZIP=${ZIP_CODE}&Rte_Box=R&UserName=EDDM`;
fetch(apiUrl)
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.json();
    })
    .then(data => {
        const features = data.results[0].value.features;
        console.log('Features:', features); 

        // layer if it matches targetRoutes << may expand
        features.forEach(feature => {
            const zipCrid = feature.attributes.ZIP_CRID;
            if (targetRoutes.includes(zipCrid)) {
                uspsGeoJSON.addData({
                    "type": "Feature",
                    "properties": feature.attributes,
                    "geometry": {
                        "type": "MultiLineString",
                        "coordinates": feature.geometry.paths
                    }
                });
            }
        });

        uspsGeoJSON.setStyle(feature => ({
            color: getColor(feature.properties.ZIP_CRID),
            weight: 4, 
            opacity: 0.9
        }));

        // view for each display to clients
        uspsGeoJSON.eachLayer(layer => {
            layer.bindPopup(
                `Route: ${layer.feature.properties.ZIP_CRID}<br>` +
                    `City: ${layer.feature.properties.CITY_STATE}`
            );
        });

        // fit map to the bounds of the rendered routes
        if (uspsGeoJSON.getBounds().isValid()) {
            map.fitBounds(uspsGeoJSON.getBounds());
        } else {
            console.warn('No valid bounds for GeoJSON layer');
            map.setView(MAP_CONFIG); //map id may mess it up
        }

        // adds legend
        let legend = L.control({ position: 'bottomright' });
        legend.onAdd = function(map) {
            let div = L.DomUtil.create('div', 'legend');
            div.innerHTML += '<h4>Routes</h4>';
            targetRoutes.forEach(route => {
                div.innerHTML += `<i style="background:${getColor(route)}"></i> ${route}<br>`;
            });
            return div;
        };
        legend.addTo(map);
    })
    .catch(error => {
        console.error('Error processing GeoJSON:', error);
        alert('Failed to render routes. Check console for details.');
    });
