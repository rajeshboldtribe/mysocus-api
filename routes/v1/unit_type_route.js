
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var unit_type_module = require('../../modules/v1/unit_type_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Unit Type Details

        //headers : user-token (admin/super admin)
        // params :
        // type_name
        // type_parent_name
        // type_parent_id
        // building_id

        //Functions: add_unit_type
        //Response: status, message, result


        app.post('/v1/add_unit_type', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("type_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            var type_parent = req.body.type_parent_id;
                            if (req.body.type_parent_id != null && req.body.type_parent_id != "null") {
                                type_parent = new ObjectID(req.body.type_parent_id);
                            } else {
                                type_parent = null;
                            }

                            var new_unit_type = {
                                type_name: req.body.type_name,
                                type_parent_id: new ObjectID(type_parent),
                                building_id: new ObjectID(req.body.building_id),
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                active: true,
                            };

                            unit_type_module.add_unit_type(new_unit_type, function (result, error, message) {
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
                } else {
                    if (req.body.hasOwnProperty("type_name") == false) {
                        res.json({ status: false, message: "type_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Add Unit Type Details


        //API for Update Unit Type Details

        //Params: unit_type_id, type_name, type_parent_name,type_parent_id,building_id, user-token (header)
        //Functions: edit_single_unit
        //Response: status, message, result

        app.post('/v1/update_unit_type', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty('unit_type_id')
                    && req.body.hasOwnProperty("type_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            unit_type_module.edit_single_unit_types(
                                req.body.unit_type_id,
                                req.body.type_name,
                                req.body.type_parent_name,
                                req.body.type_parent_id,
                                req.body.building_id,
                                user_id,
                                function (result, error, message) {
                                    if (error) {
                                        res.json({ status: false, message: message });
                                    } else {
                                        res.json({ status: true, message: message, result: req.body.unit_id });
                                    }
                                })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                } else {
                    if (req.body.hasOwnProperty("unit_type_id") == false) {
                        res.json({ status: false, message: "unit_type_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("type_name") == false) {
                        res.json({ status: false, message: "type_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End of Update Unit Type Details

        //API for View All Unit Type Details

        //Params: user-token
        //Functions: view_all_unit_types
        //Response: status, message, result

        app.post('/v1/view_all_unit_type', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            unit_type_module.view_all_unit_types(req.body.building_id, function (result, error, message) {
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
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Unit Type Details


        //API for View Single Unit Type Details
        //Params: user-token,unit_type_id
        //Functions: view_single_unit_types
        //Response: status, message, result

        app.post('/v1/view_unit_type', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("unit_type_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            unit_type_module.view_single_unit_types(req.body.unit_type_id, function (result, error, message) {
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
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("unit_type_id-token") == false) {
                        res.json({ status: false, message: "unit_type_id-token parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of View Single Unit Type Details

        //API for Delete Single Unit Type Details
        //Params: user-token,unit_type_id,building_id
        //Functions: delete_unit_types
        //Response: status, message, result

        app.post('/v1/delete_unit_type', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("unit_type_id")
                    && req.body.hasOwnProperty("building_id")
                ) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            unit_type_module.delete_unit_type(req.body.unit_type_id, req.body.building_id, function (error, message) {
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
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("unit_type_id") == false) {
                        res.json({ status: false, message: "unit_type_id parameter missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Delete Single Unit Type Details
    }
}
