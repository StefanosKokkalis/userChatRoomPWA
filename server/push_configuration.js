const http = require('http');
const push = require(`${__dirname}/../server/push.js`);
http.createServer( (request, response) => {

    // Enable CORS
    response.setHeader('Access-Control-Allow-Origin', '*');

    // Get request vars
    const { url, method } = request;

    // Subscribe
    if ( method === 'POST' && url.match(/^\/subscribe\/?/) ) {

        // Get POST Body
        let body = [];

        // Read body stream
        request.on( 'data', chunk => body.push(chunk) ).on( 'end', () => {

          // Parse subscription body to object
          let subscription = JSON.parse(body.toString());

          // Store subscription for push notifications
          push.addSubscription( subscription );

          // Respond
          response.end('Subscribed');
        })

      // Public Key
      } else if ( url.match(/^\/key\/?/) ) {

        // Respond with public key from push module
        response.end( push.getKey() );

      // Push Notification
      } else if ( method === 'POST' && url.match(/^\/push\/?/) ) {

        // Get POST Body
        let body = [];

        // Read body stream
        request.on( 'data', chunk => body.push(chunk) ).on( 'end', () => {
          push.send( body.toString() );
          response.end('Push sent');
        })
      // Not Found
    } else {

      response.status = 404;
      response.end('Error: Unknown Request');
    }


}).listen( 3333, () => { console.log('Push Server Running on 3333') });