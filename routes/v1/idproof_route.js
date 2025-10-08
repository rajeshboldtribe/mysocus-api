
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var idproof_module = require('../../modules/v1/idproof_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add Idproof Details
    //headers : user-token (admin/super admin)
    // params :
    // proof_name
    //Functions: add_id_proof
    //Response: status, message, result
    app.post('/v1/add_id_proof', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("proof_name")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              var new_idproof = {
                proof_name: req.body.proof_name,
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true,
              };
              idproof_module.add_id_proof(new_idproof, function (result, error, message) {
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
          if (req.body.hasOwnProperty("proof_name") == false) {
            res.json({ status: false, message: "proof_name parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }

        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Idproof Details


    //API for Update Idproof Details

    //Params: proof_id, proof_name, user-token (header)
    //Functions: update_id_proof
    //Response: status, message, result

    app.post('/v1/update_id_proof', ensureAuthorized, function (req, res) {
      try {
        if (
          req.body.hasOwnProperty("proof_name")
          && req.body.hasOwnProperty("proof_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              idproof_module.update_id_proof(
                req.body.proof_id,
                req.body.proof_name,
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
          if (req.body.hasOwnProperty("proof_id") == false) {
            res.json({ status: false, message: "proof_id parameter is missing" });
          } else if (req.body.hasOwnProperty("proof_name") == false) {
            res.json({ status: false, message: "proof_name parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Update Idproof Details


    //API for View All Id proof Details

    //Params: user-token
    //Functions: view_all_idproof
    //Response: status, message, result

    app.post('/v1/view_all_proofs', ensureAuthorized, function (req, res) {
      try {
        idproof_module.view_all_idproof(function (result, error, message) {
          if (error) {
            res.json({ status: false, message: message });
          } else {
            res.json({ status: true, message: message, result: result });
          }
        })
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of View All Idproof Details



    //API for Delete Single Idproof Details

    //Params: user-token,proof_id,building_id
    //Functions: delete_id_proof
    //Response: status, message, result

    app.post('/v1/delete_id_proof', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("proof_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A')) {
              idproof_module.delete_id_proof(req.body.proof_id, function (error, message) {
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
            res.json({ status: false, message: "user-token parameter missing" });
          } else {
            res.json({ status: false, message: "proof_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Delete Single Idproof Details
  }
}
