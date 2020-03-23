// Load map view
mapView = newMapVisualization(new Coords(-36.8181067,-73.0488407), 
                             [new Coords(-37.4684,-73.2594), 
                              new Coords(-36.4250, -72.6326)],
                              zomm_level=14)
/*
drawStaticPoints({mapView: mapView,
                data_path: 'data/students_ccp.geojson', 
                name: 'students',
                class_type:'student-static',
                r: 3,
                attrs: {'stroke': 'rgb(79, 56, 141)',
                         'stroke-width': 1,
                        'id': (d,i) => 'student_' + d.properties.osmid},
                callback: () => {
                    getPoints('students').append('title').text((d) => 
                            'Student ID: ' + d.properties.osmid + '\n'
                            +'Number of students: ' + d.properties.student_co)
                }});
*/
drawStaticPoints({mapView: mapView,
                 data_path:'data/schools_ccp.geojson', 
                 name: 'schools',
                 r: 5,
                 class_type: 'school',
                attrs:{'id': (d,i) => 'school_'+d.properties.node_id},
                callback: () => {
                    getPoints('schools').append('title').text((d) => 
                            'School ID: ' + d.properties.node_id)
                }});

var routes;            
//colors = ['#FF4500', '#E6E6FA', '#FFF0F5', '#FA8072', '#9400D3', '#87CEFA', '#FFFFF0', '#778899', '#F5F5DC']

Promise.all([d3.json('data/school_links.json'),
             d3.json('data/ccp_final_WGS84.geojson')],
             d3.json('data/students_ccp.geojson'))
.then((data)=>{
    routes = data[0]; 
    edges = data[1];
    students = data[2];

    route = routes['c4561']
    
    sp = edges.features.filter(edge => route.includes(edges.features.indexOf(edge)))
    console.log(sp)

    animatePath(mapView, sp)
    
    

    
});


/*
drawPaths({mapView: mapView,
    data_path:'static/project_specific/data/ccp_network_corrected_WGS84.geojson',
    name: 'streets',
    class_type: 'street',
    attrs: {'id': (d,i) => 'street_' + d.properties.id}/*,
callback: highlightRoutes});*/