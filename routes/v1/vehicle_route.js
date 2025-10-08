
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var vehicle_module = require('../../modules/v1/vehicle_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Vehicle Details

        //headers : user-token (admin/super admin)
        // params :
        // vehicle_type
        //vehicle_manufacturer
        //vehicle_name


        //Functions: add_vehicle
        //Response: status, message, result
        app.post('/v1/add_vehicle', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("vehicle_name")
                    && req.body.hasOwnProperty("vehicle_type")
                    && req.body.hasOwnProperty("vehicle_manufacturer")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A'|| result == 'E')) {
                            var new_vehicle = {
                                vehicle_name: req.body.vehicle_name,
                                vehicle_type: req.body.vehicle_type,
                                vehicle_manufacturer: req.body.vehicle_manufacturer,
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                active: true,
                            };
                            vehicle_module.add_vehicle(new_vehicle, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                }else {
                                    res.json({ status: true, message: message, result: result.insertedId });
                                }
                            })
                        }else {
                            res.json({ status: false, message: message });
                        }
                    })
                }else {
                    if (req.body.hasOwnProperty("vehicle_name") == false) {
                        res.json({ status: false, message: "vehicle_name parameter is missing" });
                    }else if (req.body.hasOwnProperty("vehicle_type") == false) {
                        res.json({ status: false, message: "vehicle_type parameter is missing" });
                    }else if (req.body.hasOwnProperty("vehicle_manufacturer") == false) {
                        res.json({ status: false, message: "vehicle_manufacturer parameter is missing" });
                    }else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Add Vehicle Details


        //API for Update Vehicle Details
        //Params: vehicle_id, vehicle_name,vehicle_type, vehicle_manufacturer,user-token (header)
        //Functions: update_vehicle
        //Response: status, message, result
        app.post('/v1/update_vehicle', ensureAuthorized, function (req, res) {
            try {
                if (
                    req.body.hasOwnProperty("vehicle_name")
                    && req.body.hasOwnProperty("vehicle_id")
                    && req.body.hasOwnProperty("vehicle_type")
                    && req.body.hasOwnProperty("vehicle_manufacturer")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A'|| result == 'E')) {
                            vehicle_module.update_vehicle(
                                req.body.vehicle_id,
                                req.body.vehicle_name,
                                req.body.vehicle_type,
                                req.body.vehicle_manufacturer,
                                user_id,
                                function (result, error, message) {
                                    if (error) {
                                        res.json({ status: false, message: message });
                                    }else {
                                        res.json({ status: true, message: message, result: req.body.unit_id });
                                    }
                                })
                        }else {
                            res.json({ status: false, message: message });
                        }
                    })
                }else {
                    if (req.body.hasOwnProperty("vehicle_id") == false) {
                        res.json({ status: false, message: "vehicle_id parameter is missing" });
                    }else if (req.body.hasOwnProperty("vehicle_name") == false) {
                        res.json({ status: false, message: "vehicle_name parameter is missing" });
                    }else if (req.body.hasOwnProperty("vehicle_type") == false) {
                        res.json({ status: false, message: "vehicle_type parameter is missing" });
                    }else if (req.body.hasOwnProperty("vehicle_manufacturer") == false) {
                        res.json({ status: false, message: "vehicle_manufacturer parameter is missing" });
                    }else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End of Update Vehicle Details

        //API for View All Vehicle Details
        //Params: user-token,starting_after,limit
        //Functions: view_all_vehicles
        //Response: status, message, result
        app.post('/v1/view_all_vehicles', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'R' || result == 'SR' || result == 'E')) {
                            vehicle_module.view_all_vehicles(req.body.starting_after, req.body.limit, function (result, error, message, total) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                }else {
                                    res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                                }
                            })
                        }else {
                            res.json({ status: false, message: message });
                        }
                    })
                }else {
                        res.json({ status: false, message: "user-token parameter missing" });
                }
            }catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Vehicle Details

        //API for Delete Single Vehicle Details

        //Params: user-token,vehicle_id
        //Functions: delete_vehicle
        //Response: status, message, result

        app.post('/v1/delete_vehicle', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("vehicle_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A'|| result == 'E')) {
                            vehicle_module.delete_vehicle(req.body.vehicle_id, function (error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                }else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        }else {
                            res.json({ status: false, message: message });
                        }
                    })
                }else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    }else if (req.body.hasOwnProperty("vehicle_id") == false) {
                        res.json({ status: false, message: "vehicle_id parameter missing" });
                    }
                }
            }catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Delete Single Vehicle Details
    }
}
