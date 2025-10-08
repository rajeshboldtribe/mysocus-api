//REQUIRE
var jwt = require('jsonwebtoken');

module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add Admin

    //Params: name, email, contact_no, admin_type, user_token, type, get_notifications, active
    //Functions: email_exists, userExists, add_admin
    //Response: status, message, result, user_token

    app.post('/v1/add_admin', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("name")
          && req.body.hasOwnProperty("email")
          && req.body.hasOwnProperty("contact_no")
          && req.body.hasOwnProperty("admin_type")
          && req.headers.hasOwnProperty("user-token")) {
          var user = {};
          jwt.sign({ user }, 'secretkey', (err, user_token) => {
            admin_module.email_exists(req.body.email, function (exists, error, message) {
              if (exists) {
                res.json({ status: false, message: message });
              } else {
                admin_module.userExists(req.token, function (user_id, result, exists, message) {
                  if (exists && (result == 'A' || result == 'SA')) {
                    var newUserDetails = {
                      name: req.body.name,
                      email: req.body.email,
                      contact_no: req.body.contact_no,
                      user_token: user_token,
                      user_type: req.body.admin_type,
                      created_by: new ObjectID(user_id),
                      created_on: new Date(),
                      active: true,
                      // building_id:new ObjectID(building_id)
                    };
                    admin_module.add_admin(newUserDetails, function (result, error, message) {
                      if (error) {
                        res.json({ status: false, message: message });
                      } else {
                        res.json({ status: true, message: message, result: result.insertedId, user_token: user_token });
                      }
                    })
                  } else {
                    res.json({ status: false, message: message });
                  }
                });
              }
            })
          });
        } else {
          if (req.body.hasOwnProperty("name") == false) {
            res.json({ status: false, message: "name parameter missing" });
          } else if (req.body.hasOwnProperty("email") == false) {
            res.json({ status: false, message: "email parameter missing" });
          } else if (req.body.hasOwnProperty("contact_no") == false) {
            res.json({ status: false, message: "contact_no parameter missing" });
          } else if (req.body.hasOwnProperty("admin_type") == false) {
            res.json({ status: false, message: "admin_type parameter missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          }
        }
      } catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: "failed at try" });
      }
    });

    //End of Add Admin

    //API for Update Admin

    //Params: admin_id, name, email, contact_no, education, college_name, degree, user_token
    //Functions: userExists, update_admin
    //Response: status, message, result, user_token
    app.post('/v1/update_admin', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("admin_id")
          && req.body.hasOwnProperty("name")
          && req.body.hasOwnProperty("email")
          && req.body.hasOwnProperty("contact_no")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || 'SA')) {
              admin_module.update_admin(req.body.admin_id, req.body.name, req.body.email, req.body.contact_no, user_id,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message, result: result.insertedId });
                  }
                })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("admin_id") == false) {
            res.json({ status: false, message: "admin_id parameter missing" });
          } else if (req.body.hasOwnProperty("name") == false) {
            res.json({ status: false, message: "name parameter missing" });
          } else if (req.body.hasOwnProperty("email") == false) {
            res.json({ status: false, message: "email parameter missing" });
          } else if (req.body.hasOwnProperty("contact_no") == false) {
            res.json({ status: false, message: "contact_no parameter missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          }
        }
      } catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: er });
      }
    });

    //End of Update Admin

    //API for View All Admin

    //Params: user_token
    //Functions: view_all_admin
    //Response: status, message, result

    app.post('/v1/view_all_admin', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || 'SA')) {
              admin_module.view_all_admin(result, function (result, error, message, total) {
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
          }
        }
      }
      catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: er });
      }
    });

    //End of View All Admin

    //API for Toggle Admin Active

    //Params: admin_id, user_token, active
    //Functions: toggle_admin_active
    //Response: status, message, result

    app.post('/v1/toggle_admin_active', ensureAuthorized, function (req, res) {

      try {
        if (req.body.hasOwnProperty("admin_id") && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (result, exists, message) {
            if (exists && (result == 'A' || 'SA')) {
              admin_module.toggle_admin_active(req.body.admin_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: req.body.admin_id });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("admin_id") == false) {
            res.json({ status: false, message: "admin_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {

        res.json({ status: false, message: "failed at try" });
      }
    });

    //End of Toggle Admin Active

    //API for Get All Admin With Pagination 

    //Params: admin_id, user_token,starting_after,limit
    //Functions: userExists,get_admin_details
    //Response: status, message, result

    app.post('/v1/get_admin_details', ensureAuthorized, function (req, res) {
      try {
        ;
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (result, exists, message) {
            if (exists && (result == 'A' || 'SA')) {

              admin_module.get_admin_details(req.body.starting_after, req.body.limit, function (result, error, message) {
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
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {

        res.json({ status: false, message: "failed at try" });
      }
    });
    //End Of Get All Admin With Pagination 

    //API for Get All Building Admin With Pagination 

    //Params: admin_id, user_token,starting_after,limit
    //Functions: userExists,get_admin_details
    //Response: status, message, result

    app.post('/v1/get_building_admins', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (type_id, result, exists, message) {
            if (exists && (result == 'SA')) {

              admin_module.get_building_admins(req.body.building_id, function (result, error, message) {
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
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End Of Get All building Admin With Pagination 

    //API for Remove Building Admin

    //Params: admin_id, user_token,starting_after,limit
    //Functions: userExists,get_admin_details
    //Response: status, message, result

    app.post('/v1/remove_building_admins', ensureAuthorized, function (req, res) {
      try {
        ;
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("admin_id")) {
          admin_module.userExists(req.token, function (type_id, result, exists, message) {
            if (exists && (result == 'SA')) {

              admin_module.remove_admin(req.body.admin_id, function (error, message) {
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
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("admin_id") == false) {
            res.json({ status: false, message: "admin_id parameter is missing" });
          }
        }
      } catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End Of Remove Building Admin


    //API for User Login by mobile number

    //Params: mobile_number
    //Functions: userExists,update_user_token
    //Response: status, message, result

    app.post('/v1/login_with_mobilenumber', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("mobile_number")) {

          user_module.loginmobile(req.body.mobile_number, function (result, usertype, buildingid, unit_id, exists, message, user_token) {
            if (!exists) {
              res.json({ status: false, message: loginMessage });
            } else {
              var user = {};
              jwt.sign({ user }, 'secretkey', (err, user_token) => {
                user_module.update_user_token(result, user_token, req.body.fcm_token, function (result2, error, message) {
                  if (error) {
                    res.json({ status: false, message: loginMessage })
                  } else {
                    data = {
                      user_id: result,
                      user_type: usertype,
                      user_token: user_token,
                      user_building_id: buildingid,
                      user_unit_id: unit_id
                    }
                    res.json({ status: true, message: 'Log in successfull', result: data })
                  }
                })
              })
            }
          })
        } else {
          if (req.body.hasOwnProperty("mobile_number") == false) {
            res.json({ status: false, message: "mobile_number parameter missing" });
          }
        }
      } catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: er });
      }
    });

    //End of User Login by Mobile number


    //API for User Login by mobile number & Password
    //Params: mobile_number
    //Functions: userExists,update_user_token
    //Response: status, message, result

    app.post('/v1/login_with_mobilenumber_pwd', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("mobile_number")
          && req.body.hasOwnProperty("password")) {
          user_module.login_mobile_password(req.body.mobile_number, req.body.password, function (exists, usertype, result, loginMessage) {
            if (!exists) {
              res.json({ status: false, message: loginMessage });
            } else {
              var user = {};
              jwt.sign({ user }, 'secretkey', (err, user_token) => {
                user_module.update_user_token(result.user_id, user_token, req.body.fcm_token, function (result2, error, message) {
                  if (error) {
                    res.json({ status: false })
                  } else {
                    result.user_token = user_token;
                    res.json({ status: true, message: loginMessage, result: result });
                  }
                })
              })
            }
          })
        } else {
          if (req.body.hasOwnProperty("mobile_number") == false) {
            res.json({ status: false, message: "mobile_number parameter missing" });
          } else {
            res.json({ status: false, message: "password parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of User Login by Mobile number & Password


    //API for User Login by Email & Password

    //Params:email,password
    //Functions: userExists,update_user_token
    //Response: status, message, result

    app.post('/v1/login_with_email', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("email") && req.body.hasOwnProperty("password")) {

          user_module.loginemail(req.body.email.toLowerCase(), req.body.password, function (exists, usertype, result, loginMessage) {
            if (!exists) {
              res.json({ status: false, message: loginMessage });
            } else {
              var user = {};
              jwt.sign({ user }, 'secretkey', (err, user_token) => {
                if (usertype == "SA") {
                  user_module.update_user_token_sa(req.body.email.toLowerCase(), user_token, req.body.fcm_token, function (result3, error, message) {
                    if (error) {
                      res.json({ status: false })
                    } else {
                      result.user_token = user_token;
                      res.json({ status: true, message: loginMessage, result: result })
                    }
                  })
                } else {
                  user_module.update_user_token(result.user_id, user_token, req.body.fcm_token, function (result2, error, message) {
                    if (error) {
                      res.json({ status: false })
                    } else {
                      result.user_token = user_token;
                      res.json({ status: true, message: loginMessage, result: result })
                    }
                  })
                }
              })
            }
          })
        } else {
          if (req.body.hasOwnProperty("password") == false) {
            res.json({ status: false, message: "password parameter missing" });
          } else {
            res.json({ status: false, message: "email parameter missing" });
          }
        }
      } catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: er });
      }
    });

    //End of User Login by Email & Password


    //API for Resend Invitation To Admin

    //Params: email_id, user_token
    //Functions: resend_invitation_admin
    //Response: status, message, result

    app.post('/v1/resend_invitation_admin', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("email_id") && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA')) {
              admin_module.get_admin_building_name(req.body.email_id.toLowerCase(), function (buildingName, adminName, buildingError, buildingMessage) {
                if (buildingError) {
                  res.json({ status: false, message: buildingMessage });
                } else {
                  var value = adminName;
                  var subject = 'Log In Credentials'
                  admin_module.sendEmail(req.body.email_id, subject, value, buildingName, function (error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    } else {
                      res.json({ status: true, message: "Invitation Sent Successfully" });
                    }
                  })
                }
              })


            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("email_id") == false) {
            res.json({ status: false, message: "email_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Resend Invitation To Admin


    //Start of Forgot Password User
    app.post('/v1/forgot_password_user', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("email_id")) {
          admin_module.email_exists(req.body.email_id, function (exists, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              if (exists) {
                admin_module.sendPasswordResetEmail(req.body.email_id, function (error1, message1) {
                  res.json({ status: !error1, message: message1 });
                })
              } else {
                res.json({ status: false, message: message });
              }
            }
          })
        } else {
          res.json({ status: false, message: "email_id parameter is missing" })
        }
      } catch (ex) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Forgot Password User

    //Start of Reset User Password
    app.post('/v1/reset_user_password', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("email_id")
          && req.body.hasOwnProperty("password")) {
          admin_module.reset_user_password(req.body.email_id, req.body.password, function (error, message) {
            res.json({ status: !error, message: message });
          })
        } else {
          if (req.body.hasOwnProperty("email_id") == false) {
            res.json({ status: false, message: "email_id parameter is missing" });
          } else {
            res.json({ status: false, message: "password parameter is missing" });
          }
        }
      } catch (ex) {
        res.json({ status: false, message: "failed at try" });
      }
    })
    //End of Reset User Password


    app.post('/v1/contact_us', function (req, res) {
      try {
        if (req.body.hasOwnProperty("email") &&
          req.body.hasOwnProperty("name") &&
          req.body.hasOwnProperty("message")) {
          var data = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message
          }
          admin_module.contact_us(data, function (error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              res.json({ status: true, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("name") == false) {
            res.json({ status: false, message: "name parameter missing" });
          } else if (req.body.hasOwnProperty("email") == false) {
            res.json({ status: false, message: "email parameter missing" });
          } else if (req.body.hasOwnProperty("message") == false) {
            res.json({ status: false, message: "message parameter missing" });
          }
        }
      }
      catch (er) {
        console.log("error occured : " + er);
        res.json({ status: false, message: er });
      }
    });

  }


}

