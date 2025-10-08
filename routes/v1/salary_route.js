module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var salary_module = require('../../modules/v1/salary_module')(mongo, ObjectID, url, assert, dbb, db);
    var employee_module = require('../../modules/v1/employee_module')(mongo, ObjectID, url, assert, dbb, db);
    var vendor_module = require('../../modules/v1/vendor_module')(mongo, ObjectID, url, assert, dbb, db);



    // START OF VIEW EMPLOYEE VENDOR PAYABLE LIST
    app.post('/v1/view_employee_vendor_list', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("payable_month") &&
          req.body.hasOwnProperty("payable_year")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              salary_module.view_employee_vendor_list(req.body.building_id, req.body.payable_month, req.body.payable_year, function (result, error, message) {
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
          if (req.header.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("payable_month") == false) {
            res.json({ status: false, message: "payable_month parameter is missing" });
          } else if (req.body.hasOwnProperty("payable_year") == false) {
            res.json({ status: false, message: "payable_year parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW EMPLOYEE VENDOR PAYABLE LIST

    //START OF ADD SALARY ENTRY
    app.post('/v1/add_salary_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("payable_month") &&
          req.body.hasOwnProperty("payable_year") &&
          req.body.hasOwnProperty("salary_paid") &&
          req.body.hasOwnProperty("payment_type")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              var bankAccountID = "";
              if (req.body.bank_account_id != undefined && req.body.bank_account_id != '') {
                bankAccountID = new ObjectID(req.body.bank_account_id);
              }
              var newEntry = {
                building_id: new ObjectID(req.body.building_id),
                payable_month: req.body.payable_month,
                payable_year: req.body.payable_year,
                salary_paid: JSON.parse(req.body.salary_paid),
                payment_type: req.body.payment_type,
                bank_account_id: bankAccountID,
                created_on: new Date(),
                created_by: new ObjectID(user_id),
                active: true
              }
              salary_module.add_salary_entry(newEntry, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.header.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("payable_month") == false) {
            res.json({ status: false, message: "payable_month parameter is missing" });
          } else if (req.body.hasOwnProperty("payable_year") == false) {
            res.json({ status: false, message: "payable_year parameter is missing" });
          } else if (req.body.hasOwnProperty("salary_paid") == false) {
            res.json({ status: false, message: "salary_paid parameter is missing" });
          } else if (req.body.hasOwnProperty("payment_type") == false) {
            res.json({ status: false, message: "payment_type parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF ADD SALARY ENTRY


    //START OF VIEW SALARY ENTRIES
    app.post('/v1/view_salary_entries', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("limit") &&
          req.body.hasOwnProperty("starting_after")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              salary_module.view_salary_entries(req.body.building_id, req.body.limit, req.body.starting_after, req.body.start_date, req.body.end_date, function (result, error, message, totalData) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, totaldata: totalData });
                }
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("limit") == false) {
            res.json({ status: false, message: "limit parameter is missing" });
          } else if (req.body.hasOwnProperty("starting_after") == false) {
            res.json({ status: false, message: "starting_after parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW SALARY ENTRIES


    //START OF EXPORT SALARY ENTRIES
    app.get('/v1/export_salary_entries', function (req, res) {
      try {
        if (req.query.hasOwnProperty("building_id")
          && req.query.hasOwnProperty("start_date")
          && req.query.hasOwnProperty("end_date")) {
          salary_module.export_salary_entries(req.query.building_id, req.query.start_date, req.query.end_date, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              // res.json({ status: true, message: message, result: result });
              const filePath = "Salary_Details_Export/salary_export_sheet.csv";
              const createCsvWriter = require('csv-writer').createObjectCsvWriter;
              const csvWriter = createCsvWriter({
                path: 'Salary_Details_Export/salary_export_sheet.csv',
                header: [
                  { id: 'DATE_OF_ENTRY', title: 'DATE_OF_ENTRY' },
                  { id: 'PAYABLE_YEAR', title: 'PAYABLE_YEAR' },
                  { id: 'PAYABLE_MONTH', title: 'PAYABLE_MONTH' },
                  { id: 'NAME', title: 'NAME' },
                  { id: 'ROLE', title: 'ROLE' },
                  { id: 'PHONE_NUMBER', title: 'PHONE_NUMBER' },
                  { id: 'SALARY', title: 'SALARY' },
                  { id: 'PAYMENT_MODE', title: 'PAYMENT_MODE' },
                  { id: 'BUILDING_ACCOUNT', title: 'BUILDING_ACCOUNT' },
                  { id: 'RECEIVER_ACCOUNT', title: 'RECEIVER_ACCOUNT' },
                ]
              });
              var data = [];
              for (var salary of result) {
                var salaryInfo = {
                  "DATE_OF_ENTRY": salary.created_on,
                  "PAYABLE_YEAR": salary.payable_year,
                  "PAYABLE_MONTH": salary.payable_month,
                  "NAME": salary.name,
                  "ROLE": salary.role,
                  "PHONE_NUMBER": salary.phone_number,
                  "SALARY": salary.salary.salary_amount,
                  "PAYMENT_MODE": salary.payment_type,
                  "BUILDING_ACCOUNT": salary.building_account,
                  "RECEIVER_ACCOUNT": salary.receiver_account
                }
                data.push(salaryInfo);
              }
              csvWriter
                .writeRecords(data)
                .then(() => {
                  res.download(filePath);
                });
            }
          })
        } else {
          if (req.query.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.query.hasOwnProperty("start_date") == false) {
            res.json({ status: false, message: "start_date parameter is missing" });
          } else if (req.query.hasOwnProperty("end_date") == false) {
            res.json({ status: false, message: "end_date parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })
    //END OF EXPORT SALARY ENTRIES
  }


}