module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var amenities_module = {

        //Start of Add Amenities
        add_amenity: function (new_amenities, callBack) {
            try {

                db.db().collection(dbb.AMENITIES).insertOne(new_amenities, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Amenities Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Amenities


        //Start of Update Amenities


        update_amenity: function (
            building_id,
            amenity_id,
            amenity_name,
            amenity_desc,
            amenity_imgs,
            is_free,
            amenity_price_info,
            guest_price_info,
            available_timings,
            no_of_slots,
            resident_hour_price,
            guest_hour_price,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.AMENITIES).updateOne({ "_id": new ObjectID(amenity_id) }, {
                    $set: {
                        building_id: new ObjectID(building_id),
                        amenity_name: amenity_name,
                        amenity_desc: amenity_desc,
                        amenity_imgs: JSON.parse(amenity_imgs),
                        //is_free: is_free.toLowerCase() == 'true' ? true : false,
                        is_free: is_free,
                        amenity_price_info: JSON.parse(amenity_price_info),
                        guest_price_info: JSON.parse(guest_price_info),
                        available_timings: available_timings,
                        resident_hour_price: resident_hour_price,
                        guest_hour_price: guest_hour_price,
                        no_of_slots: parseInt(no_of_slots),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Amenities Details Updated Successfully");
                    }

                });
            } catch (e) {

                callBack(null, true, e);
            }
        },
        //End of Update Amenities



        //Start of View All Amenities

        view_all_amenities: function (starting_after, limit, building_id, callBack) {
            try {
                amenities = [];
                var totaldata;

                if (limit == undefined || starting_after == undefined) {
                    var cursor = db.db().collection(dbb.AMENITIES).find({ building_id: new ObjectID(building_id), active: true });
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);
                    var cursor = db.db().collection(dbb.AMENITIES).find({ building_id: new ObjectID(building_id), active: true }).skip(starting_after).limit(limit);

                }

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }
                    else {
                        amenities.push(doc);
                    }
                }, function () {
                    if (amenities.length == 0) {
                        callBack(null, true, "No Amenities Found", '');
                    }
                    else {
                        db.db().collection(dbb.AMENITIES).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }
                            callBack(amenities, false, "Amenities Found", totaldata);
                        })
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Amenities

        //Start of Delete Amenities

        delete_amenity: function (amenity_id, building_id, callBack) {
            try {

                db.db().collection(dbb.AMENITIES).updateOne({ "_id": new ObjectID(amenity_id), building_id: new ObjectID(building_id) }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {

                    if (err) {
                        callBack(true, err);
                    }
                    else {
                        callBack(false, "Amenities Deleted");
                    }
                });
            } catch (e) {

                callBack(true, e);
            }
        },
        //End of Delete Amenities

    }
    return amenities_module;
}