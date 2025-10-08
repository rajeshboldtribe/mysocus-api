module.exports = function (mongo, ObjectID, url, assert, dbb, db, firebase_key) {
  var complaints_module = {

    //Start of Add Complaints Details

    book_complaint: function (new_complaint, callBack) {
      try {

        db.db().collection(dbb.COMPLAINTS).insertOne(new_complaint, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "Complaints Details Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add  Complaints Details


    //Start of Update Complaints Details

    edit_complaint: function (complaint_id,
      resident_id,
      unit_id,
      building_id,
      complaint_title,
      complaint_desc,
      complaint_raised_imgs,
      complaint_raised_date,
      is_urgent,
      modified_by,
      callBack) {
      try {
        db.db().collection(dbb.COMPLAINTS).updateOne({ "_id": new ObjectID(complaint_id) }, {
          $set: {
            resident_id: new ObjectID(resident_id),
            unit_id: new ObjectID(unit_id),
            building_id: new ObjectID(building_id),
            complaint_title: complaint_title,
            complaint_desc: complaint_desc,
            complaint_raised_imgs: JSON.parse(complaint_raised_imgs),
            complaint_raised_date: new Date(complaint_raised_date),
            is_urgent: is_urgent,
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {

            callBack(null, true, err);
          } else {

            callBack(result, false, "Complaints Details Updated Successfully");
          }

        });
      } catch (e) {

        callBack(null, true, e);
      }
    },
    //End of Update  Complaints Details

    //Start of View All Complaints Details

    view_all_complaints: function (starting_after, limit, building_id, callBack) {

      try {
        var complaints = [];
        var totaldata;
        var cursor;
        var rating
        var resident_feedback


        if ((limit == '' || limit == undefined) && (starting_after == '' || starting_after == undefined)) {
          cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { building_id: new ObjectID(building_id), complaint_completed_date: { $exists: true }, active: true } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ]);
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { building_id: new ObjectID(building_id), complaint_completed_date: { $exists: true }, active: true } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ]).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {

            var employeeName = "";
            var employeeContactInfo = "";
            var unitName = "";
            var residentName = "";
            var residentContactInfo = "";
            if (doc.employee_details != undefined && doc.employee_details.length > 0) {
              employeeName = doc.employee_details[0].employee_name;
              employeeContactInfo = doc.employee_details[0].employee_contact_info;
            }

            if (doc.unit_details.length != 0) {
              unitName = doc.unit_details[0].unit_name;
            }

            if (doc.resident_details.length != 0) {
              residentName = doc.resident_details[0].resident_name;
              residentContactInfo = doc.resident_details[0].resident_contact_info;
            }

            if (doc.ratings == undefined) {
              ratings = 0;
            }
            else {
              ratings = doc.ratings
            }
            if (doc.resident_feedback == undefined) {
              resident_feedback = 'Not Available'
            }
            else {
              resident_feedback = doc.resident_feedback
            }

            var data = {
              _id: doc._id,
              complaint_title: doc.complaint_title,
              resident_id: doc.resident_id,
              resident_name: residentName,
              resident_contact_info: residentContactInfo,
              unit_id: doc.unit_id,
              unit_name: unitName,
              complaint_desc: doc.complaint_desc,
              complaint_raised_imgs: doc.complaint_raised_imgs,
              complaint_raised_date: doc.complaint_raised_date,
              is_urgent: doc.is_urgent,
              employee_name: employeeName,
              employee_contact_info: employeeContactInfo,
              complaint_allotted_date: doc.complaint_allotted_date,
              complaint_completed_date: doc.complaint_completed_date,
              complaint_service_type: doc.complaint_service_type,
              complaint_fee: doc.complaint_fee,
              servicer_feedback: doc.service_feedback,
              resident_feedback: resident_feedback,
              ratings: ratings,
              comments: doc.comments
            }
            complaints.push(data)
          }
        }, function () {
          if (complaints.length == 0) {
            callBack(null, true, "No Complaints Found", '');
          }
          else {
            db.db().collection(dbb.COMPLAINTS).countDocuments({ building_id: new ObjectID(building_id), complaint_completed_date: { $exists: true }, active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(complaints, false, "Complaints Found", totaldata);
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Complaints Details


    //Start of View Resident Complaints Details

    view_user_complaints: function (starting_after, limit, unit_id, building_id, callBack) {
      try {
        complaints = [];
        var totaldata;
        var employeeid = "";
        var employeename = "";
        var employeecontactInfo = "";
        var unitNo = "";
        var residentName = "";
        var residentContactInfo = "";


        if ((limit == '' || limit == undefined) && (starting_after == '' || starting_after == undefined)) {
          var cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { unit_id: new ObjectID(unit_id), building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ]);
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          var cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { unit_id: new ObjectID(unit_id), building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ]).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            if (doc.employee_details.length !== 0) {
              employeeid = doc.employee_details[0]._id;
              employeename = doc.employee_details[0].employee_name;
              employeecontactInfo = doc.employee_details[0].employee_contact_info;
            }

            if (doc.resident_details.length > 0 && doc.resident_details[0] != undefined) {
              residentName = doc.resident_details[0].resident_name;
              residentContactInfo = doc.resident_details[0].resident_contact_info;
            }

            if (doc.unit_details.length > 0 && doc.unit_details[0] != undefined) {
              unitNo = doc.unit_details[0].unit_name;
            }
            var data = {
              _id: doc._id,
              complaint_title: doc.complaint_title,
              resident_id: doc.resident_id,
              resident_name: residentName,
              resident_contact_info: residentContactInfo,
              unit_id: doc.unit_id,
              unit_name: unitNo,
              complaint_desc: doc.complaint_desc,
              complaint_raised_imgs: doc.complaint_raised_imgs,
              complaint_raised_date: doc.complaint_raised_date,
              is_urgent: doc.is_urgent,
              employee_id: employeeid,
              employee_name: employeename,
              employee_contact_info: employeecontactInfo,
              complaint_allotted_date: doc.complaint_allotted_date,
              complaint_completed_date: doc.complaint_completed_date,
              complaint_service_type: doc.complaint_service_type,
              complaint_fee: doc.complaint_fee,
              servicer_feedback: doc.service_feedback,
              resident_feedback: doc.resident_feedback,
              ratings: doc.ratings,
              comments: doc.comments
            }

            complaints.push(data)
          }
        }, function () {
          if (complaints.length == 0) {
            callBack(null, true, "No Complaints Found", '');
          }
          else {
            db.db().collection(dbb.COMPLAINTS).countDocuments({ unit_id: new ObjectID(unit_id), building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(complaints, false, "Complaints Found", totaldata);
            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View  Resident Complaints Details

    //Start of View single Complaint
    view_single_complaint: function (building_id, complaint_id, callBack) {
      try {

        var complaint = {};

        var cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
          { $match: { _id: new ObjectID(complaint_id), building_id: new ObjectID(building_id), active: true } },
          { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
          { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
        ]);

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var employeeid = "";
            var employeename = "";
            var employeecontactInfo = "";
            var unitNo = "";
            var residentName = "";
            var residentContactInfo = "";
            if (doc.employee_details.length !== 0) {
              employeeid = doc.employee_details[0]._id;
              employeename = doc.employee_details[0].employee_name;
              employeecontactInfo = doc.employee_details[0].employee_contact_info;
            }
            if (doc.resident_details.length > 0 && doc.resident_details[0] != undefined) {
              residentName = doc.resident_details[0].resident_name;
              residentContactInfo = doc.resident_details[0].resident_contact_info;
            }

            if (doc.unit_details.length > 0 && doc.unit_details[0] != undefined) {
              unitNo = doc.unit_details[0].unit_name;
            }
            var data = {
              _id: doc._id,
              complaint_title: doc.complaint_title,
              resident_id: doc.resident_id,
              resident_name: residentName,
              resident_contact_info: residentContactInfo,
              unit_id: doc.unit_id,
              unit_name: unitNo,
              complaint_desc: doc.complaint_desc,
              complaint_raised_imgs: doc.complaint_raised_imgs,
              complaint_raised_date: doc.complaint_raised_date,
              is_urgent: doc.is_urgent,
              employee_id: employeeid,
              employee_name: employeename,
              employee_contact_info: employeecontactInfo,
              complaint_allotted_date: doc.complaint_allotted_date,
              complaint_completed_date: doc.complaint_completed_date,
              complaint_service_type: doc.complaint_service_type,
              complaint_fee: doc.complaint_fee,
              servicer_feedback: doc.service_feedback,
              resident_feedback: doc.resident_feedback,
              ratings: doc.ratings,
              comments: doc.comments
            }

            complaint = data
          }
        }, function () {
          if (complaint == {}) {
            callBack(null, true, "Complaint Not Found");
          }
          else {
            callBack(complaint, false, "Complaint Found");
          }
        })
      } catch (e) {
        callBack(null, true, e)
      }
    },
    //End of View Single Complaint

    //Start of Delete  Complaints Details

    delete_complaint: function (complaint_id, building_id, callBack) {
      try {

        complaint_id = JSON.parse(complaint_id);
        complaint = [];
        for (var i = 0; i < complaint_id.length; i++) {
          var a = new ObjectID(complaint_id[i]);
          complaint.push(a)
        }

        db.db().collection(dbb.COMPLAINTS).updateMany({ "_id": { $in: complaint }, building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "Complaints Deleted");
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of Delete  Complaints Details

    //Start of  Allot Complaint

    allot_complaint: function (employee_id, complaint_id, complaint_allotted_date, comments, callBack) {
      try {
        db.db().collection(dbb.COMPLAINTS).updateOne({ "_id": new ObjectID(complaint_id) }, {
          $set: {
            employee_id: new ObjectID(employee_id),
            complaint_allotted_date: new Date(complaint_allotted_date),
            comments: comments
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Complaints Alloted Successfully");
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Allot Complaint


    //Start of  Complaint Completed

    complaint_completed: function (complaint_id,
      complaint_service_type,
      complaint_fee,
      service_feedback,
      complaint_completed_date, callBack) {
      try {
        db.db().collection(dbb.COMPLAINTS).updateOne({ "_id": new ObjectID(complaint_id) }, {
          $set: {

            complaint_service_type: complaint_service_type,
            complaint_fee: parseInt(complaint_fee),
            service_feedback: service_feedback,
            complaint_completed_date: new Date(complaint_completed_date)
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Complaints Completed Successfully");
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Complaint Completed


    //Start of  Rate Complaints 

    rate_complaint_attended: function (ratings, complaint_id, resident_feedback, employee_id, callBack) {
      try {
        var rateVal = 0.0
        rateVal1 = parseFloat(ratings);
        rateVal12 = rateVal1.toFixed(2);
        db.db().collection(dbb.COMPLAINTS).updateOne({ "_id": new ObjectID(complaint_id) }, {
          $set: {
            ratings: parseFloat(rateVal12),
            resident_feedback: resident_feedback,
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(employee_id) }, {
              $inc: {
                total_rating_sum: parseFloat(rateVal12),
                total_rating_count: 1
              }
            }, { upsert: false }, function (err, result) {
              if (err) {
                callBack(null, true, err);
              } else {
                callBack(result, false, "Complaints Rating Made Successfully");
              }
            })
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Rate Complaints 

    //Start of View All Unresolved Complaints Details

    view_unresolved_complaints: function (starting_after, limit, building_id, callBack) {
      try {
        complaints = [];
        var totaldata;


        if (limit == '' && starting_after == '') {

          var cursor = db.db().collection(dbb.COMPLAINTS).find({ building_id: new ObjectID(building_id), complaint_completed_date: { $exists: false }, active: true });
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.COMPLAINTS).find({ building_id: new ObjectID(building_id), complaint_completed_date: { $exists: false }, active: true }).skip(starting_after).limit(limit);
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            complaints.push(doc);
          }
        }, function () {
          if (complaints.length == 0) {
            callBack(complaints, true, "No Unresolved Complaints Found", '');
          }
          else {
            db.db().collection(dbb.COMPLAINTS).countDocuments({ building_id: new ObjectID(building_id), complaint_completed_date: { $exists: false }, active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(complaints, false, "Unresolved Complaints Found", totaldata);
            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Unresolved Complaints Details


    //Start of View All Unalloted Complaints Details

    view_unallotted_complaints: function (starting_after, limit, building_id, callBack) {
      try {
        complaints = [];
        var totaldata;
        var cursor;


        if (limit == '' && starting_after == '') {
          cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { building_id: new ObjectID(building_id), complaint_allotted_date: { $exists: false }, active: true } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ])
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { building_id: new ObjectID(building_id), complaint_allotted_date: { $exists: false }, active: true } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
          ]).skip(starting_after).limit(limit);
        }
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            var unitNo = "";
            var raisedBy = "";
            var residentContactInfo = "";

            if (doc.unit_details != undefined && doc.unit_details.length > 0) {
              unitNo = doc.unit_details[0].unit_name;
            }
            if (doc.resident_details != undefined && doc.resident_details.length > 0) {
              raisedBy = doc.resident_details[0].resident_name;
              residentContactInfo = doc.resident_details[0].resident_contact_info;
            }

            var data = {
              _id: doc._id,
              complaint_title: doc.complaint_title,
              complaint_desc: doc.complaint_desc,
              complaint_raised_imgs: doc.complaint_raised_imgs,
              is_urgent: doc.is_urgent,
              complaint_allotted_date: doc.complaint_allotted_date,
              unit_no: unitNo,
              raised_by: raisedBy,
              resident_contact_info: residentContactInfo,
              complaint_raised_date: doc.complaint_raised_date,
            }
            complaints.push(data);
          }
        }, function () {
          if (complaints.length == 0) {
            callBack(null, true, "No Unalloted Complaints Found", '');
          }
          else {
            db.db().collection(dbb.COMPLAINTS).countDocuments({ building_id: new ObjectID(building_id), complaint_allotted_date: { $exists: false }, active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(complaints, false, "Unalloted Complaints Found", totaldata);
            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Unalloted Complaints Details


    //Start of view all allotted complaints

    view_allotted_complaints: function (building_id, starting_after, limit, callBack) {
      try {
        var totaldata;
        var cursor;
        var complaints = [];

        var isLimitAvailable = limit != '' && limit != undefined;
        var isStartingAfterAvailable = starting_after != '' && starting_after != undefined

        if (!isLimitAvailable && !isStartingAfterAvailable) {
          cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { building_id: new ObjectID(building_id), complaint_allotted_date: { $exists: true }, complaint_completed_date: { $exists: false }, active: true } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ])
        } else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
            { $match: { building_id: new ObjectID(building_id), complaint_allotted_date: { $exists: true }, complaint_completed_date: { $exists: false }, active: true } },
            { $lookup: { from: dbb.EMPLOYEE, localField: "employee_id", foreignField: "_id", as: "employee_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          ]).skip(starting_after).limit(limit);
        }


        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err, '');
          } else {
            var employeename = "";
            var employeecontactInfo = "";
            var unitName = "";
            var residentName = "";
            var residentContactInfo = "";

            if (doc.employee_details.length != 0) {
              employeename = doc.employee_details[0].employee_name;
              employeecontactInfo = doc.employee_details[0].employee_contact_info;
            }

            if (doc.unit_details.length != 0) {
              unitName = doc.unit_details[0].unit_name;
            }

            if (doc.resident_details.length != 0) {
              residentName = doc.resident_details[0].resident_name;
              residentContactInfo = doc.resident_details[0].resident_contact_info;
            }

            var data = {
              _id: doc._id,
              complaint_title: doc.complaint_title,
              complaint_desc: doc.complaint_desc,
              complaint_raised_imgs: doc.complaint_raised_imgs,
              is_urgent: doc.is_urgent,
              complaint_raised_date: doc.complaint_raised_date,
              complaint_allotted_date: doc.complaint_allotted_date,
              unit_no: unitName,
              raised_by: residentName,
              resident_contact_info: residentContactInfo,
              employee_name: employeename,
              employee_contact_info: employeecontactInfo,
              comments: doc.comments
            }
            complaints.push(data);
          }
        }, function () {
          if (complaints.length == 0) {
            callBack(null, true, "No Complaints Allotted", totaldata);
          } else {
            db.db().collection(dbb.COMPLAINTS).countDocuments({ building_id: new ObjectID(building_id), complaint_allotted_date: { $exists: true }, complaint_completed_date: { $exists: false }, active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(complaints, false, "Allotted Complaints Found", totaldata);
            })
          }
        })

      } catch (ex) {
        callBack(null, true, ex, '');
      }
    },
    //End of view all allotted complaints

    //Start of sending notification to Users
    send_complaint_notification: function (complaint_id, title, message, callBack) {
      try {
        var fcmTokens = [];
        var cursor = db.db().collection(dbb.COMPLAINTS).aggregate([
          { $match: { _id: new ObjectID(complaint_id) } },
          { $lookup: { from: dbb.RESIDENT, localField: "unit_id", foreignField: "unit_id", as: "resident_details" } },
          { $lookup: { from: dbb.USER, localField: "resident_details._id", foreignField: "user_id", as: "user_details" } }
        ]);


        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            if (doc.user_details.length > 0) {
              for (i = 0; i < doc.user_details.length; i++) {
                if (doc.user_details[i].fcm_token != null && doc.user_details[i].fcm_token != undefined) {
                  fcmTokens.push(doc.user_details[i].fcm_token);
                }
              }
            }
          }
        }, function () {
          if (fcmTokens.length == 0) {
            callBack(null, true, "No Users Found");
          } else {
            const firebase = require("firebase-admin");
            const serviceAccount = firebase_key;
            const firebaseToken = fcmTokens;

            if (!firebase.apps.length) {

              firebase.initializeApp({
                credential: firebase.credential.cert(serviceAccount),
                databaseURL: "https://apartment-erp.firebaseio.com"
              });
            }

            const payload = {
              notification: {
                title: title,
                body: message,
                type: 'complaint',
                type_id: complaint_id,
              },
              data: {
                title: title,
                body: message,
                type: 'complaint',
                type_id: complaint_id,
              }

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
                callBack(true, error, false)
              });
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of sending notification to users


    //Sample Push API
    send_sample_notification: function (user_id, callBack) {
      try {
        db.db().collection(dbb.USER).findOne({ "user_id": new ObjectID(user_id) }, function (err, doc) {
          if (err) {
            callBack(true, err);
          } else {
            var complaintID = "5e70ee1f53bb270004206cc3";
            var fcmToken = [];
            fcmToken.push(doc.fcm_token);

            var title = "Complaint Completed";
            var message = {
              complaint_id: complaintID,
              message: "Your complaint has been completed succesfully. Please rate the service attended."
            }

            var disp = JSON.stringify(message);
            console.log(disp);

            const firebase = require("firebase-admin");
            const serviceAccount = firebase_key;
            const firebaseToken = fcmToken;

            if (!firebase.apps.length) {

              firebase.initializeApp({
                credential: firebase.credential.cert(serviceAccount),
                databaseURL: "https://apartment-erp.firebaseio.com"
              });
            }

            const payload = {
              notification: {
                title: title,
                body: "Your complaint has been completed succesfully. Please rate the service attended.",
                type: 'complaint',
                type_id: complaintID,
                sound: "default",
              },
              data: {
                title: title,
                body: disp,
                type: 'complaint',
                sound: "default",
              }

            };

            const options = {
              priority: 'high',
              timeToLive: 60 * 60 * 24, // 1 day
            };

            firebase.messaging().sendToDevice(firebaseToken, payload, options)
              .then(function (response) {
                callBack(false, "Notification Successfully sent")
              })
              .catch(function (error) {
                callBack(true, error)
              });
          }
        })
      } catch (er) {
        callBack(true, er);
      }
    },
    //End of Sample Push API


  }
  return complaints_module;
}