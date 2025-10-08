
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var employee_module = require('../../modules/v1/employee_module')(mongo, ObjectID, url, assert, dbb, db);
    var user_module = require('../../modules/v1/user_module')(mongo, ObjectID, url, assert, dbb, db);
    var building_module = require('../../modules/v1/building_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for Add Employee Details

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // employee_name
    // employee_designation
    // employee_img
    // employee_contact_info
    // employee_id_proof
    // employee_code(optional)
    // employee_email(optional)
    // employee_salary_amount
    // employee_bank_account_no
    // employee_bank_name
    // employee_bank_ifsc_code
    // employee_bank_branch
    // is_provided_by_vendor
    // vendor_id
    // active

    //Functions: add_employee,add_user
    //Response: status, message, result


    app.post('/v1/add_employee', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("employee_name")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("employee_designation")
          && req.body.hasOwnProperty("employee_img")
          && req.body.hasOwnProperty("employee_contact_info")
          && req.body.hasOwnProperty("employee_id_proof")
          && req.body.hasOwnProperty("employee_salary_amount")
          && req.body.hasOwnProperty("employee_bank_name")
          && req.body.hasOwnProperty("employee_bank_account_no")
          && req.body.hasOwnProperty("employee_bank_ifsc_code")
          && req.body.hasOwnProperty("employee_bank_branch")
          && req.body.hasOwnProperty("is_provided_by_vendor")
          && req.body.hasOwnProperty("departments")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              user = user_id
              employee_module.check_employee_info_exists(req.body.employee_email, req.body.employee_contact_info, function (exists, existsMessage) {
                if (exists) {
                  res.json({ status: true, message: 'User Already Exits', active: false });
                }
                else {
                  var empDepts = [];
                  if (req.body.departments != undefined) {
                    var employeeDeptArray = JSON.parse(req.body.departments);
                    for (var dept of employeeDeptArray) {
                      empDepts.push(new ObjectID(dept));
                    }
                  }

                  if (req.body.vendor_id == '') {

                    var new_employee = {
                      employee_name: req.body.employee_name,
                      employee_designation: req.body.employee_designation,
                      employee_img: req.body.employee_img,
                      employee_contact_info: parseInt(req.body.employee_contact_info),
                      employee_id_proof: JSON.parse(req.body.employee_id_proof),
                      employee_code: req.body.employee_code,
                      employee_email: req.body.employee_email.trim().toLowerCase(),
                      employee_salary_amount: req.body.employee_salary_amount,
                      employee_bank_account_no: req.body.employee_bank_account_no,
                      employee_bank_name: req.body.employee_bank_name,
                      employee_bank_ifsc_code: req.body.employee_bank_ifsc_code,
                      employee_bank_branch: req.body.employee_bank_branch,
                      is_provided_by_vendor: req.body.is_provided_by_vendor,
                      departments: empDepts,
                      building_id: new ObjectID(req.body.building_id),
                      total_rating_sum: 0,
                      total_rating_count: 0,
                      created_by: new ObjectID(user),
                      created_on: new Date(),
                      active: true,
                    };
                  }
                  else {
                    var new_employee = {
                      employee_name: req.body.employee_name,
                      employee_designation: req.body.employee_designation,
                      employee_img: req.body.employee_img,
                      employee_contact_info: parseInt(req.body.employee_contact_info),
                      employee_id_proof: JSON.parse(req.body.employee_id_proof),
                      employee_code: req.body.employee_code,
                      employee_email: req.body.employee_email.trim().toLowerCase(),
                      employee_salary_amount: req.body.employee_salary_amount,
                      employee_bank_account_no: req.body.employee_bank_account_no,
                      employee_bank_name: req.body.employee_bank_name,
                      employee_bank_ifsc_code: req.body.employee_bank_ifsc_code,
                      employee_bank_branch: req.body.employee_bank_branch,
                      departments: empDepts,
                      is_provided_by_vendor: req.body.is_provided_by_vendor,
                      vendor_id: new ObjectID(req.body.vendor_id),
                      building_id: new ObjectID(req.body.building_id),
                      total_rating_sum: 0,
                      total_rating_count: 0,
                      created_by: new ObjectID(user),
                      created_on: new Date(),
                      active: true,
                    };
                  }
                  employee_module.add_employee(new_employee, function (result, error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    }
                    else {
                      var new_user = {
                        email: req.body.employee_email,
                        password: 'qwerty',
                        mobile: parseInt(req.body.employee_contact_info),
                        user_type: 'E',
                        user_id: new ObjectID(result.insertedId),
                        user_token: 'E',
                        fcm_token: req.body.fcm_token,
                        created_by: new ObjectID(user),
                        created_on: new Date(),
                        active: true,
                      };
                      user_module.add_user(new_user, function (result, error, message) {
                        if (error) {
                          res.json({ status: false, message: message, active: true });
                        }
                        else {
                          res.json({ status: true, message: message, result: result.insertedId, active: true });
                        }
                      })
                    }
                  })
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("employee_contact_info") == false) {
            res.json({ status: false, message: "employee_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_img") == false) {
            res.json({ status: false, message: "employee_img parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_name") == false) {
            res.json({ status: false, message: "employee_name parameter is missing" });
          } else if (req.body.hasOwnProperty("departments") == false) {
            res.json({ status: false, message: "departments parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_designation") == false) {
            res.json({ status: false, message: "employee_designation parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_id_proof") == false) {
            res.json({ status: false, message: "employee_id_proof parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_salary_amount") == false) {
            res.json({ status: false, message: "employee_salary_amount parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_name") == false) {
            res.json({ status: false, message: "employee_bank_name parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_account_no") == false) {
            res.json({ status: false, message: "employee_bank_account_no parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_ifsc_code") == false) {
            res.json({ status: false, message: "employee_bank_ifsc_code parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_branch") == false) {
            res.json({ status: false, message: "employee_bank_branch parameter is missing" });
          } else if (req.body.hasOwnProperty("is_provided_by_vendor") == false) {
            res.json({ status: false, message: "is_provided_by_vendor parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }

        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Employee Details


    //Start of Add Admin Employee

    app.post('/v1/add_admin_employee', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("employee_name")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("employee_img")
          && req.body.hasOwnProperty("employee_contact_info")
          && req.body.hasOwnProperty("employee_email")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA')) {
              user = user_id
              employee_module.check_employee_info_exists(req.body.employee_email.trim().toLowerCase(), req.body.employee_contact_info, function (exists, existsMessage) {
                if (exists) {
                  res.json({ status: true, message: 'User Already Exits' });
                } else {
                  var empDepts = [];
                  if (req.body.departments != undefined) {
                    var employeeDeptArray = JSON.parse(req.body.departments);
                    for (var dept of employeeDeptArray) {
                      empDepts.push(new ObjectID(dept));
                    }
                  }
                  var new_employee = {
                    employee_name: req.body.employee_name,
                    employee_designation: "Owner",
                    employee_img: req.body.employee_img,
                    employee_contact_info: parseInt(req.body.employee_contact_info),
                    employee_email: req.body.employee_email.trim().toLowerCase(),
                    employee_id_proof: "",
                    employee_code: "",
                    employee_salary_amount: "",
                    employee_bank_account_no: "",
                    employee_bank_name: "",
                    employee_bank_ifsc_code: "",
                    employee_bank_branch: "",
                    is_provided_by_vendor: false,
                    vendor_id: "",
                    building_id: new ObjectID(req.body.building_id),
                    departments: empDepts,
                    created_by: new ObjectID(user),
                    created_on: new Date(),
                    active: true,
                  };
                  employee_module.add_employee(new_employee, function (result, error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    }
                    else {
                      var new_user = {
                        email: req.body.employee_email.trim().toLowerCase(),
                        password: "qwerty",
                        mobile: parseInt(req.body.employee_contact_info),
                        user_type: 'A',
                        user_id: new ObjectID(result.insertedId),
                        user_token: 'E',
                        created_by: new ObjectID(user),
                        created_on: new Date(),
                        active: true,
                      };
                      user_module.add_user(new_user, function (result, error, message) {
                        if (error) {
                          res.json({ status: false, message: message, active: true });
                        } else {
                          building_module.update_admin_details(req.body.building_id, result.insertedId, function (building_name, error, message) {
                            if (error) {
                              res.json({ status: false, message: message, active: true });
                            } else {
                              var subject = 'Log In Credentials'
                              console.log(building_name);
                              admin_module.sendEmail(req.body.employee_email.trim().toLowerCase(), subject, req.body.employee_name, building_name, function (error, message) {
                                if (error) {
                                  res.json({ status: false, message: message });
                                }
                                else {
                                  res.json({ status: true, message: "Admin Assigned Successfully & Invitation Sent Successfully", result: "", active: true });
                                }
                              })
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("employee_contact_info") == false) {
            res.json({ status: false, message: "employee_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_img") == false) {
            res.json({ status: false, message: "employee_img parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_name") == false) {
            res.json({ status: false, message: "employee_name parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Admin Employee


    //API for Update Employee Details

    //headers : user-token (admin/super admin)
    // params :
    // employee_id:
    // building_id
    // employee_name
    // employee_designation
    // employee_img
    // employee_contact_info
    // employee_id_proof
    // employee_code(optional)
    // employee_email(optional)
    // employee_salary_amount
    // employee_bank_account_no
    // employee_bank_name
    // employee_bank_ifsc_code
    // employee_bank_branch
    // is_provided_by_vendor
    // vendor_id
    // active

    //Functions: update_employee,update_user
    //Response: status, message, result


    app.post('/v1/update_employee', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("employee_name")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("employee_designation")
          && req.body.hasOwnProperty("employee_img")
          && req.body.hasOwnProperty("employee_contact_info")
          && req.body.hasOwnProperty("employee_id_proof")
          && req.body.hasOwnProperty("employee_salary_amount")
          && req.body.hasOwnProperty("employee_bank_name")
          && req.body.hasOwnProperty("employee_bank_account_no")
          && req.body.hasOwnProperty("employee_bank_ifsc_code")
          && req.body.hasOwnProperty("employee_bank_branch")
          && req.body.hasOwnProperty("is_provided_by_vendor")
          && req.body.hasOwnProperty("departments")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              user = user_id;
              var empDepts = [];
              if (req.body.departments != undefined) {
                var employeeDeptArray = JSON.parse(req.body.departments);
                for (var dept of employeeDeptArray) {
                  empDepts.push(new ObjectID(dept));
                }
              }
              employee_module.update_employee(
                req.body.employee_id,
                req.body.building_id,
                req.body.employee_name,
                req.body.employee_designation,
                req.body.employee_img,
                req.body.employee_contact_info,
                req.body.employee_id_proof,
                req.body.employee_code,
                req.body.employee_email.trim().toLowerCase(),
                req.body.employee_salary_amount,
                req.body.employee_bank_account_no,
                req.body.employee_bank_name,
                req.body.employee_bank_ifsc_code,
                req.body.employee_bank_branch,
                req.body.is_provided_by_vendor,
                req.body.vendor_id,
                empDepts,
                user, function (result, error, message) {
                  res.json({ status: !error, message: message });
                })

            }
            else {
              console.log("used not allowed")
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("employee_contact_info") == false) {
            res.json({ status: false, message: "employee_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_img") == false) {
            res.json({ status: false, message: "employee_img parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_name") == false) {
            res.json({ status: false, message: "employee_name parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_designation") == false) {
            res.json({ status: false, message: "employee_designation parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_id_proof") == false) {
            res.json({ status: false, message: "employee_id_proof parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_salary_amount") == false) {
            res.json({ status: false, message: "employee_salary_amount parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_name") == false) {
            res.json({ status: false, message: "employee_bank_name parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_account_no") == false) {
            res.json({ status: false, message: "employee_bank_account_no parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_ifsc_code") == false) {
            res.json({ status: false, message: "employee_bank_ifsc_code parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_bank_branch") == false) {
            res.json({ status: false, message: "employee_bank_branch parameter is missing" });
          } else if (req.body.hasOwnProperty("is_provided_by_vendor") == false) {
            res.json({ status: false, message: "is_provided_by_vendor parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("departments") == false) {
            res.json({ status: false, message: "departments parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Update Employee Details


    //API for View All Employee Details

    //Params: user-token
    //Functions: view_all_employees
    //Response: status, message, result

    app.post('/v1/view_all_employees', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              employee_module.view_all_employees(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
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

          else if (req.body.hasOwnProperty("building_id") == false) {

            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Employee Details



    //API for View Single Employee Details

    //Params: user-token,employee_id
    //Functions: view_single_employee
    //Response: status, message, result

    app.post('/v1/view_single_employee', ensureAuthorized, function (req, res) {
      try {

        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("employee_id")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              employee_module.view_single_employee(req.body.employee_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result });
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
          else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View Single Employee Details



    //API for Delete  Employee Details

    //Params: user-token,employee_id,building_id
    //Functions: delete_employee
    //Response: status, message, result

    app.post('/v1/delete_employee', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("building_id")

        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              employee_module.delete_employee(req.body.employee_id, req.body.building_id, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {

                  res.json({ status: true, message: message });
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
          else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter missing" });
          }
          else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Delete  Employee Details


    //API for Update Employee Department Details

    //headers : user-token (admin/super admin)
    // params :
    // employee_id:
    // building_id
    // employee_departments

    //Functions: update_employee_department
    //Response: status, message, result


    app.post('/v1/update_employee_department', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("employee_departments")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              user = user_id
              employee_module.update_employee_department(req.body.employee_id,
                req.body.building_id,
                req.body.employee_departments,
                user
                , function (result, error, message) {
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
          if (req.body.hasOwnProperty("employee_departments") == false) {
            res.json({ status: false, message: "employee_departments parameter is missing" });
          }
          else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter is missing" });
          }

          else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }

          else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }

        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Update Employee Department Details


    //API for Update Employee Vehicles Details

    //headers : user-token (admin/super admin)
    // params :
    // employee_id:
    // building_id
    // employee_vehicles

    //Functions: update_employee_vehicles
    //Response: status, message, result


    app.post('/v1/update_employee_vehicles', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("employee_vehicles")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              user = user_id
              employee_module.update_employee_vehicles(req.body.employee_id,
                req.body.building_id,
                req.body.employee_vehicles,
                user
                , function (result, error, message) {
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
          if (req.body.hasOwnProperty("employee_vehicles") == false) {
            res.json({ status: false, message: "employee_vehicles parameter is missing" });
          } else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Update Employee Vehicles Details

    app.post('/v1/employee_visitor_entry', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("entry_time")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              let employee_entry = {
                employee_id: new ObjectID(req.body.employee_id),
                building_id: new ObjectID(req.body.building_id),
                entry_time: new Date(req.body.entry_time),
                exit_time: null
              }
              employee_module.employee_visitor_entry(employee_entry, function (result, error, message) {
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
          if (req.body.hasOwnProperty("keyword") == false) {
            res.json({ status: false, message: "keyword parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    app.post('/v1/search_employee', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("keyword")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              employee_module.search_employee(req.body.keyword, req.body.building_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("keyword") == false) {
            res.json({ status: false, message: "keyword parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    // Api For Change Password

    app.post('/v1/change_password', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("new_password")
          && req.body.hasOwnProperty("old_password")
        ) {
          admin_module.checkUserExistsAndGetUserID(req.token, function (exists, user_id, error, message) {
            if (!error) {
              if (exists) {
                employee_module.change_password(user_id, req.body.new_password, req.body.old_password, function (error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  }
                  else {
                    res.json({ status: true, message: message });
                  }
                })
              }
              else {
                res.json({ status: false, message: message });
              }
            } else {
              res.json({ status: false, message: message });
            }

          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          }
          else if (req.body.hasOwnProperty("new_password") == false) {
            res.json({ status: false, message: "new_password parameter missing" });
          }
          else if (req.body.hasOwnProperty("old_password") == false) {
            res.json({ status: false, message: "old_password parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    // End Of Change Password

    //API : update_employee_password
    //Headers: user-token
    //Params: employee_id, password
    app.post('/v1/update_employee_password', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("employee_id")
          && req.body.hasOwnProperty("password")) {
          admin_module.userExists(req.token, function (user_id, result, userExists, userExistsMessage) {
            if (userExists && (result == 'A' || result == 'E')) {
              employee_module.update_employee_password(req.body.employee_id, req.body.password, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("employee_id") == false) {
            res.json({ status: false, message: "employee_id parameter missing" });
          } else if (req.body.hasOwnProperty("password") == false) {
            res.json({ status: false, message: "password parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })



    
  }
}
