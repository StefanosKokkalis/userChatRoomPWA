// Camera's class
class Camera {
    constructor( video_node ) {
        //Camera stream DOM node
        this.video_node = video_node;
    }
    
    //camera feed viewfinder on
    switch_on() {
        console.log('IELAAAA');
        //get camera media stream and set on player <video>
        navigator.mediaDevices.getUserMedia({
            video: {width: 600, height: 600},
            audio: false
        }).then( stream => {
            this.video_node.srcObject = this.stream = stream;
            console.log("camera switched on");
        }).catch( (err) => {
            console.log(err, 'something went wrong');
        })
    }
    
    //camera feed viewfinder off
    switch_off() {
        // pause video node
        this.video_node.pause();
        //stop media stream
        this.stream.getTracks()[0].stop();
    }
    
    //camera photo from camera stream
    take_photo() {
        
        //create a <canvas> element to render the photo
        let canvas = document.createElement('canvas');
        canvas.setAttribute('height', 600);
        canvas.setAttribute('width', 600);
        
        // get camera context
        let context = canvas.getContext('2d');
        
        //draw (render) the image on the canvas
        context.drawImage(this.video_node, 0, 0, canvas.width, canvas.height);
        
        //get the canvas image as data url
        this.photo = context.canvas.toDataURL();
        
        //destroy canvas
        context = null;
        canvas = null;
        
        return this.photo;
    }
}


