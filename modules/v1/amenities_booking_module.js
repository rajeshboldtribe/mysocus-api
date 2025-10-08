module.exports = function (mongo, ObjectID, url, assert, dbb, db, firebase_key) {
  var amenities_module = {

    //Start of Add Booking
    book_amenity: function (new_booking, callBack) {
      try {

        db.db().collection(dbb.AMENITIESBOOKING).insertOne(new_booking, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "Booking Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add Booking


    //Start of Update Amenities Booking

    update_booking: function (
      building_id,
      booking_id,
      amenity_id,
      resident_id,
      booking_date,
      guest_info,
      starting_time,
      ending_time,
      charges,
      modified_by,
      callBack) {
      try {

        db.db().collection(dbb.AMENITIESBOOKING).updateOne({ "_id": new ObjectID(booking_id) }, {
          $set: {

            building_id: new ObjectID(building_id),
            amenity_id: new ObjectID(amenity_id),
            resident_id: new ObjectID(resident_id),
            booking_date: new Date(booking_date),
            guest_info: JSON.parse(guest_info),
            starting_time: starting_time,
            ending_time: ending_time,
            approved: false,
            modified_by: new ObjectID(modified_by),
            modified_on: new Date(),
            charges: parseInt(charges)
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Amenities Booking Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update Amenities Booking



    //Start of View All Amenities Bookings

    view_all_bookings: function (start_date, end_date, building_id, starting_after, limit, callBack) {
      try {

        amenities_booking = [];
        var totaldata;
        var bookings = [];

        if ((start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00' || start_date == undefined || end_date == undefined) && ((starting_after == '' || starting_after == undefined) && (limit == '' || limit == undefined))) {

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              {
                $match: { building_id: new ObjectID(building_id), active: true }
              },
              {
                $lookup: {
                  from: dbb.AMENITIES,
                  localField: "amenity_id",
                  foreignField: "_id",
                  as: "amenity_details"
                },

              },
              {
                $unwind: "$amenity_details"
              },
              {
                $lookup: {
                  from: dbb.RESIDENT,
                  localField: "resident_id",
                  foreignField: "_id",
                  as: "resident_details"
                }
              },
              {
                $unwind: "$resident_details"
              },
            ])
        }

        else if ((start_date !== '' || end_date !== '' || start_date !== '0000-00-00' || end_date !== '0000-00-00') && ((starting_after == '' || starting_after == undefined) && (limit == '' || limit == undefined))) {

          var edate = new Date(end_date);
          var sdate = new Date(start_date);
          sdate.setDate(sdate.getDate() - 1);

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              {

                $match: { building_id: new ObjectID(building_id), booking_date: { $gt: sdate, $lt: edate }, active: true }
              },
              {
                $lookup: {
                  from: dbb.AMENITIES,
                  localField: "amenity_id",
                  foreignField: "_id",
                  as: "amenity_details"
                },

              },
              {
                $unwind: "$amenity_details"
              },
              {
                $lookup: {
                  from: dbb.RESIDENT,
                  localField: "resident_id",
                  foreignField: "_id",
                  as: "resident_details"
                }
              },
              {
                $unwind: "$resident_details"
              },
            ])
        }
        else if ((start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00') && ((starting_after !== '' || starting_after !== undefined) && (limit !== '' || limit !== undefined))) {

          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              {

                $match: { building_id: new ObjectID(building_id), active: true }
              },
              {
                $lookup: {
                  from: dbb.AMENITIES,
                  localField: "amenity_id",
                  foreignField: "_id",
                  as: "amenity_details"
                },

              },
              {
                $unwind: "$amenity_details"
              },
              {
                $lookup: {
                  from: dbb.RESIDENT,
                  localField: "resident_id",
                  foreignField: "_id",
                  as: "resident_details"
                }
              },
              {
                $unwind: "$resident_details"
              },
            ]).skip(starting_after).limit(limit);
        }

        else {

          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          var edate = new Date(end_date);
          var sdate = new Date(start_date);
          sdate.setDate(sdate.getDate() - 1);

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              {

                $match: { building_id: new ObjectID(building_id), booking_date: { $gt: sdate, $lt: edate }, active: true }
              },
              {
                $lookup: {
                  from: dbb.AMENITIES,
                  localField: "amenity_id",
                  foreignField: "_id",
                  as: "amenity_details"
                },

              },
              {
                $unwind: "$amenity_details"
              },
              {
                $lookup: {
                  from: dbb.RESIDENT,
                  localField: "resident_id",
                  foreignField: "_id",
                  as: "resident_details"
                }
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
            var doc3 = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_name: doc.resident_details.resident_name,
              amenity_id: doc.amenity_id,
              amenity_name: doc.amenity_details.amenity_name,
              booking_date: doc.booking_date,
              guest_info: doc.guest_info,
              cancelling_reason: doc.cancelling_reason,
              status: doc.status,
              starting_time: doc.starting_time,
              ending_time: doc.ending_time,
              unit_id: doc.resident_details.unit_id,
              approved: doc.approved

            }
            amenities_booking.push(doc3);
          }
        }, function () {
          if (amenities_booking.length == 0) {
            callBack(amenities_booking, true, "No Amenities Booking Found", '');
          }
          else {
            var index = 0;
            var getUnitDetailsOfBooking = function (doc) {

              var unitId = doc.unit_id;
              var unitCursor = db.db().collection(dbb.UNIT).find({ "_id": unitId });

              unitCursor.forEach(function (doc99, err99) {
                if (err99) {
                  callBack(amenities_booking, true, "No Unapproved Amenities Booking Found", '');
                } else {
                  var data = {
                    _id: doc._id,
                    building_id: doc.building_id,
                    resident_id: doc.resident_id,
                    resident_name: doc.resident_name,
                    amenity_id: doc.amenity_id,
                    amenity_name: doc.amenity_name,
                    booking_date: doc.booking_date,
                    guest_info: doc.guest_info,
                    cancelling_reason: doc.cancelling_reason,
                    status: doc.status,
                    approved: doc.approved,
                    comments: doc.comments,
                    starting_time: doc.starting_time,
                    ending_time: doc.ending_time,
                    unit_no: doc99.unit_name
                  }
                  bookings.push(data);
                }
              }, function () {
                if (index < amenities_booking.length) {
                  getUnitDetailsOfBooking(amenities_booking[index]);
                  index++;
                } else {

                  if ((start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00' || start_date == undefined || end_date == undefined)) {
                    db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
                      if (!countErr) {
                        totaldata = count;
                      }

                      callBack(bookings, false, "Unapproved Amenities Booking Found", totaldata);

                    });
                  } else {
                    var edate = new Date(end_date);
                    var sdate = new Date(start_date);
                    sdate.setDate(sdate.getDate() - 1);

                    db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), booking_date: { $gt: sdate, $lt: edate }, active: true }, function (countErr, count) {
                      if (!countErr) {
                        totaldata = count;
                      }

                      callBack(bookings, false, "Unapproved Amenities Booking Found", totaldata);

                    });
                  }
                }
              })
            }
            getUnitDetailsOfBooking(amenities_booking[index]);
            index++;
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Amenities Booking


    //Start of View All Unapproved Amenities Bookings

    view_unapproved_bookings: function (building_id, starting_after, limit, callBack) {
      try {

        amenities_booking = [];
        var totaldata;
        var bookings = [];


        if ((starting_after == undefined) && (limit == undefined)) {

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).aggregate([
            { $match: { building_id: new ObjectID(building_id), approved: false, status: false } },
            { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" } },
            { $unwind: "$amenity_details" },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $unwind: "$resident_details" },
          ]).sort({ _id: -1 });
        } else {
          starting_after = parseInt(starting_after);
          limit = parseInt(limit);

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).aggregate([
            { $match: { building_id: new ObjectID(building_id), approved: false, status: false } },
            { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" } },
            { $unwind: "$amenity_details" },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $unwind: "$resident_details" },
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit);

        }
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {

            var doc3 = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_name: doc.resident_details.resident_name,
              unit_id: doc.resident_details.unit_id,
              amenity_id: doc.amenity_id,
              amenity_name: doc.amenity_details.amenity_name,
              booking_date: doc.booking_date,
              guest_info: doc.guest_info,
              cancelling_reason: doc.cancelling_reason,
              status: doc.status,
              approved: doc.approved,
              comments: doc.comments,
              starting_time: doc.starting_time,
              ending_time: doc.ending_time
            }
            amenities_booking.push(doc3);
          }
        }, function () {
          if (amenities_booking.length == 0) {
            callBack(amenities_booking, false, "No Unapproved Amenities Booking Found", 0);
          } else {
            var index = 0;
            var getUnitDetailsOfBooking = function (doc) {

              var unitId = doc.unit_id;
              var unitCursor = db.db().collection(dbb.UNIT).find({ "_id": unitId });

              unitCursor.forEach(function (doc99, err99) {
                if (err99) {
                  callBack(doc, false, "No Unapproved Amenities Booking Found", 0);
                } else {

                  var data = {
                    _id: doc._id,
                    building_id: doc.building_id,
                    resident_id: doc.resident_id,
                    resident_name: doc.resident_name,
                    amenity_id: doc.amenity_id,
                    amenity_name: doc.amenity_name,
                    booking_date: doc.booking_date,
                    guest_info: doc.guest_info,
                    cancelling_reason: doc.cancelling_reason,
                    status: doc.status,
                    approved: doc.approved,
                    comments: doc.comments,
                    starting_time: doc.starting_time,
                    ending_time: doc.ending_time,
                    unit_no: doc99.unit_name
                  }
                  bookings.push(data);
                }
              }, function () {
                if (index < amenities_booking.length) {
                  getUnitDetailsOfBooking(amenities_booking[index]);
                  index++;
                } else {
                  db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), approved: false, status: false }, function (countErr, count) {
                    if (!countErr) {
                      totaldata = count;
                    }

                    callBack(bookings, false, "Unapproved Amenities Booking Found", totaldata);
                  })
                }
              })

            }
            getUnitDetailsOfBooking(amenities_booking[index]);
            index++;
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Unapproved Amenities Booking



    //Start of  view_bookings_amenities

    view_bookings_amenities: function (starting_after, limit, start_date, end_date, amenity_id, building_id, callBack) {
      try {
        amenities_booking = [];

        starting_after = parseInt(starting_after);
        limit = parseInt(limit);

        if ((start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00') && ((starting_after == '' || starting_after == undefined) && (limit == '' || limit == undefined))) {
          var cursor = db.db().collection(dbb.AMENITIESBOOKING).aggregate([
            { $match: { building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id) } },
            { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" }, },
            { $unwind: "$amenity_details" },
            { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
            { $unwind: "$resident_details" },
          ])


        }
        else if ((starting_after == '' || starting_after == undefined) && (limit == '' || limit == undefined)) {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);
          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              { $match: { building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id), booking_date: { $gte: sdate, $lte: edate } } },
              { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" }, },
              { $unwind: "$amenity_details" },
              { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
              { $lookup: { from: dbb.UNIT, localField: "resident_details.unit_id", foreignField: "_id", as: "unit_details" } },
              { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } }
            ])
        }
        else if ((start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00')) {
          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              { $match: { building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id) } },
              { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" }, },
              { $unwind: "$amenity_details" },
              { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
              { $lookup: { from: dbb.UNIT, localField: "resident_details.unit_id", foreignField: "_id", as: "unit_details" } },
              { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } }
            ]).skip(starting_after).limit(limit);

        }
        else {
          var sdate = new Date(start_date);
          var edate = new Date(end_date);
          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              { $match: { building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id), booking_date: { $gte: sdate, $lte: edate } } },
              { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" }, },
              { $unwind: "$amenity_details" },
              { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
              { $lookup: { from: dbb.UNIT, localField: "resident_details.unit_id", foreignField: "_id", as: "unit_details" } },
              { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } }
            ]).skip(starting_after).limit(limit);

        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }

          else {
            var residentName = "";
            var unitNo = "";

            if (doc.resident_details != undefined && doc.resident_details.length > 0) {
              residentName = doc.resident_details[0].resident_name;
            }

            if (doc.unit_details != undefined && doc.unit_details.length > 0) {
              if (doc.unit_parent_details != undefined && doc.unit_parent_details.length > 0) {
                unitNo = doc.unit_parent_details[0].unit_name + " - " + doc.unit_details[0].unit_name;
              } else {
                unitNo = doc.unit_details[0].unit_name;
              }
            }

            var doc3 = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_name: residentName,
              amenity_id: doc.amenity_id,
              amenity_name: doc.amenity_details.amenity_name,
              booking_date: doc.booking_date,
              guest_info: doc.guest_info,
              cancelling_reason: doc.cancelling_reason,
              status: doc.status,
              approved: doc.approved,
              starting_time: doc.starting_time,
              ending_time: doc.ending_time,
              unit_no: unitNo
            }
            amenities_booking.push(doc3);
          }
        }, function () {
          if (amenities_booking.length == 0) {
            callBack(null, true, "No Amenities Booking Found", 0);
          }
          else {
            db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id) }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(amenities_booking, false, "Amenities Booking Found", totaldata);
            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of  view_bookings_amenities

    //Start Of View User Amenity Bookings

    view_user_amenity_bookings: function (start_date, end_date, resident_id, building_id, callBack) {
      try {
        amenities_booking = [];

        if (start_date == undefined || end_date == undefined || start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00') {

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              { $match: { building_id: new ObjectID(building_id), resident_id: new ObjectID(resident_id) } },
              { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" } },
              { $unwind: "$amenity_details" },
              { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
              { $unwind: "$resident_details" },
            ])

        }
        else {

          var edate = new Date(end_date);
          var sdate = new Date(start_date);
          sdate.setDate(sdate.getDate() - 1);

          var cursor = db.db().collection(dbb.AMENITIESBOOKING).
            aggregate([
              { $match: { building_id: new ObjectID(building_id), resident_id: new ObjectID(resident_id), booking_date: { $gte: sdate, $lte: edate } } },
              { $lookup: { from: dbb.AMENITIES, localField: "amenity_id", foreignField: "_id", as: "amenity_details" } },
              { $unwind: "$amenity_details" },
              { $lookup: { from: dbb.RESIDENT, localField: "resident_id", foreignField: "_id", as: "resident_details" } },
              { $unwind: "$resident_details" },
            ])


        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var doc3 = {
              _id: doc._id,
              building_id: doc.building_id,
              resident_id: doc.resident_id,
              resident_name: doc.resident_details.resident_name,
              amenity_id: doc.amenity_id,
              amenity_name: doc.amenity_details.amenity_name,
              booking_date: new Date(doc.booking_date),
              guest_info: doc.guest_info,
              cancelling_reason: doc.cancelling_reason,
              status: doc.status,
              starting_time: doc.starting_time,
              ending_time: doc.ending_time,
              approved: doc.approved
            }
            amenities_booking.push(doc3);
          }
        }, function () {
          if (amenities_booking.length == 0) {
            callBack(null, true, "No Amenities Booking Found");
          } else {
            callBack(amenities_booking, false, "Amenities Booking Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End Of View User Amenity Bookings



    //Start of Cancel Amenities Booking

    cancel_booking: function (building_id, booking_id, cancelling_reason, modified_by, callBack) {
      try {

        db.db().collection(dbb.AMENITIESBOOKING).updateOne({ "_id": new ObjectID(booking_id), "building_id": new ObjectID(building_id) }, {
          $set: {
            approved: false,
            cancelling_reason: cancelling_reason,
            status: true,
            cancelled_by: new ObjectID(modified_by),
            cancelled_on: new Date(),
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {

            callBack(null, true, err);
          } else {

            callBack(result, false, "Amenities Booking Details Cancelled Successfully");
          }

        });
      } catch (e) {

        callBack(null, true, e);
      }
    },

    //End of Cancel Amenities Booking


    //Start of Approve Amenities Booking

    approve_booking: function (building_id, booking_id, modified_by, callBack) {
      try {
        db.db().collection(dbb.AMENITIESBOOKING).updateOne({ "_id": new ObjectID(booking_id), "building_id": new ObjectID(building_id) }, {
          $set: {
            approved: true,
            status: true,
            approved_by: new ObjectID(modified_by),
            approved_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Amenities status changed successfully Successfully");
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Approve Amenities Booking

    //Start of Push notification

    amenity_booking_pushnotification: function (notification_title, notification_body, amenity_booking_id, callBack) {
      try {
        var resident_id;
        var residentCursor = db.db().collection(dbb.AMENITIESBOOKING).find({ _id: new ObjectID(amenity_booking_id) })
        residentCursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            resident_id = doc.resident_id
          }
        }, function () {
          if (resident_id == '') {
            callBack(false, "Amenity Booking Updated Successfully,But No Active Resident Found", false);
          }
          else {
            var fcm_tokens = [];
            var cursor = db.db().collection(dbb.USER).find({ active: true, user_id: new ObjectID(resident_id) });
            cursor.forEach(function (doc, err) {
              if (err) {
                callBack(true, 'Error Occured');
              }
              else {
                if (doc.fcm_token != null && doc.fcm_token != '' && doc.fcm_token != undefined) {
                  fcm_tokens.push(doc.fcm_token);
                }
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
                      type: 'amenity',
                      sound: "default",
                    },
                    data: {
                      title: notification_title,
                      body: notification_body,
                      type: 'amenity',
                      sound: "default",
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
                      callBack(true, "Something has gone wrong!", false)
                    });
                }
                else {
                  callBack(false, "Amenity Booking Updated Successfully,But No FCM Token Found", false);
                }
              }
            });
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //Enf Of Push Notification


    //////////////////////////////////////////////////////////////////////////////////
    //Start of View All Amenities Bookings

    //  view_all_bookings: function (start_date, end_date, building_id, starting_after, limit, callBack) {
    //     try {

    //         amenities_booking = [];
    //         var totaldata;
    //         var bookings = [];
    //         var conditions = [];


    //         if (start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00' || start_date == undefined || end_date == undefined) {
    //             conditions = [
    //                 {

    //                     $match: { building_id: new ObjectID(building_id), active: true }
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.AMENITIES,
    //                         localField: "amenity_id",
    //                         foreignField: "_id",
    //                         as: "amenity_details"
    //                     },

    //                 },
    //                 {
    //                     $unwind: "$amenity_details"
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.RESIDENT,
    //                         localField: "resident_id",
    //                         foreignField: "_id",
    //                         as: "resident_details"
    //                     }
    //                 },
    //                 {
    //                     $unwind: "$resident_details"
    //                 },
    //             ]
    //         }
    //         else {
    //             var edate = new Date(end_date);
    //             var sdate = new Date(start_date);
    //             sdate.setDate(sdate.getDate() - 1);
    //             conditions = [
    //                 {

    //                     $match: { building_id: new ObjectID(building_id), booking_date: { $gt: sdate, $lt: edate }, active: true }
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.AMENITIES,
    //                         localField: "amenity_id",
    //                         foreignField: "_id",
    //                         as: "amenity_details"
    //                     },

    //                 },
    //                 {
    //                     $unwind: "$amenity_details"
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.RESIDENT,
    //                         localField: "resident_id",
    //                         foreignField: "_id",
    //                         as: "resident_details"
    //                     }
    //                 },
    //                 {
    //                     $unwind: "$resident_details"
    //                 },
    //             ]

    //         }


    //         if (starting_after == undefined || limit == undefined) {

    //             var cursor = db.db().collection(dbb.AMENITIESBOOKING).
    //                 aggregate(conditions)
    //         }

    //         else {
    //             var limit = parseInt(limit);
    //             var starting_after = parseInt(starting_after);
    //             var cursor = db.db().collection(dbb.AMENITIESBOOKING).
    //                 aggregate(conditions).skip(starting_after).limit(limit);
    //         }

    //         cursor.forEach(function (doc, err) {
    //             if (err) {
    //                 callBack(null, true, err);
    //             }

    //             else {
    //                 var doc3 = {
    //                     _id: doc._id,
    //                     building_id: doc.building_id,
    //                     resident_id: doc.resident_id,
    //                     resident_name: doc.resident_details.resident_name,
    //                     amenity_id: doc.amenity_id,
    //                     amenity_name: doc.amenity_details.amenity_name,
    //                     booking_date: doc.booking_date,
    //                     guest_info: doc.guest_info,
    //                     cancelling_reason: doc.cancelling_reason,
    //                     status: doc.status,
    //                     starting_time: doc.starting_time,
    //                     ending_time: doc.ending_time,
    //                     unit_id: doc.resident_details.unit_id,
    //                     approved: doc.approved

    //                 }
    //                 amenities_booking.push(doc3);
    //             }
    //         }, function () {
    //             if (amenities_booking.length == 0) {
    //                 callBack(amenities_booking, true, "No Amenities Booking Found", '');
    //             }
    //             else {
    //                 var index = 0;
    //                 var getUnitDetailsOfBooking = function (doc) {

    //                     var unitId = doc.unit_id;
    //                     var unitCursor = db.db().collection(dbb.UNIT).find({ "_id": unitId });

    //                     unitCursor.forEach(function (doc99, err99) {
    //                         if (err99) {
    //                             callBack(amenities_booking, true, "No Unapproved Amenities Booking Found", '');
    //                         } else {
    //                             var data = {
    //                                 _id: doc._id,
    //                                 building_id: doc.building_id,
    //                                 resident_id: doc.resident_id,
    //                                 resident_name: doc.resident_name,
    //                                 amenity_id: doc.amenity_id,
    //                                 amenity_name: doc.amenity_name,
    //                                 booking_date: doc.booking_date,
    //                                 guest_info: doc.guest_info,
    //                                 cancelling_reason: doc.cancelling_reason,
    //                                 status: doc.status,
    //                                 approved: doc.approved,
    //                                 comments: doc.comments,
    //                                 starting_time: doc.starting_time,
    //                                 ending_time: doc.ending_time,
    //                                 unit_no: doc99.unit_name
    //                             }
    //                             bookings.push(data);
    //                         }
    //                     }, function () {
    //                         if (index < amenities_booking.length) {
    //                             getUnitDetailsOfBooking(amenities_booking[index]);
    //                             index++;
    //                         } else {

    //                             if ((start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00' || start_date == undefined || end_date == undefined)) {
    //                                 db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
    //                                     if (!countErr) {
    //                                         totaldata = count;
    //                                     }

    //                                     callBack(bookings, false, "Unapproved Amenities Booking Found", totaldata);

    //                                 });
    //                             } else {
    //                                 var edate = new Date(end_date);
    //                                 var sdate = new Date(start_date);
    //                                 sdate.setDate(sdate.getDate() - 1);

    //                                 db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), booking_date: { $gt: sdate, $lt: edate }, active: true }, function (countErr, count) {
    //                                     if (!countErr) {
    //                                         totaldata = count;
    //                                     }

    //                                     callBack(bookings, false, "Unapproved Amenities Booking Found", totaldata);

    //                                 });
    //                             }
    //                         }
    //                     })
    //                 }
    //                 getUnitDetailsOfBooking(amenities_booking[index]);
    //                 index++;
    //             }
    //         })
    //     } catch (e) {
    //         callBack(null, true, e);
    //     }
    // },
    // //End of View All Amenities Booking



    //Start of  view_bookings_amenities

    //   view_bookings_amenities: function (starting_after, limit, start_date, end_date, amenity_id, building_id, callBack) {
    //     try {
    //         amenities_booking = [];
    //         conditions = []


    //         if (start_date == '' || end_date == '' || start_date == '0000-00-00' || end_date == '0000-00-00') {
    //             conditions = [
    //                 {

    //                     $match: { building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id) }
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.AMENITIES,
    //                         localField: "amenity_id",
    //                         foreignField: "_id",
    //                         as: "amenity_details"
    //                     },

    //                 },
    //                 {
    //                     $unwind: "$amenity_details"
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.RESIDENT,
    //                         localField: "resident_id",
    //                         foreignField: "_id",
    //                         as: "resident_details"
    //                     }
    //                 },
    //                 {
    //                     $unwind: "$resident_details"
    //                 },
    //             ]
    //         }
    //         else {
    //             var edate = new Date(end_date);
    //             var sdate = new Date(start_date);
    //             sdate.setDate(sdate.getDate() - 1);

    //             conditions = [
    //                 {
    //                     $match: { building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id), booking_date: { $gte: sdate, $lte: edate } }
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.AMENITIES,
    //                         localField: "amenity_id",
    //                         foreignField: "_id",
    //                         as: "amenity_details"
    //                     },
    //                 },
    //                 {
    //                     $unwind: "$amenity_details"
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: dbb.RESIDENT,
    //                         localField: "resident_id",
    //                         foreignField: "_id",
    //                         as: "resident_details"
    //                     }
    //                 },
    //                 {
    //                     $unwind: "$resident_details"
    //                 },
    //             ]
    //         }


    //         if (starting_after == undefined || limit == undefined) {
    //             var cursor = db.db().collection(dbb.AMENITIESBOOKING).
    //                 aggregate(conditions)
    //         }
    //         else {
    //             starting_after = parseInt(starting_after);
    //             limit = parseInt(limit);

    //             var cursor = db.db().collection(dbb.AMENITIESBOOKING).
    //                 aggregate(conditions).skip(starting_after).limit(limit);

    //         }

    //         cursor.forEach(function (doc, err) {
    //             if (err) {
    //                 callBack(null, true, err);
    //             }

    //             else {
    //                 var doc3 = {
    //                     _id: doc._id,
    //                     building_id: doc.building_id,
    //                     resident_id: doc.resident_id,
    //                     resident_name: doc.resident_details.resident_name,
    //                     amenity_id: doc.amenity_id,
    //                     amenity_name: doc.amenity_details.amenity_name,
    //                     booking_date: doc.booking_date,
    //                     guest_info: doc.guest_info,
    //                     cancelling_reason: doc.cancelling_reason,
    //                     status: doc.status,
    //                     approved: doc.approved
    //                 }
    //                 amenities_booking.push(doc3);
    //             }
    //         }, function () {
    //             if (amenities_booking.length == 0) {
    //                 callBack(null, true, "No Amenities Booking Found", totaldata.length);
    //             }
    //             else {

    //                 db.db().collection(dbb.AMENITIESBOOKING).countDocuments({ building_id: new ObjectID(building_id), amenity_id: new ObjectID(amenity_id) }, function (countErr, count) {
    //                     if (!countErr) {
    //                         totaldata = count;
    //                     }

    //                     callBack(amenities_booking, false, "Amenities Booking Found", totaldata.length);
    //                 })
    //             }
    //         })

    //     } catch (e) {
    //         callBack(null, true, e);
    //     }
    // },
    //End of  view_bookings_amenities

  }
  return amenities_module;
}