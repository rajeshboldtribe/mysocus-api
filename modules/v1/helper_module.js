module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var helper_module = {

        //Start of Add Helper Details

        add_helper: function (new_helper, callBack) {
            try {
                db.db().collection(dbb.HELPER).insertOne(new_helper, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "New Helper Added Successfully");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Helper Details


        //Start of Update Helper Details

        update_helper: function (
            helper_id,
            helper_name,
            building_id,
            helper_img,
            helper_contact_info,
            helper_sec_contact_info,
            helper_permanent_address,
            helper_service,
            helper_id_proofs,
            is_private,
            is_approved,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.HELPER).updateOne({ "_id": new ObjectID(helper_id) }, {

                    $set: {
                        helper_name: helper_name,
                        helper_permanent_address: helper_permanent_address,
                        helper_img: helper_img,
                        helper_contact_info: parseInt(helper_contact_info),
                        helper_sec_contact_info: parseInt(helper_sec_contact_info),
                        helper_service: helper_service,
                        helper_id_proofs: JSON.parse(helper_id_proofs),
                        building_id: new ObjectID(building_id),
                        is_private: is_private,
                        is_kyc_approved: is_approved,
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Helper Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Helper Details



        //Start of View All Helpers

        view_all_helpers: function (starting_after, limit, building_id, user_type, callBack) {
            try {
                var find;
                var totaldata;
                var helpers = [];


                if (user_type == 'SA' || user_type == 'A') {
                    find = {
                        building_id: new ObjectID(building_id),
                        active: true
                    }
                }else if (user_type == 'R' || user_type == 'SR') {
                    find = {
                        building_id: new ObjectID(building_id),
                        is_private: false,
                        active: true
                    }
                }

                if (limit == undefined || starting_after == undefined) {
                    var cursor = db.db().collection(dbb.HELPER).find(find).collation({ locale: "en" }).sort({helper_name : 1})
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);
                    var cursor = db.db().collection(dbb.HELPER).find(find).sort({helper_name : 1}).collation({ locale: "en" }).skip(starting_after).limit(limit);
                }
                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }
                    else {
                        helpers.push(doc);
                    }
                }, function () {
                    if (helpers.length == 0) {
                        callBack(null, true, "No Helpers Found", '');
                    }
                    else {
                        db.db().collection(dbb.HELPER).countDocuments({
                            building_id: new ObjectID(building_id), active: true
                        }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }

                            callBack(helpers, false, "Helpers Found", totaldata);
                        })
                    }
                })

            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Helpers


        //Start of View Single Helper

        view_helper: function (helper_id, callBack) {
            try {
                helper = [];

                var cursor = db.db().collection(dbb.HELPER).find({ _id: new ObjectID(helper_id), active: true })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        helper.push(doc);
                    }
                }, function () {
                    if (helper.length == 0) {
                        callBack(null, true, "No Helper Found");
                    }
                    else {
                        callBack(helper, false, "Helper Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View Single Helper


        //Start of Delete Helper

        delete_helper: function (helper_id, building_id, callBack) {
            try {
                helper_id = JSON.parse(helper_id);
                helper = [];

                for (var i = 0; i < helper_id.length; i++) {
                    var a = new ObjectID(helper_id[i]);
                    helper.push(a)
                }
                db.db().collection(dbb.HELPER).updateMany({ "_id": { $in: helper }, building_id: new ObjectID(building_id) }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {


                    if (err) {
                        callBack(true, err);
                    }
                    else {
                        db.db().collection(dbb.USER).updateMany({ "user_id": { $in: helper } }, {
                            $set: {
                                active: false
                            }
                        }, { upsert: false }, function (err, result) {


                            if (err) {
                                callBack(true, err);
                            }
                            else {

                                callBack(false, " Helper Deleted");
                            }
                        });
                    }
                });
            } catch (e) {

                callBack(true, e);
            }
        },
        //End of Delete Helper

        //Start of Update Employee Departments

        update_employee_department: function (employee_id,
            building_id,
            employee_departments,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(employee_id) }, {

                    $set: {
                        employee_departments: JSON.parse(employee_departments),
                        building_id: new ObjectID(building_id),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Employee Department Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Employee Department

        helper_visitor_entry: function (helper_entry, callBack) {
            try {

                db.db().collection(dbb.HELPER_VISITORS).insertOne(helper_entry, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Employee Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //Start of Update Helper Vehicles

        update_helper_vehicles: function (helper_id,
            building_id,
            helper_vehicle_details,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.HELPER).updateOne({ "_id": new ObjectID(helper_id) }, {

                    $set: {
                        helper_vehicle_details: JSON.parse(helper_vehicle_details),
                        building_id: new ObjectID(building_id),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Helper Vehicles Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Helper Vehicles

        search_helper: function (keyword, building_id, callBack) {
            try {
                let helpers = [];
                var cursor = db.db().collection(dbb.HELPER).find({ helper_name: { $regex: keyword, $options: 'i' }, building_id: new ObjectID(building_id), active: true })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        helpers.push(doc);
                    }
                }, function () {
                    if (helpers.length == 0) {
                        callBack(null, true, "No Employee  Found");
                    }
                    else {
                        callBack(helpers, false, "Employee  Found");
                    }
                })
            } catch (e) {
                callBack(true, e);
            }
        },
        //Start of Toggle Kyc Active

        toggle_helper_active: function (helper_id, callBack) {
            try {
                var is_kyc_approved = false;

                var cursor = db.db().collection(dbb.HELPER).find({ "_id": new ObjectID(helper_id) });
                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }
                    else {
                        is_kyc_approved = doc.is_kyc_approved;
                        if (is_kyc_approved == true) {
                            db.db().collection(dbb.HELPER).updateOne({ "_id": new ObjectID(helper_id) }, {
                                $set: {
                                    is_kyc_approved: false,
                                }
                            }, { upsert: false }, function (err, result) {
                                if (err) {
                                    callBack(null, true, err);
                                } else {
                                    callBack(result, false, "KYC disapproved");
                                }
                            });
                        }
                        else {
                            db.db().collection(dbb.HELPER).updateOne({ "_id": new ObjectID(helper_id) }, {
                                $set: {
                                    is_kyc_approved: true,
                                }
                            }, { upsert: false }, function (err, result) {
                                if (err) {
                                    callBack(null, true, err);
                                } else {
                                    callBack(result, false, "KYC approved");
                                }
                            });
                        }
                    }
                });

            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Toggle Kyc Active


        //Start of View Helper Units

        view_helpers_units: function (building_id, helper_id, callBack) {
            try {
                var helper_unit;
                var cursor = db.db().collection(dbb.HELPER).find({ _id: new ObjectID(helper_id), building_id: new ObjectID(building_id), active: true })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        
                        if(doc.helper_units != undefined){
                        helper_unit = doc.helper_units;
                        }
                        else{
                            helper_unit=[];
                        }
                    }
                }, function () {
                    if (helper_unit.length == 0) {
                        callBack(null, true, "Helper Not Assigned to Any Unit");
                    }
                    else {
                      
                        var units = [];
                        var index = 0
                        var getUnitInfo = function (unitInfo) {

                            var unitCursor = db.db().collection(dbb.UNIT).aggregate([
                                {
                                    $match: { "_id": new ObjectID(unitInfo)}
                                },
                                {
                                    $lookup: {
                                        from: dbb.UNIT,
                                        localField: "unit_parent_id",
                                        foreignField: "_id",
                                        as: "unit_details"
                                    },
                                },
                                {
                                    $unwind: "$unit_details"
                                },
                            ])

                            unitCursor.forEach(function (doc99, err99) {
                                if (err99) {
                                    callBack(null, true, "No Units Found");
                                } else {
                                  
                                    var data = {
                                        unit_name: doc99.unit_name,
                                        unit_id: doc99._id,
                                        unit_parent_id:doc99.unit_parent_id,
                                        unit_parent_name:doc99.unit_details.unit_name
                                    }
                                    units.push(data)
                                }
                            }, function () {
                                index++;
                                if (index < helper_unit.length) {
                                    getUnitInfo(helper_unit[index]);
                                   
                                } else {
                                    callBack(units, false, "Helper Assigned Unit Found");
                                }
                            })
                        }

                        if (helper_unit.length > 0) {
                            getUnitInfo(helper_unit[index])
                        }
                    }
                })
            } catch (e) { 
                callBack(null,true, e);
            }
        },
        //End of View  Helper Units


    }
    return helper_module;
}