
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db);
    var enotice_module = require('../../modules/v1/enotice_module')(mongo, ObjectID, url, assert, dbb, db, firebase_key, gmail);

    //API for Add E-notice Details
    //headers : user-token (admin/super admin)
    // params :
    // notice_title
    // notice_desc
    // notice_target [all or specific groups]
    // notice_generated_date
    // notice_valid_till
    // building_id
    //Functions: add_enotice
    //Response: status, message, result
    app.post('/v1/add_enotice', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("notice_title")
          && req.body.hasOwnProperty("notice_desc")
          && req.body.hasOwnProperty("notice_target")
          && req.body.hasOwnProperty("notice_generated_date")
          && req.body.hasOwnProperty("notice_valid_till")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'E' || result == 'A')) {
              var new_notice = {
                notice_title: req.body.notice_title,
                notice_valid_till: new Date(req.body.notice_valid_till),
                notice_generated_date: new Date(req.body.notice_generated_date),
                notice_target: JSON.parse(req.body.notice_target),
                notice_desc: req.body.notice_desc,
                building_id: new ObjectID(req.body.building_id),
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                read_users: [],
                active: true,
              };
              enotice_module.add_enotice(new_notice, function (building_name, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  enotice_module.enotice_pushnotification2(req.body.notice_title, req.body.notice_desc, req.body.notice_target, req.body.building_id, building_name, function (error, message) {
                    if (error) {
                      res.json({ status: false, message: message, notification_status: false });
                    } else {
                      res.json({ status: true, message: message, notification_status: true });
                    }
                  })

                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("notice_title") == false) {
            res.json({ status: false, message: "notice_title parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_desc") == false) {
            res.json({ status: false, message: "notice_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_target") == false) {
            res.json({ status: false, message: "notice_target parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_generated_date") == false) {
            res.json({ status: false, message: "notice_generated_date parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_valid_till") == false) {
            res.json({ status: false, message: "notice_valid_till parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Add E-notice Details

    //API for Update E-notice Details
    //Params: 
    // enotice_id,
    // notice_title,
    // notice_valid_till,
    // notice_generated_date,
    // notice_target,
    // notice_desc,
    // building_id ,
    //  user-token
    //Functions: update_enotice 
    //Response: status, message, result
    app.post('/v1/update_enotice', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty('enotice_id')
          && req.body.hasOwnProperty("notice_title")
          && req.body.hasOwnProperty("notice_desc")
          && req.body.hasOwnProperty("notice_target")
          && req.body.hasOwnProperty("notice_generated_date")
          && req.body.hasOwnProperty("notice_valid_till")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'E' || result == 'A')) {
              enotice_module.update_enotice(
                req.body.enotice_id,
                req.body.notice_title,
                req.body.notice_valid_till,
                req.body.notice_generated_date,
                req.body.notice_target,
                req.body.notice_desc,
                req.body.building_id,
                user_id,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message, result: req.body.unit_id });
                  }
                })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("enotice_id") == false) {
            res.json({ status: false, message: "enotice_id parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_title") == false) {
            res.json({ status: false, message: "notice_title parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_desc") == false) {
            res.json({ status: false, message: "notice_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_target") == false) {
            res.json({ status: false, message: "notice_target parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_generated_date") == false) {
            res.json({ status: false, message: "notice_generated_date parameter is missing" });
          } else if (req.body.hasOwnProperty("notice_valid_till") == false) {
            res.json({ status: false, message: "notice_valid_till parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Update E-notice Details


    //API for Get E-notice Details
    //Params: user-token,building_id
    //Functions: view_enotice ,starting_after,limit
    //Response: status, message, result
    app.post('/v1/view_enotice', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'A' || result == 'SR' || result == 'E')) {
              enotice_module.view_enotice(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
            res.json({ status: false, message: "user-token parameter missing" });
          } else {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Get E-notice Details

    //API for Delete Single E-notice Details
    //Params: user-token,enotice_id,building_id
    //Functions: delete_enotice
    //Response: status, message, result
    app.post('/v1/delete_enotice', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("enotice_id")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'E' || result == 'A')) {
              enotice_module.delete_enotice(req.body.enotice_id, req.body.building_id, function (error, message) {
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
          } else if (req.body.hasOwnProperty("enotice_id") == false) {
            res.json({ status: false, message: "enotice_id parameter missing" });
          } else {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Delete Single E-notice Details

    //API to mark notification read
    //Headers : user-token
    //Params : enotice_id
    //Response : success or false
    app.post('/v1/mark_notification_read', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("enotice_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              enotice_module.mark_notification_read(req.body.enotice_id, user_id, function (error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1 });
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
            res.json({ status: false, message: "enotice_id parameter missing" });
          }
        }
      } catch (ex) {
        res.json({ status: false, message: ex })
      }
    })
    //End of mark notification read
  }
}
