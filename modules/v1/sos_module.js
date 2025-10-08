module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var sos_module = {

    //ADD SOS FUNCTION
    add_sos_to_unit: function (new_sos, callBack) {
      try {
        db.db().collection(dbb.SOS).insertOne(new_sos, function (err, result) {
          if (err) {
            callBack(true, "Error Occurred");
          } else {
            callBack(false, "SOS added successfully");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //END OF ADD SOS

    //START OF EDIT SOS 
    edit_sos: function (sos_id, sos_name, sos_img, sos_phone_number, callBack) {
      try {
        db.db().collection(dbb.SOS).updateOne({ _id: new ObjectID(sos_id) }, {
          $set: {
            name: sos_name,
            phone_number: sos_phone_number,
            user_img: sos_img
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "SOS info edited succesfully");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //END OF EDIT SOS

    //START OF DELETE SOS
    delete_sos: function (sos_id, callBack) {
      try {
        db.db().collection(dbb.SOS).updateOne({ _id: new ObjectID(sos_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "SOS info deleted successfully");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //END OF DELETE SOS

    search_sos_by_phoneno: function (phone_no, callBack) {
      try {
        var units = [];
        var cursor = db.db().collection(dbb.SOS).aggregate([
          { $match: { phone_number: { $regex: phone_no, $options: 'i' } } },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" }, },
          { $unwind: "$unit_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          { $unwind: "$unit_parent_details" }
        ]);

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var unitNo = "";
            var unitID = "";

            if (doc.unit_details != undefined) {
              unitID = doc.unit_details._id;
              if (doc.unit_parent_details != undefined) {
                unitNo = doc.unit_parent_details.unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitNo = doc.unit_details.unit_name;
              }
            }

            var data = {
              sos_name: doc.name,
              sos_img: doc.user_img,
              sos_phone_number: doc.phone_number,
              unit_id: unitID,
              unit_no: unitNo
            }
            units.push(data);
          }
        }, function () {
          if (units.length == 0) {
            callBack(null, true, "No units found");
          } else {
            callBack(units, false, "units Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    get_sos_by_unit: function (unit_id, callBack) {
      try {
        var sos = [];
        var cursor = db.db().collection(dbb.SOS).find({ unit_id: new ObjectID(unit_id), active: true });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            data = {
              sos_id: doc._id,
              sos_name: doc.name,
              sos_phone_number: doc.phone_number,
              sos_img: doc.user_img,
            }
            sos.push(data);
          }
        }, function () {
          if (sos === []) {
            callBack(null, true, "SOS not found");
          } else {
            callBack(sos, false, "SOS Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

  }
  return sos_module;
}