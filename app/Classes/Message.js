class Message {
    constructor() {
        this.messages = [];
        
        //connect to socket server
        this.socket = io();
        
        //Handle connection error
        this.socket.once('connect_error', () => {
            
            // Notify main.js via an event
            window.dispatchEvent( new Event('messages_error') );
        });
        
        //listen for all server messages (send or connect)
        this.socket.on('all_messages', (messages) => {
            
            //update local messages array
            this.messages = messages;
            
            //notify client via an event
            window.dispatchEvent( new Event('messages_ready') );
        });
        
        //listen for new message from server
        this.socket.on('new_message', (message) => {
            
            //add to local messages
            this.messages.unshift(message);
            
            //notify client via custom event
            window.dispatchEvent( new CustomEvent('new_message', {detail: message}) );
        });
    }
    
    //Get all messages
    get all() {
        return this.messages;
    }
    
    //Add a new message
    add(user_name, data_url, caption_text) {
        
        //create message obj
        let message = {
            username: user_name,
            photo : data_url,
            caption : caption_text
        }
        
         // add to local messages
        this.messages.unshift(message);

        //emit to server
        console.log('sending to server');
        this.socket.emit('new_message', message);

        //return formatted message obj
        return message;
    }
}