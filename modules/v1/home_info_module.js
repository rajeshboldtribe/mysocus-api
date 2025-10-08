module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var home_info_module = {

        //Start of Add Home Info Details
        add_homeinfo_details: function (new_homeinfo, callBack) {
            try {

                db.db().collection(dbb.HOMEINFO).insertOne(new_homeinfo, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Unit Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Home Info Details


        //Start of Get Home Info Details

        get_homeinfo_details: function (callBack) {
            try {
                homeinfo = [];

                var cursor = db.db().collection(dbb.HOMEINFO).find({})

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        unit.push(doc);
                    }
                }, function () {
                    if (homeinfo.length == 0) {
                        callBack(null, true, "No Home Info Details Found");
                    }
                    else {
                        callBack(homeinfo, false, "Home Info Details Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Get Home Info Details

       

        //Start of Home Info Details
        delete_single_homeinfo_details: function (homeinfo_id, callBack) {
            try {
                db.db().collection(dbb.HOMEINFO).deleteOne({ "_id": new ObjectID(homeinfo_id) }, function (err, obj) {
                    if (err) {
                        callBack(true, err);
                    }
                    else {
                        //console.log(obj.result.n + " record(s) deleted");  
                        callBack(false, "Home Info Deleted");
                    }
                });
            } catch (e) {

                callBack(null, true, e);
            }
        },
        //End of Delete Home Info Details

        //Start of Update Home info Details

        update_homeinfo_details: function (homeinfo_id,unit_id,owner_id,helper_info,tenant_info,parking_spots, modified_by, callBack) {
            try {
               
                db.db().collection(dbb.HOMEINFO).updateOne({ "_id": new ObjectID(homeinfo_id) }, {
                    $set: {
                        unit_id: new ObjectID(unit_id),
                        //is_top_most: req.body.is_top_most.toLowerCase() == 'true' ? true : false,
                        owner_id: new ObjectID(owner_id),
                        helper_info: JSON.parse(helper_info),
                        tenant_info: JSON.parse(tenant_info),
                        parking_spots: JSON.parse(parking_spots),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Home Info Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Unit Details

    }
    return home_info_module;
}