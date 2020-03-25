
var routes;  // Useless?; YES
let timer, animation_selected;

$("#clear-button").on("click", clear);
$("#pause-button").on("click", pause);

// Load map view
mapView = newMapVisualization(new Coords(-36.8181067,-73.0488407), 
                             [new Coords(-37.4684,-73.2594), 
                              new Coords(-36.4250, -72.6326)],
                              load_callback = overlayInAnimations,
                              zomm_level=12)

drawStaticPoints({mapView: mapView,
                 data_path:'data/schools_ccp.geojson', 
                 name: 'schools',
                 r: 4,
                 class_type: 'school',
                attrs:{'id': (d,i) => 'school_'+d.properties.node_id},
                callback: () => {
                    getPoints('schools').append('title').text((d) => 
                            'School ID: ' + d.properties.node_id)
                }});

function prepareAnimation(){
    Promise.all([d3.json('data/school_links.json'),
                 d3.json('data/ccp_WGS84.geojson'),
                 d3.json('data/students_agg_ccp.geojson'),
                 d3.json('data/school_agg_assignments.json'),
                 d3.json('data/students_paths.json'),
                 d3.json('data/school_student_assignment.json'),
                 d3.json('data/students_ccp.geojson')])
            .then((data)=>{
                routes = data[0]; 
                edges = data[1];
                students_agg = data[2];
                assignments_agg = data[3];

                students_path = data[4];
                assignments_student = data[5];
                students = data[6];
                
                mapView.g.selectAll('circle.school')
                    .on('click', function(d) {
                        animation_selected = parseInt($("#strategy-selector").val());
                        console.log(animation_selected);
                        pause().then(clear).then(function () {
                            if (typeof(timer) !== "undefined") {
                                timer.stop();
                            }
                            if (animation_selected == 0){
                                alert("Debes seleccionar una estrategia!");
                            }
                            else if(animation_selected == 1){
                                schoolAssignments = assignments_agg[d.properties.node_id]
                                projectAssignments(schoolAssignments, students_agg);
                            }else if(animation_selected == 2){
                                schoolAssignments = assignments_student[d.properties.node_id]
                                projectAssignments(schoolAssignments, students);
                            }                           


                            d3.select("#school-display").html("School: " + d.properties.node_id);
                            d3.select("#play-button").on("click", function () {
                                
                                timer = startTimer();
                                
                                if(animation_selected == 1){
                                    animateSchoolRoute(routes[d.properties.node_id], edges, schoolAssignments, timer);
                                }else if(animation_selected == 2){
                                    animateStudentsWalk(students_path[d.properties.node_id], edges, assignments_student, timer);
                                }
                            });
                            
                        });

                    });
            });
}


function projectAssignments(schoolAssignments, students) {
    assignedStudentsFeature = students.features.filter(student => schoolAssignments.includes(student.properties.node_id))

    mapView.g.selectAll('circle.student-unserved')
            .data(assignedStudentsFeature)
            .enter()
            .append("circle")
            .attr("class", "student-unserved")
            .attr("id", function (d) {
                return 's' + d.properties.osmid;
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

function animateSchoolRoute(route, edges, assignments, timer=undefined) {
    
    sp = []
    route.forEach(edgeID => sp.push(edges.features.find(edge => edge.properties.osmid == edgeID)))
    
    // this function is project-specific thats why is here.
    animateNextPath = (
        mapView,
        path,
        ipath
        ) => {
        if (ipath < path.length - 1) {
            delay = 0
            endNode = path[ipath].properties.v;
            if(assignments.includes(endNode)){
                time = $("#timer").html();
                addNewEventLog(title=time + " | Estudiante", text="ID: " + endNode);
                d3.select("circle#s" + endNode)
                    .attr("class", "student-served");
            }
            
            animatePath({mapView: mapView, 
                         path: path, 
                         ipath: ipath + 1,  
                         onEndFunction: animateNextPath});
            
            

        } else {
            timer.stop();
        }
    }
    animatePath({mapView: mapView,
                 path: sp,
                 onEndFunction: animateNextPath}
                );
    
    
}

function animateStudentsWalk(routes, edges, timer){
    var ended = 0;
    Object.entries(routes).forEach((route) => {
        school_id = route[0];
        sp_ids = route[1];

        sp = []
        sp_ids.forEach(edgeID => sp.push(edges.features.find(edge => edge.properties.osmid == edgeID)))
        
        // this function is project-specific thats why is here.
        /* Creo que para hacer esto vamos a tener que hacer que la función animatePath retorne una promesa.
        El problema es que no se como meter eso con la recusrividad. La otra opción es ocupar queue defer, que como dije
        por el grupo está deprecated. Also, creo que los paths están como el pic again.
        */
        animateNextPath = (
            mapView,
            path,
            ipath
            ) => {
            if (ipath < path.length - 1) {
                delay = 0;
                animatePath({mapView: mapView, 
                            path: path, 
                            ipath: ipath + 1,  
                            onEndFunction: animateNextPath});
            } else {
                ended++;
                if (ended == routes.length) {
                    console.log('All Routes Ended');
                    timer.stop();
                }
            }
        }
        animatePath({mapView: mapView,
                    path: sp,
                    pointClass: 'student-unserved',
                    onEndFunction: animateNextPath}
                    );
        });
}

function pause() {
    return new Promise(function(resolve, reject) {
        console.log('Pause')
        d3.selectAll('circle.truck').interrupt();
        d3.selectAll('circle.student-static').interrupt();
        d3.selectAll('path.street-route').interrupt();
        resolve();
    })
}

function clear() {
    return new Promise(function(resolve, reject) {
        console.log('Clear View')
        d3.selectAll('circle.truck').remove();
        d3.selectAll('circle.student-served').remove();
        d3.selectAll('circle.student-unserved').remove();
        d3.selectAll('path.street-route').remove();
        resolve();
    })
}

function overlayInAnimations(){
    d3.select('#overlay-header')
      .transition()
      .duration(400)
      .style('opacity', 1);
    
    d3.select('#overlay-buttons')
      .transition()
      .duration(400)
      .style('opacity', 1);
}

function overlayOutAnimations(mode_selected){
    animation_selected = mode_selected;
    exitDuration = 500;

    // Hide the panel
    d3.select('#overlay-panel')
      .transition()
      .duration(exitDuration)
      .style('opacity', 0)
      .on('end', ()=> d3.select('#overlay-panel').style('display', 'none'));

    // Show side panel and footer
    d3.select('.side-bar-container')
      .transition()
      .duration(exitDuration)
      .style('width', '300px');
    
    d3.select('#footer-bar')
      .transition()
      .duration(exitDuration)
      .style('bottom', '0px');
    
      prepareAnimation();
}