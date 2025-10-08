module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var vendor_category_module = {


        add_vendor_category: function (new_category, callback) {
            db.db().collection(dbb.VENDORCATEGORIES).insertOne(new_category, function (err, result) {
                if (err) {
                    callback(null, true, err);
                } else {
                    callback(result, false, "Category Added Successfully");
                }
            })
        },


        update_vendor_category: function (category_id, category_name, callback) {
            try {
                db.db().collection(dbb.VENDORCATEGORIES).updateOne({ "_id": new ObjectID(category_id) }, {
                    $set: {
                        vendor_category_name: category_name
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callback(null, true, err);
                    } else {
                        callback(result, false, "Category Updated Successfully");
                    }
                })
            } catch (e) {
                callback(null, true, e);
            }
        },

        delete_vendor_category: function (category_id, callback) {
            try {
                db.db().collection(dbb.VENDORCATEGORIES).updateOne({ "_id": new ObjectID(category_id) }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callback(null, true, err);
                    } else {
                        callback(result, false, "Category Deleted Successfully");
                    }
                })
            } catch (e) {
                callback(null, true, e);
            }
        },

        view_all_vendor_category: function (callback) {
            try {
                var categories = [];
                var cursor = db.db().collection(dbb.VENDORCATEGORIES).find({ "active": true });

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callback(null, true, err);
                    } else {
                        var data = {
                            vendor_category_id: doc._id,
                            vendor_category_name: doc.vendor_category_name
                        }
                        categories.push(data);
                    }
                }, function () {
                    if (categories.length == 0) {
                        callback(null, true, "No categories Found");
                    } else {
                        callback(categories, false, "Categories Found");
                    }
                })
            } catch (e) {
                callback(null, true, e);
            }
        },
    }
    return vendor_category_module;
}