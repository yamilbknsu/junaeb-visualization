// Load map view
mapView = newMapVisualization(new Coords(-36.8181067,-73.0488407), 
                             [new Coords(-37.4684,-73.2594), 
                              new Coords(-36.4250, -72.6326)],
                              zomm_level=14)

$("#clear-button").on("click", clear);

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

var routes;            
//colors = ['#FF4500', '#E6E6FA', '#FFF0F5', '#FA8072', '#9400D3', '#87CEFA', '#FFFFF0', '#778899', '#F5F5DC']

Promise.all([d3.json('data/school_links.json'),
             d3.json('data/ccp_final_WGS84.geojson'),
             d3.json('data/students_ccp.geojson'),
            d3.json('data/school_student_assignments.json')])
.then((data)=>{
    routes = data[0]; 
    edges = data[1];
    students = data[2];
    assignments = data[3];
    
    mapView.g.selectAll('circle.school')
        .on('click', function(d) {
            pause().then(clear).then(function () {
                schoolAssignments = assignments[d.properties.node_id]
                projectAssignments(schoolAssignments, students);
                d3.select("#school-display").html("School: " + d.properties.node_id);
                d3.select("#play-button").on("click", function () {
                    timer = startTimer();
                    animateSchoolRoute(routes[d.properties.node_id], edges, schoolAssignments, timer);
                });
                
            });

        });
});

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
/*
drawPaths({mapView: mapView,
    data_path:'static/project_specific/data/ccp_network_corrected_WGS84.geojson',
    name: 'streets',
    class_type: 'street',
    attrs: {'id': (d,i) => 'street_' + d.properties.id}/*,
callback: highlightRoutes});*/