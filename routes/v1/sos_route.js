module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var sos_module = require('../../modules/v1/sos_module')(mongo, ObjectID, url, assert, dbb, db);

    //ADD SOS API
    app.post('/v1/add_sos_to_unit', ensureAuthorized, function (req, res) {
      try {
        if (
          req.body.hasOwnProperty("unit_id") &&
          req.body.hasOwnProperty("sos_name") &&
          req.body.hasOwnProperty("sos_img") &&
          req.body.hasOwnProperty("sos_phone_number") &&
          req.headers.hasOwnProperty("user-token")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              var sos_data = {
                unit_id: new ObjectID(req.body.unit_id),
                name: req.body.sos_name,
                phone_number: req.body.sos_phone_number.toString(),
                user_img: req.body.sos_img,
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true
              }
              sos_module.add_sos_to_unit(sos_data, function (error, message) {
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
          if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("sos_name") == false) {
            res.json({ status: false, message: "sos_name parameter is missing" });
          } else if (req.body.hasOwnProperty("sos_img") == false) {
            res.json({ status: false, message: "sos_img parameter is missing" });
          } else if (req.body.hasOwnProperty("sos_phone_number") == false) {
            res.json({ status: false, message: "sos_phone_number parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //END OF ADD SOS API

    //START OF EDIT SOS
    app.post('/v1/edit_sos', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("sos_id") &&
          req.body.hasOwnProperty("sos_name") &&
          req.body.hasOwnProperty("sos_img") &&
          req.body.hasOwnProperty("sos_phone_number")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              sos_module.edit_sos(req.body.sos_id, req.body.sos_name, req.body.sos_img, req.body.sos_phone_number, function (error, message1) {
                res.json({ status: !error, message: message1 });
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("sos_id") == false) {
            res.json({ status: false, message: "sos_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("sos_name") == false) {
            res.json({ status: false, message: "sos_name parameter is missing" });
          } else if (req.body.hasOwnProperty("sos_img") == false) {
            res.json({ status: false, message: "sos_img parameter is missing" });
          } else if (req.body.hasOwnProperty("sos_phone_number") == false) {
            res.json({ status: false, message: "sos_phone_number parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //END OF EDIT SOS

    //START OF DELETE SOS
    app.post('/v1/delete_sos', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("sos_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              sos_module.delete_sos(req.body.sos_id, function (error, message1) {
                res.json({ status: !error, message: message1 });
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("sos_id") == false) {
            res.json({ status: false, message: "sos_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //END OF DELETE SOS

    app.post('/v1/search_sos_by_phoneno', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("phone_number") &&
          req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              sos_module.search_sos_by_phoneno(req.body.phone_number, function (result, error, message) {
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
          if (req.body.hasOwnProperty("phone_number") == false) {
            res.json({ status: false, message: "phone_number parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    app.post('/v1/get_sos_by_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("unit_id") &&
          req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              sos_module.get_sos_by_unit(req.body.unit_id, function (result, error, message) {
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
          if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

  }
}