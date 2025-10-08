

module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var resident_module = require('../../modules/v1/resident_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add Resident Details

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // resident_name
    // resident_img
    // resident_email
    // resident_contact_info
    // resident_sec_contact_info(optional)
    // resident_permanent_address
    // resident_id_proof(Array of objects)
    // resident_vehcile_details(Array of objects)
    // unit_id
    // is_owner

    //Functions: add_resident,add_user
    //Response: status, message, result

    app.post('/v1/add_resident', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("resident_name")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("resident_email")
          && req.body.hasOwnProperty("resident_img")
          && req.body.hasOwnProperty("resident_contact_info")
          && req.body.hasOwnProperty("resident_id_proof")
          && req.body.hasOwnProperty("resident_permanent_address")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("is_owner")
          && req.body.hasOwnProperty("is_residing")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              var user = user_id;
              resident_module.checkResidentExists(req.body.resident_email, req.body.resident_contact_info, req.body.building_id, function (residentExist, checkResidentError, residentErrorMessage) {
                if (checkResidentError) {
                  res.json({ status: false, message: residentErrorMessage });
                } else {
                  if (residentExist) {
                    res.json({ status: false, message: "User Already Exists" });
                  } else {
                    var new_resident = {
                      resident_name: req.body.resident_name,
                      resident_email: req.body.resident_email.toLowerCase(),
                      resident_img: req.body.resident_img,
                      resident_contact_info: req.body.resident_contact_info,
                      resident_sec_contact_info: req.body.resident_sec_contact_info,
                      resident_id_proof: JSON.parse(req.body.resident_id_proof),
                      resident_permanent_address: req.body.resident_permanent_address,
                      resident_vehicle_details: [],
                      is_sub_resident: false,
                      is_owner: req.body.is_owner,
                      is_residing: req.body.is_residing,
                      unit_id: new ObjectID(req.body.unit_id),
                      building_id: new ObjectID(req.body.building_id),
                      created_by: new ObjectID(user),
                      created_on: new Date(),
                      active: true
                    };

                    resident_module.add_resident(new_resident, function (result, error, message) {
                      if (error) {
                        res.json({ status: false, message: message });
                      } else {
                        if (req.body.is_sub_resident == true) {
                          user_type = 'SR';
                        } else {
                          user_type = 'R';
                        }
                        var new_user = {
                          email: req.body.resident_email,
                          password: 'qwerty',
                          mobile: parseInt(req.body.resident_contact_info),
                          user_type: user_type,
                          user_id: new ObjectID(result.insertedId),
                          user_token: 'R',
                          fcm_token: req.body.fcm_token,
                          created_by: new ObjectID(user),
                          created_on: new Date(),
                          active: true
                        };
                        user_module.add_user(new_user, function (result, error, message) {
                          if (error) {
                            res.json({ status: false, message: message, active: true });
                          } else {
                            res.json({ status: true, message: message, result: result.insertedId, active: true });
                          }
                        })
                      }
                    })
                  }
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("resident_name") == false) {
            res.json({ status: false, message: "resident_name parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_email") == false) {
            res.json({ status: false, message: "resident_email parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_img") == false) {
            res.json({ status: false, message: "resident_img parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_contact_info") == false) {
            res.json({ status: false, message: "resident_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id_proof") == false) {
            res.json({ status: false, message: "resident_id_proof parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_permanent_address") == false) {
            res.json({ status: false, message: "resident_permanent_address parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("is_owner") == false) {
            res.json({ status: false, message: "is_owner parameter is missing" });
          } else if (req.body.hasOwnProperty("is_residing") == false) {
            res.json({ status: false, message: "is_residing parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Resident Details


    //API for Create Resident Details

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // unit_id
    // resident_email
    // resident_contact_info
    // is_owner
    // is_sub_resident

    //Functions: create_resident,add_user
    //Response: status, message, result

    app.post('/v1/create_resident', ensureAuthorized, function (req, res) {
      try {
        var user_type
        var value
        if (
          req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("resident_email")
          && req.body.hasOwnProperty("resident_contact_info")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("is_sub_resident")
          && req.body.hasOwnProperty("is_owner")
          && req.body.hasOwnProperty("is_residing")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              user = user_id
              resident_module.checkResidentExists(req.body.resident_email, req.body.resident_contact_info, req.body.building_id, function (residentExists, checkResidentError, residentMessage) {
                if (checkResidentError) {
                  res.json({ status: false, message: residentMessage });
                } else {
                  if (residentExists) {
                    res.json({ status: false, message: "User Already Exists" });
                  } else {
                    var new_resident = {
                      resident_email: req.body.resident_email.toLowerCase(),
                      resident_contact_info: req.body.resident_contact_info,
                      is_sub_resident: req.body.is_sub_resident,
                      is_owner: req.body.is_owner,
                      is_residing: req.body.is_residing,
                      unit_id: new ObjectID(req.body.unit_id),
                      building_id: new ObjectID(req.body.building_id),
                      created_by: new ObjectID(user),
                      created_on: new Date(),
                      active: true
                    };
                    resident_module.create_resident(new_resident, function (result, error, message, building_name) {
                      if (error) {
                        res.json({ status: false, message: message });
                      } else {
                        if (req.body.is_sub_resident == true) {
                          user_type = 'SR';
                        } else {
                          user_type = 'R';
                        }
                        var new_user = {
                          email: req.body.resident_email,
                          password: '',
                          mobile: req.body.resident_contact_info,
                          user_type: user_type,
                          user_id: new ObjectID(result.insertedId),
                          user_token: user_type,
                          fcm_token: req.body.fcm_token,
                          created_by: new ObjectID(user),
                          created_on: new Date(),
                          active: true
                        };

                        user_module.add_user(new_user, function (result2, error, message) {
                          if (error) {
                            res.json({ status: false, message: message, active: true });
                          } else {
                            resident_module.sendEmail(result.insertedId, req.body.building_id, req.body.unit_id, req.body.resident_email, req.body.resident_contact_info, req.body.is_owner, req.body.is_sub_resident, req.body.is_residing, building_name, function (error, message) {
                              if (error) {
                                res.json({ status: false, message: message });
                              } else {
                                res.json({ status: true, message: message });
                              }

                            })
                          }
                        })
                      }
                    })
                  }
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }

        else {

          if (req.body.hasOwnProperty("is_sub_resident") == false) {
            res.json({ status: false, message: "is_sub_resident parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_email") == false) {
            res.json({ status: false, message: "resident_email parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_contact_info") == false) {
            res.json({ status: false, message: "resident_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("is_owner") == false) {
            res.json({ status: false, message: "is_owner parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else {
            res.json({ status: false, message: "is_residing parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Create Resident Details


    //API for Update Resident Details

    //headers : user-token (admin/super admin)
    // params :
    // resident_id:
    // building_id
    // resident_name
    // resident_img
    // resident_email
    // resident_contact_info
    // resident_sec_contact_info(optional)
    // resident_permanent_address
    // resident_id_proof(Array of objects)
    // resident_vehcile_details(Array of objects)
    // unit_id
    // is_owner

    //Functions: update_resident,update_user
    //Response: status, message, result
    app.post('/v1/update_resident', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("resident_name")
          && req.body.hasOwnProperty("resident_img")
          && req.body.hasOwnProperty("resident_contact_info")
          && req.body.hasOwnProperty("resident_permanent_address")
          && req.body.hasOwnProperty("is_residing")
          && req.body.hasOwnProperty("is_owner")
          && req.body.hasOwnProperty("is_sub_resident")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.update_resident(
                req.body.resident_id,
                req.body.resident_name,
                req.body.resident_img,
                req.body.resident_contact_info,
                req.body.resident_sec_contact_info,
                req.body.resident_permanent_address,
                req.body.is_residing,
                req.body.is_owner,
                req.body.is_sub_resident,
                req.body.resident_id_proof,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    user_module.update_user(req.body.resident_id,
                      req.body.resident_contact_info,
                      user_id, function (result, error, message) {
                        if (error) {
                          res.json({ status: false, message: message });
                        }
                        else {
                          res.json({ status: true, message: message, result: result.insertedId });
                        }
                      })
                  }
                })
            } else {
              res.json({ status: false, message: message });
            }
          });
        }
        else {
          if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_name") == false) {
            res.json({ status: false, message: "resident_name parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_email") == false) {
            res.json({ status: false, message: "resident_email parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_img") == false) {
            res.json({ status: false, message: "resident_img parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_contact_info") == false) {
            res.json({ status: false, message: "resident_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id_proof") == false) {
            res.json({ status: false, message: "resident_id_proof parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_permanent_address") == false) {
            res.json({ status: false, message: "resident_permanent_address parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("is_owner") == false) {
            res.json({ status: false, message: "is_owner parameter is missing" });
          } else if (req.body.hasOwnProperty("is_residing") == false) {
            res.json({ status: false, message: "is_residing parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Update Resident Details


    //API for Update Resident Details Mobile

    //headers : user-token (admin/super admin)
    // params :
    // resident_id:
    // building_id
    // resident_name
    // resident_img
    // resident_email
    // resident_contact_info
    // resident_sec_contact_info(optional)
    // resident_permanent_address
    // resident_id_proof(Array of objects)
    // resident_vehcile_details(Array of objects)
    // unit_id
    // is_owner

    //Functions: update_resident,update_user
    //Response: status, message, result
    app.post('/v1/update_resident_mobile', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("resident_name")
          && req.body.hasOwnProperty("resident_img")
          && req.body.hasOwnProperty("resident_contact_info")
          && req.body.hasOwnProperty("resident_permanent_address")
          && req.body.hasOwnProperty("is_residing")
          && req.body.hasOwnProperty("is_owner")
          && req.body.hasOwnProperty("is_sub_resident")
          && req.body.hasOwnProperty("resident_id_proof")
          && req.body.hasOwnProperty("password")) {

          // admin_module.userExists(req.token, function (user_id, result, exists, message) {
          //   if (exists) {
              resident_module.update_resident_mobile(
                req.body.resident_id,
                req.body.resident_name,
                req.body.resident_img,
                req.body.resident_contact_info,
                req.body.resident_sec_contact_info,
                req.body.resident_permanent_address,
                req.body.is_residing,
                req.body.is_owner,
                req.body.is_sub_resident,
                req.body.resident_id_proof,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    user_module.update_user_mobile(req.body.resident_id, req.body.resident_contact_info, req.body.password,function (result, error, message) {
                        if (error) {
                          res.json({ status: false, message: message });
                        }
                        else {
                          res.json({ status: true, message: message, result: result.insertedId });
                        }
                      })
                  }
                })
          //   } else {
          //     res.json({ status: false, message: message });
          //   }
          // });
        }
        else {
          if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_name") == false) {
            res.json({ status: false, message: "resident_name parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_email") == false) {
            res.json({ status: false, message: "resident_email parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_img") == false) {
            res.json({ status: false, message: "resident_img parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_contact_info") == false) {
            res.json({ status: false, message: "resident_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_id_proof") == false) {
            res.json({ status: false, message: "resident_id_proof parameter is missing" });
          } else if (req.body.hasOwnProperty("resident_permanent_address") == false) {
            res.json({ status: false, message: "resident_permanent_address parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("is_owner") == false) {
            res.json({ status: false, message: "is_owner parameter is missing" });
          } else if (req.body.hasOwnProperty("is_residing") == false) {
            res.json({ status: false, message: "is_residing parameter is missing" });
          } else if (req.body.hasOwnProperty("password") == false) {
            res.json({ status: false, message: "password parameter is missing" });
          } else {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Update Resident Mobile


    //API for View All Resident Details

    //Params: user-token
    //Functions: view_all_residents
    //Response: status, message, result

    app.post('/v1/view_all_residents', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("limit")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("starting_after")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'R')) {
              resident_module.view_all_residents(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Resident Details


    //API for Search Resident Details

    //Params: user-token
    //Functions: view_all_residents
    //Response: status, message, result

    app.post('/v1/search_residents', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("keyword")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.search_residents(req.body.keyword, req.body.building_id, function (result, error, message, total) {
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
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Search Resident Details


    //API for View Single Resident Details

    //Params: user-token,resident_id
    //Functions: view_resident
    //Response: status, message, result

    app.post('/v1/view_resident', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("resident_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.view_resident(req.body.resident_id, function (result1, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result1 });
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
          } else {
            res.json({ status: false, message: "resident_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of View Single Resident Details



    //API for Delete Single Resident Details

    //Params: user-token,resident_id,building_id
    //Functions: delete_resident
    //Response: status, message, result

    app.post('/v1/delete_resident', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              resident_module.delete_resident(req.body.resident_id, req.body.building_id, function (error, message) {
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
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id parameter missing" });
          } else {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Delete Single Resident Details

    //Start of Remove Resident

    app.post('/v1/remove_resident', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("resident_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.remove_resident(req.body.resident_id, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: "User not available" });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token missing" });
          } else {
            res.json({ status: false, message: "resident_id missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });
    //End of Add Vehicle to Resident


    //Start of Add Vehicle to Resident

    app.post('/v1/add_vehicle_to_resident', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("resident_vehicle_details")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.add_vehicle_to_resident(req.body.resident_id, req.body.resident_vehicle_details, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: "User not available" });
            }
          })
        } else {
          if (req.body.hasOwnProperty("resident_vehicle_details") == false) {
            res.json({ status: false, message: "resident_vehicle_details missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token missing" });
          } else {
            res.json({ status: false, message: "resident_id_missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });
    //End of Add Vehicle to Resident

    //Start of Remove Vehicle from Resident
    app.post('/v1/remove_vehicle_from_resident', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("resident_id")
          && req.body.hasOwnProperty("resident_vehicle_details")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.remove_vehicle_from_resident(req.body.resident_id, req.body.resident_vehicle_details, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: "User not available" });
            }
          })
        } else {
          if (req.body.hasOwnProperty("resident_vehicle_details") == false) {
            res.json({ status: false, message: "resident_vehicle_details missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token missing" });
          } else {
            res.json({ status: false, message: "resident_id missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });
    //End of Remove Vehicle from Resident

    //Search Resident by Vehicle Number
    app.post('/v1/search_resident_by_vehicle_number', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("vehicle_number")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              resident_module.search_resident_by_vehicle_number(req.body.building_id, req.body.vehicle_number, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message })
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message })
            }
          })
        } else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token missing" });
          } else {
            res.json({ status: false, message: "vehicle_number missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    })
    //End of Search Resident by Vehicle Number

    //Search Resident by Mobile Number
    app.post('/v1/search_resident_by_mobile_number', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("mobile_number")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message1) {
            if (exists) {
              resident_module.search_resident_by_mobile_number(req.body.building_id, req.body.mobile_number, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message })
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message1 })
            }
          })
        } else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token missing" });
          } else {
            res.json({ status: false, message: "mobile_number missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    })
    //End of Search Resident by Mobile Number


    //API to Check if user profile completed
    app.post('/v1/check_profile_completed', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("resident_id")) {
          resident_module.check_profile_completed(req.body.building_id, req.body.resident_id, function (profileCompleted, message) {
            res.json({ status: profileCompleted, message: message });
          })
        } else {
          if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id missing" });
          } else if (req.body.hasOwnProperty("resident_id") == false) {
            res.json({ status: false, message: "resident_id missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: e });
      }
    })
    //End  of API to check if user profile completed

  }
}
