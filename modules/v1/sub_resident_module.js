module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var sub_resident_module = {

        //Start of Add Sub Resident Details

        add_sub_resident: function (new_sub_resident, callBack) {
            try {

                db.db().collection(dbb.RESIDENT).insertOne(new_sub_resident, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Sub Resident Details Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add  Sub Resident Details


        //Start of Update Sub Resident Details

        update_sub_resident: function (resident_id,
            building_id,
            resident_name,
            resident_img,
            resident_email,
            resident_contact_info,
            resident_sec_contact_info,
            resident_permanent_address,
            resident_id_proof,
            resident_vehcile_details,
            unit_id,
            is_sub_resident,
            is_owner,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.RESIDENT).updateOne({ "_id": new ObjectID(resident_id) }, {
                    $set: {
                        resident_name: resident_name,
                        resident_email: resident_email,
                        resident_img: resident_img,
                        resident_contact_info: parseInt(resident_contact_info),
                        resident_sec_contact_info: parseInt(resident_sec_contact_info),
                        resident_id_proof: JSON.parse(resident_id_proof),
                        resident_permanent_address: resident_permanent_address,
                        resident_vehcile_details: JSON.parse(resident_vehcile_details),
                        is_sub_resident: is_sub_resident.toLowerCase() == 'true' ? true : false,
                        is_owner: is_owner.toLowerCase() == 'true' ? true : false,
                        unit_id: new ObjectID(unit_id),
                        building_id: new ObjectID(building_id),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Sub Resident Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update  Sub Resident Details


        //Start of View Single Resident Details

        view_resident: function (resident_id, callBack) {
            try {
                resident = [];

                var cursor = db.db().collection(dbb.RESIDENT).find({ "_id": new ObjectID(resident_id), active: true })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        resident.push(doc);
                    }
                }, function () {
                    if (resident.length == 0) {
                        callBack(null, true, "No Resident Found");
                    }
                    else {
                        callBack(resident, false, "Resident Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View Single  Resident Details


        //Start of Delete  Sub Resident Details

        delete_sub_resident: function (resident_id, building_id, callBack) {
            try {
                resident_id = JSON.parse(resident_id);
                resident = [];

                for (var i = 0; i < resident_id.length; i++) {
                    var a = new ObjectID(resident_id[i]);
                    resident.push(a)
                }

                db.db().collection(dbb.RESIDENT).updateMany({ "_id": { $in: resident }, building_id: new ObjectID(building_id) }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {

                    if (err) {
                        callBack(true, err);
                    }
                    else {

                        db.db().collection(dbb.USER).updateMany({ "user_id": { $in: resident } }, {
                            // db.db().collection(dbb.USER).deleteOne({ "user_id": new ObjectID(resident_id) }, function (err, obj) {
                            $set: {
                                active: false
                            }
                        }, { upsert: false }, function (err, result) {
                            if (err) {
                                callBack(true, err);
                            }
                            else {
                                callBack(false, "Sub Resident Deleted");
                            }
                        });
                    }
                });
            } catch (e) {

                callBack(true, e);
            }
        },
        //End of Delete  Sub Resident Details


        //Start of View All Resident Details Of A Unit

        view_all_residents: function (building_id, unit_id, callBack) {
            try {
                resident = [];

                var cursor = db.db().collection(dbb.RESIDENT).find({ "building_id": new ObjectID(building_id), "unit_id": new ObjectID(unit_id), active: true })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        resident.push(doc);
                    }
                }, function () {
                    if (resident.length == 0) {
                        callBack(null, true, "No Resident Found");
                    }
                    else {
                        callBack(resident, false, "Resident Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Resident Details Of A Unit

    }
    return sub_resident_module;
}