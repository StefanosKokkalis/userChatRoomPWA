// Init new camera instance on the video player
const camera = new Camera( $("#player")[0] );


// Main app logic
const _init = (userName) => {
    console.log("App running");
    
    const username = userName;
    
    // Init new message instance
    const messages = new Message();
    
    //Notify user of connection errors
    window.addEventListener('messages_error', () => {
        toastr.error('Messages could not be retrieved.<br>Will keep trying.', 'Network Connection Error');
    });
    
    
   //Listen for existing messages from server
    window.addEventListener('messages_ready', () => {
        
        //remove the loader
        $('#loader').remove();
        
        //check some messages exist
        if ( messages.all.length == 0) toastr.info('Add the first message.', 'No messages');
        
        //Empty our existing messages if this update is from a reconnection
        $('messages').empty();
        
        //loop and render all messages [reverse as were prepending]
        messages.all.reverse().forEach( renderMessage );
    });
    
    //Listen for new message event
    window.addEventListener('new_message', (e) => {
        renderMessage( e.detail );
    });
    
    //Switch on camera in viewfinder
    $("#viewfinder").on("show.bs.modal", () => {
        console.log("camera on");
        camera.switch_on();
    });
    
    $("#viewfinder").on("hidden.bs.modal", () => {
        console.log("camera off");
        camera.switch_on();
    });
    
    //Take Photo
    $("#shutter").on("click", () => {
        //console.log("take photo") ;
        let photo = camera.take_photo();
        
        //show photo preview in camera button
        $("#camera").css("background-image", `url(${photo})`).addClass('withphoto');
    });
    
    //Submit Photo
    $("#send").on("click", () => {
         
        //Get caption text
        let caption = $("#caption").val();
        
        //Check message if ok
        if(!camera.photo || !caption) {
            
            //Show notification and return
            toastr.warning('Photo & Caption Required.', 'Incomplete Message');
            return;
        }
        
        
        let message = messages.add (username, camera.photo, caption);
        
        console.log(messages.all);
        
       
        // Render new message in feed
        //renderMessage({photo: camera.photo, caption: caption});
        renderMessage( message );
        
        // Reset caption yyfield on success
        $('#caption').val('');
        $('#camera').css('background-image','').removeClass('withphoto');
        camera.photo = null;
        
    });
}

// Create new message element
const renderMessage = (message) => {
    // Message HTML
    let msgHtml = `<div style="display:none;" class="row message bg-light mb-2 rounded shadow">
                        <div class="col-2 p-1">
                            <img src="${message.photo}" class="photo w-100 rounded">
                        </div>
                        <div class="col-10 p-1">
                            <div class='row'>
                            <p class='names'>${message.username}</p>
                            </div>
                            <div class='row'>
                            <p class='messages'>${message.caption}</p>
                            </div>
                        </div>
                    </div>`;
    
    $(msgHtml).prependTo('#messages').show(500)
    
    //bind a click handler on new img element to show in modal
    .find('img').on("click",showPhoto);
};


// Show message photo in modal
const showPhoto = (e) => {
//    console.log("Showing Photo");
    
    // get photo source
    let photoSrc = $(e.currentTarget).attr('src');
    
    // set to and show photo()
    $('#photoframe img').attr('src', photoSrc);
    $('#photoframe').modal('show');
    
}