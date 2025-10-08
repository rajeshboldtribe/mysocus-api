module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var helper_assign_module = {

        //Start of Assign Helper

        assign_helper_unit: function (assign_helper, callBack) {
            try {

                db.db().collection(dbb.UNITHELPER).insertOne(assign_helper, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Helper Assigned Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Assign Helper

        //Start of Get Unit helper Details

        get_units_helpers: function (starting_after, limit, building_id, unit_id, callBack) {
            try {
                helper = [];
                var totaldata;
                if (limit == '' && starting_after == '' || (limit == undefined && starting_after == undefined)) {

                    var cursor = db.db().collection(dbb.UNITHELPER).aggregate([
                        {
                            $match: { building_id: new ObjectID(building_id), unit_id: new ObjectID(unit_id), active: true }
                        },
                        {
                            $lookup: {
                                from: dbb.HELPER,
                                localField: "helper_id",
                                foreignField: "_id",
                                as: "helper_details"
                            },
                        },
                        {
                            $unwind: "$helper_details"
                        },
                        {
                            $lookup: {
                                from: dbb.UNIT,
                                localField: "unit_id",
                                foreignField: "_id",
                                as: "unit_details"
                            },
                        },
                        {
                            $unwind: "$unit_details"
                        },
                    ]);
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);
                    var cursor = db.db().collection(dbb.UNITHELPER).aggregate([
                        {
                            $match: { building_id: new ObjectID(building_id), unit_id: new ObjectID(unit_id), active: true }
                        },
                        {
                            $lookup: {
                                from: dbb.HELPER,
                                localField: "helper_id",
                                foreignField: "_id",
                                as: "helper_details"
                            },
                        },
                        {
                            $unwind: "$helper_details"
                        },
                        {
                            $lookup: {
                                from: dbb.UNIT,
                                localField: "unit_id",
                                foreignField: "_id",
                                as: "unit_details"
                            },
                        },
                        {
                            $unwind: "$unit_details"
                        },
                    ]).skip(starting_after).limit(limit);

                }
                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        var doc3 = {
                            _id: doc._id,
                            helper_name: doc.helper_details.helper_name,
                            helper_id: doc.helper_id,
                            unit_name: doc.unit_details.unit_name,
                            unit_id: doc.unit_id,
                            building_id: doc.building_id,
                            active: doc.active,
                            last_worked_date: doc.last_worked_date
                        }
                        helper.push(doc3);
                    }
                }, function () {
                    if (helper.length == 0) {
                        callBack(null, true, "No Unit helper Found", '');
                    }
                    else {
                        db.db().collection(dbb.UNITHELPER).countDocuments({ building_id: new ObjectID(building_id), unit_id: new ObjectID(unit_id), active: true }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }

                            callBack(helper, false, "Unit helper Found", totaldata);
                        })
                    }
                })

            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Get Unit helper Details



        //Start of View Helper Unit Details

        view_helpers_units: function (starting_after, limit, building_id, helper_id, callBack) {
            try {
                helper = [];
                var totaldata;

                if (limit == '' && starting_after == '' || (limit == undefined && starting_after == undefined)) {
                    var cursor = db.db().collection(dbb.UNITHELPER).aggregate([
                        {
                            $match: { building_id: new ObjectID(building_id), helper_id: new ObjectID(helper_id), active: true }
                        },
                        {
                            $lookup: {
                                from: dbb.HELPER,
                                localField: "helper_id",
                                foreignField: "_id",
                                as: "helper_details"
                            },
                        },
                        {
                            $unwind: "$helper_details"
                        },
                        {
                            $lookup: {
                                from: dbb.UNIT,
                                localField: "unit_id",
                                foreignField: "_id",
                                as: "unit_details"
                            },
                        },
                        {
                            $unwind: "$unit_details"
                        },
                    ]);
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);

                    var cursor = db.db().collection(dbb.UNITHELPER).aggregate([
                        {
                            $match: { building_id: new ObjectID(building_id), helper_id: new ObjectID(helper_id), active: true }
                        },
                        {
                            $lookup: {
                                from: dbb.HELPER,
                                localField: "helper_id",
                                foreignField: "_id",
                                as: "helper_details"
                            },
                        },
                        {
                            $unwind: "$helper_details"
                        },
                        {
                            $lookup: {
                                from: dbb.UNIT,
                                localField: "unit_id",
                                foreignField: "_id",
                                as: "unit_details"
                            },
                        },
                        {
                            $unwind: "$unit_details"
                        },
                    ]).skip(starting_after).limit(limit);

                }

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        var doc3 = {
                            _id: doc._id,
                            helper_name: doc.helper_details.helper_name,
                            helper_id: doc.helper_id,
                            unit_name: doc.unit_details.unit_name,
                            unit_id: doc.unit_id,
                            building_id: doc.building_id,
                            active: doc.active,
                            last_worked_date: doc.last_worked_date
                        }
                        helper.push(doc3);
                    }
                }, function () {
                    if (helper.length == 0) {
                        callBack(null, true, "No helper Unit Found", '');
                    }
                    else {
                        db.db().collection(dbb.UNITHELPER).countDocuments({ building_id: new ObjectID(building_id), helper_id: new ObjectID(helper_id), active: true }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }

                        callBack(helper, false, "helper Unit Found", totaldata);
                    })
                }
                })

            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View Helper Unit Details


        //Start of  Remove Helper Unit

        remove_helper_unit: function (helper_id, unit_id, building_id, last_worked_date, callBack) {
            try {

                db.db().collection(dbb.UNITHELPER).updateOne({ "helper_id": new ObjectID(helper_id), "unit_id": new ObjectID(unit_id), "building_id": new ObjectID(building_id) }, {
                    $set: {

                        last_worked_date: new Date(last_worked_date)
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Assign Helper Remove Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Remove Helper Unit


        //Start of assign helper unit 2

        assign_helper_unit2: function (helper_id, building_id, unit_id, callBack) {
            try {
                db.db().collection(dbb.HELPER).updateOne({ "_id": new ObjectID(helper_id), "building_id": new ObjectID(building_id) }, {
                    $push: {
                        "helper_units": unit_id
                    }
                }, { upser: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Helper assigned to unit");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of assign helper unit 2

        //Start of remove helper unit 2
        
        remove_helper_unit2: function (helper_id, building_id, unit_id, callBack) {
            try {
                db.db().collection(dbb.HELPER).updateOne({ "_id": new ObjectID(helper_id), "building_id": new ObjectID(building_id) }, {
                    $pull: {
                        "helper_units": unit_id
                    }
                }, { upser: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Helper removed from unit");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of remove helper unit 2

    }
    return helper_assign_module;
}