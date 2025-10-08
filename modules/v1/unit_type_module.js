module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var unit_type_module = {

        //Start of Add Unit Type

        add_unit_type: function (new_unit_type, callBack) {
            try {

                db.db().collection(dbb.UNITTYPE).insertOne(new_unit_type, function (err, result, message) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Unit Type Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Unit Type


        //Start of Update Unit Type

        edit_single_unit_types: function (unit_type_id,
            type_name,
            type_parent_name,
            type_parent_id,
            building_id,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.UNITTYPE).updateOne({ "_id": new ObjectID(unit_type_id) }, {

                    $set: {
                        type_name: type_name,
                        type_parent_name: type_parent_name,
                        type_parent_id:new ObjectID(type_parent_id),
                        // type_parent_id: type_parent_id,
                        building_id: new ObjectID(building_id),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    } else {
                        callBack(result, false, "Unit Type Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Unit Type



        //Start of View All Unit Type

        view_all_unit_types: function (building_id, callBack) {
            try {
                unit_type = [];

                var cursor = db.db().collection(dbb.UNITTYPE).find({ building_id: new ObjectID(building_id), active: true })

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

                        unit_type_module.view_all_unit_types2(unit_type, function (result, error) {
                            if (error) {
                                callBack(null, true, "No Unit Type Found");
                            }
                            else {
                                callBack(result, false, "Unit Type Found");
                            }
                        })
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Unit Type



        //Start of View  Unit Type

        view_all_unit_types2: function (unit_type, callBack) {
            try {
                unit_type_datas = [];
                var index = 0;
                var get_data = function (doc) {
                    if (doc.type_parent_id !== null) {
                        var cursor = db.db().collection(dbb.UNITTYPE).find({ _id: new ObjectID(doc.type_parent_id) })
                        cursor.forEach(function (doc2, err) {
                            if (err) {
                                callBack(null, true);
                            }
                            else {
                                doc.type_parent_name = doc2.type_name
                                unit_type_datas.push(doc);
                            }
                        }, function () {
                            index++;
                            if (index < unit_type.length) {
                                get_data(unit_type[index]);
                            } else {
                                callBack(unit_type_datas, false);
                            }
                        })
                    }
                    else {
                        doc.type_parent_name = null;
                        unit_type_datas.push(doc);
                        index++;
                        if (index < unit_type.length) {
                            get_data(unit_type[index]);
                        } else {
                            callBack(unit_type_datas, false);
                        }
                    }
                }
                if (unit_type.length !== 0) {
                    get_data(unit_type[index]);
                }
            } catch (e) {
                callBack(null, true);
            }
        },
        //End of View  Unit Type


        //Start of Delete Unit Type

        delete_unit_type: function (unit_type_id, building_id, callBack) {
            try {
                var message = "";
                var undeletedUnits = 0;
                unit_type = [];
                var index = 0;
                var delete_data = function (doc) {
                    var unit_id = new ObjectID(doc);
                    db.db().collection(dbb.UNIT).countDocuments({ unit_type_id: unit_id, building_id: new ObjectID(building_id) }, function (err, count) {
                        if (err) {
                            callBack(true, 'Error Occured');
                        }
                        else {
                            if (count == 0) {
                                unit_type.push(unit_id);
                            } else {
                                undeletedUnits++;
                            }
                            index++;
                            if (index < unit_type_id.length) {
                                delete_data(unit_type_id[index]);
                            } else {
                                var noDeleted = unit_type_id.length - undeletedUnits;
                                if (noDeleted > 0) {
                                    message = noDeleted + " deleted successfully ";
                                }
                                if (undeletedUnits > 0) {
                                    message = message + undeletedUnits + " not deleted because they have inner units";
                                }
                                db.db().collection(dbb.UNITTYPE).deleteMany({ "_id": { $in: unit_type }, building_id: new ObjectID(building_id) }, function (err, result) {
                                    if (err) {
                                        callBack(true, err);
                                    }
                                    else {
                                        callBack(false, message);
                                    }
                                });
                            }
                        }
                    });
                }
                unit_type_id = JSON.parse(unit_type_id);

                if (unit_type_id.length !== 0) {
                    delete_data(unit_type_id[index]);
                }

            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Delete Unit Type


        //Start of View Single Unit Type

        view_single_unit_types: function (unit_type_id, callBack) {
            try {
                unit_type = [];

                var cursor = db.db().collection(dbb.UNITTYPE).find({ _id: new ObjectID(unit_type_id), active: true })

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
        //End of View Single Unit Type

    }
    return unit_type_module;
}