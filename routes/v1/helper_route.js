
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db);
        var helper_module = require('../../modules/v1/helper_module')(mongo, ObjectID, url, assert, dbb, db);
        var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Helper Details

        //headers : user-token (admin/super admin)
        // params :
        // building_id
        // helper_name
        // helper_img
        // helper_permanent_address
        // helper_service
        // helper_contact_info
        // helper_sec_contact_info(optional)
        // helper_id_proofs[Array of Object]

        //Functions: add_helper,add_user
        //Response: status, message, result


        app.post('/v1/add_helper', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("helper_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("helper_img")
                    && req.body.hasOwnProperty("helper_permanent_address")
                    && req.body.hasOwnProperty("helper_service")
                    && req.body.hasOwnProperty("helper_contact_info")
                    && req.body.hasOwnProperty("helper_id_proofs")
                    && req.body.hasOwnProperty("is_private")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            user = user_id
                            user_module.userExists(req.body.helper_contact_info, function (user_id, user_result, exists, message) {
                                if (exists) {
                                    res.json({ status: false, message: 'User Already Exits', });
                                } else {
                                    if (result == 'A') {
                                        var is_approved = true
                                    } else {
                                        var is_approved = false
                                    }

                                    var helperUnits = [];
                                    var objectIDchecker = require('mongodb').ObjectID;

                                    var isPrivate = req.body.is_private.toString() == "true" ? true : false;
                                    if (isPrivate) {
                                        if (req.body.unit_id != undefined && objectIDchecker.isValid(req.body.unit_id)) {
                                            helperUnits.push(req.body.unit_id);
                                        }
                                    }

                                    var new_helper = {
                                        helper_name: req.body.helper_name,
                                        helper_permanent_address: req.body.helper_permanent_address,
                                        helper_img: req.body.helper_img,
                                        helper_contact_info: parseInt(req.body.helper_contact_info),
                                        helper_sec_contact_info: parseInt(req.body.helper_sec_contact_info),
                                        helper_service: req.body.helper_service,
                                        helper_id_proofs: JSON.parse(req.body.helper_id_proofs),
                                        building_id: new ObjectID(req.body.building_id),
                                        is_private: req.body.is_private.toString() == "true" ? true : false,
                                        helper_units: helperUnits,
                                        is_kyc_approved: is_approved,
                                        created_by: new ObjectID(user),
                                        created_on: new Date(),
                                        active: true,
                                    };
                                    helper_module.add_helper(new_helper, function (result, error, message) {
                                        if (error) {
                                            res.json({ status: false, message: message });
                                        } else {
                                            res.json({ status: true, message: message, result: result.insertedId });
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("helper_name") == false) {
                        res.json({ status: false, message: "helper_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_img") == false) {
                        res.json({ status: false, message: "helper_img parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_permanent_address") == false) {
                        res.json({ status: false, message: "helper_permanent_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_service") == false) {
                        res.json({ status: false, message: "helper_service parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_contact_info") == false) {
                        res.json({ status: false, message: "helper_contact_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_id_proofs") == false) {
                        res.json({ status: false, message: "helper_id_proofs parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_private") == false) {
                        res.json({ status: false, message: "is_private parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Add Helper Details

        //API for Update Helper Details

        //headers : user-token (admin/super admin)
        // params :
        // helper_id:
        // building_id
        // helper_name
        // helper_img
        // helper_permanent_address
        // helper_service
        // helper_contact_info
        // helper_sec_contact_info(optional)
        // helper_id_proofs[Array of Object]
        // is_private

        //Functions: update_helper,update_user
        //Response: status, message, result

        app.post('/v1/update_helper', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("helper_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("helper_img")
                    && req.body.hasOwnProperty("helper_permanent_address")
                    && req.body.hasOwnProperty("helper_service")
                    && req.body.hasOwnProperty("helper_contact_info")
                    && req.body.hasOwnProperty("helper_id_proofs")
                    && req.body.hasOwnProperty("is_private")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            if (result == 'A' || result == 'E') {
                                var is_approved = true
                            } else {
                                var is_approved = false
                            }

                            user = user_id
                            helper_module.update_helper(
                                req.body.helper_id,
                                req.body.helper_name,
                                req.body.building_id,
                                req.body.helper_img,
                                req.body.helper_contact_info,
                                req.body.helper_sec_contact_info,
                                req.body.helper_permanent_address,
                                req.body.helper_service,
                                req.body.helper_id_proofs,
                                req.body.is_private,
                                is_approved,
                                user
                                , function (result, error, message) {
                                    res.json({ status: !error, message: message });
                                })
                        }
                        else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_name") == false) {
                        res.json({ status: false, message: "helper_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_img") == false) {
                        res.json({ status: false, message: "helper_img parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_permanent_address") == false) {
                        res.json({ status: false, message: "helper_permanent_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_service") == false) {
                        res.json({ status: false, message: "helper_service parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_contact_info") == false) {
                        res.json({ status: false, message: "helper_contact_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_id_proofs") == false) {
                        res.json({ status: false, message: "helper_id_proofs parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_private") == false) {
                        res.json({ status: false, message: "is_private parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Update Helper Details


        //API for View All Helper Details

        //Params: user-token
        //Functions: view_all_helpers
        //Response: status, message, result

        app.post('/v1/view_all_helpers', ensureAuthorized, function (req, res) {
            try {

                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            helper_module.view_all_helpers(req.body.starting_after, req.body.limit, req.body.building_id, result, function (result2, error, message, total) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result2, total: total, totaldata: result2.length });
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

        //End of View All Helper Details



        //API for View Single Helper Details

        //Params: user-token,helper_id
        //Functions: view_helper
        //Response: status, message, result

        app.post('/v1/view_helper', ensureAuthorized, function (req, res) {
            try {

                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("helper_id")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            helper_module.view_helper(req.body.helper_id, function (result, error, message) {
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
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter missing" });
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View Single Helper Details



        //API for Delete Helper Details

        //Params: user-token,helper_id,building_id
        //Functions: delete_helper
        //Response: status, message, result

        app.post('/v1/delete_helper', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("building_id")
                ) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            helper_module.delete_helper(req.body.helper_id, req.body.building_id, function (error, message) {
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
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Delete Helper Details


        //API for Update Helper Vehicles Details

        //headers : user-token (admin/super admin)
        // params :
        // helper_id:
        // building_id
        // helper_vehicle_details

        //Functions: update_helper_vehicles
        //Response: status, message, result


        app.post('/v1/update_helper_vehicles', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("helper_vehicle_details")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            user = user_id
                            helper_module.update_helper_vehicles(req.body.helper_id,
                                req.body.building_id,
                                req.body.helper_vehicle_details,
                                user
                                , function (result, error, message) {
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
                    if (req.body.hasOwnProperty("helper_vehicle_details") == false) {
                        res.json({ status: false, message: "helper_vehicle_details parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "employee_id parameter is missing" });
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

        //End of Update Helper Vehicles Details


        app.post('/v1/helper_visitor_entry', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("helper_id")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("entry_time")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            let helper_entry = {
                                helper_id: new ObjectID(req.body.helper_id),
                                building_id: new ObjectID(req.body.building_id),
                                entry_time: new Date(req.body.entry_time),
                                exit_time: null
                            }
                            helper_module.helper_visitor_entry(helper_entry, function (result, error, message) {
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
                    if (req.body.hasOwnProperty("keyword") == false) {
                        res.json({ status: false, message: "keyword parameter is missing" });
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

        app.post('/v1/search_helper', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("keyword")
                    && req.body.hasOwnProperty("building_id")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            helper_module.search_helper(req.body.keyword, req.body.building_id, function (result, error, message) {
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
                    if (req.body.hasOwnProperty("keyword") == false) {
                        res.json({ status: false, message: "keyword parameter is missing" });
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

        //API for Toggle Kyc Active
        //Params: helper_id, user_token, active
        //Functions: toggle_helper_active
        //Response: status, message, result

        app.post('/v1/toggle_kyc_active', ensureAuthorized, function (req, res) {

            try {
                if (req.body.hasOwnProperty("helper_id") && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'A' || result == 'E')) {
                            helper_module.toggle_helper_active(req.body.helper_id, function (result, error, message) {
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
                    if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {

                res.json({ status: false, Message: "failed at try" });
            }
        });
        //End of Toggle Kyc Active

        //API for View Helper Unit Details
        //Params: user-token,building_id,helper_id
        //Functions: view_helpers_units
        //Response: status, message, result

        app.post('/v1/view_helpers_units', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("helper_id")
                ) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'A' || result == 'E')) {
                            helper_module.view_helpers_units(req.body.building_id, req.body.helper_id, function (result2, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result2 });
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
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("helper_id") == false) {
                        res.json({ status: false, message: "helper_id parameter is missing" });
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of View  Helper Unit Details

    }
}
