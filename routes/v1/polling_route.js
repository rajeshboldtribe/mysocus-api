module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var polling_module = require('../../modules/v1/polling_module')(mongo, ObjectID, url, assert, dbb, db);

    app.post('/v1/create_poll', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("question") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("options") &&
          req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              var new_poll = {
                question: req.body.question,
                building_id: new ObjectID(req.body.building_id),
                options: JSON.parse(req.body.options),
                answers: [],
                active: true,
                created_by: new ObjectID(user_id),
                created_on: new Date()
              }
              polling_module.create_poll(new_poll, function (error, message) {
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
          if (req.body.hasOwnProperty("question") == false) {
            res.json({ status: false, message: "question parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("options") == false) {
            res.json({ status: false, message: "options parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    app.post('/v1/delete_poll', ensureAuthorized, function (req, res) {
      try {
        if (
          req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("poll_id")
        ) {
          console.log(req.body);
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              polling_module.delete_poll(req.body.poll_id, function (error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1 });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("poll_id") == false) {
            res.json({ status: false, message: "poll_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    app.post('/v1/poll_answered', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("poll_id") &&
          req.body.hasOwnProperty("selected_option") &&
          req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'SR')) {
              polling_module.poll_answered(req.body.poll_id, parseInt(req.body.selected_option), user_id, function (error, message) {
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
          if (req.body.hasOwnProperty("poll_id") == false) {
            res.json({ status: false, message: "poll_id parameter is missing" });
          } else if (req.body.hasOwnProperty("selected_option") == false) {
            res.json({ status: false, message: "selected_option parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });

    app.post('/v1/get_active_polls', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              polling_module.get_poll(req.body.building_id, function (result, error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    app.post('/v1/get_poll', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              polling_module.get_poll(req.body.building_id, function (result, error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    app.post('/v1/get_poll_result', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("poll_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              polling_module.get_poll_result(req.body.poll_id, function (result, error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1, result: result })
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.body.hasOwnProperty("poll_id") == false) {
            res.json({ status: false, message: "poll_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

  }
}