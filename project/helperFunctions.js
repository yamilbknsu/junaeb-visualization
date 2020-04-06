$(document).ready(() =>{
    $('#region-selector').prop('selectedIndex', 0);
    $('#strategy-selector').prop('selectedIndex', 0);

    // Some GUI elements setup
    $('#overlay-region-button-0').click(() => {
        obj = $('#overlay-region-button-0');
        if (!obj.hasClass('region-selected')){
            obj.toggleClass('region-selected');
            $('#overlay-region-button-1').toggleClass('region-selected');
            region_selected = 0;
        }
    });
    $('#overlay-region-button-1').click(() => {
        obj = $('#overlay-region-button-1');
        if (!obj.hasClass('region-selected')){
            obj.toggleClass('region-selected');
            $('#overlay-region-button-0').toggleClass('region-selected');
            region_selected = 1;
        }
    });
});

function loadCorrectMap(){
    d3.select("#viz-container").selectAll("*").remove();
    if (region_selected == 1) {

        mapView = newMapVisualization(concepcionCoords.center,
                                      concepcionCoords.bounds,
                                      load_callback = () => 1,
                                      zomm_level = 12);

        drawStaticPoints({
            mapView: mapView,
            data_path: 'data/ccp/schools_ccp.geojson',
            name: 'schools',
            r: 4,
            class_type: 'school',
            attrs: {'id': (d, i) => 'school_' + d.properties.node_id},
            callback: () => {
                getPoints('schools').append('title').text((d) =>
                    'School ID: ' + d.properties.node_id)}});
    } else {
        mapView = newMapVisualization(nubleCoords.center,
                                      nubleCoords.bounds,
                                      load_callback = () => 1,
                                      zomm_level = 12);

        //TODO: Check the id's, this will probably be fixed when the data is corrected
        drawStaticPoints({mapView: mapView,
                         data_path: 'data/nuble/schools_nuble.geojson',
                         name: 'schools',
                         r: 4,
                         class_type: 'school',
                         attrs: {'id': (d, i) => 'school_' + d.properties.node_id},
                         callback: () => {
                             getPoints('schools').append('title').text((d) =>
                                 'School ID: ' + d.properties.node_id)}});
    }

    return mapView;
}

function overlayInAnimations() {
    d3.select('#region-title')
      .transition()
      .duration(1500)
      .style('transform', 'translateY(0px)')
      .style('opacity', 1);
}

function onRegionChanged(region){
    region_selected = region;

    if(region_selected == 0){
        d3.select('#overlay-panel')
          .style('display', 'block')
          .transition()
          .duration(1500)
          .style('opacity', 1);

        overlayInAnimations();
    }else{
        d3.select('#region-title')
          .transition()
          .duration(1500)
          .style('opacity', 0)
          .style('transform', 'translateY(-100px)')
          .on('end', ()=>{
              d3.select('#region-title')
              .style('transform', 'translateY(100px)')
          });
        
        if(animation_selected == 0){
            d3.select('#strategy-title')
              .transition()
              .duration(1500)
              .style('opacity', 1)
              .style('transform', 'translateY(0px)');
        }
    }

    if(animation_selected != 0 && region_selected != 0){
        prepareAnimation();
    }
}


function onStrategyChanged(strategy){
    animation_selected = strategy;

    if(animation_selected == 0){
        d3.select('#overlay-panel')
          .style('display', 'block')
          .transition()
          .duration(1500)
          .style('opacity', 1);

        overlayInAnimations();
    }else{
        d3.select('#strategy-title')
          .transition()
          .duration(1500)
          .style('opacity', 0)
          .style('transform', 'translateY(-100px)')
          .on('end', ()=>{
              d3.select('#strategy-title')
              .style('transform', 'translateY(100px)')

              d3.select('#overlay-panel')
                .style('display', 'none');
          });
    }
    
    if(animation_selected != 0 && region_selected != 0){
        prepareAnimation();
    }
}

function showAnimationInterface(){
    d3.select('#user-interface')
        .style('opacity', 0)
        .style('transform', 'translateY(-100px)')
      .transition()
      .duration(1000)
      .style('opacity', 1)
      .style('transform', 'translateY(0px)');
}

function hideAnimationInterface(){
    d3.select('#user-interface')
      .transition()
      .duration(1000)
      .style('opacity', 0)
      .style('transform', 'translateY(-100px)');
}

function secondsToStr(seconds){
    hours = Math.floor(seconds/3600);
    seconds = seconds%3600;
    minutes = Math.floor(seconds/60);
    seconds = seconds%60;

    string = "";
    if (hours != 0) string += ("0" + hours).slice(-2) + ":"
    if (minutes != 0) string += ("0" + minutes).slice(-2) + ":"
    string += ("0" + seconds).slice(-2);
    return string;
}