
module.exports = {
    configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
        var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
        var amenities_module = require('../../modules/v1/amenities_module')(mongo, ObjectID, url, assert, dbb, db);
        var moment = require('moment-timezone');

        //API for Add Amenities Details

        //headers : user-token (admin/super admin)
        // params :

        // amenity_name
        // amenity_desc
        // amenity_imgs[JSON Array] , [  "A","B" ]
        // is_free (Boolean)
        // amenity_price_info (JSON Object), {"fullday":2000,"halfday":1200} 
        // guest_price_info (JSON Object),  {"fullday":3000,"halfday":2200} 
        // available_timings (JSON Array),[ "10AM","5PM" ]
        // no_of_slots
        // building_id                                                     


        //Functions: add_amenity
        //Response: status, message, result


        app.post('/v1/add_amenity', ensureAuthorized, function (req, res) {
            try {
                if (req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("amenity_name")
                    && req.body.hasOwnProperty("amenity_desc")
                    && req.body.hasOwnProperty("amenity_imgs")
                    && req.body.hasOwnProperty("is_free")
                    && req.body.hasOwnProperty("amenity_price_info")
                    && req.body.hasOwnProperty("guest_price_info")
                    && req.body.hasOwnProperty("available_timings")
                    && req.headers.hasOwnProperty("user-token")) {

                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            var timingArray = JSON.parse(req.body.available_timings);
                            var amenityTimeArray = [];
                            var startTimeVal = new Date(timingArray[0]);
                            var endTimeVal = new Date(timingArray[1]);
                            console.log("Starting Time " + startTimeVal, "Ending Time " + endTimeVal);
                            amenityTimeArray.push(moment(startTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'));
                            amenityTimeArray.push(moment(endTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'));
                            console.log("Converted Start Time " + moment(startTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'), "Converted EndTime " + moment(endTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'));
                            var new_amenities = {
                                building_id: new ObjectID(req.body.building_id),
                                amenity_name: req.body.amenity_name,
                                amenity_desc: req.body.amenity_desc,
                                amenity_imgs: JSON.parse(req.body.amenity_imgs),
                                is_free: req.body.is_free,
                                amenity_price_info: JSON.parse(req.body.amenity_price_info),
                                guest_price_info: JSON.parse(req.body.guest_price_info),
                                resident_hour_price: req.body.resident_hour_price,
                                guest_hour_price: req.body.guest_hour_price,
                                available_timings: amenityTimeArray,
                                no_of_slots: 0,
                                active: true
                            };
                            amenities_module.add_amenity(new_amenities, function (result, error, message) {
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
                    if (req.body.hasOwnProperty("amenity_name") == false) {
                        res.json({ status: false, message: "amenity_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_desc") == false) {
                        res.json({ status: false, message: "amenity_desc parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_imgs") == false) {
                        res.json({ status: false, message: "amenity_imgs parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_free") == false) {
                        res.json({ status: false, message: "is_free parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_price_info") == false) {
                        res.json({ status: false, message: "amenity_price_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("guest_price_info") == false) {
                        res.json({ status: false, message: "guest_price_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("available_timings") == false) {
                        res.json({ status: false, message: "available_timings parameter is missing" });
                    } else if (req.body.hasOwnProperty("no_of_slots") == false) {
                        res.json({ status: false, message: "no_of_slots parameter is missing" });
                    } else if (req.body.hasOwnProperty("no_of_slots") == false) {
                        res.json({ status: false, message: "no_of_slots parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }

                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Add Amenities Details


        //API for Update Amenities Details

        //Params: 
        // amenity_id,
        // amenity_name,
        // amenity_desc,
        // amenity_imgs[JSON Array],
        // is_free(Boolean),
        // amenity_price_info(JSON Object),
        // guest_price_info(JSON Object),
        // available_timings(JSON Array),
        // no_of_slots,
        // user-token(header),

        //Functions: update_amenity
        //Response: status, message, result

        app.post('/v1/update_amenity', ensureAuthorized, function (req, res) {
            try {
                if (
                    req.body.hasOwnProperty("amenity_id")
                    && req.body.hasOwnProperty("building_id")
                    && req.body.hasOwnProperty("amenity_name")
                    && req.body.hasOwnProperty("amenity_desc")
                    && req.body.hasOwnProperty("amenity_imgs")
                    && req.body.hasOwnProperty("is_free")
                    && req.body.hasOwnProperty("amenity_price_info")
                    && req.body.hasOwnProperty("guest_price_info")
                    && req.body.hasOwnProperty("available_timings")
                    && req.headers.hasOwnProperty("user-token")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'A' || result == 'E')) {
                            var timingArray = JSON.parse(req.body.available_timings);
                            var amenityTimeArray = [];
                            var startTimeVal = new Date(timingArray[0]);
                            var endTimeVal = new Date(timingArray[1]);
                            amenityTimeArray.push(moment(startTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'));
                            amenityTimeArray.push(moment(endTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'));
                            console.log("Starting Time " + startTimeVal, "Ending Time " + endTimeVal);
                            console.log("Converted Start Time " + moment(startTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'), "Converted EndTime " + moment(endTimeVal, 'YYYY-MM-DDThh:mm:ssz').format('hh:mm A'));
                            amenities_module.update_amenity(
                                req.body.building_id,
                                req.body.amenity_id,
                                req.body.amenity_name,
                                req.body.amenity_desc,
                                req.body.amenity_imgs,
                                req.body.is_free,
                                req.body.amenity_price_info,
                                req.body.guest_price_info,
                                amenityTimeArray,
                                0,
                                req.body.resident_hour_price,
                                req.body.guest_hour_price,
                                user_id,
                                function (result, error, message) {
                                    if (error) {
                                        res.json({ status: false, message: message });
                                    }
                                    else {
                                        res.json({ status: true, message: message, result: req.body.unit_id });
                                    }
                                })
                        }
                        else {
                            res.json({ status: false, message: message });
                        }
                    })
                }
                else {
                    if (req.body.hasOwnProperty("amenity_id") == false) {
                        res.json({ status: false, message: "amenity_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_name") == false) {
                        res.json({ status: false, message: "amenity_name parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_desc") == false) {
                        res.json({ status: false, message: "amenity_desc parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_imgs") == false) {
                        res.json({ status: false, message: "amenity_imgs parameter is missing" });
                    } else if (req.body.hasOwnProperty("is_free") == false) {
                        res.json({ status: false, message: "is_free parameter is missing" });
                    } else if (req.body.hasOwnProperty("amenity_price_info") == false) {
                        res.json({ status: false, message: "amenity_price_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("guest_price_info") == false) {
                        res.json({ status: false, message: "guest_price_info parameter is missing" });
                    } else if (req.body.hasOwnProperty("available_timings") == false) {
                        res.json({ status: false, message: "available_timings parameter is missing" });
                    } else if (req.body.hasOwnProperty("no_of_slots") == false) {
                        res.json({ status: false, message: "no_of_slots parameter is missing" });
                    } else if (req.headers.hasOwnProperty("user-token") == false) {
                        res.json({ status: false, message: "user-token parameter is missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: "failed at try" });
            }
        });
        //End of Update Amenities Details

        //API for View All Amenities Details

        //Params: user-token
        //Functions: view_all_amenities
        //Response: status, message, result

        app.post('/v1/view_all_amenities', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token")
                    && req.body.hasOwnProperty("building_id")
                ) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists) {
                            amenities_module.view_all_amenities(req.body.starting_after, req.body.limit, req.body.building_id, function (result1, error, message, total) {
                                if (error) {
                                    res.json({ status: false, message: message });
                                } else {
                                    res.json({ status: true, message: message, result: result1, total: total, totaldata: result1.length });
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
            }
            catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of View All Amenities Details


        //API for Delete Single Amenities Details

        //Params: user-token,amenity_id,building_id
        //Functions: delete_amenity
        //Response: status, message, result

        app.post('/v1/delete_amenity', ensureAuthorized, function (req, res) {
            try {
                if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("amenity_id") && req.body.hasOwnProperty("building_id")) {
                    admin_module.userExists(req.token, function (user_id, result, exists, message) {
                        if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
                            amenities_module.delete_amenity(req.body.amenity_id, req.body.building_id, function (error, message) {
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
                    } else if (req.body.hasOwnProperty("amenity_id") == false) {
                        res.json({ status: false, message: "amenity_id parameter missing" });
                    } else if (req.body.hasOwnProperty("building_id") == false) {
                        res.json({ status: false, message: "building_id parameter missing" });
                    }
                }
            } catch (er) {
                res.json({ status: false, message: er });
            }
        });

        //End of Delete Single Amenities Details
    }
}
