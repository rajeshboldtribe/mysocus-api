module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var building_module = {

    //Start of Add Building
    add_building: function (new_building, user_id, callBack) {
      try {

        db.db().collection(dbb.BUILDING).insertOne(new_building, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            var unit_type = {
              type_name: new_building.building_name,
              type_parent_id: null,
              building_id: new ObjectID(result.insertedId),
              created_by: new ObjectID(user_id),
              created_on: new Date(),
              active: true,
            }
            db.db().collection(dbb.UNITTYPE).insertOne(unit_type, function (err2, result2, message) {
              if (err2) {
                callBack(null, true, "Error Occurred Creating Unit Type " + err2);
              } else {
                var unit = {
                  unit_name: new_building.building_name,
                  unit_type_id: new ObjectID(result2.insertedId),
                  unit_parent_id: null,
                  building_id: new ObjectID(result.insertedId),
                  created_by: new ObjectID(user_id),
                  created_on: new Date(),
                  active: true
                }
                db.db().collection(dbb.UNIT).insertOne(unit, function (err3, result3, message) {
                  if (err3) {
                    callBack(null, true, "Error Occurred Creating Unit" + err3);
                  } else {
                    callBack(result, false, "Building Added Successfully");
                  }
                })
              }

            })
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add Building   


    //Start of Get Building Details

    get_building_details: function (callBack) {
      try {
        building = [];
        var buildingInfo = [];


        var cursor = db.db().collection(dbb.BUILDING).find({ active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            building.push(doc);
          }
        }, function () {
          if (building.length == 0) {
            callBack(null, true, "No Building Found");
          }
          else {
            // callBack(building, false, "Building Found");
            var index = 0;
            var getAdminDetails = function (singleBuilding) {
              var adminData = [];
              var vendorData = [];

              var adminCursor = db.db().collection(dbb.EMPLOYEE).aggregate(
                [{ $match: { building_id: new ObjectID(singleBuilding._id) } },
                {
                  $lookup: {
                    from: dbb.USER,
                    localField: "_id",
                    foreignField: "user_id",
                    as: "user_details"
                  },
                },
                {
                  $unwind: "$user_details"
                },
                {
                  $match: { "user_details.user_type": "A", "user_details.active": true }
                },
                ]
              );


              adminCursor.forEach(function (doc2, err2) {
                if (err2) {
                  callBack(null, true, err2);
                }
                else {

                  adminData.push({
                    _id: doc2.user_details._id,
                    employee_name: doc2.employee_name,
                    employee_designation: doc2.employee_designation,
                    employee_img: doc2.employee_img,
                    employee_contact_info: doc2.employee_contact_info,
                    employee_email: doc2.employee_email
                  });

                }
              }, function () {


                // var vendorCursor = db.db().collection(dbb.VENDOR).find({ building_id: new ObjectID(singleBuilding._id) })
                var vendorCursor = db.db().collection(dbb.VENDOR).aggregate([
                  { $match: { building_id: new ObjectID(singleBuilding._id) } },
                  { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_service_details" } },
                  { $unwind: "$vendor_service_details" },
                ])


                vendorCursor.forEach(function (doc3, err3) {
                  if (err3) {
                    callBack(null, true, err3);
                  }
                  else {
                    var vendorService = "";
                    if (doc3.vendor_service_details != undefined || doc3.vendor_service_details != '') {
                      vendorService = doc3.vendor_service_details.vendor_category_name;
                    }
                    var vdata = {
                      _id: doc3._id,
                      vendor_name: doc3.vendor_name,
                      vendor_service: vendorService,
                      vendor_service_id: doc3.vendor_service,
                      vendor_contact_info: doc3.vendor_contact_info,
                      vendor_image: doc3.vendor_image,
                      vendor_type: doc3.vendor_type,
                      vendor_govt_license_no: doc3.vendor_govt_license_no,
                      vendor_id_type: doc3.vendor_id_type,
                      vendor_id_number: doc3.vendor_id_number,
                      vendor_id_image: doc3.vendor_id_image,
                      vendor_account_no: doc3.vendor_account_no,
                      vendor_bank_name: doc3.vendor_bank_name,
                      vendor_bank_ifsc: doc3.vendor_bank_ifsc,
                      vendor_bank_branch: doc3.vendor_bank_branch,
                      vendor_other_contacts: doc3.vendor_other_contacts,
                      created_by: doc3.created_by,
                      created_on: doc3.created_on,
                      active: doc3.active,
                    }
                    vendorData.push(vdata);
                  }
                }, function () {
                  var buildingData = {
                    _id: singleBuilding._id,
                    building_name: singleBuilding.building_name,
                    building_address: singleBuilding.building_address,
                    building_poc_name: singleBuilding.building_poc_name,
                    building_poc_phonenumber: singleBuilding.building_poc_phonenumber,
                    building_accounts: singleBuilding.building_accounts,
                    is_admin_issued: singleBuilding.is_admin_issued,
                    building_login_password: singleBuilding.building_login_password,
                    created_by: singleBuilding.created_by,
                    created_on: singleBuilding.created_on,
                    payment_history: singleBuilding.payment_history,
                    valid_till: singleBuilding.valid_till,
                    location: singleBuilding.location,
                    vendor_details: vendorData,
                    admin_details: adminData,
                    active: true,
                  }

                  buildingInfo.push(buildingData);

                  if (index < building.length) {
                    getAdminDetails(building[index]);
                    index++;
                  } else {
                    callBack(buildingInfo, false, "Building Details Found");
                  }
                })
              })
            }

            getAdminDetails(building[index]);
            index++;
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Building Details



    //Start of Get User Building Details

    get_user_building: function (building_id, callBack) {
      try {
        building = '';
        var cursor = db.db().collection(dbb.BUILDING).find({ _id: new ObjectID(building_id), active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }

          else {

            building = doc;
          }
        }, function () {
          if (building.length == 0) {
            callBack(null, true, "No Building Found");
          }
          else {
            callBack(building, false, "Building Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get User Building Details



    //Start of Delete Building Details

    delete_single_building_details: function (building_id, callBack) {
      try {
        db.db().collection(dbb.BUILDING).deleteOne({ "_id": new ObjectID(building_id) }, function (err, obj) {

          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "Building Deleted");
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of Delete Building Details

    //Start of Update Building Details

    update_building_details: function (building_id, building_name, building_address, building_poc_name, building_poc_phonenumber, building_accounts, location, modified_by, callBack) {
      try {
        db.db().collection(dbb.BUILDING).updateOne({ "_id": new ObjectID(building_id) }, {
          $set: {
            building_name: building_name,
            building_address: building_address,
            building_poc_name: building_poc_name,
            building_poc_phonenumber: building_poc_phonenumber,
            building_accounts: JSON.parse(building_accounts.toString()),
            location: location,
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Building Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update Building Details



    //Start of Add Vendor Details

    add_vender_info: function (building_id, vendor_id, callBack) {
      try {
        var data = {
          vendor_id: new ObjectID(vendor_id),
        }

        db.db().collection(dbb.BUILDING).updateOne({ "_id": new ObjectID(building_id) }, { $push: { vendors: data } }, function (err, result) {
          if (err) {
            callBack(null, true, 'Error');
          } else {
            callBack(vendor_id, false, "Vendor Details Added Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Add Vendor Details


    //Start of Remove Vendor Details

    remove_vender_info: function (building_id, vendor_id, callBack) {
      try {
        db.db().collection(dbb.BUILDING).updateOne({ "_id": new ObjectID(building_id) }, { $pull: { vendors: { vendor_id: new ObjectID(vendor_id) } } }, function (err, result) {
          if (err) {
            callBack(null, true, 'Error');
          } else {
            db.db().collection(dbb.VENDOR).updateOne({ "_id": new ObjectID(vendor_id) }, { $set: { active: false } }, function (err2, result2) {
              if (err2) {
                callBack(null, true, 'Error');
              } else {
                callBack(vendor_id, false, "Vendor Details Removed Successfully");
              }
            });
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Remove Vendor Details


    //Start of Delete Vendor Details

    delete_vender_info: function (vendor_id, callBack) {
      try {
        vendor_id = JSON.parse(vendor_id);
        vendor = [];

        for (var i = 0; i < vendor_id.length; i++) {
          var a = new ObjectID(vendor_id[i]);
          vendor.push(a)
        }
        db.db().collection(dbb.BUILDING).updateMany(
          {}, { $pull: { vendors: { vendor_id: { $in: vendor } } } }, { upsert: true }, function (err, result) {
            if (err) {

              callBack(true, 'Error');
            } else {
              callBack(false, "Vendor Details Removed Successfully");
            }

          });
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Delete Vendor Details


    //Start of Update Building Admin Details

    update_admin_details: function (building_id, admin_id, callBack) {
      try {
        db.db().collection(dbb.BUILDING).updateOne({ "_id": new ObjectID(building_id) }, {
          $set: {
            is_admin_issued: true,
            admin_id: new ObjectID(admin_id),
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            db.db().collection(dbb.BUILDING).findOne({ _id: new ObjectID(building_id), active: true }, function (err, doc) {
              if (err) {
                callBack(null, true, "No building found");
              } else {
                callBack(doc.building_name, false, "Building found");
              }
            })
            // callBack(result, false, "Building Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update Building Admin Details


    //Start of BuildingLogin

    do_building_login: function (building_login_id, password, callBack) {
      try {
        var buildingExist = false;
        var result;
        var cursor = db.db().collection(dbb.BUILDING).find({ 'building_login_id': building_login_id, 'password': password });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          buildingExist = true;
          result = doc;
        }, function () {
          if (buildingExist) {
            callBack(result, false, "Building matched");
          } else {
            callBack(null, true, "Building does not exist");
          }
        })
      } catch (e) {
        callBack(null, true, e)
      }
    },
    //End of Building Login


    //Start of Get Top Level Unit Types

    get_toplevel_unittypes: function (building_id, callBack) {
      try {
        var cursor = db.db().collection(dbb.UNITTYPE).find({ "building_id": new ObjectID(building_id), "type_parent_name": "NONE" });
        var topLevelUnits = [];
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var unitInfo = {};
            unitInfo["_id"] = doc._id;
            unitInfo["name"] = doc.type_name;
            unitInfo["parent_id"] = doc.type_parent_id;
            unitInfo["parent_name"] = doc.type_parent_name;
            topLevelUnits.push(unitInfo);
          }
        }, function () {
          if (topLevelUnits.length == 0) {
            callBack(null, true, "No Units Found");
          } else {
            callBack(topLevelUnits, false, "Units Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Top Level Unit Types

    //Start of Get SubLevel Unit Types

    get_sublevel_unittypes: function (building_id, type_parent_id, callBack) {
      try {
        var cursor = db.db().collection(dbb.UNITTYPE).find({ "building_id": new ObjectID(building_id), "type_parent_id": new ObjectID(type_parent_id) });
        var subLevelUnits = [];
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var unitInfo = {};
            unitInfo["_id"] = doc._id;
            unitInfo["name"] = doc.type_name;
            unitInfo["parent_id"] = doc.type_parent_id;
            unitInfo["parent_name"] = doc.type_parent_name;
            subLevelUnits.push(unitInfo);
          }
        }, function () {
          if (subLevelUnits.length == 0) {
            callBack(null, false, "No more subLevelUnittypes Found");
          } else {
            callBack(subLevelUnits, false, "Units Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Sub Level Unit Types

    //Start Of Get Super Dashboard Details

    get_super_dashboard_details: function (callBack) {
      data = {}
      db.db().collection(dbb.BUILDING).countDocuments({ active: true }, function (countErr, count) {
        if (!countErr) {
          data.buildings_count = count;
        } else {
          data.buildings_count = 0;
        }
        db.db().collection(dbb.VENDOR).countDocuments({ active: true }, function (countErr, count) {
          if (!countErr) {
            data.vendors_count = count;
          } else {
            data.vendors_count = 0;
          }
          db.db().collection(dbb.VENDORCATEGORIES).countDocuments({ active: true }, function (countErr, count) {
            if (!countErr) {
              data.vendor_category_count = count;
              callBack(data, false, "Data Found");

            } else {
              data.vendor_category_count = 0;
              callBack(data, false, "Data Found");

            }
          })
        })
      })
    },

    //End Of Get Super Dashboard Details

    //Start Of Get Dashboard Details

    get_dashboard_details: function (building_id, callBack) {
      data = {}
      db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), active: true, booking_date: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(), $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString() } }, function (countErr, count) {
        if (!countErr) {
          data.current_date_ammenitis_bookings = count;
        } else {
          data.current_date_ammenitis_bookings = 0;
        }
        db.db().collection(dbb.COMPLAINTS).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
          if (!countErr) {
            data.total_active_complaints = count;
          } else {
            data.total_active_complaints = 0;
          }
          db.db().collection(dbb.RESIDENT).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
            if (!countErr) {
              data.total_residents = count;
            } else {
              data.total_residents = 0;
            }
            db.db().collection(dbb.VISITORS).countDocuments({ building_id: new ObjectID(building_id), active: true, date_of_visit: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(), $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString() } }, function (countErr, count) {
              if (!countErr) {
                data.total_current_visitors = count;
              } else {
                data.total_current_visitors = 0;
              }
              db.db().collection(dbb.BUILDING).findOne({ _id: new ObjectID(building_id), active: true }, function (err, doc) {
                if (err) {
                  data.total_vendors = 0;
                  callBack(data, false, "Data Found");
                } else {
                  data.total_vendors = doc.vendors.length;
                  callBack(data, false, "Data Found");
                }
              })
            })
          })
        })
      })
    },

    //End Of Get Dashboard Details

    //Start of Get full Building Details

    get_full_building_details: function (building_id, callBack) {
      try {
        unit_types = [];
        units = [];

        //GET ALL UNIT TYPES
        var cursor = db.db().collection(dbb.UNITTYPE).find({ "building_id": new ObjectID(building_id), active: true });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            unit_types.push(doc);
          }
        }, function () {
          lowest_unit_type = null;
          //GET LOWEST UNIT TYPE
          index = 0;
          var get_lowest_unit_type = function (single_unit_type) {
            var lowest = true;
            var i = 0;
            var lowest_check = function (i) {
              if (single_unit_type._id + "" == unit_types[i].type_parent_id + "") {
                lowest = false;
              }
              i++;
              if (i < unit_types.length) {
                lowest_check(i);
              }
            }
            lowest_check(i);

            if (lowest != true) {
              index++;
              get_lowest_unit_type(unit_types[index]);
            } else {
              lowest_unit_type = single_unit_type;
            }
          }
          if (unit_types.length > 0) {
            get_lowest_unit_type(unit_types[index]);

          }
          //END OF GETTING LOWEST UNIT

          //GET ALL UNITS
          var all_units = [];
          var cursor = db.db().collection(dbb.UNIT).find({ "building_id": new ObjectID(building_id), active: true });
          cursor.forEach(function (doc, err) {
            if (err) {
              callBack(null, true, err);
            } else {
              all_units.push({
                _id: doc._id,
                unit_name: doc.unit_name,
                square_feet: doc.square_feet,
                unit_desc: doc.unit_desc,
                unit_type_id: doc.unit_type_id,
                unit_parent_id: doc.unit_parent_id,
                building_id: doc.building_id,
                sub_units: []
              });
            }
          }, function () {
            //LOOP THROUGH ALL UNITS
            //GET LOWEST UNIT AND INSERT INTO PARENT UNIT
            var all_units_clone = all_units;

            var manipulate_data = function () {
              for (var i = 0; i < all_units_clone.length; i++) {
                if (all_units_clone[i].unit_type_id + "" == lowest_unit_type.type_parent_id + "") {
                  for (var j = 0; j < all_units.length; j++) {
                    if (all_units[j].unit_type_id + "" == lowest_unit_type._id + "" && all_units[j].unit_parent_id + "" == all_units_clone[i]._id) {
                      all_units_clone[i].sub_units.push(all_units_clone[j]);
                    }
                  }
                }
              }

              if (lowest_unit_type.type_parent_id != null) {
                for (var j = 0; j < unit_types.length; j++) {
                  if (unit_types[j]._id + "" == lowest_unit_type.type_parent_id + "") {
                    lowest_unit_type = unit_types[j];
                    //call the recursive function below
                    manipulate_data();
                  }
                }
              } else {
                //final response

                var data_to_send = [];
                index = 0;

                var get_parent_data = function (i) {
                  if (all_units_clone[i].unit_parent_id == null || all_units_clone[i].unit_parent_id == "null") {
                    data_to_send.push(all_units_clone[i]);
                  }
                  i++;
                  if (i < all_units_clone.length) {
                    get_parent_data(i);
                  } else {
                    callBack(data_to_send, false, "data found");
                  }
                }
                get_parent_data(index);
              }
            }
            if (all_units_clone.length > 0) {
              manipulate_data();
            }
          })
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Full Building Details


    //Start of Adding Subscription
    add_building_subscription: function (building_id, booking_date, duration, amount, callBack) {
      try {
        var buildingFound = false;
        var buildingDetails;
        var cursor = db.db().collection(dbb.BUILDING).find({ _id: new ObjectID(building_id) });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          buildingFound = true;
          buildingDetails = doc;
        }, function () {
          if (buildingFound) {
            var validDate = new Date(buildingDetails.valid_till);
            var currentDate = new Date(booking_date);
            var newSubscriptionDate;

            var paymentInfo = {
              amount: amount,
              payment_date: currentDate,
              duration: duration + " days"
            }

            var increaseDays = parseInt(duration) * 24 * 60 * 60 * 1000;

            if (validDate.getTime() > currentDate.getTime()) {
              newSubscriptionDate = new Date(validDate.getTime() + increaseDays);
            } else {
              newSubscriptionDate = new Date(currentDate.getTime() + increaseDays);
            }

            db.db().collection(dbb.BUILDING).updateOne({ "_id": new ObjectID(building_id) }, {
              $set: { valid_till: newSubscriptionDate, },
              $push: { payment_history: paymentInfo },
            }, { upsert: false }, function (err2, result) {
              if (err2) {
                callBack(null, true, err2);
              } else {
                callBack(result, false, "Building Subscription Added");
              }

            });


          } else {
            callBack(null, true, "Building Not Found");
          }
        })


      } catch (e) {
        callBack(null, true, e);
      }

    },
    //End of Adding Subscription


    //Start of get building name
    get_building_name: function (building_id, callBack) {
      try {
        db.db().collection(dbb.BUILDING).findOne({ _id: new ObjectID(building_id) }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(doc.building_name, false, "Building Name Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of get building name
  }
  return building_module;
}