
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var classified_module = require('../../modules/v1/classified_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add classified Details

    //headers : user-token (admin/super admin)
    // params :
    // ad_name
    // ad_desc
    // ad_images
    // ad_contact_number
    // ad_contact_person

    //Functions: create_classified_ad
    //Response: status, message, result
    app.post('/v1/create_classified_ad', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("ad_name")
          && req.body.hasOwnProperty("ad_desc")
          && req.body.hasOwnProperty("ad_images")
          && req.body.hasOwnProperty("ad_contact_person")
          && req.body.hasOwnProperty("ad_contact_number")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              var new_classified = {
                ad_name: req.body.ad_name,
                ad_desc: req.body.ad_desc,
                ad_images: JSON.parse(req.body.ad_images),
                ad_contact_person: req.body.ad_contact_person,
                ad_contact_number: req.body.ad_contact_number,
                posted_by: new ObjectID(user_id),
                building_id: new ObjectID(req.body.building_id),
                posted_on: new Date(),
                active: true,
              };
              classified_module.create_classified_ad(new_classified, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result.insertedId });
                }
              })

            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("ad_name") == false) {
            res.json({ status: false, message: "ad_name parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_desc") == false) {
            res.json({ status: false, message: "ad_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_images") == false) {
            res.json({ status: false, message: "ad_images parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_contact_person") == false) {
            res.json({ status: false, message: "ad_contact_person parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_contact_number") == false) {
            res.json({ status: false, message: "ad_contact_number parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add classified Details


    //API for Update classified Details

    // Params: user-token (header)
    // ad_name
    // ad_desc
    // ad_images
    // ad_contact_number
    // ad_contact_person
    // ad_id

    //Functions: update_classified_ad
    //Response: status, message, result

    app.post('/v1/update_classified_ad', ensureAuthorized, function (req, res) {
      try {
        if (
          req.body.hasOwnProperty("ad_id")
          && req.body.hasOwnProperty("ad_name")
          && req.body.hasOwnProperty("ad_desc")
          && req.body.hasOwnProperty("ad_images")
          && req.body.hasOwnProperty("ad_contact_person")
          && req.body.hasOwnProperty("ad_contact_number")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              classified_module.update_classified_ad(
                req.body.ad_id,
                req.body.ad_name,
                req.body.ad_desc,
                req.body.ad_images,
                req.body.ad_contact_person,
                req.body.ad_contact_number,
                user_id,
                req.body.building_id,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  }
                  else {
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
          if (req.body.hasOwnProperty("ad_id") == false) {
            res.json({ status: false, message: "ad_id parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_name") == false) {
            res.json({ status: false, message: "ad_name parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_desc") == false) {
            res.json({ status: false, message: "ad_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_images") == false) {
            res.json({ status: false, message: "ad_images parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_contact_person") == false) {
            res.json({ status: false, message: "ad_contact_person parameter is missing" });
          } else if (req.body.hasOwnProperty("ad_contact_number") == false) {
            res.json({ status: false, message: "ad_contact_number parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Update classified Details


    //API for View All Classified Details

    //Params: user-token
    //Functions: get_classifieds
    //Response: status, message, result

    app.post('/v1/get_classifieds', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              classified_module.get_classifieds(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result, totaldata: total, total: result.length });
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
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All classified Details


    //API for View User All Classified Details

    //Params: user-token
    //Functions: get_user_classifieds
    //Response: status, message, result

    app.post('/v1/get_user_classifieds', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              classified_module.get_user_classifieds(req.body.starting_after, req.body.limit, user_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result, totaldata: total, total: result.length });
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
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View User All classified Details


    //API for Delete Single classified Details

    //Params: user-token,ad_id
    //Functions: delete_classified_ad
    //Response: status, message, result

    app.post('/v1/delete_classified_ad', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("ad_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              classified_module.delete_classified_ad(req.body.ad_id, function (error, message) {
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
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("ad_id") == false) {
            res.json({ status: false, message: "ad_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Delete Single classified Details


    //API: delete_user_classified
    //Headers: user-token
    //Params: ad_id
    app.post('/v1/delete_user_classified', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("ad_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              classified_module.delete_user_classified(req.body.ad_id, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("ad_id") == false) {
            res.json({ status: false, message: "ad_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })
  }
}
