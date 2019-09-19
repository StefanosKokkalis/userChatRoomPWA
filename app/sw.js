// SW Version
const version = '1.0';

// Static Cache - App Shell
const appAssets = [
    '/classes/message.js',
    '/classes/camera.js',
    '/views/partials/header.hbs',
    '/views/partials/footer.hbs',
    '/views/login.hbs',
    '/views/profile.hbs',
    '/views/room.hbs',
    '/views/register.hbs',
    '/profile.js',
    '/room.js'
];


// SW Install
self.addEventListener( 'install', e => {
    e.waitUntil(
        caches.open( `static-${version}` )
            .then( cache => cache.addAll(appAssets) )
    );
});

// SW Activate
self.addEventListener( 'activate', e => {

    // Clean static cache
    let cleaned = caches.keys().then( keys => {
        keys.forEach( key => {
            if ( key !== `static-${version}` && key.match('static-') ) {
                return caches.delete(key);
            }
        });
    });
    e.waitUntil(cleaned);
});

// SW listens for notification
self.addEventListener('push',(e) => {
    console.log(e);
    self.registration.showNotification( e.data.text() );
});

// SW Fetch
self.addEventListener('fetch', (e) => {

    // App shell
    if( e.request.url.match(location.origin) ) {
        e.respondWith( staticCache(e.request) );
    // font-awesome
    } else if ( e.request.url.match('use.fontawesome.com') ) {
        e.respondWith( fallbackCache(e.request) );
    }
    
});



// Static cache startegy - Cache with Network Fallback
const staticCache = ( req, cacheName = `static-${version}` ) => {

    return caches.match(req).then( cachedRes => {

        // Return cached response if found
        if(cachedRes) return cachedRes;

        // Fall back to network
        return fetch(req).then ( networkRes => {

            // Update cache with new response
            caches.open(cacheName)
                .then( cache => cache.put( req, networkRes ));

            // Return Clone of Network Response
            return networkRes.clone();
        });
    });
};

// Network with Cache Fallback
const fallbackCache = (req, cacheName = `static-${version}`) => {

    // Try Network
    return fetch(req).then( networkRes => {

        // Check res is OK, else go to cache
        if( !networkRes.ok ) throw 'Fetch Error';

        // Update cache
        caches.open( cacheName )
            .then( cache => cache.put( req, networkRes ) );

        // Return Clone of Network Response
        return networkRes.clone();
    })
    
    // Try cache
    .catch( err => caches.match(req) );
};






