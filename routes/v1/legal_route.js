const { app } = require('firebase-admin');

module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var legal_module = require('../../modules/v1/legal_module')(mongo, ObjectID, url, assert, dbb, db);


    app.post('/v1/get_terms_conditions', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              legal_module.get_terms_conditions(function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })


    app.post('/v1/get_privacy_policy', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              legal_module.get_privacy_policy(function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
  }
}