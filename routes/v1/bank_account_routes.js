module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var banking_module = require('../../modules/v1/bank_account_module')(mongo, ObjectID, url, assert, dbb, db);

    app.post('/v1/add_bank_account', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("bank_account") &&
          req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              banking_module.add_bank_account(req.body.building_id, JSON.parse(req.body.bank_account), function (error, message1) {
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
          if (req.body.hasOwnProperty("bank_account") == false) {
            res.json({ status: false, message: "bank_account parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    app.post('/v1/view_bank_accounts', ensureAuthorized, function (req, res) {
      try {
        if (
          req.body.hasOwnProperty("building_id") &&
          req.headers.hasOwnProperty("user-token")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              banking_module.view_bank_accounts(req.body.building_id, function (bank_accounts, error, message) {
                if (error) {
                  console.log(error)
                  res.json({ status: false, message: message, result: null });
                } else {
                  res.json({ status: true, message: message, result: bank_accounts });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });


    app.post('/v1/view_bank_account_roles', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              banking_module.view_bank_account_roles(function (result, error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    })

    app.post('/v1/delete_bank_account', ensureAuthorized, function (req, res) {
      try {
        if (
          req.headers.hasOwnProperty("user-token") && 
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("bank_account_id") 
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              banking_module.delete_bank_account(req.body.building_id, req.body.bank_account_id, function ( error, message1) {
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
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    })
  }
}