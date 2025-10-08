module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var vehicle_module = {

        //Start of Add Vehicle Details

        add_vehicle: function (new_vehicle, callBack) {
            try {

                db.db().collection(dbb.VEHICLE).insertOne(new_vehicle, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Vehicle Details Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Vehicle Details


        //Start of Update Vehicle Details

        update_vehicle: function (vehicle_id,
            vehicle_name,
            vehicle_type,
            vehicle_manufacturer,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.VEHICLE).updateOne({ "_id": new ObjectID(vehicle_id) }, {
                    $set: {
                        vehicle_name: vehicle_name,
                        vehicle_type: vehicle_type,
                        vehicle_manufacturer: vehicle_manufacturer,
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Vehicle Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Vehicle Details

        //Start of View All Vehicle Details

        view_all_vehicles: function (starting_after, limit, callBack) {
            try {
                vehicle = [];
                var totaldata;

                if (limit == '' && starting_after == '' || limit == undefined && starting_after == undefined) {
                    var cursor = db.db().collection(dbb.VEHICLE).find({ active: true }).collation({ locale: "en" }).sort({vehicle_name : 1});
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);
                    var cursor = db.db().collection(dbb.VEHICLE).find({ active: true }).collation({ locale: "en" }).sort({vehicle_name : 1}).skip(starting_after).limit(limit);
                }
                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }
                    else {
                        vehicle.push(doc);
                    }
                }, function () {
                    if (vehicle.length == 0) {
                        callBack(null, true, "No Vehicle Found", '');
                    }
                    else {
                        db.db().collection(dbb.VEHICLE).countDocuments({ active: true }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }

                            callBack(vehicle, false, "Vehicle Found", totaldata);
                        })
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Vehicle Details


        //Start of View Single Vehicle Details

        view_single_vehicle: function (unit_type_id, callBack) {
            try {
                unit_type = [];

                var cursor = db.db().collection(dbb.UNITTYPE).find({ _id: new ObjectID(unit_type_id) })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        unit_type.push(doc);
                    }
                }, function () {
                    if (unit_type.length == 0) {
                        callBack(null, true, "No Unit Type Found");
                    }
                    else {
                        callBack(unit_type, false, "Unit Type Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View Single Vehicle Details



        //Start of Delete Vehicle Details
        delete_vehicle: function (vehicle_id, callBack) {
            try {
                vehicle_id = JSON.parse(vehicle_id);
                vehicle = [];

                for (var i = 0; i < vehicle_id.length; i++) {
                    var a = new ObjectID(vehicle_id[i]);
                    vehicle.push(a)
                }

                db.db().collection(dbb.VEHICLE).updateMany({ "_id": { $in: vehicle } }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(true, err);
                    }
                    else {
                        callBack(false, "Vehicle Deleted");
                    }
                });
            } catch (e) {

                callBack(true, e);
            }
        },
        //End of Delete Vehicle Details

    }
    return vehicle_module;
}