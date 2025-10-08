module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var department_module = {

        //Start of Add Department

        add_department: function (new_department, callBack) {
            try {

                db.db().collection(dbb.DEPARTMENT).insertOne(new_department, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Department Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Department


        //Start of Update Department

        update_department: function (department_id,
            department_name,
            department_desc,
            building_id,
            modified_by,
            callBack) {
            try {

                db.db().collection(dbb.DEPARTMENT).updateOne({ "_id": new ObjectID(department_id) }, {

                    $set: {
                        department_name: department_name,
                        department_desc: department_desc,
                        building_id: new ObjectID(building_id),
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Department Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Department



        //Start of View All Department

        view_all_departments: function (starting_after, limit, building_id, callBack) {
            try {
                department = [];

                var totaldata;


                if (limit == '' && starting_after == '') {
                    var cursor = db.db().collection(dbb.DEPARTMENT).find({ active: true });
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);
                    var cursor = db.db().collection(dbb.DEPARTMENT).find({ active: true }).skip(starting_after).limit(limit);
                }

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }
                    else {
                        department.push(doc);
                    }
                }, function () {
                    if (department.length == 0) {
                        callBack(null, true, "No Departments Found", '');
                    }
                    else {
                        db.db().collection(dbb.DEPARTMENT).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }

                            callBack(department, false, "Departments Found", totaldata);
                        })
                    }
                })

            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Department



        //Start of View All Active Department

        view_all_active_departments: function (starting_after, limit, building_id, callBack) {
            try {
                department = [];
                var totaldata;

                if (limit == '' && starting_after == '') {
                    var cursor = db.db().collection(dbb.DEPARTMENT).find({ building_id: new ObjectID(building_id), active: true });
                }
                else {
                    var limit = parseInt(limit);
                    var starting_after = parseInt(starting_after);
                    var cursor = db.db().collection(dbb.DEPARTMENT).find({ building_id: new ObjectID(building_id), active: true }).skip(starting_after).limit(limit);

                }
                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }
                    else {
                        department.push(doc);
                    }
                }, function () {
                    if (department.length == 0) {
                        callBack(null, true, "No Active Departments Found", '');
                    }
                    else {
                        db.db().collection(dbb.DEPARTMENT).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
                            if (!countErr) {
                                totaldata = count;
                            }

                            callBack(department, false, "Active Departments Found", totaldata);
                        })
                    }
                })

            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Active Department


        //Start of View Single Department

        view_single_department: function (department_id, callBack) {
            try {
                unit_type = [];

                var cursor = db.db().collection(dbb.DEPARTMENT).find({ _id: new ObjectID(department_id), active: true })

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        unit_type.push(doc);
                    }
                }, function () {
                    if (unit_type.length == 0) {
                        callBack(null, true, "No Department  Found");
                    }
                    else {
                        callBack(unit_type, false, "Department  Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View Single Department


        //Start of Delete Department

        delete_department: function (department_id, building_id, callBack) {
            try {
                department_id = JSON.parse(department_id);
                department = [];
                for (var i = 0; i < department_id.length; i++) {
                    var a = new ObjectID(department_id[i]);
                    department.push(a)
                }

                db.db().collection(dbb.DEPARTMENT).updateMany({ "_id": { $in: department }, building_id: new ObjectID(building_id) }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(true, err);
                    }
                    else {
                        callBack(false, "Department Deleted");
                    }
                });
            } catch (e) {

                callBack(true, e);
            }
        },
        //End of Delete Department

    }
    return department_module;
}