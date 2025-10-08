module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var employee_module = {

    //Start of Add Employee

    add_employee: function (new_employee, callBack) {
      try {

        db.db().collection(dbb.EMPLOYEE).insertOne(new_employee, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          } else {
            callBack(result, false, "Employee Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    employee_visitor_entry: function (employee_entry, callBack) {
      try {

        db.db().collection(dbb.EMPLOYEE_VISITORS).insertOne(employee_entry, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          } else {
            callBack(result, false, "Employee Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add Employee


    //Start of Update Employee

    update_employee: function (
      employee_id,
      building_id,
      employee_name,
      employee_designation,
      employee_img,
      employee_contact_info,
      employee_id_proof,
      employee_code,
      employee_email,
      employee_salary_amount,
      employee_bank_account_no,
      employee_bank_name,
      employee_bank_ifsc_code,
      employee_bank_branch,
      is_provided_by_vendor,
      vendor_id,
      departments,
      modified_by,
      callBack) {
      try {
        if (vendor_id == "" || vendor_id == undefined || vendor_id == null) {
          db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(employee_id) }, {

            $set: {
              employee_name: employee_name,
              employee_designation: employee_designation,
              employee_img: employee_img,
              employee_contact_info: parseInt(employee_contact_info),
              employee_id_proof: JSON.parse(employee_id_proof),
              employee_code: employee_code,
              employee_email: employee_email,
              employee_salary_amount: employee_salary_amount,
              employee_bank_account_no: employee_bank_account_no,
              employee_bank_name: employee_bank_name,
              employee_bank_ifsc_code: employee_bank_ifsc_code,
              employee_bank_branch: employee_bank_branch,
              is_provided_by_vendor: is_provided_by_vendor,
              building_id: new ObjectID(building_id),
              modified_by: new ObjectID(modified_by),
              modified_on: new Date(),
              departments: departments
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              console.log(err);
              callBack(null, true, err);
            } else {
              callBack(result, false, "Employee Details Updated Successfully");
            }

          });
        }
        else {
          db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(employee_id) }, {

            $set: {
              employee_name: employee_name,
              employee_designation: employee_designation,
              employee_img: employee_img,
              employee_contact_info: parseInt(employee_contact_info),
              employee_id_proof: JSON.parse(employee_id_proof),
              employee_code: employee_code,
              employee_email: employee_email,
              employee_salary_amount: employee_salary_amount,
              employee_bank_account_no: employee_bank_account_no,
              employee_bank_name: employee_bank_name,
              employee_bank_ifsc_code: employee_bank_ifsc_code,
              employee_bank_branch: employee_bank_branch,
              is_provided_by_vendor: is_provided_by_vendor,
              vendor_id: new ObjectID(vendor_id),
              building_id: new ObjectID(building_id),
              modified_by: new ObjectID(modified_by),
              modified_on: new Date(),
              departments: departments
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              console.log(err);
              callBack(null, true, err);
            } else {
              callBack(result, false, "Employee Details Updated Successfully");
            }
          });
        }
      } catch (e) {
        console.log(e);
        callBack(null, true, e);
      }
    },
    //End of Update Employee

    //Start of View All Employee

    view_all_employees: function (starting_after, limit, building_id, callBack) {
      try {
        var employeeInfo = [];
        var totaldata;
        var cursor;
        if ((limit == undefined || limit == '') && (starting_after == undefined || starting_after == '')) {
          cursor = db.db().collection(dbb.EMPLOYEE).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.DEPARTMENT, localField: "departments", foreignField: "_id", as: "department_details" } }
          ]).collation({ locale: "en" }).sort({ employee_name: 1 });
        } else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          cursor = db.db().collection(dbb.EMPLOYEE).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.DEPARTMENT, localField: "departments", foreignField: "_id", as: "department_details" } }
          ]).collation({ locale: "en" }).sort({ employee_name: 1 }).skip(starting_after).limit(limit);;
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err, 0);
          } else {
            var departments = [];
            if (doc.department_details != undefined && doc.department_details.length > 0) {
              for (var dept of doc.department_details) {
                departments.push(dept.department_name);
              }
            }

            var emp = {
              "_id": doc._id,
              "employee_name": doc.employee_name,
              "employee_designation": doc.employee_designation,
              "employee_img": doc.employee_img,
              "employee_contact_info": doc.employee_contact_info,
              "employee_email": doc.employee_email,
              "employee_id_proof": doc.employee_id_proof,
              "employee_code": doc.employee_code,
              "employee_salary_amount": doc.employee_salary_amount,
              "employee_bank_account_no": doc.employee_bank_account_no,
              "employee_bank_name": doc.employee_bank_name,
              "employee_bank_ifsc_code": doc.employee_bank_ifsc_code,
              "employee_bank_branch": doc.employee_bank_branch,
              "is_provided_by_vendor": doc.is_provided_by_vendor,
              "employee_rating": doc.total_rating_sum / doc.total_rating_count,
              "vendor_id": doc.vendor_id,
              "building_id": doc.building_id,
              "created_by": doc.created_by,
              "created_on": doc.created_on,
              "active": doc.active,
              "departments": departments
            }
            employeeInfo.push(emp);
          }
        }, function () {
          if (employeeInfo.length == 0) {
            callBack(null, true, "No Employees Found", 0);
          } else {
            db.db().collection(dbb.EMPLOYEE).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(employeeInfo, false, "Employee Found", totaldata);
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Employee


    //Start of View Single Employee

    view_single_employee: function (employee_id, callBack) {
      try {
        employee = [];

        var cursor = db.db().collection(dbb.EMPLOYEE).find({ _id: new ObjectID(employee_id), active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            employee.push(doc);
          }
        }, function () {
          if (employee.length == 0) {
            callBack(null, true, "No Employee  Found");
          } else {
            callBack(employee, false, "Employee  Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View Single Employee


    //Start of Delete Employee

    delete_employee: function (employee_id, building_id, callBack) {
      try {
        employee_id = JSON.parse(employee_id);
        employee = [];

        for (var i = 0; i < employee_id.length; i++) {
          var a = new ObjectID(employee_id[i]);
          employee.push(a)
        }
        db.db().collection(dbb.EMPLOYEE).updateMany({ "_id": { $in: employee }, building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          } else {
            db.db().collection(dbb.USER).updateMany({ "user_id": { $in: employee } }, {
              $set: {
                active: false
              }
            }, { upsert: false }, function (err, result) {
              if (err) {
                callBack(true, err);
              }
              else {
                callBack(false, "Employee Deleted");
              }
            });
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of Delete Employee

    //Start of Update Employee Departments

    update_employee_department: function (employee_id,
      building_id,
      employee_departments,
      modified_by,
      callBack) {
      try {
        db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(employee_id) }, {

          $set: {
            employee_departments: JSON.parse(employee_departments),
            building_id: new ObjectID(building_id),
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Employee Department Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update Employee Department

    //Start of Change Password

    change_password: function (user_id, new_password, old_password, callBack) {
      try {
        db.db().collection(dbb.USER).findOne({ _id: new ObjectID(user_id) }, function (err, doc) {
          if (err) {
            callBack(true, "User not Found");
          } else {
            if (doc.password == old_password) {
              db.db().collection(dbb.USER).updateOne({ _id: new ObjectID(user_id) }, {
                $set: {
                  password: new_password
                }
              }, { upsert: false }, function (err, result) {
                if (err) {
                  callBack(true, err);
                } else {
                  callBack(false, "Password Changed Successfully");
                }
              });
            } else {
              callBack(true, "Password Mismatch");
            }
          }
        })

      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Change Password

    search_employee: function (keyword, building_id, callBack) {
      try {
        let employees = [];
        var cursor = db.db().collection(dbb.EMPLOYEE).find({ employee_name: { $regex: keyword, $options: 'i' }, building_id: new ObjectID(building_id), active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            employees.push(doc);
          }
        }, function () {
          if (employees.length == 0) {
            callBack(null, true, "No Employee  Found");
          } else {
            callBack(employees, false, "Employee  Found");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },

    //Start of Update Employee Vehicles

    update_employee_vehicles: function (employee_id,
      building_id,
      employee_vehicles,
      modified_by,
      callBack) {
      try {
        db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(employee_id) }, {

          $set: {
            employee_vehicles: JSON.parse(employee_vehicles),
            building_id: new ObjectID(building_id),
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Employee Vehicles Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update Employee Vehicles


    //Start of get building ID

    get_building_id_employee: function (employee_id, callBack) {
      try {
        var buildingid;

        var cursor = db.db().collection(dbb.EMPLOYEE).find({ _id: new ObjectID(employee_id), active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            buildingid = doc.building_id;
          }
        }, function () {
          if (buildingid != "") {
            callBack(null, true, "No Employee  Found");
          } else {
            callBack(buildingid, false, "Employee  Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View get building ID

    //Start of Get Employee Name
    get_employee_name: function (employee_id, callBack) {
      try {
        db.db().collection(dbb.EMPLOYEE).findOne({ _id: new ObjectID(employee_id), active: true }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(doc.employee_name, false, true);
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Employee Name

    //Start of Check Employee Exists
    check_employee_info_exists: function (email, contact_info, callBack) {
      try {
        db.db().collection(dbb.USER).findOne({ email: email, active: true }, function (err, doc) {
          if (err || doc == undefined || doc == null) {
            db.db().collection(dbb.USER).findOne({ mobile: contact_info, active: true }, function (err1, doc1) {
              if (err1 == null || doc1 == null) {
                callBack(false, "User Doesn't Exist");
              } else {
                callBack(true, "User Exists");
              }
            })
          } else {
            callBack(true, "User Exists");
          }
        })
      } catch (er) {
        callBack(false, er);
      }
    },
    //End of Check Employee Exists


    //Start of Update Employee Password
    update_employee_password: function (employee_id, password, callBack) {
      try {
        db.db().collection(dbb.USER).updateOne({ user_id: new ObjectID(employee_id) }, {
          $set: {
            password: password,
          }
        }, { upsert: false }, function (err, doc) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Password updated");
          }
        })
      } catch (er) {
        callBack(true, er);
      }
    },
    //End of Update Employee Password
  }
  return employee_module;
}