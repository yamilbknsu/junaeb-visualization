// Global variables (Need to find a better way to handle this)
let gMainView;

// Projection objects
let d3Path;

let simRatio = 25;



function newMapVisualization(centerCoords, // Coords object
    boundingBox, // List of two Coords objects [SW, NE]
    load_callback = () => 1,
    zomm_level = 13,
    containerID = '#viz-container',
    tileFunction = getTileURL,
    tileMode = 'dark_all') {

    // Append div that will contain the map
    d3.select(containerID).append('div').attr('id', 'map');

    // Initializing leaflet map object
    map = L.map('map', {
        zoomControl: false
    });
    map.on('load', load_callback);
    map.setView([centerCoords.lat, centerCoords.lng], zomm_level);

    // Adding tiles to the map
    var tileURL = tileFunction(tileMode);
    actualLayer = L.tileLayer(tileURL, {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    });
    map.addLayer(actualLayer);

    // Setting the bounding box
    southWest = L.latLng(boundingBox[0].lat, boundingBox[0].lng),
        northEast = L.latLng(boundingBox[1].lat, boundingBox[1].lng);
    var bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);
    map.on('drag', function () {
        map.panInsideBounds(bounds, {
            animate: false
        });
    });

    // Overlay SVG
    svg = d3.select(map.getPanes().overlayPane).append("svg");
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

    // Do something with the update callback
    gMainView = {
        svg: svg,
        g: g,
        southWest: boundingBox[0],
        northEast: boundingBox[1]
    }
    reset();
    map.on('viewreset', reset);
    map.on('zoom', reset);

    transform = d3.geoTransform({
        point: projectPoint
    });

    d3Path = d3.geoPath().projection(transform);

    return {
        svg: svg,
        g: g,
        southWest: boundingBox[0],
        northEast: boundingBox[1]
    }
}

class Coords {
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
}

// Map related functions
function getTileURL(mode) {
    return 'http://{s}.basemaps.cartocdn.com/' + mode + '/{z}/{x}/{y}.png';
}

function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

let drawnPoints = {}
let drawnStreets = {}

function reset() {
    // Adjust SVG object to new bounds
    var bottomLeft = map.latLngToLayerPoint(gMainView.southWest),
        topRight = map.latLngToLayerPoint(gMainView.northEast);

    gMainView.svg.attr('width', topRight.x - bottomLeft.x + "px")
        .attr('height', bottomLeft.y - topRight.y + "px")
        .style("left", bottomLeft.x + "px")
        .style("top", topRight.y + "px");

    gMainView.g.attr('transform', 'translate(' + -bottomLeft.x + ', ' + -topRight.y + ')');


    Object.keys(drawnPoints).forEach((key) => {
        drawnPoints[key]
            .attr('cx', function (d) {
                coor = d.geometry.coordinates
                return map.latLngToLayerPoint([coor[1], coor[0]]).x;
            }).attr('cy', function (d) {
                coor = d.geometry.coordinates
                return map.latLngToLayerPoint([coor[1], coor[0]]).y;
            });
    });

    d3.selectAll('path').attr("d", d3Path);
    d3.selectAll('circle')
                .attr('cx', function (d) {
                    coor = d.geometry.coordinates
                    return map.latLngToLayerPoint([coor[1], coor[0]]).x;
                }).attr('cy', function (d) {
                    coor = d.geometry.coordinates
                    return map.latLngToLayerPoint([coor[1], coor[0]]).y;
                });
    Object.keys(drawnStreets).forEach((key) => {
        drawnStreets[key]
            .attr('d', d3Path);
    });
}


// User level drawing functions
function drawStaticPoints({
    mapView,
    data_path,
    name = '',
    class_type = '',
    r = 3,
    attrs = {},
    style = {},
    callback = () => undefined
} = {}) {
    if (class_type === '') {
        class_type = 'element' + drawnPoints.length;
    }
    if (name === '') {
        name = 'element' + drawnPoints.length;
    }

    Promise.all([
            d3.json(data_path)
        ]).then((data) => {
            collection = data[0];
            points = mapView.g.selectAll('circle.' + class_type)
                .data(collection.features)
                .enter()
                .append('circle')
                .attr("r", r)
                .attr("class", class_type)
                .attr('cx', function (d) {
                    coor = d.geometry.coordinates
                    return map.latLngToLayerPoint([coor[1], coor[0]]).x;
                }).attr('cy', function (d) {
                    coor = d.geometry.coordinates
                    return map.latLngToLayerPoint([coor[1], coor[0]]).y;
                });

            Object.keys(attrs).forEach((key) => {
                points.attr(key, attrs[key]);
            });

            Object.keys(style).forEach((key) => {
                points.style(key, style[key]);
            });

            drawnPoints[name] = points;
            reset(mapView);
        })
        .then(callback);
}

