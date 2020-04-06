// Global variables
let timer, animation_selected = 0, region_selected = 0;

// State variables
var servedStudents = [],
    totalStudents = 0;

$("#clear-button").on("click", clear);
$("#pause-button").on("click", pause);

// Some hardcoded data (?)
var concepcionCoords = {
    center: new Coords(-36.8181067, -73.0488407),
    bounds: [new Coords(-37.4684, -73.2594),
        new Coords(-36.4250, -72.6326)
    ]
};
var nubleCoords = {
    center: new Coords(-36.60530775, -72.06340725),
    bounds: [new Coords(-37.188356300, -72.873690400),
        new Coords(-36.022259200, -71.253124100)
    ]
};

// Load map view
var mapView = newMapVisualization(concepcionCoords.center,
    concepcionCoords.bounds,
    load_callback = overlayInAnimations,
    zomm_level = 12);

drawStaticPoints({
    mapView: mapView,
    data_path: 'data/ccp/schools_ccp.geojson',
    name: 'schools',
    r: 4,
    class_type: 'school',
    attrs: {
        'id': (d, i) => 'school_' + d.properties.node_id
    },
    callback: () => {
        getPoints('schools').append('title').text((d) =>
            'School ID: ' + d.properties.node_id)
    }
});


function prepareAnimation() {
    hideAnimationInterface();

    // Update mapview to selected region
    mapView = loadCorrectMap();

    // Load the data
    if(region_selected == 1){
        //edges_car_file = '../data/ccp_WGS84.geojson';
        //edges_walking_file = '../data/ccp_walking_WGS84.geojson';
        edges_file = animation_selected == 1 ? '../data/ccp/ccp_WGS84.geojson' : '../data/ccp/ccp_walking_WGS84.geojson';
        students_file = animation_selected == 1 ? '../data/ccp/students_agg_ccp.geojson':'../data/ccp/students_ccp.geojson';
        if (animation_selected == 1) assignments_file = '../data/ccp/agg_assignments_ccp.json';
        else assignments_file = animation_selected == 3 ? '../data/ccp/nearestschool_assignment_ccp.json':'../data/ccp/actualschool_assignment_ccp.json'

        if (animation_selected == 1) routes_file = '../data/ccp/agg_routes_school_ccp.json';
        else routes_file = animation_selected == 2 ? '../data/ccp/students_actual_school_paths_ccp.json':
                                                '../data/ccp/students_nearest_school_paths_ccp.json';
    }else{
        edges_file = animation_selected == 1 ? '../data/nuble/nuble_WGS84.geojson' : '../data/nuble/nuble_walking_WGS84.geojson';
        students_file = animation_selected == 1 ? '../data/nuble/students_agg_nuble.geojson':'../data/nuble/students_nuble.geojson';
        if (animation_selected == 1) assignments_file = '../data/nuble/';
        else assignments_file = animation_selected == 3 ? '../data/nuble/':'../data/nuble/'

        if (animation_selected == 1) routes_file = '../data/nuble/nuble_agg_routes_school_links.json';
        else routes_file = animation_selected == 2 ? '../data/nuble/':
                                                '../data/nuble/';
    }

    Promise.all([d3.json(edges_file), d3.json(students_file),
                 d3.json(assignments_file), d3.json(routes_file)])
    .then((data) => {
        edges = data[0];
        students = data[1];
        assignments = data[2];
        routes = data[3];
        
        mapView.g.selectAll('circle.school')
                .on('click', function (d, i, n) {
                pause().then(clear).then(function () {
                    if (typeof (timer) !== "undefined") {
                        timer.stop();
                    }
                    if (animation_selected == 0) {
                        alert("Debes seleccionar una estrategia!");
                    } else{
                        d3.select(n[i]).attr('r', 6)
                          .classed('school-selected', true);

                        schoolAssignments = assignments[d.properties.node_id]
                        assignedStudentsFeature = students.features.filter(student => 
                                                  schoolAssignments.includes(student.properties.node_id))
                        projectAssignments(assignedStudentsFeature);

                        if (animation_selected == 1){
                            sp = []
                            routes[d.properties.node_id].forEach(edgeID => sp.push(edges.features.find(edge => edge.properties.osmid == edgeID)));
                                             
                            servedStudents = [];
                            totalStudents = assignedStudentsFeature.length;
                            totalTime = 0
                            sp.forEach(path => totalTime += path.properties.time_secs)
                            
                            d3.select("#school-title").html(d.properties.node_id);
                            d3.select('#student-amount-indicator').html(servedStudents.length + '/' + totalStudents);
                            d3.select('#total-time-indicator').html(secondsToStr(Math.floor(totalTime)));
                            showAnimationInterface();
    
                            
                        }else{
                            // DO something
                        }

                        $('.btn-disabled').toggleClass('btn-disabled');

                        d3.select("#play-button").on("click", function () {

                            timer = startTimer();
    
                            if (animation_selected == 1) {
                                animateSchoolRoute(sp, schoolAssignments, timer);
                            } else if (animation_selected == 2 || animation_selected == 3) {
                                animateStudentsWalk(routes[d.properties.node_id], edges, schoolAssignments, timer);
                            }
                        });
                    }
                        
                });

            });
    });
}


