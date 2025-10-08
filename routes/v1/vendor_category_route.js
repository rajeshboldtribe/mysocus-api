module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, esnureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var vendor_category_module = require('../../modules/v1/vendor_category_module')(mongo, ObjectID, url, assert, dbb, db);

        //API for Add Vendor Category

        app.post('/v1/add_vendor_category', esnureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("vendor_category_name")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            var new_vendor_category = {
                                vendor_category_name: req.body.vendor_category_name,
                                created_by: new ObjectID(user_id),
                                created_on: new Date(),
                                active: true,
                            }
                            vendor_category_module.add_vendor_category(new_vendor_category, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        } else {
                            res.json({ status: false, message: "User does not exist" });
                        }
                    })

                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    } else {
                        res.json({ status: false, message: "vendor_category_name is missing" })
                    }
                }
            } catch (ex) {
                res.json({ status: false, message: ex });
            }
        })

        // End of Add Vendor Category

        // Start Of Update Vendor Category

        app.post('/v1/update_vendor_category', esnureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") &&
                    req.body.hasOwnProperty("vendor_category_id")
                    && req.body.hasOwnProperty("vendor_category_name")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == "SA" || result == "A" || result == 'E')) {
                            vendor_category_module.update_vendor_category(req.body.vendor_category_id, req.body.vendor_category_name, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        } else {
                            res.json({ status: false, message: "User does not exist" });
                        }
                    })
                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    } else if (req.body.hasOwnProperty("vendor_category_name") == false) {
                        res.json({ status: false, message: "vendor_category_name is missing" })
                    } else {
                        res.json({ status: false, message: "vendor_category_id is missing" })
                    }
                }
            } catch (ex) {
                res.json({ status: false, message: ex });
            }
        })

        // End Of Update Vendor Category

        // Start Of Delete Vendor Category
        app.post('/v1/delete_vendor_category', esnureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") &&
                    req.body.hasOwnProperty("vendor_category_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exist, message) {
                        if (exist && result == "SA") {
                            vendor_category_module.delete_vendor_category(req.body.vendor_category_id, function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message });
                                }
                            })
                        } else {
                            res.json({ status: false, message: "User does not exist" });
                        }
                    })

                } else {
                    if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    } else {
                        res.json({ status: false, message: "vendor_category_id is missing" })
                    }
                }
            } catch (ex) {
                res.json({ status: false, message: ex });
            }
        })
        // End Of Delete Vendor Category


        // Start Of View Vendor Category
        app.post('/v1/view_all_vendor_category', esnureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exist, message) {
                        if (exist) {
                            vendor_category_module.view_all_vendor_category(function (result, error, message) {
                                if (error) {
                                    res.json({ status: false, message: message })
                                } else {
                                    res.json({ status: true, message: message, result: result });
                                }
                            })
                        } else {
                            res.json({ status: false, message: "User does not exist" });
                        }
                    })
                }
            } catch (ex) {
                res.json({ status: false, message: ex });
            }
        })

    }
    // End Of View Vendor Category

}