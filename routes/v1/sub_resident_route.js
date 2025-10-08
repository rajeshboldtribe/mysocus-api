
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var sub_resident_module = require('../../modules/v1/sub_resident_module')(mongo, ObjectID, url, assert, dbb, db);
        var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Sub Resident Details

        //headers : user-token (admin/super admin)
        // params :
        // building_id
        // resident_name
        // resident_img
        // resident_email(optional)
        // resident_contact_info
        // resident_sec_contact_info(optional)
        // resident_permanent_address
        // resident_id_proof(Array of objects)
        // resident_vehcile_details(Array of objects)(optional)
        // unit_id
        // is_owner

        //Functions: add_sub_resident,add_user
        //Response: status, message, result


        app.post('/v1/add_sub_resident', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("resident_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("resident_img")
                    && req.body.hasOwnProperty("resident_contact_info")
                    && req.body.hasOwnProperty("resident_id_proof")
                    && req.body.hasOwnProperty("resident_permanent_address")
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("is_sub_resident")
                    && req.body.hasOwnProperty("is_owner")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            user = user_id
                            user_module.userExists(req.body.resident_contact_info, function (user_id, result, exists, message) {
                                if (exists) {
                                    res.json({ status: true, message: 'User Already Exits' });
                                } else {
                                    var new_sub_resident = {
                                        resident_name: req.body.resident_name,
                                        resident_email: req.body.resident_email,
                                        resident_img: req.body.resident_img,
                                        resident_contact_info: parseInt(req.body.resident_contact_info),
                                        resident_sec_contact_info: parseInt(req.body.resident_sec_contact_info),
                                        resident_id_proof: JSON.parse(req.body.resident_id_proof),
                                        resident_permanent_address: req.body.resident_permanent_address,
                                        resident_vehcile_details: JSON.parse(req.body.resident_vehcile_details),
                                        is_sub_resident: req.body.is_sub_resident.toLowerCase() == 'true' ? true : false,
                                        is_owner: req.body.is_owner.toLowerCase() == 'true' ? true : false,
                                        unit_id: new ObjectID(req.body.unit_id),
                                        building_id: new ObjectID(req.body.building_id),
                                        resident_id: new ObjectID(user_id),
                                        created_by: new ObjectID(user),
                                        created_on: new Date(),
                                        active: true,
                                        is_owner: false
                                    };
                                    sub_resident_module.add_sub_resident(new_sub_resident, function (result, error, message) {
                                        if (error) {
                                            res.json({ status: false, message: message });
                                        } else {
                                            var new_user = {
                                                email: req.body.resident_email,
                                                password: req.body.password,
                                                mobile: parseInt(req.body.resident_contact_info),
                                                user_type: 'SR',
                                                user_id: new ObjectID(result.insertedId),
                                                user_token: '',
                                                fcm_token: req.body.fcm_token,
                                                created_by: new ObjectID(user),
                                                created_on: new Date(),
                                                active: true,
                                            };
                                            user_module.add_user(new_user, function (result, error, message) {
                                                if (error) {
                                                    res.json({ status: false, message: message });
                                                }
                                                else {
                                                    res.json({ status: true, message: message, result: result.insertedId });
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                } else {
                    if (req.body.hasOwnProperty("resident_name") == false) {
                        res.json({ status: false, message: "resident_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_img") == false) {
                        res.json({ status: false, message: "resident_img parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_contact_info") == false) {
                        res.json({ status: false, message: "resident_contact_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_id_proof") == false) {
                        res.json({ status: false, message: "resident_id_proof parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_permanent_address") == false) {
                        res.json({ status: false, message: "resident_permanent_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_sub_resident") == false) {
                        res.json({ status: false, message: "is_sub_resident parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_owner") == false) {
                        res.json({ status: false, message: "is_owner parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Add Sub Resident Details


        //API for Update Sub Resident Details

        //headers : user-token (admin/super admin)
        // params :
        // resident_id:
        // building_id
        // resident_name
        // resident_img
        // resident_email(optional)
        // resident_contact_info
        // resident_sec_contact_info(optional)
        // resident_permanent_address
        // resident_id_proof(Array of objects)
        // resident_vehcile_details(Array of objects)(optional)
        // unit_id
        // is_owner

        //Functions: update_sub_resident,update_user
        //Response: status, message, result


        app.post('/v1/update_sub_resident', ensureAuthorized, function (req, res) {
            try {

                if (req.body.hasOwnProperty("resident_id")
                    && req.body.hasOwnProperty("resident_name")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("resident_img")
                    && req.body.hasOwnProperty("resident_contact_info")
                    && req.body.hasOwnProperty("resident_id_proof")
                    && req.body.hasOwnProperty("resident_permanent_address")
                    && req.body.hasOwnProperty("unit_id")
                    && req.body.hasOwnProperty("is_sub_resident")
                    && req.body.hasOwnProperty("is_owner")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'R' || result == 'A' || result == 'E')) {
                            user = user_id
                            sub_resident_module.update_sub_resident(req.body.resident_id,
                                req.body.building_id,
                                req.body.resident_name,
                                req.body.resident_img,
                                req.body.resident_email,
                                req.body.resident_contact_info,
                                req.body.resident_sec_contact_info,
                                req.body.resident_permanent_address,
                                req.body.resident_id_proof,
                                req.body.resident_vehcile_details,
                                req.body.unit_id,
                                req.body.is_sub_resident,
                                req.body.is_owner,
                                user, function (result, error, message) {
                                    if (error) {
                                        res.json({ status: false, message: message });
                                    } else {
                                        user_module.update_user(req.body.resident_id,
                                            req.body.resident_email,
                                            req.body.password,
                                            req.body.resident_contact_info,
                                            user, function (result, error, message) {
                                                if (error) {
                                                    res.json({ status: false, message: message });
                                                } else {
                                                    res.json({ status: true, message: message, result: result.insertedId });
                                                }
                                            })
                                    }
                                })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("resident_id") == false) {
                        res.json({ status: false, message: "resident_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_name") == false) {
                        res.json({ status: false, message: "resident_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_img") == false) {
                        res.json({ status: false, message: "resident_img parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_contact_info") == false) {
                        res.json({ status: false, message: "resident_contact_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_id_proof") == false) {
                        res.json({ status: false, message: "resident_id_proof parameter is missing" });
                    } else if (req.body.hasOwnProperty("resident_permanent_address") == false) {
                        res.json({ status: false, message: "resident_permanent_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("unit_id") == false) {
                        res.json({ status: false, message: "unit_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_sub_resident") == false) {
                        res.json({ status: false, message: "is_sub_resident parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_owner") == false) {
                        res.json({ status: false, message: "is_owner parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Update Resident Details


        //API for View All Resident Details

        //Params: user-token
        //Functions: view_all_residents
        //Response: status, message, result

        app.post('/v1/view_all_residents', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'R' || result == 'A' || result == 'R')) {
                            resident_module.view_all_residents(function (result, error, message) {
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
                    res.json({ status: false, message: "user-token parameter missing" });
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Resident Details



        //API for View Single Resident Details

        //Params: user-token,resident_id
        //Functions: view_resident
        //Response: status, message, result

        app.post('/v1/view_resident', ensureAuthorized, function (req, res) {
            try {

                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("resident_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'R' || result == 'A' || result == 'E')) {
                            resident_module.view_resident(req.body.resident_id, function (result, error, message) {
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
                    } else {
                        res.json({ status: false, message: "resident_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View Single Resident Details

        //API for Delete Single Sub Resident Details

        //Params: user-token,resident_id
        //Functions: delete_sub_resident
        //Response: status, message, result

        app.post('/v1/delete_sub_resident', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("resident_id")
                    && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'R' || result == 'A')) {
                            sub_resident_module.delete_sub_resident(req.body.resident_id, req.body.building_id, function (error, message) {
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
                    } else if (req.body.hasOwnProperty("resident_id") == false) {
                        res.json({ status: false, message: "resident_id parameter missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Delete Single Resident Details



        //End of View All Resident Details Of A Unit

        //Params: user-token,building_id,unit_id
        //Functions: view_residents_unit
        //Response: status, message, result

        app.post('/v1/view_residents_unit', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("unit_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            sub_resident_module.view_all_residents(req.body.building_id, req.body.unit_id, function (result, error, message) {
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
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter missing" });
                    } else {
                        res.json({ status: false, message: "unit_id parameter missing" });
                    }
                }
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Resident Details Of A Unit

    }
}
