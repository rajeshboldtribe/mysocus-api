// REQUIRE
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var bodyParser = require('body-parser');
var cors = require('cors');
var ObjectID = require('mongodb').ObjectID;
var jwt = require('jsonwebtoken');
var moment = require('moment');

var multer = require('multer');
var readXlsxFile = require('read-excel-file/node');
var path = require('path');
var fs = require('fs');

//ROUTES

var adminroute = require('./routes/v1/admin_route');
var buildingroute = require('./routes/v1/building_route');
var unitroute = require('./routes/v1/unit_route');
var unittyperoute = require('./routes/v1/unit_type_route');
var homeinforoute = require('./routes/v1/home_info_route');
var vendorroute = require('./routes/v1/vendor_route');
var enoticeroute = require('./routes/v1/enotice_route');
var residentroute = require('./routes/v1/resident_route');
var departmentroute = require('./routes/v1/department_route');
var employeeroute = require('./routes/v1/employee_route');
var helperroute = require('./routes/v1/helper_route');
var sub_residentroute = require('./routes/v1/sub_resident_route');
var idproofroute = require('./routes/v1/idproof_route');
var vehicleroute = require('./routes/v1/vehicle_route');
var amenitiesroute = require('./routes/v1/amenities_route');
var amenities_booking_route = require('./routes/v1/amenities_booking_route');
var complaintsroute = require('./routes/v1/complaints_route');
var visitorsroute = require('./routes/v1/visitors_route');
var helperassignroute = require('./routes/v1/helper_assign_route');
var sharingwallroute = require('./routes/v1/sharing_wall_route');
var classifiedroute = require('./routes/v1/classified_route');
var vendorcategoryroute = require('./routes/v1/vendor_category_route');
var sosroute = require('./routes/v1/sos_route');
var pollingroute = require('./routes/v1/polling_route');
var maintenanceroute = require('./routes/v1/maintenance_route');
var bankingroute = require('./routes/v1/bank_account_routes');
var assetroute = require('./routes/v1/asset_route');
var salaryroute = require('./routes/v1/salary_route');
var loansroute = require('./routes/v1/loans_route');
var legalroute = require('./routes/v1/legal_route');


var gmail = require('./config/gmail_config');
var firebase_key = require('./config/firebase_key');
var dbb = require('./config/collections');

//Configuring Port
app.set('port', (process.env.PORT || 8008));
app.use(cors());
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('/', function (req, res) {
    res.send("WELCOME TO APARTMENT ERP API'S");
});


//CHANGE PROD TO FALSE IF YOU WANT TO RUN THE

//APP ON THE LOCAL MACHINE
var prod = true;
var db;

if (prod) {
    var prod_url = require('./config/database');
    url = prod_url;
}

//Mongo Connection
mongo.connect(url, { useNewUrlParser: true }, function (err, database) {
    assert.equal(null, err);
    db = database;

    //JWT token authorization function
    function ensureAuthorized(req, res, next) {
        var bearerToken;
        var bearerHeader = 'Bearer ' + req.headers["user-token"];
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];
            req.token = bearerToken;
            next();
        } else {
            res.send(403);
        }
    }

    //Configuring Routes
    adminroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    amenities_booking_route.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);
    amenitiesroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    assetroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    bankingroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);
    buildingroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    classifiedroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    complaintsroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);
    departmentroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    employeeroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    enoticeroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);
    helperassignroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    helperroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    homeinforoute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    idproofroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    loansroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    maintenanceroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);
    pollingroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    residentroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    salaryroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    sharingwallroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    sosroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    sub_residentroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    unitroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    unittyperoute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    vendorcategoryroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    vendorroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    vehicleroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail);
    visitorsroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);
    legalroute.configure(app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail);

    app.listen(app.get('port'), function () {
        console.log('Node app is running on port', app.get('port'));
    });
})
app.get('/v1/test', function (req, res) {
    res.send("WELCOME TO v1 test 01");
});













