
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var department_module = require('../../modules/v1/department_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Department Details

        //headers : user-token (admin/super admin)
        // params :
        // building_id
        // department_name
        // department_desc(optional)

        //Functions: add_department
        //Response: status, message, result


        app.post('/v1/add_department', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("department_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A')) {
                            var new_department = {
                                department_name: req.body.department_name,
                                department_desc: req.body.department_desc,
                                building_id: new ObjectID(req.body.building_id),
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                active: true,
                            };
                            department_module.add_department(new_department, function (result, error, message) {
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
                    if (req.body.hasOwnProperty("department_name") == false) {
                        res.json({ status: false, message: "department_name parameter is missing" });
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

        //End of Add Department Details


        //API for Update Department Details

        //Params: 
        //department_id,
        // department_name,
        // department_desc,
        // building_id, user-token (header)
        //Functions: edit_single_unit
        //Response: status, message, result

        app.post('/v1/update_department', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty('department_id')
                    && req.body.hasOwnProperty("department_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A')) {
                            department_module.update_department(
                                req.body.department_id,
                                req.body.department_name,
                                req.body.department_desc,
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
                }
                else {
                    if (req.body.hasOwnProperty("department_id") == false) {
                        res.json({ status: false, message: "department_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("department_name") == false) {
                        res.json({ status: false, message: "department_name parameter is missing" });
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
        //End of Update Department Details

        //API for View All Department Details

        //Params: user-token,limit,starting_after
        //Functions: view_all_departments
        //Response: status, message, result

        app.post('/v1/view_all_departments', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            department_module.view_all_departments(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Department Details



        //API for View All Active Department Details

        //Params: user-token,limit,starting_after,building_id
        //Functions: view_all_active_departments
        //Response: status, message, result

        app.post('/v1/view_all_active_departments', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            department_module.view_all_active_departments(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Active Department Details



        //API for View Single Department Details

        //Params: user-token,department_id
        //Functions: view_single_department
        //Response: status, message, result

        app.post('/v1/view_single_department', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("department_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            department_module.view_single_department(req.body.department_id, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result });
                                }
                            })
                        }
                        else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("department_id") == false) {
                        res.json({ status: false, message: "department_id parameter missing" });
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View Single Department Details



        //API for Delete  Department Details

        //Params: user-token,department_id,building_id
        //Functions: delete_department
        //Response: status, message, result

        app.post('/v1/delete_department', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("department_id") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            department_module.delete_department(req.body.department_id, req.body.building_id, function (error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                }
                                else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        }
                        else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("department_id") == false) {
                        res.json({ status: false, message: "department_id parameter missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Delete Department Details
    }
}
