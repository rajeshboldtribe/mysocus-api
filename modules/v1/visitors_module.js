module.exports = function (mongo, ObjectID, url, assert, dbb, db, firebase_key) {

  var visitors_module = {

    //Start of Add Expected Visitors Details

    add_expected_visitor: function (new_visitors, callBack) {
      try {

        db.db().collection(dbb.VISITORS).insertOne(new_visitors, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "Visitors Details Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add Expected Visitors Details


    //Start of Update Expected Visitors Details

    edit_expected_visitor: function (building_id,
      resident_id,
      visit_id,
      visitor_details,
      visitor_vehicle_details,
      date_of_visit,
      hours_of_stay,
      modified_by,
      purpose_of_visit,
      callBack) {
      try {

        if (visitor_vehicle_details == undefined || visitor_vehicle_details == '') {
          visitor_vehicle_details = {}
        }

        db.db().collection(dbb.VISITORS).updateOne({ "_id": new ObjectID(visit_id) }, {
          $set: {
            building_id: new ObjectID(building_id),
            resident_id: new ObjectID(resident_id),
            visitor_details: JSON.parse(visitor_details),
            visitor_vehicle_details: JSON.parse(visitor_vehicle_details),
            date_of_visit: new Date(date_of_visit),
            hours_of_stay: hours_of_stay,
            modified_by: new ObjectID(modified_by),
            modified_on: new Date(),
            purpose_of_visit: purpose_of_visit
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Expected Visitors Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update  Expected Visitors Details



    //Start of Approve Visitors 

    approve_expected_visitor: function (building_id,
      visit_id,
      callBack) {
      try {
        db.db().collection(dbb.VISITORS).updateOne({ "_id": new ObjectID(visit_id), building_id: new ObjectID(building_id) }, {
          $set: { is_user_approved: true, }
        }, { upsert: false }, function (err, result) {
          if (err) {

            callBack(null, true, err);
          } else {

            callBack(result, false, "Visitor Approved");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Approve Visitor

    //Start of Deny Visitor
    deny_visitor: function (building_id,
      visit_id,
      callBack) {
      try {
        db.db().collection(dbb.VISITORS).updateOne({ "_id": new ObjectID(visit_id), building_id: new ObjectID(building_id) }, {
          $set: {
            is_user_approved: false,
            active: false,
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Visitor Approved");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Deny Visitor


    //Start of Create Visitors Entry

    create_visitor_entry: function (new_visitors, callBack) {
      try {

        db.db().collection(dbb.VISITORS).insertOne(new_visitors, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "Visitors Details Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Create Visitors Entry



    //Start of View Single Visitor Details By OTP

    get_expected_visitor_details: function (building_id, visit_otp, callBack) {
      try {
        var visitor = {};
        var visitorInfo = {};
        var visitorFound = false;

        var cursor = db.db().collection(dbb.VISITORS).aggregate([
          { $match: { building_id: new ObjectID(building_id), visitor_otp: parseInt(visit_otp) } },
          { $lookup: { from: dbb.RESIDENT, localField: "unit_id", foreignField: "unit_id", as: "resident_details" } },
          { $unwind: "$resident_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          { $unwind: "$unit_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          { $unwind: "$unit_parent_details" },
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            // visitor.push(doc);
            var unitNo = "";
            if (doc.unit_details != undefined) {
              if (doc.unit_parent_details != undefined) {
                unitNo = doc.unit_parent_details.unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitNo = doc.unit_details.unit_name;
              }
            }
            visitorFound = true;
            var data = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_unit_id: doc.resident_details.unit_id,
              visitor_details: doc.visitor_details,
              visitor_vehicle_details: doc.visitor_vehicle_details,
              date_of_visit: doc.date_of_visit,
              hours_of_stay: doc.hours_of_stay,
              visitor_otp: doc.visitor_otp,
              is_user_approved: doc.is_user_approved,
              purpose_of_visit: doc.purpose_of_visit,
              unit_no: unitNo
            }
            visitorInfo = data;
          }
        }, function () {
          if (visitorFound == false) {
            callBack(null, true, "No Visitor Found");
          }
          else {
            callBack(visitorInfo, false, "Visitor Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View Single Visitor Details By OTP

    employee_visit_exit: function (visit_id, exit_time, callBack) {
      try {
        db.db().collection(dbb.EMPLOYEE_VISITORS).updateOne({ "_id": new ObjectID(visit_id) }, {
          $set: {
            exit_time: new Date(exit_time)
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Visitor Details Updated");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },

    helper_visit_exit: function (visit_id, exit_time, callBack) {
      try {
        db.db().collection(dbb.HELPER_VISITORS).updateOne({ "_id": new ObjectID(visit_id) }, {
          $set: {
            exit_time: new Date(exit_time)
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Visitor Details Updated");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },

    vendor_visit_exit: function (visit_id, exit_time, callBack) {
      try {
        db.db().collection(dbb.VENDOR_ENTRIES).updateOne({ "_id": new ObjectID(visit_id) }, {
          $set: {
            exit_time: new Date(exit_time)
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Vendor Exit Updated");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },

    //Start of Delete Visitor Details

    delete_expected_visitor: function (building_id, visit_id, callBack) {
      try {
        db.db().collection(dbb.VISITORS).update({ "_id": new ObjectID(visit_id), building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Visitor Details Deleted");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Delete  Visitor Details

    //Start of Visit Exists

    visitExists: function (visit_id, callBack) {
      try {
        var cursor = db.db().collection(dbb.VISITORS).find({ "_id": new ObjectID(visit_id) });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          visitExists = true;
          resident_id = doc.resident_id

        }, function () {
          if (visitExists) {

            callBack(resident_id, false, "Visit Found");
          } else {

            callBack('', true, "Visit Does not Exists!");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Visit Exists

    //start of View All Visitors

    view_all_visitors: function (start_date, end_date, starting_after, limit, building_id, callBack) {
      try {
        var visitorDetail = [];
        var totaldata;
        var cursor;
        if ((start_date == undefined || end_date == undefined || start_date == "" || end_date == "") && (starting_after !== undefined || limit !== undefined)) {
          limit = parseInt(limit);
          starting_after = parseInt(starting_after);

          cursor = db.db().collection(dbb.VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.RESIDENT, localField: "unit_id", foreignField: "unit_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        } else if ((start_date !== undefined || end_date !== undefined) && (starting_after == undefined || limit == undefined)) {
          var edate = new Date(end_date);
          var sdate = new Date(start_date);

          cursor = db.db().collection(dbb.VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id), date_of_visit: { $gte: sdate, $lt: edate } } },
            { $lookup: { from: dbb.RESIDENT, localField: "unit_id", foreignField: "unit_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          ]).sort({ _id: -1 });
        }
        else if ((start_date == undefined || end_date == undefined) && (starting_after == undefined || limit == undefined)) {
          cursor = db.db().collection(dbb.VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.RESIDENT, localField: "unit_id", foreignField: "unit_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          ]).sort({ _id: -1 });
        }
        else {
          var edate = new Date(end_date);
          var sdate = new Date(start_date);
          limit = parseInt(limit);
          starting_after = parseInt(starting_after);

          cursor = db.db().collection(dbb.VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id), date_of_visit: { $gte: sdate, $lt: edate } } },
            { $lookup: { from: dbb.RESIDENT, localField: "unit_id", foreignField: "unit_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);

        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            var unitInfo = ""
            if (doc.unit_details != undefined && doc.unit_details.length > 0) {
              if (doc.unit_parent_details != undefined && doc.unit_parent_details.length > 0) {
                unitInfo = doc.unit_parent_details[0].unit_name + " - " + doc.unit_details[0].unit_name;
              } else {
                unitInfo = doc.unit_details[0].unit_name;
              }
            }
            var data = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_unit_id: doc.unit_id,
              resident_unit_no: unitInfo,
              visitor_details: doc.visitor_details,
              visitor_vehicle_details: doc.visitor_vehicle_details,
              date_of_visit: doc.date_of_visit,
              hours_of_stay: doc.hours_of_stay,
              visitor_otp: doc.visitor_otp,
              is_user_approved: doc.is_user_approved,
              purpose_of_visit: doc.purpose_of_visit
            }
            visitorDetail.push(data);
          }
        }, function () {
          if (visitorDetail.length == 0) {
            callBack(null, true, "No Visitors Found", '');
          } else {
            visitors_module.getVisitorInfoFromArray(visitorDetail, building_id, callBack);
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    // End of View All Visitors


    //start of View User Visitors

    view_user_visitor: function (start_date, end_date, starting_after, limit, building_id, unit_id, callBack) {
      try {
        visitors = [];
        var totaldata;

        var limit = parseInt(limit);
        var starting_after = parseInt(starting_after);
        if (start_date == '' || start_date == undefined || end_date == '' || end_date == undefined) {
          var cursor = db.db().collection(dbb.VISITORS).find({ building_id: new ObjectID(building_id), unit_id: new ObjectID(unit_id) }).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }
        else {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);
          var cursor = db.db().collection(dbb.VISITORS).find({ building_id: new ObjectID(building_id), unit_id: new ObjectID(unit_id), date_of_visit: { $gte: sdate, $lte: edate } }).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc2, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            visitors.push(doc2);
          }
        }, function () {
          if (visitors.length == 0) {
            callBack(null, true, "No Visitors Found");
          }
          else {
            db.db().collection(dbb.VISITORS).countDocuments({ building_id: new ObjectID(building_id), resident_id: new ObjectID(user_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(visitors, false, "Visitors Found", totaldata);
            });
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    // End of View User Visitors

    //start of View Employee Visitors

    view_employee_visitor: function (start_date, end_date, starting_after, limit, building_id, unit_id, callBack) {
      try {
        visitors = [];
        var totaldata;

        var limit = parseInt(limit);
        var starting_after = parseInt(starting_after);
        if (start_date == '' || start_date == undefined || end_date == '' || end_date == undefined) {
          var cursor = db.db().collection(dbb.EMPLOYEE_VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }
        else {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);
          var cursor = db.db().collection(dbb.EMPLOYEE_VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id), entry_time: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc2, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            var employeeName = "";
            var employeeDesignation = "";
            var employeeCode = "";
            var employeeImg = "";
            var employeeContactInfo = "";
            if (doc2.employee_details[0] != undefined) {
              employeeName = doc2.employee_details[0].employee_name;
              employeeDesignation = doc2.employee_details[0].employee_designation;
              employeeCode = doc2.employee_details[0].employee_code;
              employeeImg = doc2.employee_details[0].employee_img;
              employeeContactInfo = doc2.employee_details[0].employee_contact_info;
            }
            var data = {
              _id: doc2._id,
              building_id: doc2.building_id,
              employee_name: employeeName,
              employee_designation: employeeDesignation,
              employee_img: employeeImg,
              employee_code: employeeCode,
              employee_contact_info: employeeContactInfo,
              entry_time: doc2.entry_time,
              exit_time: doc2.exit_time
            }
            visitors.push(data);
          }
        }, function () {
          if (visitors.length == 0) {
            callBack(null, true, "No Visitors Found");
          }
          else {
            db.db().collection(dbb.EMPLOYEE_VISITORS).countDocuments({ building_id: new ObjectID(building_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(visitors, false, "Visitors Found", totaldata);
            });
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    // End of View User Visitors



    //start of View Employee Visitors
    view_helper_visitor: function (start_date, end_date, starting_after, limit, building_id, unit_id, callBack) {
      try {
        visitors = [];
        var totaldata;
        var cursor;

        var limit = parseInt(limit);
        var starting_after = parseInt(starting_after);
        if (start_date == '' || start_date == undefined || end_date == '' || end_date == undefined) {
          cursor = db.db().collection(dbb.HELPER_VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.HELPER, localField: "helper_id", foreignField: "_id", as: "helper_details" } },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }
        else {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);
          cursor = db.db().collection(dbb.HELPER_VISITORS).aggregate([
            { $match: { building_id: new ObjectID(building_id), entry_time: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.HELPER, localField: "helper_id", foreignField: "_id", as: "helper_details" } },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc2, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var helperName = "";
            var helperImg = "";
            var helperAddress = "";
            var helperContactInfo = "";
            var isPrivate = false;
            var isKYCapproved = false;

            if (doc2.helper_details[0] != undefined) {
              helperName = doc2.helper_details[0].helper_name;
              helperImg = doc2.helper_details[0].helper_img;
              helperAddress = doc2.helper_details[0].helper_permanent_address;
              helperContactInfo = doc2.helper_details[0].helper_contact_info;
              isPrivate = doc2.helper_details[0].is_private;
              isKYCapproved = doc2.helper_details[0].is_kyc_approved;
            }

            var data = {
              _id: doc2._id,
              building_id: doc2.building_id,
              helper_id: doc2.helper_id,
              helper_name: helperName,
              helper_img: helperImg,
              helper_permanent_address: helperAddress,
              helper_contact_info: helperContactInfo,
              is_private: isPrivate,
              is_kyc_approved: isKYCapproved,
              entry_time: doc2.entry_time,
              exit_time: doc2.exit_time
            }
            visitors.push(data);
          }
        }, function () {
          if (visitors.length == 0) {
            callBack(null, true, "No Visitors Found");
          }
          else {
            db.db().collection(dbb.HELPER_VISITORS).countDocuments({ building_id: new ObjectID(building_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(visitors, false, "Visitors Found", totaldata);
            });
          }
        })
      } catch (e) {
        callBack(null, true, e, 0);
      }
    },
    // End of View User Visitors

    //Start of View Vendor Visit Details
    view_vendor_visitor: function (start_date, end_date, starting_after, limit, building_id, callBack) {
      try {
        visitors = [];
        var totaldata;
        var cursor;

        var limit = parseInt(limit);
        var starting_after = parseInt(starting_after);
        if (start_date == '' || start_date == undefined || end_date == '' || end_date == undefined) {
          cursor = db.db().collection(dbb.VENDOR_ENTRIES).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.VENDOR, localField: "vendor_id", foreignField: "_id", as: "vendor_details" } },
            { $unwind: "$vendor_details" },
            { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_details.vendor_service", foreignField: "_id", as: "vendor_category_details" } }
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }
        else {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);
          cursor = db.db().collection(dbb.VENDOR_ENTRIES).aggregate([
            { $match: { building_id: new ObjectID(building_id), entry_time: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.VENDOR, localField: "vendor_id", foreignField: "_id", as: "vendor_details" } },
            { $unwind: "$vendor_details" },
            { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_details.vendor_service", foreignField: "_id", as: "vendor_category_details" } },

          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err, 0)
          } else {
            var vendorName = "";
            var vendorCategory = "";
            var vendorContact = "";
            var vendorImg = "";

            if (doc.vendor_details != undefined) {
              vendorName = doc.vendor_details.vendor_name;
              vendorContact = doc.vendor_details.vendor_contact_info;
              vendorImg = doc.vendor_details.vendor_image;
            }
            if (doc.vendor_category_details.length > 0 && doc.vendor_category_details[0] != undefined) {
              vendorCategory = doc.vendor_category_details[0].vendor_category_name;
            }
            var data = {
              _id: doc._id,
              vendor_id: doc.vendor_id,
              building_id: doc.building_id,
              entry_time: doc.entry_time,
              exit_time: doc.exit_time,
              vendor_name: vendorName,
              vendor_service: vendorCategory,
              vendor_contact_info: vendorContact,
              vendor_img: vendorImg
            }
            visitors.push(data);
          }
        }, function () {
          if (visitors.length == 0) {
            callBack(null, true, "No Vendor Visits", 0)
          } else {
            db.db().collection(dbb.VENDOR_ENTRIES).countDocuments({ building_id: new ObjectID(building_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(visitors, false, "Vendor Visits Found", totaldata);
            });
          }
        })
      } catch (ex) {
        callBack(null, true, ex, 0);
      }
    },
    //End of View Vendor Visit Details

    //Start of Push notification Android
    visitor_pushnotification: function (notification_title, notification_body, unit_id, notif_type, visit_id, callBack) {
      try {
        var resident_ids = [];
        var unitCursor = db.db().collection(dbb.RESIDENT).find({ unit_id: new ObjectID(unit_id), active: true })
        unitCursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            resident_ids.push(doc._id)
          }
        }, function () {
          if (resident_ids.length == 0) {
            callBack(false, "Data Added Successfully,But No Active Resident Found", false);
          }
          else {

            var fcm_tokens = [];
            var index = 0;
            var get_data = function (doc_data) {
              var cursor = db.db().collection(dbb.USER).find({ active: true, user_id: new ObjectID(doc_data) });
              cursor.forEach(function (doc, err) {
                if (err) {
                  callBack(true, 'Error Occured');
                } else {
                  if (doc.fcm_token !== null && doc.fcm_token !== '' && doc.fcm_token != null && doc.fcm_token != "null") {
                    fcm_tokens.push(doc.fcm_token);
                  }
                  index++;
                  if (index < resident_ids.length) {
                    get_data(resident_ids[index]);
                  } else {
                    if (fcm_tokens.length !== 0) {
                      const firebase = require("firebase-admin");
                      const serviceAccount = firebase_key;
                      const firebaseToken = fcm_tokens;

                      if (!firebase.apps.length) {

                        firebase.initializeApp({
                          credential: firebase.credential.cert(serviceAccount),
                          databaseURL: "https://apartment-erp.firebaseio.com"
                        });
                      }

                      const payload = {
                        data: {  //you can send only notification or only data(or include both)
                          title: notification_title,
                          body: notification_body,
                          type: notif_type,
                          type_id: visit_id,
                          category: notif_type,
                          sound: "alarm_buzzer.wav",
                          click_action: notif_type,
                          action: notif_type,
                        },
                      };

                      const options = {
                        priority: 'high',
                        timeToLive: 60 * 60 * 24, // 1 day
                      };

                      firebase.messaging().sendToDevice(firebaseToken, payload, options)
                        .then(function (response) {
                          callBack(false, "Notification Successfully sent", true)
                        })
                        .catch(function (error) {
                          callBack(true, "Something has gone wrong!", false)
                        });
                    }
                    else {
                      callBack(false, "Data Added Successfully,But No FCM Token Found", false);
                    }
                  }
                }
              });
            }

            if (resident_ids.length !== 0) {
              get_data(resident_ids[index]);
            }
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //Enf Of Push Notification Android


    //START OF PUSH NOTIFICATION iOS
    visitor_pushnotification_ios: function (notification_title, notification_body, unit_id, notif_type, visit_id, callBack) {
      try {
        var resident_ids = [];
        var unitCursor = db.db().collection(dbb.RESIDENT).find({ unit_id: new ObjectID(unit_id), active: true })
        unitCursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            resident_ids.push(doc._id)
          }
        }, function () {
          if (resident_ids.length == 0) {
            callBack(false, "Data Added Successfully,But No Active Resident Found", false);
          }
          else {

            var fcm_tokens = [];
            var index = 0;
            var get_data = function (doc_data) {
              var cursor = db.db().collection(dbb.USER).find({ active: true, user_id: new ObjectID(doc_data) });
              cursor.forEach(function (doc, err) {
                if (err) {
                  callBack(true, 'Error Occured');
                } else {
                  if (doc.fcm_token !== null && doc.fcm_token !== '' && doc.fcm_token != null && doc.fcm_token != "null") {
                    fcm_tokens.push(doc.fcm_token);
                  }
                  index++;
                  if (index < resident_ids.length) {
                    get_data(resident_ids[index]);
                  } else {
                    if (fcm_tokens.length !== 0) {
                      const firebase = require("firebase-admin");
                      const serviceAccount = firebase_key;
                      const firebaseToken = fcm_tokens;

                      if (!firebase.apps.length) {

                        firebase.initializeApp({
                          credential: firebase.credential.cert(serviceAccount),
                          databaseURL: "https://apartment-erp.firebaseio.com"
                        });
                      }

                      const payload = {
                        notification: {
                          title: notification_title,
                          body: notification_body,
                          type: notif_type,
                          type_id: visit_id,
                          category: notif_type,
                          sound: "alarm_buzzer.caf",
                          click_action: notif_type,
                          action: notif_type,
                        },
                      };

                      const options = {
                        priority: 'high',
                        timeToLive: 60 * 60 * 24, // 1 day
                      };

                      firebase.messaging().sendToDevice(firebaseToken, payload, options)
                        .then(function (response) {
                          callBack(false, "Notification Successfully sent", true)
                        })
                        .catch(function (error) {
                          callBack(true, "Something has gone wrong!", false)
                        });
                    }
                    else {
                      callBack(false, "Data Added Successfully,But No FCM Token Found", false);
                    }
                  }
                }
              });
            }

            if (resident_ids.length !== 0) {
              get_data(resident_ids[index]);
            }
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //Enf Of Push Notification iOS

    //Search Visitor By Vehicle Number
    search_visitor_vehicle_number: function (building_id, vehicle_number, callBack) {
      try {
        var visitorDetail = [];
        var cursor = db.db().collection(dbb.VISITORS).find({ building_id: new ObjectID(building_id), "visitor_vehicle_details.vehicle_number": { $regex: vehicle_number, $options: 'i' } });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var data = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_unit_id: doc.unit_id,
              visitor_details: doc.visitor_details,
              visitor_vehicle_details: doc.visitor_vehicle_details,
              date_of_visit: doc.date_of_visit,
              hours_of_stay: doc.hours_of_stay,
              visitor_otp: doc.visitor_otp,
              is_user_approved: doc.is_user_approved
            }
            visitorDetail.push(data);
          }
        }, function () {
          if (visitorDetail.length == 0) {
            callBack(null, true, "No Visitors Found", '');
          } else {
            visitors_module.getVisitorInfoFromArray(visitorDetail, building_id, callBack);
          }
        });
      } catch (er) {
        callBack(null, true, er);
      }
    },
    //End of Search Visitor By Vehicle Number


    //Search Visitor By Phone Number
    search_visitor_phone_number: function (building_id, phone_number, callBack) {
      try {
        var visitorDetail = [];
        var cursor = db.db().collection(dbb.VISITORS).find({ building_id: new ObjectID(building_id), visitor_details: { $elemMatch: { visitor_mobilenumber: { $regex: phone_number, $options: 'i' } } } })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var data = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_unit_id: doc.unit_id,
              visitor_details: doc.visitor_details,
              visitor_vehicle_details: doc.visitor_vehicle_details,
              date_of_visit: doc.date_of_visit,
              hours_of_stay: doc.hours_of_stay,
              visitor_otp: doc.visitor_otp,
              is_user_approved: doc.is_user_approved
            }
            visitorDetail.push(data);
          }
        }, function () {
          if (visitorDetail.length == 0) {
            callBack(null, true, "No Visitors Found", '');
          } else {
            visitors_module.getVisitorInfoFromArray(visitorDetail, building_id, callBack);
          }
        });
      } catch (er) {
        callBack(null, true, er);
      }
    },
    //End Of Search Visitor By Phone Number


    getVisitorInfoFromArray: function (visitorDetail, building_id, callBack) {
      var visitors = [];
      var index = 0;
      var getUnitInfo = function (visitorInfo) {
        var unitNo;
        var unitCursor = db.db().collection(dbb.UNIT).aggregate([
          { $match: { _id: new ObjectID(visitorInfo.resident_unit_id) } },
          { $lookup: { from: dbb.UNIT, localField: "unit_parent_id", foreignField: "_id", as: "parent_unit_details" } },
        ])
        unitCursor.forEach(function (doc99, err99) {
          if (err99) {
            callBack(null, true, "No Visitors Found", '');
          } else {
            unitNo = doc99.unit_name;
            if (doc99.parent_unit_details != undefined) {
              var parentUnit = doc99.parent_unit_details[0].unit_name;
              unitNo = parentUnit + " - " + doc99.unit_name;
            }
            var item = {
              _id: visitorInfo._id,
              building_id: visitorInfo.building_id,
              resident_id: visitorInfo.resident_id,
              resident_unit_no: unitNo,
              visitor_details: visitorInfo.visitor_details,
              visitor_vehicle_details: visitorInfo.visitor_vehicle_details,
              date_of_visit: visitorInfo.date_of_visit,
              hours_of_stay: visitorInfo.hours_of_stay,
              visitor_otp: visitorInfo.visitor_otp,
              is_user_approved: visitorInfo.is_user_approved,
              unit_id: visitorInfo.resident_unit_id,
              purpose_of_visit: visitorInfo.purpose_of_visit
            }
            visitors.push(item);
          }
        }, function () {
          if (index < visitorDetail.length) {
            getUnitInfo(visitorDetail[index]);
            index++;
          } else {
            db.db().collection(dbb.VISITORS).countDocuments({ building_id: new ObjectID(building_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(visitors, false, "Visitors Found", totaldata);
            });
          }
        })
      }
      getUnitInfo(visitorDetail[index]);
      index++;
    },

    //Start of Get Visitor Approved
    get_visitor_approved_status: function (building_id, visit_id, callBack) {
      var isVisitorFound = false;
      var message = ""
      try {
        var cursor = db.db().collection(dbb.VISITORS).find({ building_id: new ObjectID(building_id), _id: new ObjectID(visit_id) });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(true, err);
          } else {
            if (doc.active) {
              isVisitorFound = doc.is_user_approved;
              message = "Visitor Approved"
            } else {
              isVisitorFound = true;
              message = "Visitor Entry denied. Please call and confirm once with the unit."
            }
          }
        }, function () {
          if (isVisitorFound) {
            callBack(false, message);
          } else {
            callBack(true, "Visitor Not Yet Approved")
          }
        })

      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Get Visitor Approved

    //Start of Resident Entry
    add_resident_entry: function (resident_entry, callBack) {
      try {
        db.db().collection(dbb.RESIDENT_ENTRIES).insertOne(resident_entry, function (error, result) {
          if (error) {
            callBack(true, "Error while inserting resident entry");
          } else {
            callBack(false, "Resident Entry inserted");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Resident Entry

    //Start of Get Resident Entries
    get_resident_entries: function (building_id, limit, starting_after, start_date, end_date, callBack) {
      try {

        var residentEntries = [];
        var totaldata;
        limit = parseInt(limit);
        starting_after = parseInt(starting_after);



        if (start_date != undefined && start_date != "" && end_date != undefined && end_date != "") {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);

          var cursor = db.db().collection(dbb.RESIDENT_ENTRIES).aggregate([
            { $match: { building_id: new ObjectID(building_id), entry_time: { $gte: sdate, $lt: edate } } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $unwind: "$resident_details" },
            { $lookup: { from: dbb.UNIT, localField: "resident_details.unit_id", foreignField: "_id", as: "unit_details" } },
            { $unwind: "$unit_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parentdetails" } },
            { $unwind: "$unit_parentdetails" },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        } else {
          var cursor = db.db().collection(dbb.RESIDENT_ENTRIES).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $unwind: "$resident_details" },
            { $lookup: { from: dbb.UNIT, localField: "resident_details.unit_id", foreignField: "_id", as: "unit_details" } },
            { $unwind: "$unit_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parentdetails" } },
            { $unwind: "$unit_parentdetails" },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, e, 0);
          } else {
            var residentName = "";
            var residentImg = "";
            var unitNo = "";
            if (doc.resident_details != undefined) {
              residentName = doc.resident_details.resident_name;
              residentImg = doc.resident_details.resident_img;
            }

            if (doc.unit_details != undefined) {
              if (doc.unit_parentdetails != undefined) {
                unitNo = doc.unit_parentdetails.unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitNo = doc.unit_details.unit_name;
              }
            }

            var data = {
              _id: doc._id,
              building_id: doc.buidling_id,
              resident_id: doc.resident_id,
              resident_name: residentName,
              unit_no: unitNo,
              entry_time: doc.entry_time,
              vehicle_details: doc.vehicle_details,
              resident_img: residentImg
            }

            residentEntries.push(data);
          }
        }, function () {
          if (residentEntries.length == 0) {
            callBack(null, true, "No Entries Found", 0);
          } else {
            db.db().collection(dbb.RESIDENT_ENTRIES).countDocuments({ building_id: new ObjectID(building_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(residentEntries, false, "Entries Found", totaldata);
            });

          }
        })
      } catch (e) {
        callBack(null, true, e, 0);
      }
    },
    //End of Get Resident Entries

    //Start of Get Visit Details
    get_visit_detail: function (visit_id, callBack) {
      try {
        var data = {};
        var cursor = db.db().collection(dbb.VISITORS).find({ _id: new ObjectID(visit_id) });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            data = doc;
          }
        }, function () {
          if (data != {}) {
            callBack(data, false, "Visitor Approved");
          } else {
            callBack(data, true, "Visitor Not Yet Approved");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Visit Details

    //Start of Get Visit Details iOS
    get_visit_detail_ios: function (visit_id, callBack) {
      try {
        var data = {};

        db.db().collection(dbb.VISITORS).findOne({ _id: new ObjectID(visit_id), active: true }, function (err, doc) {
          if (err) {
            callBack(false, err);
          } else {
            if (doc.is_user_approved == false) {
              callBack(true, "User Not Yet approved");
            } else {
              callBack(false, "User Approved");
            }
          }
        })


        // var cursor = db.db().collection(dbb.VISITORS).find({ _id: new ObjectID(visit_id) });
        // cursor.forEach(function (doc, err) {
        //   if (err) {
        //     callBack(null, true, err);
        //   } else {
        //     data = doc;
        //   }
        // }, function () {
        //   if (data != {}) {
        //     callBack(false, "Visitor Approved");
        //   } else {
        //     if (data.active == true) {
        //       callBack(true, "Visitor Not Yet Approved");
        //     } else {
        //       callBack(false, "Inactive status");
        //     }
        //   }
        // })

      } catch (e) {
        callBack(false, e);
      }
    },
    //End of Get Visit Details iOS

  }
  return visitors_module;
}