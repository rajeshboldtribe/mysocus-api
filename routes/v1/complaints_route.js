
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var complaints_module = require('../../modules/v1/complaints_module')(mongo, ObjectID, url, assert, dbb, db, firebase_key);
    var employee_module = require('../../modules/v1/employee_module')(mongo, ObjectID, url, assert, dbb, db);
    var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add Complaints

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // unit_id
    // resident_id
    // complaint_title
    // complaint_desc
    // comlaint_raised_imgs[JSON Array](optional)
    // complaint_raised_date     
    // is_urgent

    //Functions: add_resident,add_user
    //Response: status, message, result

    app.post('/v1/book_complaint', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("complaint_title")
          && req.body.hasOwnProperty("complaint_desc")
          && req.body.hasOwnProperty("complaint_raised_date")
          && req.body.hasOwnProperty("is_urgent")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {

              var new_complaint = {
                resident_id: new ObjectID(req.body.resident_id),
                unit_id: new ObjectID(req.body.unit_id),
                building_id: new ObjectID(req.body.building_id),
                complaint_title: req.body.complaint_title,
                complaint_desc: req.body.complaint_desc,
                complaint_raised_imgs: JSON.parse(req.body.complaint_raised_imgs),
                complaint_raised_date: new Date(req.body.complaint_raised_date),
                is_urgent: req.body.is_urgent,
                // employee_id:null,
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                invoiceAdded: false,
                active: true
              };
              complaints_module.book_complaint(new_complaint, function (result, error, message) {
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

          if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("complaint_title") == false) {
            res.json({ status: false, message: "complaint_title parameter is missing" });
          } else if (req.body.hasOwnProperty("complaint_desc") == false) {
            res.json({ status: false, message: "complaint_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("complaint_raised_date") == false) {
            res.json({ status: false, message: "complaint_raised_date parameter is missing" });
          } else if (req.body.hasOwnProperty("is_urgent") == false) {
            res.json({ status: false, message: "is_urgent parameter is missing" });
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

    //End of Add Complaints Details


    //API for Update Complaints Details

    //headers : user-token (admin/super admin)
    // params :
    // complaint_id:
    // building_id
    // unit_id
    // resident_id
    // complaint_title
    // complaint_desc
    // comlaint_raised_imgs[JSON Array](optional)
    // complaint_raised_date     
    // is_urgent

    //Functions: edit_complaint,update_user
    //Response: status, message, result


    app.post('/v1/edit_complaint', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("complaint_id")
          && req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("complaint_title")
          && req.body.hasOwnProperty("complaint_desc")
          && req.body.hasOwnProperty("complaint_raised_date")
          && req.body.hasOwnProperty("is_urgent")
          && req.body.hasOwnProperty("unit_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {

            if (exists) {

              complaints_module.edit_complaint(req.body.complaint_id,
                req.body.resident_id,
                req.body.unit_id,
                req.body.building_id,
                req.body.complaint_title,
                req.body.complaint_desc,
                req.body.complaint_raised_imgs,
                req.body.complaint_raised_date,
                req.body.is_urgent,
                user_id,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  }
                  else {
                    res.json({ status: true, message: message });
                  }
                })

            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("complaint_id") == false) {
            res.json({ status: false, message: "complaint_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("complaint_title") == false) {
            res.json({ status: false, message: "complaint_title parameter is missing" });
          } else if (req.body.hasOwnProperty("complaint_desc") == false) {
            res.json({ status: false, message: "complaint_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("complaint_raised_date") == false) {
            res.json({ status: false, message: "complaint_raised_date parameter is missing" });
          } else if (req.body.hasOwnProperty("is_urgent") == false) {
            res.json({ status: false, message: "is_urgent parameter is missing" });
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

    //End of Update Complaints Details


    //API for View All Complaints Details

    //Params: user-token,building_id
    //Functions: view_all_complaints
    //Response: status, message, result

    app.post('/v1/view_all_complaints', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
        ) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              complaints_module.view_all_complaints(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Complaints Details


    //API for View Resident Complaints Details

    //Params: user-token,unit_id,building_id
    //Functions: view_user_complaints
    //Response: status, message, result

    app.post('/v1/view_user_complaints', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              complaints_module.view_user_complaints(req.body.starting_after, req.body.limit, req.body.unit_id, req.body.building_id, function (result, error, message, total) {
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
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {

        res.json({ status: false, message: er });
      }
    });

    //End of View  Resident Complaints Details


    //API for Delete Single Complaints Details

    //Params: user-token,complaint_id,building_id
    //Functions: delete_complaint
    //Response: status, message, result

    app.post('/v1/delete_complaint', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("complaint_id")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'A' || result == 'SR')) {
              complaints_module.delete_complaint(req.body.complaint_id, req.body.building_id, function (error, message) {
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
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("complaint_id") == false) {
            res.json({ status: false, message: "complaint_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Delete Single Complaints Details

    //API for Allot Complaints 

    //Params: 
    //user-token,
    //employee_id,
    //complaint_id,
    //complaint_allotted_date

    //Functions: allot_complaint
    //Response: status, message, result

    app.post('/v1/allot_complaint', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("complaint_id")
          && req.body.hasOwnProperty("complaint_allotted_date")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              complaints_module.allot_complaint(req.body.employee_id, req.body.complaint_id, req.body.complaint_allotted_date, req.body.comments, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  employee_module.get_employee_name(req.body.employee_id, function (employee_name, error1, message1) {
                    if (error1) {
                      res.json({ status: true, message: message });
                    } else {
                      var body = {
                        complaint_id: req.body.complaint_id,
                        message: employee_name + " has been allotted to attend your complaint."
                      }
                      complaints_module.send_complaint_notification(req.body.complaint_id, "Complaint Allotted", body.message, function (results2, message2, error2) {
                        res.json({ status: true, message: message2 });
                      })
                    }
                  })
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
          } else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter missing" });
          } else if (req.body.hasOwnProperty("complaint_allotted_date") == false) {
            res.json({ status: false, message: "complaint_allotted_date parameter missing" });
          } else {
            res.json({ status: false, message: "complaint_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Allot Complaints


    //API for Complaint Completed

    //Params: 
    //user-token,
    //complaint_id
    //employee_id
    //complaint_service_type (paid or free)
    //complaint_fee (if paid)
    //service_feedback
    //complaint_completed_date

    //Functions: complaint_completed
    //Response: status, message, result

    app.post('/v1/complaint_completed', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("complaint_id")
          && req.body.hasOwnProperty("complaint_service_type")
          && req.body.hasOwnProperty("complaint_fee")
          && req.body.hasOwnProperty("service_feedback")
          && req.body.hasOwnProperty("complaint_completed_date")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              complaints_module.complaint_completed(req.body.complaint_id,
                req.body.complaint_service_type,
                req.body.complaint_fee,
                req.body.service_feedback,
                req.body.complaint_completed_date, function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  }
                  else {
                    var title = "Complaint Completed";
                    var body = {
                      complaint_id: req.body.complaint_id,
                      message: "Your complaint has been completed succesfully. Please rate the service attended."
                    }
                    complaints_module.send_complaint_notification(req.body.complaint_id, title, body.message, function (result2, error2, message2) {
                      res.json({ status: true, message: message2 });
                    })

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
          } else if (req.body.hasOwnProperty("complaint_completed_date") == false) {
            res.json({ status: false, message: "complaint_completed_date parameter missing" });
          } else if (req.body.hasOwnProperty("complaint_id") == false) {
            res.json({ status: false, message: "complaint_id parameter missing" });
          } else if (req.body.hasOwnProperty("complaint_service_type") == false) {
            res.json({ status: false, message: "complaint_service_type parameter missing" });
          } else if (req.body.hasOwnProperty("complaint_fee") == false) {
            res.json({ status: false, message: "complaint_fee parameter missing" });
          } else {
            res.json({ status: false, message: "service_feedback parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Complaint Completed

    //API for Rate Complaints 

    //Params: 
    //user-token,
    //complaint_id
    //ratings (float)
    //resident_feedback

    //Functions: rate_complaint_attended
    //Response: status, message, result

    app.post('/v1/rate_complaint_attended', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("ratings")
          && req.body.hasOwnProperty("complaint_id")
          && req.body.hasOwnProperty("resident_feedback")
          && req.body.hasOwnProperty("employee_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              complaints_module.rate_complaint_attended(req.body.ratings, req.body.complaint_id, req.body.resident_feedback, req.body.employee_id, function (result, error, message) {
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
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("resident_feedback") == false) {
            res.json({ status: false, message: "resident_feedback parameter missing" });
          } else if (req.body.hasOwnProperty("ratings") == false) {
            res.json({ status: false, message: "ratings parameter missing" });
          } else if (req.body.hasOwnProperty("complaint_id") == false) {
            res.json({ status: false, message: "complaint_id parameter missing" });
          } else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Rate Complaints 


    //API for View All Unresolved Complaints Details

    //Params: user-token,building_id
    //Functions: view_unresolved_complaints
    //Response: status, message, result

    app.post('/v1/view_unresolved_complaints', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
        ) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              complaints_module.view_unresolved_complaints(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Unresolved Complaints Details



    //API for View All Unalloted Complaints Details

    //Params: user-token,building_id
    //Functions: view_unallotted_complaints
    //Response: status, message, result
    app.post('/v1/view_unallotted_complaints', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              complaints_module.view_unallotted_complaints(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      }
      catch (er) {

        res.json({ status: false, message: er });
      }
    });
    //End of View All Unalloted Complaints Details


    //API to view alloted Complaint Details

    app.post('/v1/view_allotted_complaints', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              complaints_module.view_allotted_complaints(req.body.building_id, req.body.starting_after, req.body.limit, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (ex) {
        res.json({ status: false, message: ex });
      }
    })
    //End of view alloted Complaint Details


    //API To view single complaint
    app.post('/v1/view_single_complaint', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("complaint_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              complaints_module.view_single_complaint(req.body.building_id, req.body.complaint_id, function (result1, error, message1) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message1, result: result1 });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else {
            res.json({ status: false, message: "complaint_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e })
      }
    })
    //End of API To view single complaint



    //API To send sample push notification
    app.post('/v1/send_sample_notification', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("user_id")) {
          complaints_module.send_sample_notification(req.body.user_id, function (error, message) {
            res.json({ status: !error, message: message })
          })
        } else {
          if (req.body.hasOwnProperty("user_id") == false) {
            res.json({ status: false, message: "user_id parameter is missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    })
    //End of API To send sample push notification
  }
}
