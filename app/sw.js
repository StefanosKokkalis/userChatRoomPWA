// SW Version
const version = '1.3';

// Static Cache - App Shell
const appAssets = [
    '/Classes/Message.js',
    '/Classes/Camera.js'
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



// SW Fetch
self.addEventListener('fetch', e => {

    // App shell
    if( e.request.url.match(location.origin) ) {
        e.respondWith( staticCache(e.request) );
    
    // font-awesome
    } else if ( e.request.url.match('use.fontawesome.com') ) {
        e.respondWith( fallbackCache(e.request) );
    }
    
});

// Listen for message from client
self.addEventListener('message', e => {

	//Identify the message
//	if( e.data.action === 'cleanGiphyCache' ) cleanGiphyCache(e.data.gifs);
});


///**
// * Welcome to your Workbox-powered service worker!
// *
// * You'll need to register this file in your web app and you should
// * disable HTTP caching for this file too.
// * See https://goo.gl/nhQhGp
// *
// * The rest of the code is auto-generated. Please don't update this file
// * directly; instead, make changes to your Workbox build configuration
// * and re-run your build process.
// * See https://goo.gl/2aRDsh
// */
//
//importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");
//
//workbox.core.skipWaiting();
//
//workbox.core.clientsClaim();
//
//// Cache .js files - cache first
//workbox.routing.registerRoute(/\.hbs$/,workbox.strategies.networkFirst());
//workbox.routing.registerRoute(/\.js$/,workbox.strategies.networkFirst());
//
//
///**
// * The workboxSW.precacheAndRoute() method efficiently caches and responds to
// * requests for URLs in the manifest.
// * See https://goo.gl/S9QRab
// */
//
//self.__precacheManifest = [
////  {
////    "url": "index.html",
////    "revision": "c22d5e8364cb44e095427a2026bb1ab2"
////  },
//  {
//    "url": "main.js",
//    "revision": "823c6f544e467756019cb8ccdf3e8380"
//  },
//  {
//    "url": "Classes/Camera.js",
//    "revision": "ba4646ff12e131590371cd9fdca212b2"
//  },
//  {
//    "url": "Classes/Message.js",
//    "revision": "089928f96200627d34224b9bf62de0a4"
//  }
//].concat(self.__precacheManifest || []);
//workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
//
//workbox.routing.registerRoute(/\.(css|js)/, new workbox.strategies.CacheFirst(), 'GET');
//workbox.routing.registerRoute(/^https:\/\/use\.fontawesome\.com.*/, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"fontawesome", plugins: [] }), 'GET');
