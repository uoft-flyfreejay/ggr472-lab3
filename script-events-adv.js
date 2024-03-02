/*--------------------------------------------------------------------
GGR472 WEEK 6: JavaScript for Web Maps
MapData and MapMouse Events
--------------------------------------------------------------------*/


//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmx5ZnJlZWpheSIsImEiOiJjbHI3emdhZzUyamtqMmpteXNtaGJxbGVyIn0.SrkrFYfxjCieaBwWWdMb-w'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

//Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/flyfreejay/clsgtk42u03h301pfdtt0g4ke',
    center: [-105, 58],
    zoom: 3,
    maxBounds: [
        [-180, 30], // Southwest
        [-25, 84]  // Northeast
    ],
});

//Add search control to map overlay
//Requires plugin as source in HTML body
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        countries: "ca" //Try searching for places inside and outside of canada to test the geocoder
    })
);

//Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());



//Add data source and draw initial visiualization of layer
map.on('load', () => {

    //Use GeoJSON file as vector tile creates non-unique IDs for features which causes difficulty when highlighting polygons
    map.addSource('canada-provterr', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/smith-lg/ggr472-wk6-demo/main/data/can-provterr.geojson', //Link to raw github files when in development stage. Update to pages on deployment
        'generateId': true //Create a unique ID for each feature
    });

    //Add layer only once using case expression and feature state for opacity
    map.addLayer({
        'id': 'provterr-fill',
        'type': 'fill',
        'source': 'canada-provterr',
        'paint': {
            'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                [
                    // Change color based on population using a 'step' expression
                    'step',
                    ['get', 'POP2021'], 
                    '#ffeda0', 1000000, // Color for population under 1 million
                    '#feb24c', 5000000, // Color for population under 5 million
                    '#f03b20' // Color for population over 5 million
                ],
                '#627BC1' // Default color when not hovered
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': 'white'
        }
    });
    //Add datasource from GeoJSON
    map.addSource('toronto-mus', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/smith-lg/ggr472-wk6-demo/main/data/torontomusicvenues.geojson'
      
    });

   /*  map.addLayer({
        'id': 'toronto-mus-pnts',
        'type': 'circle',
        'source': 'toronto-mus',
        'paint': {
            'circle-radius': 5,
            'circle-color': 'blue',
        }
    }); */

    //Draw GeoJSON labels using 'name' property
    map.addLayer({
        'id': 'toronto-mus-labels',
        'type': 'symbol',
        'source': 'toronto-mus',
        'layout': {
            'text-field': ['get', 'name'],
            'text-variable-anchor': ['bottom'],
            'text-radial-offset': 0.5,
            'text-justify': 'auto'
        },
       
        'text-color': 'blue'
        
    });
    map.addLayer({
        'id': 'toronto-mus-pnts',
        'type': 'circle',
        'source': 'toronto-mus',
        'paint': {
            // Adjust marker size as per previous examples
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 1, // at zoom level 8, circle radius will be 1px
                12, 15 // at zoom level 12, circle radius will be 10px
            ],
            // Change marker color based on zoom level
            'circle-color': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, '#fbb03b', // Color at zoom level 8
                12, '#223b53' // Color at zoom level 12
            ],
        }
    });
    
});



/*--------------------------------------------------------------------
SIMPLE CLICK EVENT
--------------------------------------------------------------------*/
map.on('click', 'provterr-fill', (e) => {

    //console.log(e);   //e is the event info triggered and is passed to the function as a parameter (e)
    //Explore console output using Google DevTools

    let provname = e.features[0].properties.PRENAME;
    console.log(provname);

});



/*--------------------------------------------------------------------
ADD POP-UP ON CLICK EVENT
--------------------------------------------------------------------*/
map.on('mouseenter', 'provterr-fill', () => {
    map.getCanvas().style.cursor = 'pointer'; //Switch cursor to pointer when mouse is over provterr-fill layer
});

map.on('mouseleave', 'provterr-fill', () => {
    map.getCanvas().style.cursor = ''; //Switch cursor back when mouse leaves provterr-fill layer
});


map.on('click', 'provterr-fill', (e) => {
    new mapboxgl.Popup() //Declare new popup object on each click
        .setLngLat(e.lngLat) //Use method to set coordinates of popup based on mouse click location
        .setHTML("<b>Province/Territory:</b> " + e.features[0].properties.PRENAME + "<br>" +
            "Population: " + e.features[0].properties.POP2021) //Use click event properties to write text for popup
        .addTo(map); //Show popup on map
});



/*--------------------------------------------------------------------
HOVER EVENT USING setFeatureState() METHOD
// --------------------------------------------------------------------*/
let provID = null; //Declare initial province ID as null


map.on('mousemove', 'provterr-fill', (e) => {
    if (e.features.length > 0) { //If there are features in array enter conditional
        if (provID !== null) { //If provID IS NOT NULL set hover feature state back to false to remove opacity from previous highlighted polygon
            map.setFeatureState(
                { source: 'canada-provterr', id: provID },
                { hover: false }
            );
        }
        provID = e.features[0].id;
        map.setFeatureState(
            { source: 'canada-provterr', id: provID }, //Update provID to featureID
            { hover: true } // This now triggers the dynamic color change based on population
        );
    }
});

map.on('mouseleave', 'provterr-fill', () => {  //If mouse leaves the geojson layer, set all hover states to false and provID variable back to null
    if (provID !== null) {
        map.setFeatureState(
            { source: 'canada-provterr', id: provID },
            { hover: false }
        );
    }
    provID = null;
});



//Change marker size on zoom
//Uses interpolate operator to define linear relationship between zoom level and circle size
 [
     'interpolate', //INTERPOLATE expression produces continuous results by interpolating between value pairs
     ['linear'], //linear interpolation between stops but could be exponential ['exponential', base] where base controls rate at which output increases
     ['zoom'], //ZOOM expression changes appearance with zoom level
     8, 1, // when zoom level is 8 or less, circle radius will be 1px
     12, 10 // when zoom level is 12 or greater, circle radius will be 10px
 ]

 [
     'interpolate', //INTERPOLATE expression produces continuous results by interpolating between value pairs
     ['linear'], //linear interpolation between stops but could be exponential ['exponential', base] where base controls rate at which output increases
     ['zoom'], //zoom expression changes appearance with zoom level
    10, 5, // when zoom is 10 (or less), radius will be 5px
     12, ['/',['get', 'capacity'],20] // when zoom is 12 (or greater), radius will be capacity/20
]    