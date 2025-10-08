
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var amenities_module = require('../../modules/v1/amenities_module')(mongo, ObjectID, url, assert, dbb, db);
    var amenities_booking_module = require('../../modules/v1/amenities_booking_module')(mongo, ObjectID, url, assert, dbb, db, firebase_key);
    var moment = require('moment-timezone');

    //API for Add Amenities Booking Details

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // amenity_id
    // resident_id
    // booking_date
    // starting_time
    // ending_time
    // guest_info[JSON Array], [  "A","B" ]

    //Functions: book_amenity
    //Response: status, message, result


    app.post('/v1/book_amenity', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("amenity_id")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("charges")
          && req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("booking_date")
          && req.body.hasOwnProperty("guest_info")
          && req.body.hasOwnProperty("starting_time")
          && req.body.hasOwnProperty("ending_time")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              var startTimeDate = new Date(req.body.starting_time);
              var endTimeDate = new Date(req.body.ending_time);
              var startingTime = moment(startTimeDate, 'YYYY-MM-DDThh:mm:ssz').tz('Asia/Kolkata').format('hh:mm A');
              var endingTime = moment(endTimeDate, 'YYYY-MM-DDThh:mm:ssz').tz('Asia/Kolkata').format('hh:mm A');
              var new_booking = {
                building_id: new ObjectID(req.body.building_id),
                unit_id: new ObjectID(req.body.unit_id),
                amenity_id: new ObjectID(req.body.amenity_id),
                resident_id: new ObjectID(req.body.resident_id),
                booking_date: new Date(req.body.booking_date),
                guest_info: JSON.parse(req.body.guest_info),
                starting_time: startingTime,
                ending_time: endingTime,
                approved: false,
                active: true,
                status: false,
                charges: parseInt(req.body.charges),
                invoiceAdded: false
              };
              amenities_booking_module.book_amenity(new_booking, function (result1, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result1.insertedId });
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("charges") == false) {
            res.json({ status: false, message: "charges parameter is missing" });
          } else if (req.body.hasOwnProperty("amenity_id") == false) {
            res.json({ status: false, message: "amenity_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else if (req.body.hasOwnProperty("booking_date") == false) {
            res.json({ status: false, message: "booking_date parameter is missing" });
          } else if (req.body.hasOwnProperty("guest_info") == false) {
            res.json({ status: false, message: "guest_info parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_time") == false) {
            res.json({ status: false, message: "starting_time parameter is missing" });
          } else if (req.body.hasOwnProperty("ending_time") == false) {
            res.json({ status: false, message: "ending_time parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Amenities Booking Details


    //API for Update Amenities Booking Details
    //Params: booking_id
    // amenity_id,
    // amenity_name,
    // amenity_desc,
    // amenity_imgs[JSON Array],
    // is_free(Boolean),
    // amenity_price_info(JSON Object),
    // guest_price_info(JSON Object),
    // available_timings(JSON Array),
    // no_of_slots,
    // starting_time,
    // ending_time,
    // user-token(header),

    //Functions: update_booking
    //Response: status, message, result
    app.post('/v1/update_booking', ensureAuthorized, function (req, res) {
      try {
        if (
          req.body.hasOwnProperty("booking_id")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("amenity_id")
          && req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("booking_date")
          && req.body.hasOwnProperty("guest_info")
          && req.body.hasOwnProperty("starting_time")
          && req.body.hasOwnProperty("ending_time")
          && req.body.hasOwnProperty("charges")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              var startTimeDate = new Date(req.body.starting_time);
              var endTimeDate = new Date(req.body.ending_time);
              var startingTime = moment(startTimeDate, 'YYYY-MM-DDThh:mm:ssz').tz('Asia/Kolkata').format('hh:mm A');
              var endingTime = moment(endTimeDate, 'YYYY-MM-DDThh:mm:ssz').tz('Asia/Kolkata').format('hh:mm A');

              amenities_booking_module.update_booking(
                req.body.building_id,
                req.body.booking_id,
                req.body.amenity_id,
                req.body.resident_id,
                req.body.booking_date,
                req.body.guest_info,
                startingTime,
                endingTime,
                req.body.charges,
                user_id,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message, result: req.body.unit_id });
                  }
                })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("booking_id") == false) {
            res.json({ status: false, message: "booking_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("amenity_id") == false) {
            res.json({ status: false, message: "amenity_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else if (req.body.hasOwnProperty("booking_date") == false) {
            res.json({ status: false, message: "booking_date parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_time") == false) {
            res.json({ status: false, message: "starting_time parameter is missing" });
          } else if (req.body.hasOwnProperty("ending_time") == false) {
            res.json({ status: false, message: "ending_time parameter is missing" });
          } else if (req.body.hasOwnProperty("guest_info") == false) {
            res.json({ status: false, message: "guest_info parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("charges") == false) {
            res.json({ status: false, message: "charges parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Update Amenities Booking Details

    //API for View All Amenities Booking Details

    //Params: user-token,building_id,start_date,end_date,limit,starting_after
    //Functions: view_all_bookings
    //Response: status, message, result
    app.post('/v1/view_all_bookings', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              amenities_booking_module.view_all_bookings(req.body.start_date, req.body.end_date, req.body.building_id, req.body.starting_after, req.body.limit, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Amenities Booking Details



    //API for View All Unpproved Amenities Booking Details

    //Params: user-token,building_id,limit,starting_after
    //Functions: view_unapproved_bookings
    //Response: status, message, result

    app.post('/v1/view_unapproved_bookings', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'SA' || result == 'E')) {
              amenities_booking_module.view_unapproved_bookings(req.body.building_id, req.body.starting_after, req.body.limit, function (result2, error, message, total) {
                if (error) {
                  res.json({ status: true, message: message, result: result2, total: total, totaldata: result2.length });
                }
                else {
                  res.json({ status: true, message: message, result: result2, total: total, totaldata: result2.length });
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          }
          else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }

        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Unpproved Amenities Booking Details



    //API for View Amenities All Booking Details

    //Params: user-token,building_id,start_date,end_date,amenity_id
    //Functions: view_bookings_amenities
    //Response: status, message, result

    app.post('/v1/view_bookings_amenities', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id") && req.body.hasOwnProperty("amenity_id")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == "E")) {
              amenities_booking_module.view_bookings_amenities(req.body.starting_after, req.body.limit, req.body.start_date, req.body.end_date, req.body.amenity_id, req.body.building_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else if (req.body.hasOwnProperty("amenity_id") == false) {
            res.json({ status: false, message: "amenity_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View Amenities All Booking Details



    //API for View single User All Amenities Booking Details

    //Params: user-token,building_id,start_date,end_date,resident_id
    //Functions: view_user_amenity_bookings
    //Response: status, message, result

    app.post('/v1/view_user_amenity_bookings', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id") && req.body.hasOwnProperty("resident_id")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'SR')) {
              amenities_booking_module.view_user_amenity_bookings(req.body.start_date, req.body.end_date, req.body.resident_id, req.body.building_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View single User All Amenities Booking Details



    //API for Cancel Single Amenities Booking Details

    //Params: user-token,building_id,booking_id,cancelling_reason
    //Functions: cancel_booking
    //Response: status, message, result
    app.post('/v1/cancel_booking', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("cancelling_reason") && req.body.hasOwnProperty("building_id") && req.body.hasOwnProperty("booking_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              amenities_booking_module.cancel_booking(req.body.building_id, req.body.booking_id, req.body.cancelling_reason, user_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  var data = {
                    cancelling_reason: req.body.cancelling_reason
                  };
                  var notice_title = "Amenitiy Booking Cancelled Successfully";
                  var notice_desc = "Your booking has been cancelled due to " + req.body.cancelling_reason;

                  amenities_booking_module.amenity_booking_pushnotification(notice_title, notice_desc, req.body.booking_id, function (error, message, notification_status) {
                    if (error) {
                      res.json({ status: false, message: message, notification_status: notification_status });
                    } else {
                      res.json({ status: true, message: message, notification_status: notification_status });
                    }
                  })
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else if (req.body.hasOwnProperty("booking_id") == false) {
            res.json({ status: false, message: "booking_id parameter missing" });
          } else if (req.body.hasOwnProperty("cancelling_reason") == false) {
            res.json({ status: false, message: "cancelling_reason parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Cancel Single Amenities Booking Details



    //API for Approve  Amenities Booking Details

    //Params: user-token,building_id,booking_id
    //Functions: approve_booking
    //Response: status, message, result

    app.post('/v1/approve_booking', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("booking_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              amenities_booking_module.approve_booking(req.body.building_id, req.body.booking_id, user_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  var notice_title = "Amenitiy Booking Approved Successfully";
                  var notice_desc = "Your ammenity booking has been approved by the admin. Have a great time";

                  amenities_booking_module.amenity_booking_pushnotification(notice_title, notice_desc, req.body.booking_id, function (error, message, notification_status) {
                    if (error) {
                      res.json({ status: false, message: message, notification_status: notification_status });
                    } else {
                      res.json({ status: true, message: message, notification_status: notification_status });
                    }
                  })

                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else if (req.body.hasOwnProperty("booking_id") == false) {
            res.json({ status: false, message: "booking_id parameter missing" });
          }
        }
      }
      catch (er) {

        res.json({ status: false, message: er });
      }
    });

    //End of Approve Amenities Booking Details

  }
}
