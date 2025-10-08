module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var unit_module = {

    //Start of Add Unit

    add_unit_details: function (new_unit, callBack) {
      try {

        db.db().collection(dbb.UNIT).insertOne(new_unit, function (err, result) {
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

    //End of Add Unit

    //Start of Get Unit Details

    view_all_unit: function (starting_after, limit, building_id, callBack) {
      try {
        var units = [];
        var totaldata = 0;
        var cursor;

        if (limit == '' && starting_after == '' || (limit == undefined && starting_after == undefined)) {

          cursor = db.db().collection(dbb.UNIT).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.UNITTYPE, localField: "unit_type_id", foreignField: "_id", as: "unit_type_details" } },
            { $unwind: "$unit_type_details" },
            { $lookup: { fromd: dbb.UNIT, localField: "_id", foreignField: "unit_parent_id", as: "unit_child_details" } }
          ]).sort({ unit_name: 1 })
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          cursor = db.db().collection(dbb.UNIT).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.UNITTYPE, localField: "unit_type_id", foreignField: "_id", as: "unit_type_details" } },
            { $unwind: "$unit_type_details" },
            { $lookup: { fromd: dbb.UNIT, localField: "_id", foreignField: "unit_parent_id", as: "unit_child_details" } }
          ]).sort({ unit_name: 1 }).skip(starting_after).limit(limit);
        }


        cursor.forEach(function (doc2, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            var final_unit = true;

            if (doc2.unit_child_details != undefined && doc2.unit_child_details.length > 0) {
              final_unit = false;
            }

            var doc4 = {
              _id: doc2._id,
              unit_name: doc2.unit_name,
              square_feet: doc2.square_feet,
              unit_type_name: doc2.unit_type_details.type_name,
              unit_desc: doc2.unit_desc,
              unit_type_id: doc2.unit_type_id,
              active: doc2.active,
              final_unit: final_unit
            }
            units.push(doc4);
          }
        }, function () {
          if (units.length == 0) {
            callBack(null, true, "No Units Found");
          }
          else {
            db.db().collection(dbb.UNIT).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(units, false, "Units Found", totaldata);

            });

          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Unit Details


    //Start of Get Final Unit Info

    get_final_unit_info: function (starting_after, limit, building_id, unit_id, callBack) {
      try {
        var data = [];
        var isLimitRequired = limit != undefined && limit != '' ? true : false;
        var isStartingAfterRequired = starting_after != undefined && starting_after != '' ? true : false;
        var unit_id_check;

        if (unit_id == null) {
          unit_id_check == null;
        } else {
          unit_id_check = new ObjectID(unit_id)
        }
        var cursor;

        if (isLimitRequired && isStartingAfterRequired) {
          cursor = db.db().collection(dbb.UNIT).aggregate([
            { $match: { building_id: new ObjectID(building_id), unit_parent_id: unit_id_check, active: true } },
            { $lookup: { from: dbb.RESIDENT, let: { "unit_id": "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$unit_id", "$$unit_id"] }, { $eq: ["$is_owner", true] }, { $eq: ["$is_sub_resident", false] }] } } }], as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
            { $unwind: "$unit_parent_details" },
            { $lookup: { from: dbb.UNIT, localField: "_id", foreignField: "unit_parent_id", as: "unit_child_details" } }
          ]).sort({ unit_name: 1 }).skip(starting_after).limit(limit);
        } else {
          cursor = db.db().collection(dbb.UNIT).aggregate([
            { $match: { building_id: new ObjectID(building_id), unit_parent_id: unit_id_check, active: true } },
            { $lookup: { from: dbb.RESIDENT, let: { "unit_id": "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$unit_id", "$$unit_id"] }, { $eq: ["$is_owner", true] }, { $eq: ["$is_sub_resident", false] }] } } }], as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
            { $unwind: "$unit_parent_details" },
            { $lookup: { from: dbb.UNIT, localField: "_id", foreignField: "unit_parent_id", as: "unit_child_details" } }
          ]).sort({ unit_name: 1 });
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var ownerName = "";
            var ownerContactInfo = "";
            var parentName = "";
            var final_unit = true;

            if (doc.resident_details != undefined && doc.resident_details.length > 0) {
              ownerName = doc.resident_details[0].resident_name;
              ownerContactInfo = doc.resident_details[0].resident_contact_info;
            }
            if (doc.unit_parent_details != undefined) {
              parentName = doc.unit_parent_details.unit_name;
            }

            if (doc.unit_child_details != undefined && doc.unit_child_details.length > 0) {
              final_unit = false;
            }
            var unitInfo = {
              _id: doc._id,
              unit_name: doc.unit_name,
              square_feet: doc.square_feet,
              unit_desc: doc.unit_desc,
              unit_type_id: doc.unit_type_id,
              unit_parent_id: doc.unit_parent_id,
              building_id: doc.building_id,
              active: true,
              owner_name: ownerName,
              owner_contact_info: ownerContactInfo,
              parent_name: parentName,
              final_unit: final_unit
            }

            data.push(unitInfo);
          }
        }, function () {
          if (data.length == 0) {
            callBack(null, true, "No Units Found");
          } else {
            callBack(data, false, "Units Found")
          }
        })


      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Final Unit Info

    //Start of Get Single Unit Details 

    get_unit_info: function (building_id, unit_id, callBack) {
      try {
        unit = [];
        current_resident = '';
        resident_contact_info = '';
        owner_contact_info = '';
        owner_name = '';
        sub_owner = [];
        owner_vehicles_details = '';
        tenant_details = [];
        sub_tenant_details = [];
        owner_details = [];

        var cursor = db.db().collection(dbb.UNIT).aggregate([

          {
            $lookup: {
              from: dbb.UNITTYPE,
              localField: "unit_type_id",
              foreignField: "_id",
              as: "unit_type_details"
            },
          },
          {
            $unwind: "$unit_type_details"
          },
          {
            $lookup: {
              from: dbb.RESIDENT,

              localField: "_id",
              foreignField: "unit_id",
              as: "resident_details"
            },
          },
          {
            $unwind: "$resident_details"
          },
          {
            $match: { building_id: new ObjectID(building_id), _id: new ObjectID(unit_id), active: true, 'resident_details.active': true }
          },

        ]).sort({ unit_name: 1 })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }

          else {

            if (doc.resident_details.is_owner == true && doc.resident_details.is_sub_resident == true) {
              var doc3 = {
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_type_name: doc.unit_type_details.type_name,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                active: doc.active,
                subowner_name: doc.resident_details.resident_name,
                subowner_contact_info: doc.resident_details.resident_contact_info,
                resident_vehcile_details: doc.resident_details.resident_vehcile_details

              }

            }
            else if (doc.resident_details.is_owner == true && doc.resident_details.is_sub_resident == false) {

              var doc3 = {
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_type_name: doc.unit_type_details.type_name,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                active: doc.active,
                owner_name: doc.resident_details.resident_name,
                owner_contact_info: doc.resident_details.resident_contact_info,
                resident_vehcile_details: doc.resident_details.resident_vehcile_details
              }

            }
            else if (doc.resident_details.is_owner == false && doc.resident_details.is_sub_resident == true) {
              var doc3 = {
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_type_name: doc.unit_type_details.type_name,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                active: doc.active,
                current_sub_resident: doc.resident_details.resident_name,
                resident_contact_info: doc.resident_details.resident_contact_info,
                resident_vehcile_details: doc.resident_details.resident_vehcile_details
              }

            }
            else if (doc.resident_details.is_owner == false && doc.resident_details.is_sub_resident == false) {
              var doc3 = {
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_type_name: doc.unit_type_details.type_name,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                active: doc.active,
                current_resident: doc.resident_details.resident_name,
                resident_contact_info: doc.resident_details.resident_contact_info,
                resident_vehcile_details: doc.resident_details.resident_vehcile_details
              }

            }

            unit.push(doc3);
          }
        }, function () {
          if (unit.length == 0) {
            callBack(null, true, "No Unit Found");
          }
          else {

            for (var i = 0; i < unit.length; i++) {
              var a = unit[i];

              if (a.hasOwnProperty("current_resident")) {

                data2 = {
                  tenant_name: unit[i].current_resident,
                  tenant_contact_info: unit[i].resident_contact_info,
                  tenant_vehicles_details: unit[i].resident_vehcile_details
                }
                tenant_details.push(data2);

              }
              else if (a.hasOwnProperty("subowner_name")) {

                data1 = {
                  owner_sub_residents_name: unit[i].subowner_name,
                  owner_sub_residents_contact_info: unit[i].subowner_contact_info,
                  owner_sub_residents_vehicles_details: unit[i].resident_vehcile_details
                }
                sub_owner.push(data1)
              }
              else if (a.hasOwnProperty("current_sub_resident")) {

                data2 = {
                  sub_tenant_name: unit[i].current_sub_resident,
                  sub_tenant_contact_info: unit[i].resident_contact_info,
                  sub_tenant_vehicles_details: unit[i].resident_vehcile_details
                }
                sub_tenant_details.push(data2);

              }
              else {
                data2 = {
                  owner_name: unit[i].owner_name,
                  owner_contact_info: unit[i].owner_contact_info,
                  owner_vehicles_details: unit[i].resident_vehcile_details
                }
                owner_details.push(data2)
              }

            }
            var data = {
              _id: unit[0]._id,
              unit_name: unit[0].unit_name,
              square_feet: unit[0].square_feet,
              unit_type_name: unit[0].unit_type_name,
              unit_desc: unit[0].unit_desc,
              unit_type_id: unit[0].unit_type_id,
              active: unit[0].active,
              owner_details: owner_details,
              owner_sub_residents_details: sub_owner,
              tenant_details: tenant_details,
              sub_tenant_details: sub_tenant_details
            }

            callBack(data, false, "Unit Found");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Single Unit Details 

    //Start of Get Single Unit Details 

    get_unit_info2: function (building_id, unit_parent_id, callBack) {
      try {
        unit = [];
        current_resident = '';
        resident_contact_info = '';
        owner_contact_info = '';
        owner_name = '';
        sub_owner = [];
        owner_vehicles_details = '';
        tenant_details = [];
        sub_tenant_details = [];
        owner_details = [];

        var cursor = db.db().collection(dbb.UNIT).aggregate([
          {
            $match: { building_id: new ObjectID(building_id), unit_parent_id: new ObjectID(unit_parent_id), active: true }
          },

          // {
          //     $lookup: {
          //         from: dbb.UNITTYPE,
          //         localField: "unit_type_id",
          //         foreignField: "_id",
          //         as: "unit_type_details"
          //     },
          // },
          // {
          //     $unwind: "$unit_type_details"
          // },
          {
            $lookup: {
              from: dbb.RESIDENT,
              localField: "_id",
              foreignField: "unit_id",
              as: "resident_details"
            },
          },
          // {
          //     $unwind: "$resident_details"
          // },
          // {
          //     $match: { building_id: new ObjectID(building_id), unit_parent_id: new ObjectID(unit_parent_id), active: true, 'resident_details.active': true }
          // },

        ]).sort({ unit_name: 1 })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }

          else {
            for (var e = 0; e < doc.resident_details.length; e++) {


              if (doc.resident_details[e].is_owner == true && doc.resident_details[e].is_sub_resident == true) {
                var doc3 = {
                  _id: doc._id,
                  unit_name: doc.unit_name,
                  square_feet: doc.square_feet,
                  // unit_type_name: doc.unit_type_details.type_name,
                  unit_desc: doc.unit_desc,
                  unit_type_id: doc.unit_type_id,
                  active: doc.active,
                  subowner_name: doc.resident_details[e].resident_name,
                  subowner_contact_info: doc.resident_details[e].resident_contact_info,
                  resident_vehcile_details: doc.resident_details[e].resident_vehcile_details

                }

              }
              else if (doc.resident_details[e].is_owner == true && doc.resident_details[e].is_sub_resident == false) {

                var doc3 = {
                  _id: doc._id,
                  unit_name: doc.unit_name,
                  square_feet: doc.square_feet,
                  // unit_type_name: doc.unit_type_details.type_name,
                  unit_desc: doc.unit_desc,
                  unit_type_id: doc.unit_type_id,
                  active: doc.active,
                  owner_name: doc.resident_details[e].resident_name,
                  owner_contact_info: doc.resident_details[e].resident_contact_info,
                  resident_vehcile_details: doc.resident_details[e].resident_vehcile_details
                }

              }
              else if (doc.resident_details[e].is_owner == false && doc.resident_details[e].is_sub_resident == true) {
                var doc3 = {
                  _id: doc._id,
                  unit_name: doc.unit_name,
                  square_feet: doc.square_feet,
                  // unit_type_name: doc.unit_type_details.type_name,
                  unit_desc: doc.unit_desc,
                  unit_type_id: doc.unit_type_id,
                  active: doc.active,
                  current_sub_resident: doc.resident_details[e].resident_name,
                  resident_contact_info: doc.resident_details[e].resident_contact_info,
                  resident_vehcile_details: doc.resident_details[e].resident_vehcile_details
                }

              }
              else if (doc.resident_details[e].is_owner == false && doc.resident_details[e].is_sub_resident == false) {
                var doc3 = {
                  _id: doc._id,
                  unit_name: doc.unit_name,
                  square_feet: doc.square_feet,
                  //unit_type_name: doc.unit_type_details.type_name,
                  unit_desc: doc.unit_desc,
                  unit_type_id: doc.unit_type_id,
                  active: doc.active,
                  current_resident: doc.resident_details[e].resident_name,
                  resident_contact_info: doc.resident_details[e].resident_contact_info,
                  resident_vehcile_details: doc.resident_details[e].resident_vehcile_details
                }

              }
              else {
                var doc3 = {
                  _id: doc._id,
                  unit_name: doc.unit_name,
                  square_feet: doc.square_feet,
                  //unit_type_name: doc.unit_type_details.type_name,
                  unit_desc: doc.unit_desc,
                  unit_type_id: doc.unit_type_id,
                  active: doc.active,
                  current_resident: '',
                  resident_contact_info: '',
                  resident_vehcile_details: ''
                }

              }

              unit.push(doc3);
            }
          }
        }, function () {
          if (unit.length == 0) {

          }
          else {

            for (var i = 0; i < unit.length; i++) {
              var a = unit[i];

              if (a.hasOwnProperty("current_resident")) {

                data2 = {
                  tenant_name: unit[i].current_resident,
                  tenant_contact_info: unit[i].resident_contact_info,
                  tenant_vehicles_details: unit[i].resident_vehcile_details
                }
                tenant_details.push(data2);

              }
              else if (a.hasOwnProperty("subowner_name")) {

                data1 = {
                  owner_sub_residents_name: unit[i].subowner_name,
                  owner_sub_residents_contact_info: unit[i].subowner_contact_info,
                  owner_sub_residents_vehicles_details: unit[i].resident_vehcile_details
                }
                sub_owner.push(data1)
              }
              else if (a.hasOwnProperty("current_sub_resident")) {

                data2 = {
                  sub_tenant_name: unit[i].current_sub_resident,
                  sub_tenant_contact_info: unit[i].resident_contact_info,
                  sub_tenant_vehicles_details: unit[i].resident_vehcile_details
                }
                sub_tenant_details.push(data2);

              }
              else {
                data2 = {
                  owner_name: unit[i].owner_name,
                  owner_contact_info: unit[i].owner_contact_info,
                  owner_vehicles_details: unit[i].resident_vehcile_details
                }
                owner_details.push(data2)
              }

            }

            var data = {
              _id: unit[0]._id,
              unit_name: unit[0].unit_name,
              square_feet: unit[0].square_feet,
              // unit_type_name: unit[0].unit_type_name,
              unit_desc: unit[0].unit_desc,
              unit_type_id: unit[0].unit_type_id,
              active: unit[0].active,
              owner_details: owner_details,
              owner_sub_residents_details: sub_owner,
              tenant_details: tenant_details,
              sub_tenant_details: sub_tenant_details
            }

            callBack(data, false, "Unit Found");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Single Unit Details 


    //Start of Get Unit Details By Unit Type Id

    get_unit_type_info: function (starting_after, limit, building_id, unit_type_id, callBack) {
      try {
        unit = [];
        var totaldata;


        if (limit == '' && starting_after == '' || (limit == undefined && starting_after == undefined)) {

          var cursor = db.db().collection(dbb.UNIT).aggregate([
            {
              $match: { building_id: new ObjectID(building_id), unit_type_id: new ObjectID(unit_type_id), active: true }
            },
            {
              $lookup: {
                from: dbb.UNITTYPE,
                localField: "unit_type_id",
                foreignField: "_id",
                as: "unit_type_details"
              },
            },
            {
              $unwind: "$unit_type_details"
            },
            {
              $lookup: {
                from: dbb.RESIDENT,
                localField: "_id",
                foreignField: "unit_id",
                as: "resident_details"
              },
            },
            {
              $unwind: "$resident_details"
            },
          ])
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.UNIT).aggregate([
            {
              $match: { building_id: new ObjectID(building_id), unit_type_id: new ObjectID(unit_type_id), active: true }
            },
            {
              $lookup: {
                from: dbb.UNITTYPE,
                localField: "unit_type_id",
                foreignField: "_id",
                as: "unit_type_details"
              },
            },
            {
              $unwind: "$unit_type_details"
            },
            {
              $lookup: {
                from: dbb.RESIDENT,
                localField: "_id",
                foreignField: "unit_id",
                as: "resident_details"
              },
            },
            {
              $unwind: "$resident_details"
            },
          ]).skip(starting_after).limit(limit);

        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }

          else {
            if (doc.resident_details.is_owner == true) {

              var doc3 = {
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_type_name: doc.unit_type_details.type_name,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                active: doc.active,
                owner_name: doc.resident_details.resident_name,
                resident_contact_info: doc.resident_details.resident_contact_info
              }
            }
            else {
              var doc3 = {
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_type_name: doc.unit_type_details.type_name,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                active: doc.active,
                current_resident: doc.resident_details.resident_name,
                resident_contact_info: doc.resident_details.resident_contact_info
              }
            }

            unit.push(doc3);
          }
        }, function () {
          if (unit.length == 0) {
            callBack(null, true, "No Unit Found", '');
          }
          else {
            db.db().collection(dbb.UNIT).countDocuments({ building_id: new ObjectID(building_id), unit_type_id: new ObjectID(unit_type_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(unit, false, "Unit Found", totaldata);
            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Unit Details By Unit Type Id


    //Start of Delete Unit Details

    delete_single_unit: function (unit_id, building_id, callBack) {
      try {
        unit_id = JSON.parse(unit_id);
        unit = [];

        for (var i = 0; i < unit_id.length; i++) {
          var a = new ObjectID(unit_id[i]);
          unit.push(a)
        }

        db.db().collection(dbb.UNIT).updateMany({ "_id": { $in: unit }, building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "Unit Deleted");
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of Delete Unit Details

    //Start of Update Unit Details

    edit_single_unit: function (unit_id, unit_name, square_feet, unit_desc, unit_type_id, unit_parent_id, modified_by, callBack) {
      try {

        db.db().collection(dbb.UNIT).updateOne({ "_id": new ObjectID(unit_id) }, {
          $set: {
            unit_name: unit_name,
            square_feet: square_feet,
            unit_desc: unit_desc,
            unit_type_id: new ObjectID(unit_type_id),
            unit_parent_id: new ObjectID(unit_parent_id),
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Unit Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update Unit Details

    //Start of Delete Unit 
    delete_units: function (unit_ids, building_id, callBack) {
      try {
        var message = "";
        var undeletedUnits = 0;
        unit_type = [];
        var index = 0;
        var delete_data = function (doc) {
          var unit_id = new ObjectID(doc);
          db.db().collection(dbb.UNIT).countDocuments({ unit_parent_id: unit_id, building_id: new ObjectID(building_id), active: true }, function (err, count) {
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
              if (index < unit_ids.length) {
                delete_data(unit_ids[index]);
              } else {
                var noDeleted = unit_ids.length - undeletedUnits;

                if (undeletedUnits > 0) {
                  message = undeletedUnits + " item could not be deleted as it has units under it ";
                }

                if (noDeleted > 0) {
                  message = message + " " + noDeleted + " deleted successfully ";
                  db.db().collection(dbb.UNIT).updateMany({ "_id": { $in: unit_type }, building_id: new ObjectID(building_id) }, {
                    $set: {
                      active: false
                    }
                  }, { upsert: false }, function (err, result) {
                    if (err) {
                      callBack(true, err);
                    }
                    else {

                      db.db().collection(dbb.RESIDENT).updateMany({ "unit_id": { $in: unit_type }, building_id: new ObjectID(building_id) }, {
                        $set: {
                          active: false
                        }
                      }, { upsert: false }, function (err, result) {
                        if (err) {
                          callBack(true, err);
                        }
                        else {
                          callBack(false, message);
                        }
                      });
                    }
                  });
                } else {
                  callBack(true, message);
                }
              }
            }
          });
        }
        unit_ids = JSON.parse(unit_ids);

        if (unit_ids.length !== 0) {
          delete_data(unit_ids[index]);
        }

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Delete Unit 


    //Start of Search Unit

    search_unit: function (building_id, keyword, callBack) {
      try {
        var unitInfos = [];

        var cursor = db.db().collection(dbb.UNIT).aggregate([
          { $match: { building_id: new ObjectID(building_id), unit_name: { $regex: keyword, $options: 'i' }, active: true } },
          { $lookup: { from: dbb.RESIDENT, let: { "unit_id": "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$unit_id", "$$unit_id"] }, { $eq: ["$is_owner", true] }, { $eq: ["$is_sub_resident", false] }] } } }], as: "resident_details" } },
          { $lookup: { from: dbb.UNIT, localField: "unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          { $unwind: "$unit_parent_details" },
          { $lookup: { from: dbb.UNIT, localField: "_id", foreignField: "unit_parent_id", as: "unit_child_details" } },
        ]).sort({ unit_name: 1 })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var ownerName = "";
            var ownerContactInfo = "";
            var parentName = "";
            var final_unit = true;

            if (doc.resident_details != undefined && doc.resident_details.length > 0) {
              ownerName = doc.resident_details[0].resident_name;
              ownerContactInfo = doc.resident_details[0].resident_contact_info;
            }
            if (doc.unit_parent_details != undefined) {
              parentName = doc.unit_parent_details.unit_name;
            }

            if (doc.unit_child_details != undefined && doc.unit_child_details.length > 0) {
              final_unit = false;
            }
            var unitInfo = {
              _id: doc._id,
              unit_name: doc.unit_name,
              square_feet: doc.square_feet,
              unit_desc: doc.unit_desc,
              unit_type_id: doc.unit_type_id,
              unit_parent_id: doc.unit_parent_id,
              building_id: doc.building_id,
              active: true,
              owner_name: ownerName,
              owner_contact_info: ownerContactInfo,
              parent_name: parentName,
              final_unit: final_unit
            }

            unitInfos.push(unitInfo);
          }
        }, function () {
          if (unitInfos.length == 0) {
            callBack(null, true, "No Units Found");
          } else {
            callBack(unitInfos, false, "Units Found")
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Search Unit


    //Start of View Unit By Parent Type
    view_all_parent_units: function (building_id, type_parent_id, callBack) {
      try {

        var units = [];

        var cursor = db.db().collection(dbb.UNIT).find({ building_id: new ObjectID(building_id), unit_type_id: new ObjectID(type_parent_id), active: true }).sort({ unit_name: 1 });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            units.push(doc);
          }
        }, function () {
          if (units.length == 0) {
            callBack(null, true, "No parent units found");
          } else {
            callBack(units, false, "Parent Units found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View Unit By Parent Type


    //Start of Add Parking Unit
    add_parking_unit: function (new_parking, callBack) {
      try {
        db.db().collection(dbb.UNIT).updateOne({ "_id": new ObjectID(new_parking.unit_id), building_id: new ObjectID(new_parking.building_id) }, {
          $set: {
            parking_space: new_parking.parking_spaces
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Parking Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Add Parking Unit

    //Start of getting child Unit Type ID
    get_child_unit_type_id: function (unit_parent_type_id, callBack) {
      try {
        var unit_type_id = "";
        var cursor = db.db().collection(dbb.UNITTYPE).find({ type_parent_id: new ObjectID(unit_parent_type_id) });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            unit_type_id = doc._id;
          }
        }, function () {
          if (unit_type_id != "") {
            callBack(unit_type_id, false, "Child Unit Type Found Succesfully");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of getting child Unit Type ID

    //Start of Get unit details

    get_unit_details: function (unit_id, callBack) {
      try {
        var residentDetails = [];
        var cursor = db.db().collection(dbb.RESIDENT).find({ "unit_id": new ObjectID(unit_id), "active": true, "is_owner": { $exists: true } });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            residentDetails.push(doc);
          }
        }, function () {
          if (residentDetails.length == 0) {
            callBack(null, true, "No Residents Found");
          } else {

            //Recursive function used to get the vehicle info from the resident array and show as a seperate array of objects
            var residentInfos = [];
            var vehicleInfos = [];
            var helperInfos = [];
            var parkingInfo = {};
            var unit_name = "";
            var result = {};

            var index = 0;
            var getResidentnVehicleInfo = function (residentInfo) {
              var resident = {};
              var residentName = residentInfo.resident_name != undefined && residentInfo.resident_name != null ? residentInfo.resident_name : "";
              var residentImg = residentInfo.resident_img != undefined && residentInfo.resident_img != null ? residentInfo.resident_img : "";
              resident["resident_id"] = residentInfo._id;
              resident["resident_name"] = residentName;
              resident["resident_img"] = residentImg;
              resident["resident_email"] = residentInfo.resident_email;
              resident["resident_contact_info"] = residentInfo.resident_contact_info;
              resident["resident_sec_contact_info"] = residentInfo.resident_sec_contact_info;
              resident["permanent_address"] = residentInfo.resident_permanent_address;
              resident["is_owner"] = residentInfo.is_owner;
              resident["is_sub_resident"] = residentInfo.is_sub_resident;
              resident["is_residing"] = residentInfo.is_residing;
              resident["resident_id_proof"] = residentInfo.resident_id_proof;

              residentInfos.push(resident);
              var veh = [];
              veh = residentInfo.resident_vehicle_details;
              if (veh != undefined) {
                if (veh.length > 0) {
                  for (var i = 0; i < veh.length; i++) {
                    var vehilce = {};
                    var currentVeh = veh[i];
                    vehilce["resident_id"] = residentInfo._id;
                    vehilce["vehicle_name"] = currentVeh.vehicle_name;
                    vehilce["vehicle_type"] = currentVeh.vehicle_type;
                    vehilce["vehicle_regd_num"] = currentVeh.vehicle_regd_num;

                    vehicleInfos.push(vehilce);
                  }
                }
              }

              if (index < residentDetails.length - 1) {
                index++;
                getResidentnVehicleInfo(residentDetails[index]);
              } else {
                var cursor2 = db.db().collection(dbb.HELPER).find({ helper_units: { $elemMatch: { $eq: unit_id } }, "active": true });
                cursor2.forEach(function (doc2, err2) {
                  if (!err2) {
                    var helperval = {};
                    helperval["helper_id"] = doc2._id
                    helperval["helper_name"] = doc2.helper_name;
                    helperval["helper_img"] = doc2.helper_img;
                    helperval["helper_contact_info"] = doc2.helper_contact_info;
                    helperval["helper_permanent_address"] = doc2.helper_permanent_address;
                    helperval["helper_service"] = doc2.helper_service;
                    helperval["private"] = doc2.is_private;
                    helperInfos.push(helperval);
                  }
                }, function () {
                  var cursor3 = db.db().collection(dbb.UNIT).aggregate([
                    { $match: { _id: new ObjectID(unit_id), "active": true } },
                    { $lookup: { from: dbb.UNIT, localField: "unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
                  ])
                  cursor3.forEach(function (doc3, err3) {
                    if (!err3) {
                      if (doc3.hasOwnProperty("parking_space")) {
                        parkingInfo.parking_space = doc3.parking_space
                      } else {
                        parkingInfo.parking_space = [];
                      }

                      if (doc3.unit_parent_details[0] != undefined) {
                        unit_name = doc3.unit_parent_details[0].unit_name + " - " + doc3.unit_name;
                      } else {
                        unit_name = doc3.unit_name;
                      }

                    }
                  }, function () {
                    result["resident_details"] = residentInfos;
                    result["vehicle_details"] = vehicleInfos;
                    result["helper_details"] = helperInfos;
                    result["parking_details"] = parkingInfo;
                    result["unit_name"] = unit_name;

                    var sos = [];
                    var sosCursor = db.db().collection(dbb.SOS).find({ unit_id: new ObjectID(unit_id), active: true });
                    sosCursor.forEach(function (doc4, err4) {
                      if (err4) {
                        callBack(result, false, "Unit Details Found");
                      } else {
                        data = {
                          sos_id: doc4._id,
                          sos_name: doc4.name,
                          sos_phone_number: doc4.phone_number,
                          sos_img: doc4.user_img,
                        }
                        sos.push(data);
                      }
                    }, function () {
                      result["sos_details"] = sos;
                      callBack(result, false, "Unit Details Found");
                    })
                  })
                })
              }
            }
            getResidentnVehicleInfo(residentDetails[index]);
            index++;
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get unit details

    //Start of Get unit balance
    get_unit_balance: function (unit_id, callBack) {
      try {
        db.db().collection(dbb.UNIT).findOne({ _id: new ObjectID(unit_id), active: true }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(doc.unit_balance, false, "Unit Balance Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Unit balance

    //Start of Update unit Balance
    update_unit_balance: function (unit_id, unit_balance, callBack) {
      try {
        db.db().collection(dbb.UNIT).updateOne({ "_id": new ObjectID(unit_id) }, {
          $set: {
            unit_balance: unit_balance
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Unit Balance Updated");
          }
        })
      } catch (er) {
        callBack(true, er)
      }
    },
    //End of Update unit balance


    //Start of Get Units With Unit Parent
    get_units_from_parent_id: function (unit_parent_id, building_id, callBack) {
      try {
        var units = [];
        var cursor = db.db().collection(dbb.UNIT).find({ "unit_parent_id": new ObjectID(unit_parent_id), "building_id": new ObjectID(building_id), active: true }).sort({ unit_name: 1 });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var unit = {
              unit_id: doc._id,
              unit_name: doc.unit_name,
              unit_balance: doc.unit_balance
            }
            units.push(unit);
          }
        }, function () {
          if (units.length == 0) {
            callBack(null, true, "No Units Found");
          } else {
            // callBack(units, false, "Units Found");
            var unitCharges = [];
            var index = 0;
            var getUnitOtherCharges = function (unit) {

              var amenityTotalFee = 0;
              var complaintTotalFee = 0;
              var amenityCursor = db.db().collection(dbb.AMENITIESBOOKING).find({ unit_id: new ObjectID(unit.unit_id), invoiceAdded: false, active: true });
              amenityCursor.forEach(function (doc1, err1) {
                if (!err1) {
                  var amenityFee = 0;
                  if (!isNaN(doc1.charges)) {
                    amenityFee = doc1.charges;
                  }
                  amenityTotalFee = amenityTotalFee + amenityFee;
                }
              }, function () {
                var currentDate = new Date();
                var complaintCursor = db.db().collection(dbb.COMPLAINTS).find({ unit_id: new ObjectID(unit.unit_id), complaint_completed_date: { $lte: currentDate }, invoiceAdded: false, active: true });
                complaintCursor.forEach(function (doc2, err2) {
                  if (!err2) {
                    var complaintFee = 0;
                    if (!isNaN(doc2.complaint_fee)) {
                      complaintFee = doc2.complaint_fee;
                    }
                    complaintTotalFee = complaintTotalFee + complaintFee;
                  }
                }, function () {
                  var unitInfo = {
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name,
                    unit_balance: unit.unit_balance,
                    unit_amenity_balance: amenityTotalFee,
                    unit_complaint_balance: complaintTotalFee
                  }
                  unitCharges.push(unitInfo);

                  index++;
                  if (index < units.length - 1) {
                    getUnitOtherCharges(units[index]);
                  } else {
                    callBack(unitCharges, false, "Units Found");
                  }
                })
              })
            }

            getUnitOtherCharges(units[index]);
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    }
    //End of Get Units With Unit Parent

  }
  return unit_module;
}