
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var building_module = require('../../modules/v1/building_module')(mongo, ObjectID, url, assert, dbb, db);
        var vendor_module = require('../../modules/v1/vendor_module')(mongo, ObjectID, url, assert, dbb, db);
        var visitors_module = require('../../modules/v1/visitors_module')(mongo, ObjectID, url, assert, dbb, db);
        var resident_module = require('../../modules/v1/resident_module')(mongo, ObjectID, url, assert, dbb, db);
        var amenities_booking_module = require('../../modules/v1/amenities_booking_module')(mongo, ObjectID, url, assert, dbb, db);
        var complaints_module = require('../../modules/v1/complaints_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Building Details

        //headers : user-token (admin/super admin)
        // params :
        // building_id
        // building_name
        // building_address
        // building_poc_name
        // building_poc_phonenumber
        // building_accounts[]
        // building_login_id
        //Functions: add_building_details
        //Response: status, message, result
        app.post('/v1/add_building_details', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("building_name")
                    && req.body.hasOwnProperty("building_address")
                    && req.body.hasOwnProperty("building_poc_name")
                    && req.body.hasOwnProperty("building_poc_phonenumber")
                    && req.body.hasOwnProperty("building_accounts")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            var buildingAccountsVal = JSON.parse(req.body.building_accounts.toString());
                            var buildingAccounts = [];
                            if (buildingAccountsVal != undefined && buildingAccountsVal.length > 0) {
                                for (var account of buildingAccountsVal) {
                                    var accountData = {
                                        id: new ObjectID(),
                                        bank_name: account.bank_name,
                                        ifsc_code: account.ifsc_code,
                                        account_no: account.account_number
                                    }
                                    buildingAccounts.push(accountData);
                                }
                            }

                            var new_building = {
                                building_name: req.body.building_name,
                                building_address: req.body.building_address,
                                building_poc_name: req.body.building_poc_name,
                                building_poc_phonenumber: req.body.building_poc_phonenumber,
                                building_accounts: buildingAccounts,
                                is_admin_issued: false,
                                building_login_password: "qwerty",
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                vendors: [],
                                location: req.body.location,
                                active: true,
                                valid_till: new Date(),
                                payment_history: []
                            };
                            building_module.add_building(new_building, user_id, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result.insertedId });
                                }
                            })

                        }
                        else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("building_name") == false) {
                        res.json({ status: false, message: "building_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_address") == false) {
                        res.json({ status: false, message: "building_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_poc_name") == false) {
                        res.json({ status: false, message: "building_poc_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_poc_phonenumber") == false) {
                        res.json({ status: false, message: "building_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_accounts") == false) {
                        res.json({ status: false, message: "building_address parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Add Building Details

        //API for Get Building Details

        //Params: user_token
        //Functions: get_building_details
        //Response: status, message, result
        app.post('/v1/get_building_details', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            building_module.get_building_details(function (result, error, message) {
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
                res.json({ status: false, message: er });
            }
        });
        //End of Get Building_Details


        //API for Get User Building Details

        //Params: user_token,building_id
        //Functions: 
        //Response: status, message, result
        app.post('/v1/get_user_building', ensureAuthorized, function (req, res) {
            try {

                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            building_module.get_user_building(req.body.building_id, function (result, error, message) {
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
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Get User Building_Details


        //API for Update Building Details

        //Params: building_id, building_name, building_address,building_poc_name, building_poc_phonenumber, building_accounts, building_login_id,user_token
        //Functions: update_building_details
        //Response: status, message, result
        app.post('/v1/update_building_details', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("building_name")
                    && req.body.hasOwnProperty("building_address")
                    && req.body.hasOwnProperty("building_poc_name")
                    && req.body.hasOwnProperty("building_poc_phonenumber")
                    && req.body.hasOwnProperty("building_accounts")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            building_module.update_building_details(
                                req.body.building_id,
                                req.body.building_name,
                                req.body.building_address,
                                req.body.building_poc_name,
                                req.body.building_poc_phonenumber,
                                req.body.building_accounts,
                                req.body.location,
                                user_id, function (result, error, message) {
                                    if (error) {
                                        res.json({ status: false, message: message });
                                    } else {
                                        res.json({ status: true, message: message, result: req.body.building_id });
                                    }
                                })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_name") == false) {
                        res.json({ status: false, message: "building_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_address") == false) {
                        res.json({ status: false, message: "building_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_poc_name") == false) {
                        res.json({ status: false, message: "building_poc_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_poc_phonenumber") == false) {
                        res.json({ status: false, message: "building_address parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_accounts") == false) {
                        res.json({ status: false, message: "building_address parameter is missing" });
                    } else {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End of Update Building Details


        //API for Delete Single Building Details

        //Params: user-token,building_id
        //Functions: delete_single_building_details
        //Response: status, message, result
        app.post('/v1/delete_building_details', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A')) {
                            building_module.delete_single_building_details(req.body.building_id, function (error, message) {
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
                    } else {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Delete Single Building Details

        // API For Building Login
        app.post('/v1/building_login', function (req, res) {
            try {
                building_module.do_building_login(req.body.building_login_id, req.body.password, function (result, error, message) {
                    if (error) {
                        res.json({ status: false, message: message, result: null });
                    } else {
                        res.json({ status: true, message: message, result: result });
                    }
                })
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        // End Of Building Login

        //Start of Get Top Level Units

        //Params: user-token,building_id,
        //Functions: get_toplevel_unittypes
        //Response: status, message, result
        app.post('/v1/get_toplevel_units', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'E' || result == 'A')) {
                            building_module.get_toplevel_unittypes(req.body.building_id, function (result2, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message, result: result2 });
                                } else {
                                    res.json({ status: true, message: message, result: result2 });
                                }
                            })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Get all top level units

        //Start of Get Sub Level Units

        //Params: user-token,building_id, unit_parent_id
        //Functions: get_sublevel_unittypes
        //Response: status, message, result
        app.post('/v1/get_sublevel_units', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id") && req.body.hasOwnProperty("type_parent_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'E' || result == 'A' || result == 'E')) {
                            building_module.get_sublevel_unittypes(req.body.building_id, req.body.type_parent_id, function (result2, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message, result: result2 });
                                } else {
                                    res.json({ status: true, message: message, result: result2 });
                                }
                            })
                        } else {
                            res.json({ status: false, message: message });
                        }
                    })
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Get SubLevel Unit Types


        // Start of Get all phase,tower,unit details

        //Params: user-token,building_id,
        //Functions: get_full_building_details
        //Response: status, message, result
        app.post('/v1/get_full_building_details', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'E' || result == 'A')) {
                            building_module.get_full_building_details(req.body.building_id, function (result2, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message, result: result2 });
                                } else {
                                    res.json({ status: true, message: message, result: result2 });
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
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });
        //End of Get all phase,tower,unit details



        //API for Get Dashboard Details 

        //Params:  user_token
        //Functions: userExists
        //Response: status, message, result
        app.post('/v1/get_admin_dashboard_details', ensureAuthorized, function (req, res) {
            try {
                ;
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty('building_id')) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'A' || result == 'SA' || result == 'E')) {
                            building_module.get_dashboard_details(req.body.building_id, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message, result: result });
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
                        res.json({ status: false, message: "user-token parameter is missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End Of Get Dashboard Details

        //API for Get Super Admin Dashboard Details 

        //Params:  user_token
        //Functions: userExists
        //Response: status, message, result
        app.post('/v1/get_super_admin_dashboard_details', ensureAuthorized, function (req, res) {
            try {
                ;
                if (req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA')) {
                            building_module.get_super_dashboard_details(function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message, result: result });
                                } else {
                                    res.json({ status: true, message: message, result: result });
                                }
                            })
                        } else {
                            res.json({ status: false, message: "User Does Not Have Access" });
                        }
                    })
                }
                else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    } else {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End Of Get Super Admin Dashboard Details

        //API for creating a subscription
        app.post('/v1/add_building_subscription', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("booking_date")
                    && req.body.hasOwnProperty("duration")
                    && req.body.hasOwnProperty("amount")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            building_module.add_building_subscription(req.body.building_id, req.body.booking_date, req.body.duration, req.body.amount, function (result, error, message) {
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
                        res.json({ status: false, message: "user-token parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("booking_date")) {
                        res.json({ status: false, message: "booking_date parameter is missing" });
                    } else if (req.body.hasOwnProperty("duration")) {
                        res.json({ status: false, message: "duration parameter is missing" });
                    } else {
                        res.json({ status: false, message: "amount parameter is missing" });
                    }
                }
            } catch (e) {
                res.json({ status: false, message: e });
            }
        });
    }
}