function projectAssignments(assignedStudentsFeature) {

    mapView.g.selectAll('circle.student-unserved')
        .data(assignedStudentsFeature)
        .enter()
        .append("circle")
        .attr("class", "student-unserved")
        .attr("id", function (d) {
            id = d.properties.osmid === undefined ? d.properties.node_id : d.properties.osmid
            return 's' + String(id);
        })
        .attr('cx', function (d) {
            coor = d.geometry.coordinates
            return map.latLngToLayerPoint([coor[1], coor[0]]).x;
        }).attr('cy', function (d) {
            coor = d.geometry.coordinates
            return map.latLngToLayerPoint([coor[1], coor[0]]).y;
        })
        .attr("r", 3);
}

function animateSchoolRoute(sp, assignments, timer = undefined) {

    // this function is project-specific thats why is here.
    animateNextPath = (
        mapView,
        path,
        ipath,
        r
    ) => {
        if (ipath < path.length - 1) {
            delay = 0
            endNode = path[ipath].properties.v;
            if (assignments.includes(endNode)) {
                time = $("#timer").html();
                if (!servedStudents.includes(endNode)) servedStudents.push(endNode);
                d3.select('#student-amount-indicator').html(servedStudents.length + '/' + totalStudents);
                //addNewEventLog(title = time + " | Estudiante", text = "ID: " + endNode);
                d3.select("circle#s" + endNode)
                    .attr("class", "student-served");
            }

            animatePath({
                mapView: mapView,
                path: path,
                ipath: ipath + 1,
                r: r,
                onEndFunction: animateNextPath
            });



        } else {
            timer.stop();
        }
    }
    animatePath({
        mapView: mapView,
        path: sp,
        r: 4,
        onEndFunction: animateNextPath
    });


}

function animateStudentsWalk(routes, edges, timer) {
    var ended = 0;

    // this function is project-specific thats why is here.
    /* Creo que para hacer esto vamos a tener que hacer que la función animatePath retorne una promesa.
    El problema es que no se como meter eso con la recusrividad. La otra opción es ocupar queue defer, que como dije
    por el grupo está deprecated. Also, creo que los paths están como el pic again.
    */
    animateNextPath = (
        mapView,
        path,
        ipath,
        r,
        edgeClass,
        pointClass,
        transient
    ) => {
        if (ipath < path.length - 1) {
            delay = 0;
            animatePath({
                mapView: mapView,
                path: path,
                ipath: ipath + 1,
                edgeClass: edgeClass,
                pointClass: pointClass,
                r: r,
                onEndFunction: animateNextPath,
                transient: transient
            });
        } else {
            ended++;
            if (ended == routes.length) {
                console.log('All Routes Ended');
                timer.stop();
            }
        }
    }

    Object.entries(routes).forEach((route) => {
        student_id = route[0];
        d3.select('#s'+student_id).remove();
        sp_ids = route[1];

        sp = []
        sp_ids.forEach(edgeID => sp.push(edges.features.find(edge => edge.properties.osmid == edgeID)))

        animatePath({
            mapView: mapView,
            path: sp,
            pointClass: 'student-walking',
            edgeClass: 'street',
            r:3,
            onEndFunction: animateNextPath,
            ipath: 0,
            transient: true
        });

    });
}

function pause() {
    return new Promise(function (resolve, reject) {
        console.log('Pause')
        d3.selectAll('circle.truck').interrupt();
        d3.selectAll('circle.student-static').interrupt();
        d3.selectAll('path.street-route').interrupt();
        resolve();
    })
}

function clear() {
    return new Promise(function (resolve, reject) {
        console.log('Clear View')
        d3.selectAll('circle.truck').remove();
        d3.selectAll('circle.student-served').remove();
        d3.selectAll('circle.student-unserved').remove();
        d3.selectAll('path.street-route').remove();
        d3.selectAll('circle.school')
            .attr('r', 3)
            .classed('school-selected', false);
        resolve();
    })
}