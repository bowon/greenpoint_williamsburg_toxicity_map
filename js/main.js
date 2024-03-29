var app = app || {};

app.map = (function(w, d, $, H) {

    // "global" variables accessible within the entire app.map scope: 
    var sublayers = [], // For storing the cartodb sublayers
        sublayerActions = [], // for layer button interactions
        map_object, // variable for the <div id="map"></div> DOM element to pass to Leaflet JS
        legend_data = app.legends,
        layerSource = app.layers,
        carto = app.cartocss,
        hb_source = d.getElementById('legend-template').innerHTML,
        hb_template = H.compile(hb_source);

    // register Handlebars JS helpers for rendering legends
    H.registerHelper('each', function(context, options) {
        var ret = "";
        for(var i=0, j=context.length; i<j; i++) {
          ret = ret + options.fn(context[i]);
        }
        return ret;
    });

    H.registerHelper('if', function(conditional, options) {
        if (conditional) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
    });        

    // create the Leaflet Map
    function initMap() {
        // bounding box for Williamsburg / Greenpoint to limit the map's panable area
        var southWest = L.latLng(40.679628, -74.089720),
            northEast = L.latLng(40.755792, -73.856475),
            bounds = L.latLngBounds(southWest, northEast);

        // map paramaters to pass to Leaflet
        var params = {
            center: [40.718640, -73.950605], //Greenpoint
            zoomControl: false,
            zoom: 14,
            maxZoom: 19,
            minZoom: 14,
            scrollwheel: false,
            maxBounds: bounds,
            legends: true,
            infoControl: false,
            attributionControl: true
        };

        map_object = new L.Map('map', params); 
        var accessToken = 'pk.eyJ1IjoiYm93b25jIiwiYSI6InFDV2RBNjAifQ._F8zZ-AkgNHp0_h2XKk9Pw';
        var mapid = 'bowonc.n26oid7e';
        // for geocoding
        //map_object.addControl(L.mapbox.geocoderControl('mapbox.places'));
        var attr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' + 
                    ' <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';
        // mapbox basemap
        var basemap = L.tileLayer(
                'https://{s}.tiles.mapbox.com/v4/' + mapid + 
                '/{z}/{x}/{y}.png?access_token=' + accessToken, 
                { attribution: attr }
            )
            .addTo(map_object);
    
    } // end init map

    // grab the map's data-layers from CartoDB
    function initCartoDBLayers() {        
        var cdb_options = {
                cartodb_logo: false,
                legends: false,
                https: true,
                attributionControl: true
        };

        cartodb.createLayer(map_object, layerSource, cdb_options)
            .addTo(map_object)
            .on('done', function(layer) {
                layer.setZIndex(5); // make sure the cartodb layer is on top.

                // get the number of sublayers
                var numSubLayers = layer.getSubLayerCount();

                // iterate over the sublayers and do stuff with them
                for (var i = 0; i < numSubLayers; i++) {
                    var idx = getSubLayerIndex(i);

                    // only enable interaction for layers that need it
                    if (idx !== 'industrial_history_lines' || idx !== 'flood_risk' ) {
                        layer.getSubLayer(i).setInteraction(true);
                    } else {
                        layer.getSubLayer(i).setInteraction(false);
                    }
                    
                    // hide all sublayers by default
                    layer.getSubLayer(i).hide();
                    // add our sublayers to an array so we can act on them later
                    sublayers.push(layer.getSubLayer(i));
                    // get the field names, in the form of an array, to use for the infowindows
                    var fields = layerSource.sublayers[i].interactivity.replace(/ /g, '').split(",");                 

                    // create the info-windows manually
                    cartodb.vis.Vis.addInfowindow(
                        map_object, 
                        layer.getSubLayer(i),
                        fields
                    );
                }

            }).on('error', function(error) {
                console.log('error with cartodb.createLayer: ', error);
            });
    }  

    // gets a data-layer's numeric index or text id from the app.layers.sublayers
    function getSubLayerIndex(val) {
        var idx = null;
        if (typeof val === 'number') {                    
            layerSource.sublayers.forEach(function(d,i){
                if (val === i) {
                    idx = d.name;
                }
            });
        } else {            
            layerSource.sublayers.forEach(function(d,i){
                if (d.name === val) {
                    idx = i;
                }
            });
        }
        return idx;
    }

    // hide or show the data layer
    function hideShow(id) {
        var id_hash = '#' + id + '.data-layer', // the button id
            $button = $(id_hash); // the button itself

        if (id === "industry") {
            var a = getSubLayerIndex('industrial_history_lines'),
                b = getSubLayerIndex('industrial_history_points');

            // if the layer is already selected turn it off
            if ($button.hasClass('selected')) {
                sublayers[a].hide();
                sublayers[b].hide();
                removeLegend('industrial_history_points');
                $button.removeClass('selected active pressed');
            
            } else if (!$button.hasClass('selected')) {
                // otherwise turn it on
                sublayers[a].show();
                sublayers[b].show();
                renderLegend('industrial_history_points');
                $button.addClass('selected active pressed');
            }

        } else if (id === "polluted") {
            var a = getSubLayerIndex('polluted_points'),
                b = getSubLayerIndex('polluted_polygons');

            // if the layer is already selected turn it off
            if ($button.hasClass('selected')) {
                sublayers[a].hide();
                sublayers[b].hide();
                removeLegend('polluted_points');
                removeLegend('polluted_polygons');
                $button.removeClass('selected active pressed');
            
            } else if (!$button.hasClass('selected')) {
                // otherwise turn it on
                sublayers[a].show();
                sublayers[b].show();
                renderLegend('polluted_points');
                renderLegend('polluted_polygons');
                $button.addClass('selected active pressed');
            }

        } else {

            var index = getSubLayerIndex(id); // numeric index of the data-layer in the sublayers array

            // if the layer is already selected turn it off
            if ($button.hasClass('selected')) {
                sublayers[index].hide();
                removeLegend(id);
                $button.removeClass('selected active pressed');
            
            } else {
                // otherwise turn it on
                sublayers[index].show();
                renderLegend(id);
                $button.addClass('selected active pressed');
            }

            // determine if the index is for a choropleth layer
            if (index >= 0 && index < 3) {
                // remove other choropleth legends & layers if they are displayed,
                // multiple choropleth layers displayed simultaneously look muddy and aren't a useful UX
                for (var i=0; i<3; i++) {
                    
                    var x = getSubLayerIndex(i);
                    
                    if ($('#legend-' + x).length && i !== index) {
                        removeLegend(x);
                        sublayers[i].hide();
                    }

                    if (i !== index) { 
                        var idx = getSubLayerIndex(i),
                            $otherButton = $('#'+idx);
                        $otherButton.removeClass('selected active pressed');
                    }
                }
            }
        }
    }
    
    // renders the data-layer's legend using Handlebars JS
    function renderLegend(id) {
        var data = legend_data[id];
        data.id = id;
        
        function passData() {            
            var html = hb_template(data);
            $('.map-legends').append(html);
        }

        function resizeLegendContainer() {
            var h1 = $('.map-legends').innerHeight(),
                h2 = $('.legend-sources').innerHeight(),
                total = h1 + h2 + 10;
            $('#map-legend-container').innerHeight(total);
        }

        passData();
        resizeLegendContainer();
    }

    // removes the data-layer's legend
    function removeLegend(id) {
        var target = $('#legend-' + id),
            lcontainer = $('#map-legend-container'),
            tHeight = target.innerHeight(),
            lHeight = lcontainer.innerHeight();

        target.remove();
        lcontainer.innerHeight(lHeight - tHeight);
    }

    /*** 
        Map Interaction Event Listeners 
    ***/

    // load the appropriate data-layer on its corresponding button click
    $('.data-layer').click(function() {
        var layer = $(this).attr('id');
        console.log('clicked button: ', layer);
        hideShow(layer);
    });

    // clear all the layers
    $('.nextsteps .clear').on('click', function(e) {
        e.preventDefault();
        sublayers.forEach(function(sublayer,i) {
            sublayer.hide();
            var id = getSubLayerIndex(i);
            removeLegend(id);
        });
        
        // de-activate the buttons
        $('.data-layer').removeClass('selected pressed active');
        
        // close all open cartodb-infowindows
        $('div.cartodb-infowindow').css('display', 'none');
    });

    // set up custom zoom buttons
    var initZoomButtons = function(){
        $('#zoom-in').on('click', function(){
          map_object.zoomIn();
        });

        $('#zoom-out').on('click', function(){
          map_object.zoomOut();
        });
    };

    /* get it all going! */
    var init = function() {
        initMap();
        initCartoDBLayers();
        initZoomButtons();
    };

    // stuff that's publicly accessible outside the app.map module, 
    // eg: in the console do app.map.sublayers;
    return {
        init: init,
        sublayers : sublayers,
        hideShow : hideShow,
        renderLegend : renderLegend,
        getSubLayerIndex : getSubLayerIndex
    };

})(window, document, jQuery, Handlebars);