function getPoints(name) {
    return drawnPoints[name];
}

function drawPathsFromFile({
    mapView,
    data_path,
    name = '',
    class_type = '',
    attrs = {},
    style = {},
    callback = () => undefined
} = {}) {
    if (class_type === '') {
        class_type = 'element' + drawnElements.length;
    }
    if (name === '') {
        name = 'element' + drawnElements.length;
    }

    Promise.all([d3.json(data_path)])
        .then((data) => {
            collection = data[0];
            paths = mapView.g.selectAll('path.' + class_type)
                .data(collection.features)
                .enter()
                .append('path')
                .attr('class', class_type)
                .attr('d', d3Path);

            Object.keys(attrs).forEach((key) => {
                paths.attr(key, attrs[key]);
            });

            Object.keys(style).forEach((key) => {
                paths.style(key, style[key]);
            });

            drawnStreets[name] = paths;
            reset(mapView);
        })
        .then(callback);
}


function drawPathsFromObject({
    mapView,
    collection,
    name = '',
    class_type = '',
    attrs = {},
    style = {},
    callback = () => undefined} = {}) {

    if (class_type === '') {
        class_type = 'element' + drawnElements.length;
    }
    if (name === '') {
        name = 'element' + drawnElements.length;
    }

    paths = mapView.g.selectAll('path.' + class_type)
        .data(collection.features)
        .enter()
        .append('path')
        .attr('class', class_type)
        .attr('d', d3Path);

    Object.keys(attrs).forEach((key) => {
        paths.attr(key, attrs[key]);
    });

    Object.keys(style).forEach((key) => {
        paths.style(key, style[key]);
    });

    drawnStreets[name] = paths;
    reset(mapView);

    callback();
}

function getPaths(name) {
    return drawnStreets[name];
}

function animatePath({mapView, 
                    path,
                    pointClass = 'truck',
                    edgeClass = 'street-route', 
                    ipath = 0,
                    onEndFunction = () => undefined} = {}){
    
    currentPath = path[ipath];
    time = $("#timer").html();
    addNewEventLog(title=time + " | Calle", text="ID: " + currentPath.properties.osmid);
    pathObject = mapView.g.append('path')
                            .datum(currentPath)
                            .attr("class", edgeClass)
                            .attr("d", d3Path);
    //console.log(pathObject.node())
    
   
    circle = mapView.g.append("circle")
                        .attr("class", pointClass)
                        .attr("r", 3)
                        .attr("transform", function() {
                            var p =  pathObject.node().getPointAtLength(0);
                            return "translate(" + p.x + ", " + p.y + ")";
                        })
                .transition()
                    .ease(d3.easeLinear)
                    .duration(currentPath.properties.time_secs * 1000 / simRatio)
                    .attrTween('transform', function() {
                        return function (t) {
                            var pathLength = pathObject.node().getTotalLength();
                            var p = pathObject.node().getPointAtLength(t * pathLength);
                            pathObject.style("opacity", t);
                            return "translate(" + p.x + ", " + p.y + ")";
                        }
                    })
                    .on("end", function() {
                        //pathObject.remove();
                        d3.select(this).remove();
                        onEndFunction(mapView, path, ipath);
                        
                    })
            

    

}

function startTimer() {
    var t = d3.timer(function (elapsed) {
        
        var realMili = simRatio * elapsed;
        var minutes = Math.floor(realMili / (60000));
        var miliseconds = realMili % (60000);
        var seconds = Math.floor(miliseconds / 1000);

        returnStr = ('0' + minutes).slice(-2) + ":" + ('0' + seconds).slice(-2);
        $("#timer").html(returnStr);
    }, 100)
    return t;
}