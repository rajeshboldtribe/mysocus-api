
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var visitors_module = require('../../modules/v1/visitors_module')(mongo, ObjectID, url, assert, dbb, db, firebase_key);
    var vendor_module = require('../../modules/v1/vendor_module')(mongo, ObjectID, url, assert, dbb, db);
    var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add Expected Visitors Details

    //headers : user-token (admin/super admin)

    // params :
    // building_id
    // resident_id
    // visitor_details[{visitor_name, visitor_mobilenumber, }]
    // visitor_vehicle_details [{vehicle_id(from vehicle master), vehicle_number}] (optional)
    // date_of_visit
    // hours_of_stay(optional)

    //Functions: add_expected_visitor
    //Response: status, message, result
    app.post('/v1/add_expected_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visitor_details")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("date_of_visit")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'E' || result == 'R' || result == 'SR')) {
              user = user_id
              if (!exists) {
                res.json({ status: true, message: message, active: false });
              } else {
                var number = Math.floor(100000 + Math.random() * 900000)
                var final_number = number.toString().substring(0, 4);
                var otp = parseInt(final_number);

                var new_visitors = {
                  building_id: new ObjectID(req.body.building_id),
                  unit_id: new ObjectID(req.body.unit_id),
                  visitor_details: JSON.parse(req.body.visitor_details),
                  visitor_vehicle_details: JSON.parse(req.body.visitor_vehicle_details),
                  date_of_visit: new Date(req.body.date_of_visit),
                  hours_of_stay: req.body.hours_of_stay,
                  visitor_otp: otp,
                  resident_id: user,
                  created_by: new ObjectID(user),
                  created_on: new Date(),
                  is_user_approved: false,
                  active: true,
                  purpose_of_visit: req.body.purpose_of_visit
                };
                visitors_module.add_expected_visitor(new_visitors, function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message, result: otp });
                  }
                })
              }
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visitor_details") == false) {
            res.json({ status: false, message: "visitor_details parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("date_of_visit") == false) {
            res.json({ status: false, message: "date_of_visit parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Expected Visitors Details

    //API for Create Visitors Entry Details

    //headers : user-token (admin/super admin)

    // params :
    // building_id
    // visitor_details {visitor_name, visitor_mobilenumber}
    // visitor_vehicle_details{vehicle_type_id, vehicle_number} (optional)
    // unit_id
    // date_of_visit

    //Functions: create_visitor_entry
    //Response: status, message, result

    app.post('/v1/create_visitor_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visitor_details")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("date_of_visit")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'SA' || result == 'E')) {
              user = user_id
              var new_visitors = {
                building_id: new ObjectID(req.body.building_id),
                unit_id: new ObjectID(req.body.unit_id),
                visitor_details: JSON.parse(req.body.visitor_details),
                visitor_vehicle_details: JSON.parse(req.body.visitor_vehicle_details),
                date_of_visit: new Date(req.body.date_of_visit),
                created_by: new ObjectID(user),
                created_on: new Date(),
                is_user_approved: false,
                purpose_of_visit: req.body.purpose_of_visit,
                active: true
              };
              visitors_module.create_visitor_entry(new_visitors, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  var visitorDetails = JSON.parse(req.body.visitor_details);
                  var visitorsName = [];
                  var index = 0;
                  var get_name = function (doc_data) {
                    visitorsName.push(doc_data.visitor_name)
                    index++;
                    if (index < visitorDetails.length) {
                      get_name(visitorDetails[index]);
                    } else {
                      var data = {
                        visit_id: result.insertedId,
                        unit_id: req.body.unit_id,
                        visitor_name: visitorsName,
                        purpose_of_visit: req.body.purpose_of_visit,
                      }
                      var notice_title = "Visitor Entry Access";
                      var notice_desc = data.visitor_name[0] + "[" + data.purpose_of_visit + "], is at the gate";
                      visitors_module.visitor_pushnotification(notice_title, notice_desc, req.body.unit_id, "visitor_arrive", data.visit_id.toString(), function (error, message, notification_status) {
                        if (error) {
                          res.json({ status: false, message: message, notification_status: notification_status, result: result.insertedId });
                        } else {
                          visitors_module.visitor_pushnotification_ios(notice_title, notice_desc, req.body.unit_id, "visitor_arrive", data.visit_id.toString(), function (errorios, message_ios, notification_status_ios) {
                            if (errorios) {
                              res.json({ status: false, message: message_ios, notification_status: notification_status_ios, result: result.insertedId });
                            } else {
                              res.json({ status: true, message: message, notification_status: notification_status_ios, result: result.insertedId });
                            }
                          })
                        }
                      })
                    }
                  }
                  if (visitorDetails.length !== 0) {
                    get_name(visitorDetails[index]);
                  }
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visitor_details") == false) {
            res.json({ status: false, message: "visitor_details parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("date_of_visit") == false) {
            res.json({ status: false, message: "date_of_visit parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Create Visitors Entry Details

    //Start of Approve Previous Visitor
    app.post('/v1/allow_previous_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visitor_details")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("date_of_visit")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'SA' || result == 'E')) {
              user = user_id
              var new_visitors = {
                building_id: new ObjectID(req.body.building_id),
                unit_id: new ObjectID(req.body.unit_id),
                visitor_details: JSON.parse(req.body.visitor_details),
                visitor_vehicle_details: JSON.parse(req.body.visitor_vehicle_details),
                date_of_visit: new Date(req.body.date_of_visit),
                created_by: new ObjectID(user),
                created_on: new Date(),
                is_user_approved: true,
                active: true
              };

              visitors_module.create_visitor_entry(new_visitors, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visitor_details") == false) {
            res.json({ status: false, message: "visitor_details parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("date_of_visit") == false) {
            res.json({ status: false, message: "date_of_visit parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e })
      }
    })
    //End of Approve Previous Visitor

    //API for Update Expected Visitors Details

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // unit_id
    // visit_id
    // visitor_details[{visitor_name, visitor_mobilenumber, }]
    // visitor_vehicle_details [{vehicle_id(from vehicle master), vehicle_number}] (optional)
    // date_of_visit
    // hours_of_stay(optional)

    //Functions: edit_expected_visitor
    //Response: status, message, result
    app.post('/v1/edit_expected_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visit_id")
          && req.body.hasOwnProperty("visitor_details")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("date_of_visit")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && user_id == req.body.resident_id) {
              user = user_id
              visitors_module.edit_expected_visitor(
                req.body.building_id,
                req.body.unit_id,
                req.body.visit_id,
                req.body.visitor_details,
                req.body.visitor_vehicle_details,
                req.body.date_of_visit,
                req.body.hours_of_stay,
                user,
                req.body.purpose_of_visit, function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message, result: result.insertedId });
                  }
                })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("visitor_details") == false) {
            res.json({ status: false, message: "visitor_details parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("date_of_visit") == false) {
            res.json({ status: false, message: "date_of_visit parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Update Expected Visitors Details


    //API for Expected Visitor Approval

    //headers : user-token (admin/super admin)
    // params :
    // building_id

    // visit_id

    //Functions: approve_expected_visitor
    //Response: status, message, result
    app.post('/v1/approve_expected_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visit_id")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (user_id == req.body.resident_id || result == 'E' || result == 'A')) {
              visitors_module.approve_expected_visitor(
                req.body.building_id,
                req.body.visit_id, function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  }
                  else {
                    visitors_module.get_visit_detail(req.body.building_id, req.body.visit_id, function (result1, error, message1) {
                      if (error) {
                        res.json({ status: false, message: message1 });
                      } else {
                        var data = {
                          visit_id: result1._id,
                          unit_id: result1.unit_id,
                          visitor_name: result1.visitor_details[0].visitor_name,
                          purpose_of_visit: result1.purpose_of_visit,
                        }
                        var notice_title = "You have a new visitor";
                        var notice_desc = data.visitor_name + " [" + data.purpose_of_visit + "], has entered the gate";
                        visitors_module.visitor_pushnotification(notice_title, notice_desc, result1.unit_id, "visitor_allowed", data.visit_id.toString(), function (error, message, notification_status) {
                          if (error) {
                            res.json({ status: false, message: message, notification_status: notification_status, result: result.insertedId });
                          } else {
                            visitors_module.visitor_pushnotification_ios(notice_title, notice_desc, result1.unit_id, "visitor_allowed", data.visit_id.toString(), function (error_ios, message_ios, notification_status_ios) {
                              if (error_ios) {
                                res.json({ status: false, message: message_ios, notification_status: notification_status_ios, result: result.insertedId });
                              } else {
                                res.json({ status: true, message: message, notification_status: notification_status, result: result.insertedId });
                              }
                            })

                          }
                        })
                      }
                    })
                  }
                })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Expected Visitor Approval

    //API for Delete Expected Visitor Details

    //Params: user-token,building_id,visit_id
    //Functions: delete_expected_visitor
    //Response: status, message, result
    app.post('/v1/delete_expected_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("visit_id") &&
          req.body.hasOwnProperty("building_id")) {
          visitors_module.visitExists(req.body.visit_id, function (resident_id, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              admin_module.userExists(req.token, function (user_id, result, exists, message) {
                if (exists) {
                  visitors_module.delete_expected_visitor(req.body.building_id, req.body.visit_id, function (error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    } else {
                      res.json({ status: true, message: message });
                    }
                  })
                } else {
                  res.json({ status: false, message: message });
                }
              })
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else {
            res.json({ status: false, message: "visit_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });



    //API for Allow Visitor Entry

    //Params: user-token,building_id,visit_id
    //Functions: allow_visitor_entry
    //Response: status, message, result
    app.post('/v1/allow_visitor_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("visit_id") &&
          req.body.hasOwnProperty("building_id")) {
          visitors_module.visitExists(req.body.visit_id, function (resident_id, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              admin_module.userExists(req.token, function (user_id, user_type, exists, message) {
                if (exists && (user_type == 'E' || user_type == 'R' || user_type == 'A' || user_type == 'SR')) {
                  visitors_module.approve_expected_visitor(req.body.building_id, req.body.visit_id, function (resujlt, error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    } else {
                      res.json({ status: true, message: message });
                    }
                  })
                } else {

                  res.json({ status: false, message: message });
                }
              })
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else {
            res.json({ status: false, message: "visit_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Allow Visitor Entry

    //Start of Deny Visitor Entry
    app.post('/v1/deny_visitor_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("visit_id") &&
          req.body.hasOwnProperty("building_id")) {
          visitors_module.visitExists(req.body.visit_id, function (resident_id, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              admin_module.userExists(req.token, function (user_id, user_type, exists, message) {
                if (exists && (user_type == 'E' || user_type == 'R' || user_type == 'A' || user_type == 'SR')) {
                  visitors_module.deny_visitor(req.body.building_id, req.body.visit_id, function (resujlt, error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    } else {
                      res.json({ status: true, message: message });
                    }
                  })
                } else {
                  res.json({ status: false, message: message });
                }
              })
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else {
            res.json({ status: false, message: "visit_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Deny Visitor Entry

    //API for View Expected Visitor Details By OTP

    //Params: user-token,building_id,visit_otp
    //Functions: get_expected_visitor_details
    //Response: status, message, result
    app.post('/v1/get_expected_visitor_details', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("visit_otp")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'E')) {
              visitors_module.get_expected_visitor_details(req.body.building_id, req.body.visit_otp, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
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
          } else {
            res.json({ status: false, message: "visit_otp parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View Expected Visitor Details By OTP


    //API for View All Visitors With Pagination 

    //Params:  user_token,starting_after,limit,start_date,end_date,building_id
    //Functions: userExists,view_all_visitors
    //Response: status, message, result

    app.post('/v1/view_all_visitors', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'E')) {
              visitors_module.view_all_visitors(req.body.start_date, req.body.end_date, req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    //End Of API for View All Visitors With Pagination 


    //API for View User All Visitors With Pagination 

    //Params:  user_token,starting_after,limit,start_date,end_date,building_id,unit_id
    //Functions: userExists,view_user_visitor
    //Response: status, message, result

    app.post('/v1/view_user_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("limit")
          && req.body.hasOwnProperty("starting_after")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            var user = user_id;
            if (exists) {
              visitors_module.view_user_visitor(req.body.start_date, req.body.end_date, req.body.starting_after, req.body.limit, req.body.building_id, req.body.unit_id, function (result1, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result1, total: total, totaldata: result1.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    //End Of API for View User All Visitors With Pagination 


    //API for View User All Employee Visitors With Pagination 
    //Params:  user_token,starting_after,limit,start_date,end_date,building_id,unit_id
    app.post('/v1/view_employee_visitor', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("limit")
          && req.body.hasOwnProperty("starting_after")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            var user = user_id;
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              visitors_module.view_employee_visitor(req.body.start_date, req.body.end_date, req.body.starting_after, req.body.limit, req.body.building_id, req.body.unit_id, function (result1, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result1, total: total, totaldata: result1.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    //End Of API


    app.post('/v1/helper_visit_exit', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("visit_id")
          && req.body.hasOwnProperty("exit_time")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            var user = user_id;
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              visitors_module.helper_visit_exit(req.body.visit_id, req.body.exit_time, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("exit_time") == false) {
            res.json({ status: false, message: "exit_time parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    app.post('/v1/employee_visit_exit', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("visit_id")
          && req.body.hasOwnProperty("exit_time")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            var user = user_id;
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              visitors_module.employee_visit_exit(req.body.visit_id, req.body.exit_time, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("exit_time") == false) {
            res.json({ status: false, message: "exit_time parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    //API for View User All Employee Visitors With Pagination 
    //Params:  user_token,starting_after,limit,start_date,end_date,building_id,unit_id
    app.post('/v1/view_helper_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("limit")
          && req.body.hasOwnProperty("starting_after")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            var user = user_id;
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              visitors_module.view_helper_visitor(req.body.start_date, req.body.end_date, req.body.starting_after, req.body.limit, req.body.building_id, req.body.unit_id, function (result1, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result1, total: total, totaldata: result1.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    //End Of API


    //Start of Search Visitor By Vehicle
    app.post('/v1/search_visitor_vechile_number', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("vehicle_number")) {
          visitors_module.search_visitor_vehicle_number(req.body.building_id, req.body.vehicle_number, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              res.json({ status: true, message: message, result: result })
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else {
            res.json({ status: false, message: "vehicle_number parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Search Visitor By Vehcile

    //Start of Search Visitor By Phone Number
    app.post('/v1/search_visitor_mobile_number', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("mobile_number")) {
          visitors_module.search_visitor_phone_number(req.body.building_id, req.body.mobile_number, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              res.json({ status: true, message: message, result: result })
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else {
            res.json({ status: false, message: "mobile_number parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Search Visitor By Phone Number


    //Start of Get Visitor Approved Status
    app.post('/v1/get_visitor_approved_status', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("visit_id")) {
          visitors_module.get_visitor_approved_status(req.body.building_id, req.body.visit_id, function (error, message) {
            if (error) {
              res.json({ status: false, message: "Visitor not yet approved" });
            } else {
              res.json({ status: true, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else {
            res.json({ status: false, message: "visit_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    })
    //End of Get Visitor Approved Status

    //Start of Add Resident Entry
    app.post('/v1/add_resident_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("resident_id") &&
          req.body.hasOwnProperty("vehicle_details")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message1) {
            if (exists) {
              var newEntry = {
                building_id: new ObjectID(req.body.building_id),
                resident_id: new ObjectID(req.body.resident_id),
                entry_time: new Date(),
                vehicle_details: JSON.parse(req.body.vehicle_details)
              }

              visitors_module.add_resident_entry(newEntry, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: message1 });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else {
            res.json({ status: false, message: "vehicle_details parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e })
      }
    })
    //End of Add Resident Entry

    //Start of Get Resident Entry
    app.post('/v1/get_resident_entries', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("limit") &&
          req.body.hasOwnProperty("starting_after")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message1) {
            if (exists) {
              visitors_module.get_resident_entries(req.body.building_id, req.body.limit, req.body.starting_after, req.body.start_date, req.body.end_date, function (result, error, message, totalData) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, totaldata: totalData });
                }
              })
            } else {
              res.json({ status: false, message: message1 });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          } else {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e })
      }
    })
    //End of Get Resident Entry


    //Start of get Visit Details
    app.post('/v1/get_visit_detail', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visit_id")) {
          visitors_module.get_visit_detail(req.body.visit_id, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: "Visitor not yet approved" });
            } else {
              res.json({ status: true, message: "Visitor Approved", result: result });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });
    //End of get Visit Details


    //Start of get Visit Details
    app.post('/v1/get_visit_detail_ios', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visit_id")) {
          visitors_module.get_visit_detail_ios(req.body.visit_id, function (valid, message) {
            res.json({ status: valid, message: message });
          })
        } else {
          if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });
    //End of get Visit Details


    //Start of vendor visit entry
    app.post('/v1/vendor_visitor_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("vendor_id")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("entry_time")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              let helper_entry = {
                vendor_id: new ObjectID(req.body.vendor_id),
                building_id: new ObjectID(req.body.building_id),
                entry_time: new Date(req.body.entry_time),
                exit_time: null
              }
              vendor_module.vendor_visitor_entry(helper_entry, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result.insertedId });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("vendor_id") == false) {
            res.json({ status: false, message: "vendor_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of vendor visit entry

    //Start of vendor exit entry
    app.post('/v1/vendor_visit_exit', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("visit_id")
          && req.body.hasOwnProperty("exit_time")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              visitors_module.vendor_visit_exit(req.body.visit_id, req.body.exit_time, function (error, message1) {
                res.json({ status: !error, message: message1 })
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visit_id") == false) {
            res.json({ status: false, message: "visit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("exit_time") == false) {
            res.json({ status: false, message: "exit_time parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (ex) {
        res.json({ status: false, message: ex });
      }
    })
    //End of vendor exit entry

    //Start of Vendor Visit Details
    app.post('/v1/get_vendor_entries', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("limit")
          && req.body.hasOwnProperty("starting_after")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            var user = user_id;
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              visitors_module.view_vendor_visitor(req.body.start_date, req.body.end_date, req.body.starting_after, req.body.limit, req.body.building_id, function (result1, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result1, total: total, totaldata: result1.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user_token parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    })
    //End of Vendor Visit Details


    //Start of visitor Entry
    app.post('/v1/allow_sos_visitor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("visitor_details")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("date_of_visit")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'SA' || result == 'E')) {
              user = user_id
              var new_visitors = {
                building_id: new ObjectID(req.body.building_id),
                unit_id: new ObjectID(req.body.unit_id),
                visitor_details: JSON.parse(req.body.visitor_details),
                visitor_vehicle_details: JSON.parse(req.body.visitor_vehicle_details),
                date_of_visit: new Date(req.body.date_of_visit),
                created_by: new ObjectID(user),
                created_on: new Date(),
                is_user_approved: true,
                purpose_of_visit: "SOS",
                active: true
              };
              visitors_module.create_visitor_entry(new_visitors, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  var visitorDetails = JSON.parse(req.body.visitor_details);
                  var visitorsName;
                  visitorsName = visitorDetails.visitor_name
                  var data = {
                    visit_id: result.insertedId,
                    unit_id: req.body.unit_id,
                    visitor_name: visitorsName,
                    purpose_of_visit: "Emergency Contact",
                  }
                  var notice_title = "You have a visitor";
                  var notice_desc = data.visitor_name + " [Emergency Contact] has entered the gate";
                  visitors_module.visitor_pushnotification(notice_title, notice_desc, req.body.unit_id, "visitor_allowed", data.visit_id.toString(), function (error, message, notification_status) {
                    if (error) {
                      res.json({ status: false, message: message, notification_status: notification_status, result: result.insertedId });
                    } else {
                      visitors_module.visitor_pushnotification_ios(notice_title, notice_desc, req.body.unit_id, "visitor_allowed", data.visit_id.toString(), function (errorios, messageios, notification_status_ios) {
                        if (errorios) {
                          res.json({ status: false, message: message, notification_status: notification_status_ios, result: result.insertedId });
                        } else {
                          res.json({ status: true, message: message, notification_status: notification_status_ios, result: result.insertedId });
                        }
                      })


                    }
                  })
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("visitor_details") == false) {
            res.json({ status: false, message: "visitor_details parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("date_of_visit") == false) {
            res.json({ status: false, message: "date_of_visit parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Visitor Entry

  }
}
