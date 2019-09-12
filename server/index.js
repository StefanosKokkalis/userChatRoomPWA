// APP COMPONENTS
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const fs = require('fs');
const hbs = require('hbs');
const bodyParser = require('body-parser');
//
// CREATE HTTP SERVER
const app = express();
const server = http.Server(app);
//
// AUTHENTICATION 
// To make validator work we must use 5.3.1, a downgraded version of the installed default version.
const db = require(`${__dirname}/../db/db.js`);
const expressValidator = require('express-validator');
const saltRounds = 10;
const session = require('express-session');
const MySQLStore = require('express-mysql-session') (session);
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


// INITIALIZE AUTH
var user_obj = {};
const options = {
    host: 'localhost',
    user: 'root',
    password: '1312koufala!!',
    database: 'photomessageapp'
}

//Define sessionStore, if also sessions table doesnt exist, create it automatically
const sessionStore = new MySQLStore(options);

app.use(session({
//    store: sessionStore,
    secret: 'iowjcxz3ivjewqn',
    resave: false,
    saveUninitialized: true
//    cookie: { path: '/', httpOnly: true, secure: false, maxAge: null }
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(function(req,res,next){
    //Data passing to Profile HTML
    res.locals.isAuthenticated = req.isAuthenticated();
//    res.locals.currentUser = req.user;
//    console.log("currentUser", res.locals.currentUser);
    next();
})



//Strategy for /login POST action
passport.use(new LocalStrategy( function(username, password, done) {
//    console.log(username);
//    console.log(password);
    db.query('SELECT password FROM users WHERE username = ?', [username], (err, results, fields) => {
        if (err) {done(err)};
        
        if (results.length === 0){
            done(null, false);
        } else {
            const hash = results[0].password.toString();
            console.log("hash:"+hash);

            bcrypt.compare(password, hash, function(err, response) {
                if (response === true) {
                    return done(null, {user_id: results[0].id, userName: username});
                } else {
                    return done(null, 'GLITCH');
                }
            });
            }
    });
}));

//
//CREATE WEB SOCKET SERVER
const io = socketio(server);
//
// Init server messages from disk's file
const messageData = fs.readFileSync(`${__dirname}/db.json`).toString();
const messages = messageData ? JSON.parse(messageData) : [];
//
// Listen for new socket client (connection)
io.on('connection', (socket) => {
    console.log("New Client Connected");
        
    //Send all messages to connecting client
    socket.emit('all_messages', messages);
    
    //listen for new messages
    socket.on('new_message', (message) => {
        
        //add to messages
        messages.unshift(message);
        
        //Persist to disk
        fs.writeFileSync(`${__dirname}/db.json`, JSON.stringify(messages));
        
        //broadcast new message to all connected clients
        socket.broadcast.emit('new_message', message);
    });
})



// INITIALIZE BODYPARSER
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// From express-validator docs, the method
// app.use(expressValidator) must be immediately after
// any of the bodyParser middlewares
app.use(expressValidator());




// Routing
//
// router rendering looks up for a views file
// specify view AND partial folders and parse the engine to hbs.
app.set('views',`${__dirname}/../app/views`);
hbs.registerPartials(`${__dirname}/../app/views/partials`);
app.set('view engine', 'hbs');

//AUTH: WHENEVER CLIENT ENTERS THE APP
app.get('/',authenicationMiddleware(), function(req,res) {
    console.log('user authenticated: ' + req.isAuthenticated());
    if(req.isAuthenticated() === true){
        console.log("FUCKING TRUE");
        db.query('SELECT * FROM profile_options WHERE user_id = ?', [req.session.passport.user.user_id], (error, results, fields) => {  
            if (error) throw error;

            console.log(results);
            res.render('room', {
                username: req.session.passport.user.userName,
                nameColor: results[0].name_color,
                msgColor: results[0].message_color
            });    
        });

    }
    
});

//AUTH: WHENEVER CLIENT ENTERS PROFILE
app.get('/profile', authenicationMiddleware(), function(req, res, next) {
    console.log("user auth: " + req.isAuthenticated());
    if( req.isAuthenticated() === true ){
        console.log(req.session.passport.user);
        db.query('SELECT id FROM users WHERE username = ?', [req.session.passport.user.userName], (error, results, fields) => {
            if (error) throw error;
            req.session.passport.user.user_id = results[0].id;
            console.log("passport user: ",req.session.passport.user);
            db.query('SELECT * FROM profile_options WHERE user_id = ?', [results[0].id], (error, results2, fields) => {  
                if (error) throw error;

                console.log(results2);
                
                
                res.render('profile',{
                    currentUser: req.session.passport.user.userName,
                    nameColor: results2[0].name_color,
                    msgColor: results2[0].message_color
                }); 
            });
        });
             
    }
});

app.post('/profile', authenicationMiddleware(), function(req, res, next) {
    if( req.isAuthenticated() === true ){
        var nameColor = req.body.nameColor;
        var msgColor = req.body.msgColor;
        var userId = req.session.passport.user.user_id;
        db.query('UPDATE profile_options SET name_color = "' + nameColor + '", message_color = "' + msgColor + '" WHERE user_id = "'+userId+'" ', (error, results, fields) => {  
            if (error) throw error;
            res.render('profile',{
                currentUser : req.session.passport.user.userName,
                nameColor: nameColor,
                msgColor: msgColor
            });      
        });
    }
});

//AUTH: WHENEVER CLIENT ENTERS LOGIN
app.get('/login', function(req, res, next) {
    console.log("user auth: " + req.isAuthenticated());
    if( req.isAuthenticated() === true ){
        res.redirect('/profile');
    } else {
        res.render('login',{
            title: 'Login'
        }); 
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

app.get('/logout', function(req, res){
    req.logout();
    req.session.destroy();
    res.redirect('/login');
});

//AUTH: WHENEVER CLIENT ENTERS REGISTRATION
app.get('/register', function (req, res) {
  res.render('register', {
      title: 'Registration',
      formVisible: 'visible'
  });
});

//AUTH: REGISTER ON SUBMIT
app.post('/register',function (req, res) {
    // Validate inputs for accurate data
    // Also the fields username and email in DB must get setted to UNIQUE key type.
    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
    req.checkBody('passwordMatch', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(req.body.password);
    // Additional validation to ensure username is alphanumeric with underscores and dashes
    req.checkBody('username', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i');
    
    const errors = req.validationErrors();
    
    if(errors) {
        console.log(`errors: ${JSON.stringify(errors)}`);
        res.render('register',{
            title: 'Registration Error',
            subTitle: 'please try again.',
            formVisible: 'visible',
            errors: errors
        });
    } else {
        // Access form inputs with bodyParser
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        // Hash password 
        bcrypt.hash(password, saltRounds, (err,hash) => {
            // Insert Query
            // using ? as value and using [] as the second argument 
            // to make connection escape users' values automatically and prevent malicious data
            db.query('INSERT INTO users (username,email,password) VALUES (?, ?, ?)', [username, email, hash], (error, results, fields) => {    
                if (error) throw error;
                
                db.query('SELECT LAST_INSERT_ID() as user_id', (error, results, fields) => {
                    if(error) throw error;
                    
                    user_obj = results[0];
                    
                    db.query('INSERT INTO profile_options (user_id, name_color, message_color) VALUES (?, ?, ?)', [user_obj.user_id, "#000", "#000"], (error, results, fields) => {    
                        if (error) throw error;
                        //create new user session with passportJS
                        res.render('register', {
                            title: 'Registration Complete',
                            formVisible: 'hidden'
                        });    
                    });
                });
            });
        });   
    }
});


passport.serializeUser((user_id, done) => {
   done(null, user_id); 
});

passport.deserializeUser((user_id, done) => {
    done(null, user_id);
});


// Server "app" directory
app.use(express.static(`${__dirname}/../app`));

// Server "node_modules" directory
app.use('/modules',express.static(`${__dirname}/../node_modules`));


//Determine if user is logged in
function authenicationMiddleware() {
    return (req, res, next) => {
        if(req.isAuthenticated() === true){
            return next();  
        } else {  
            res.redirect('/login');
        }
    }
}

// Start Server
server.listen( 8888, () => console.log('Photo Message running on localhost:8888'));