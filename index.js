let html_ids,
    backendUp;

let wWidth = 1280,
    wHeight = 720;

// Initialize important values
init();

// Initialize backend connection
// openBackendConnection();

function init(){
    html_ids = {}
    html_ids['backendState'] = 'backend-state';
    html_ids['backendStateText'] = 'backend-state-text';
    html_ids['activityLog'] = 'activity-log';

    backendUp = false;

    onWindowResize();
}

function updateBackendState(heartBeat = false){
    if (heartBeat){
        $('#' + html_ids['backendState'])
            .css('background-color', '#EECF1E');
    }
    else if (backendUp){
        $('#' + html_ids['backendStateText'])
            .text("Backend Connected");
        $('#' + html_ids['backendState'])
            .css('background-color', '#1EA01E');
    }else{
        $('#' + html_ids['backendStateText'])
                .text("Backend Disconnected");
        $('#' + html_ids['backendState'])
        .css('background-color', '#911100');
    }
}

function onWindowResize(){
    wWidth = window.innerWidth;
    wHeight = window.innerHeight;

    $('#viz-container').css({'height': wHeight + 'px', 'width': wWidth + 'px'});
    $('.side-bar-container').css('height', (wHeight - 25) + 'px');
    $('#footer-bar').css('width', wWidth + 'px');
}

function addNewEventLog(title, text = ''){
    var log = document.getElementById(html_ids['activityLog']);
    log.insertAdjacentHTML('afterbegin', 
    '<div class="event-log"> \
        <h4>'+ title +'</h4> \
        <p>'+ text +'</p></div>');
}