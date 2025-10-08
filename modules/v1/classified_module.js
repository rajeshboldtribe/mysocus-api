module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var classified_module = {

    //Start of Add classified
    create_classified_ad: function (new_classified, callBack) {
      try {

        db.db().collection(dbb.CLASSIFIED).insertOne(new_classified, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "classified Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add classified


    //Start of Update classified

    update_classified_ad: function (
      ad_id,
      ad_name,
      ad_desc,
      ad_images,
      ad_contact_person,
      ad_contact_number,
      modified_by,
      building_id,
      callBack) {
      try {
        db.db().collection(dbb.CLASSIFIED).updateOne({ "_id": new ObjectID(ad_id), "building_id": new ObjectID(building_id) }, {
          $set: {
            ad_name: ad_name,
            ad_desc: ad_desc,
            ad_images: JSON.parse(ad_images),
            ad_contact_person: ad_contact_person,
            ad_contact_number: ad_contact_number,
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "classified Details Updated Successfully");
          }

        });
      } catch (e) {
        console.log(e)
        callBack(null, true, e);
      }
    },
    //End of Update classified

    //Start of View All classified

    get_classifieds: function (starting_after, limit, building_id, callBack) {
      try {
        classified = [];

        var totaldata;


        if (limit == undefined || starting_after == undefined) {
          var cursor = db.db().collection(dbb.CLASSIFIED).aggregate([
            { $match: { active: true, building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.RESIDENT, localField: "posted_by", foreignField: "_id", as: "resident_details" } }
          ])
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.CLASSIFIED).aggregate([
            { $match: { active: true, building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.RESIDENT, localField: "posted_by", foreignField: "_id", as: "resident_details" } }
          ]).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var postedBy = "";
            if (doc.resident_details != undefined && doc.resident_details.length > 0) {
              postedBy = doc.resident_details[0].resident_name;
            }
            var data = {
              _id: doc._id,
              ad_name: doc.ad_name,
              ad_desc: doc.ad_desc,
              ad_images: doc.ad_images,
              ad_contact_person: doc.ad_contact_person,
              ad_contact_number: doc.ad_contact_number,
              active: doc.active,
              posted_by: postedBy,
              posted_by_id: doc.posted_by,
              posted_on: doc.posted_on,
              building_id: doc.building_id
            }

            classified.push(data);
          }
        }, function () {
          if (classified.length == 0) {
            callBack(null, true, "No classified Found", 0);
          }
          else {
            db.db().collection(dbb.CLASSIFIED).countDocuments({ active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(classified, false, "classified Found", totaldata);
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All classified


    //Start of View User All classified

    get_user_classifieds: function (starting_after, limit, user_id, callBack) {
      try {
        classified = [];

        var totaldata;

        if (limit == undefined || starting_after == undefined) {
          var cursor = db.db().collection(dbb.CLASSIFIED).find({ posted_by: new ObjectID(user_id), active: true });
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.CLASSIFIED).find({ posted_by: new ObjectID(user_id), active: true }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            classified.push(doc);
          }
        }, function () {
          if (classified.length == 0) {
            callBack(null, true, "No classified Found", 0);
          } else {
            db.db().collection(dbb.CLASSIFIED).countDocuments({ posted_by: new ObjectID(user_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(classified, false, "classified Found", totaldata);
            });
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View User All classified

    //Start of Delete classified

    delete_classified_ad: function (ad_id, callBack) {
      try {
        ad_id = JSON.parse(ad_id);
        ad = [];
        for (var i = 0; i < ad_id.length; i++) {
          var a = new ObjectID(ad_id[i]);
          ad.push(a)
        }

        db.db().collection(dbb.CLASSIFIED).updateMany({ "_id": { $in: ad } }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "classified Deleted");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Delete classified

    //Start of Delete User Classified
    delete_user_classified: function (ad_id, callBack) {
      try {
        db.db().collection(dbb.CLASSIFIED).updateOne({ "_id": new ObjectID(ad_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "classified Deleted");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Delete User Classified

  }
  return classified_module;
}