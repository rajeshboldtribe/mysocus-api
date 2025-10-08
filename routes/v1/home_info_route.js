
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var home_info_module = require('../../modules/v1/home_info_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Home Info Details
        //headers : user-token (admin/super admin)
        // params :
        // unit_id
        // owner_id
        // helper_info [{helper_id, from_date, to_date}]
        // tenant_info[ {tenant_id, from_date, to_date}]
        // parking_spots [{parking_ids}]


        //Functions: add_homeinfo_details
        //Response: status, message, result


        app.post('/v1/add_homeinfo_details', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("owner_id")
                    && req.body.hasOwnProperty("helper_info")
                    && req.body.hasOwnProperty("tenant_info")
                    && req.body.hasOwnProperty("parking_spots")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            var new_homeinfo = {
                                unit_id: new ObjectID(req.body.unit_id),
                                owner_id: new ObjectID(req.body.owner_id),
                                helper_info: JSON.parse(req.body.helper_info),
                                tenant_info: JSON.parse(req.body.tenant_info),
                                parking_spots: JSON.parse(req.body.parking_spots),
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                active: true,
                            };
                            home_info_module.add_homeinfo_details(new_homeinfo, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result.insertedId });
                                }
                            })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("owner_id") == false) {
                        res.json({ status: false, message: "owner_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_info") == false) {
                        res.json({ status: false, message: "helper_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("tenant_info") == false) {
                        res.json({ status: false, message: "tenant_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("parking_spots") == false) {
                        res.json({ status: false, message: "parking_spots parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                console.log("error occured : " + er);
                res.json({ status: false, message: er });
            }
        });

        //End of Add Home Info Details


        //API for Update Home Info Details

        //headers : user-token (admin/super admin)
        // params :
        //homeinfo_id
        // unit_id
        // owner_id
        // helper_info [{helper_id, from_date, to_date}]
        // tenant_info[ {tenant_id, from_date, to_date}]
        // parking_spots [{parking_ids}]

        //Functions: update_homeinfo_details
        //Response: status, message, result

        app.post('/v1/update_homeinfo_details', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty('homeinfo_id')
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("owner_id")
                    && req.body.hasOwnProperty("helper_info")
                    && req.body.hasOwnProperty("tenant_info")
                    && req.body.hasOwnProperty("parking_spots")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            home_info_module.update_homeinfo_details(
                                req.body.homeinfo_id,
                                req.body.unit_id,
                                req.body.owner_id,
                                req.body.helper_info,
                                req.body.tenant_info,
                                req.body.parking_spots,
                                user_id,
                                function (result, error, message) {
                                    if (error) {
                                        res.json({ status: false, message: message });
                                    } else {
                                        res.json({ status: true, message: message, result: req.body.homeinfo_id });
                                    }
                                })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("homeinfo_id") == false) {
                        res.json({ status: false, message: "homeinfo_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("owner_id") == false) {
                        res.json({ status: false, message: "owner_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_info") == false) {
                        res.json({ status: false, message: "helper_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("tenant_info") == false) {
                        res.json({ status: false, message: "tenant_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("parking_spots") == false) {
                        res.json({ status: false, message: "parking_spots parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                console.log("error occured : " + er);
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End of Update Home Info Details


        //API for Get  Home Info Details
        //Params: user-token,homeinfo_id
        //Functions: get_homeinfo_details
        //Response: status, message, result

        app.post('/v1/get_homeinfo_details', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A')) {
                            home_info_module.get_homeinfo_details(function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result });
                                }
                            })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    res.json({ status: false, message: "user-token parameter missing" });
                }
            } catch (er) {
                console.log("error occured : " + er);
                res.json({ status: false, message: er });
            }
        });

        //End of Get Home Info Details



        //API for Delete Single Unit Details
        //Params: user-token,unit_id
        //Functions: delete_single_unit_details
        //Response: status, message, result

        app.post('/v1/delete_single_unit_details', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("unit_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            unit_module.delete_single_unit_details(req.body.unit_id, function (error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else {
                        res.json({ status: false, message: "unit_id parameter missing" });
                    }
                }
            } catch (er) {
                console.log("error occured : " + er);
                res.json({ status: false, message: er });
            }
        });
        //End of Delete Single Unit Details
    }
}
