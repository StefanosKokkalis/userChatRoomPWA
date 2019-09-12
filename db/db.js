const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1312koufala!!',
    database: 'photomessageapp'
});

connection.connect();

//test provided by https://www.npmjs.com/package/mysql
connection.query('SELECT 1 + 1 AS solution', function(error, results, fields){
    if (error) throw error;
    //console.log('The solution is: ', results[0].solution);
    console.log("DB Connected");
});



module.exports = connection;