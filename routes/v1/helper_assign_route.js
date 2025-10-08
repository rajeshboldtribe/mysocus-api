
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var helper_assign_module = require('../../modules/v1/helper_assign_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Assign Helper

        //headers : user-token (admin/super admin)
        // params :
        // building_id
        // unit_id
        // helper_id
        // from_date
        // last_worked_date(optional)

        //Functions: assign_helper_unit
        //Response: status, message, result
        app.post('/v1/assign_helper_unit', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("from_date")
                    && req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'E' || result == 'A' || result == 'R' || result == 'SR')) {
                            var assign_helper = {
                                from_date: new Date(req.body.from_date),
                                helper_id: new ObjectID(req.body.helper_id),
                                last_worked_date: new Date(req.body.last_worked_date),
                                unit_id: new ObjectID(req.body.unit_id),
                                building_id: new ObjectID(req.body.building_id),
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                active: true,
                            };
                            helper_assign_module.assign_helper_unit(assign_helper, function (result, error, message) {
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
                    if (req.body.hasOwnProperty("from_date") == false) {
                        res.json({ status: false, message: "from_date parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Assign Helper

        //API for Get Units helper Details

        //Params: user-token,unit_id,building_id
        //Functions: get_units_helpers 
        //Response: status, message, result

        app.post('/v1/get_units_helpers', ensureAuthorized, function (req, res) {
            try {

                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("unit_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'A' || result == 'E' || result == 'R' || result == 'SR')) {
                            helper_assign_module.get_units_helpers(req.body.starting_after, req.body.limit, req.body.building_id, req.body.unit_id, function (result, error, message, total) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
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
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else {
                        res.json({ status: false, message: "unit_id parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Get Units helper_Details


        //API for View Helper Unit Details

        //Params: user-token,unit_id,building_id
        //Functions: view_helpers_units 
        //Response: status, message, result

        app.post('/v1/view_helpers_units', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("helper_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'A' || result == 'E' || result == 'R' || result == 'SR')) {
                            helper_assign_module.view_helpers_units(req.body.starting_after, req.body.limit, req.body.building_id, req.body.helper_id, function (result, error, message, total) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
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
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else {
                        res.json({ status: false, message: "helper_id parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View Helper Unit Details

        //API for Remove Helper Unit

        //Params: user-token
        // building_id
        // unit_id
        // helper_id
        // last_worked_date

        //Functions: remove_helper_unit
        //Response: status, message, result

        app.post('/v1/remove_helper_unit', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("last_worked_date")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'E' || result == 'A' || result == 'R' || result == 'SR')) {
                            helper_assign_module.remove_helper_unit(req.body.helper_id, req.body.unit_id, req.body.building_id, req.body.last_worked_date, function (result, error, message) {
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
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter missing" });
                    } else {
                        res.json({ status: false, message: "last_worked_date parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Remove Helper Unit



        //Start of Assign Helper to Unit 2

        app.post('/v1/assign_helper_to_unit', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("building_id")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, error) {
                        if (exists) {
                            helper_assign_module.assign_helper_unit2(req.body.helper_id, req.body.building_id, req.body.unit_id, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        } else {
                            res.json({ status: false, message: error });
                        }
                    })
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (e) {
                res.json({ status: false, message: e });
            }

        });
        //End of Assign Helper to Unit 2

        //Start of Remove Helper to Unit 2

        app.post('/v1/remove_helper_from_unit', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, error) {
                        if (exists) {
                            helper_assign_module.remove_helper_unit2(req.body.helper_id, req.body.building_id, req.body.unit_id, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        } else {
                            res.json({ status: false, message: error });
                        }
                    })

                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (e) {
                res.json({ status: false, message: e });
            }

        });
        //End of Remove Helper to Unit 2

    }
}
