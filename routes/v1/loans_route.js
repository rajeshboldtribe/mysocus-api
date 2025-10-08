module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var loans_module = require('../../modules/v1/loans_module')(mongo, ObjectID, url, assert, dbb, db);



    //START OF ADD BUILDING LOAN
    app.post('/v1/add_building_loan', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("loan_title") &&
          req.body.hasOwnProperty("starts_from") &&
          req.body.hasOwnProperty("ends_on") &&
          req.body.hasOwnProperty("loan_amount") &&
          req.body.hasOwnProperty("current_outstanding_amount") &&
          req.body.hasOwnProperty("bank_id")) {
          admin_module.userExists(req.token, function (user_id, userType, exists, userExistMessage) {
            if (exists) {
              var newEntry = {
                building_id: new ObjectID(req.body.building_id),
                loan_title: req.body.loan_title,
                starts_from: new Date(req.body.starts_from),
                ends_on: new Date(req.body.ends_on),
                loan_amount: parseFloat(req.body.loan_amount),
                current_outstanding_amount: parseFloat(req.body.current_outstanding_amount),
                bank_id: new ObjectID(req.body.bank_id),
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true,
              }
              loans_module.add_building_loan(newEntry, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("loan_title") == false) {
            res.json({ status: false, message: "loan_title parameter is missing" });
          } else if (req.body.hasOwnProperty("starts_from") == false) {
            res.json({ status: false, message: "starts_from parameter is missing" });
          } else if (req.body.hasOwnProperty("ends_on") == false) {
            res.json({ status: false, message: "ends_on parameter is missing" });
          } else if (req.body.hasOwnProperty("loan_amount") == false) {
            res.json({ status: false, message: "loan_amount parameter is missing" });
          } else if (req.body.hasOwnProperty("current_outstanding_amount") == false) {
            res.json({ status: false, message: "current_outstanding_amount parameter is missing" });
          } else if (req.body.hasOwnProperty("bank_id") == false) {
            res.json({ status: false, message: "bank_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    });
    //END OF ADD BUILDING LOAN


    //START OF ADD LOAN EMI DETAIL
    app.post('/v1/add_loan_emi_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("loan_id") &&
          req.body.hasOwnProperty("paid_month") &&
          req.body.hasOwnProperty("paid_year") &&
          req.body.hasOwnProperty("payment_mode") &&
          req.body.hasOwnProperty("emi_amount")) {
          admin_module.userExists(req.token, function (user_id, userType, exists, userExistMessage) {
            if (exists) {
              var bankID = "";
              if (req.body.bank_id != undefined && req.body.bank_id != '') {
                bankID = new ObjectID(req.body.bank_id);
              }
              var newEntry = {
                building_id: new ObjectID(req.body.building_id),
                loan_id: new ObjectID(req.body.loan_id),
                paid_month: req.body.paid_month,
                paid_year: req.body.paid_year,
                payment_mode: req.body.payment_mode,
                emi_amount: parseFloat(req.body.emi_amount),
                bank_id: bankID,
                transaction_id: req.body.transaction_id,
                created_on: new Date(),
              }
              loans_module.add_loan_emi_entry(newEntry, function (error1, message1) {
                if (error1) {
                  res.json({ status: false, message: message1 });
                } else {
                  loans_module.refresh_outstanding_amount(req.body.building_id, req.body.loan_id, req.body.emi_amount, function (error2, message2) {
                    res.json({ status: !error2, message: message2 });
                  })
                }
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })

        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("loan_id") == false) {
            res.json({ status: false, message: "loan_id parameter is missing" });
          } else if (req.body.hasOwnProperty("paid_month") == false) {
            res.json({ status: false, message: "paid_month parameter is missing" });
          } else if (req.body.hasOwnProperty("paid_year") == false) {
            res.json({ status: false, message: "paid_year parameter is missing" });
          } else if (req.body.hasOwnProperty("payment_mode") == false) {
            res.json({ status: false, message: "payment_mode parameter is missing" });
          } else if (req.body.hasOwnProperty("emi_amount") == false) {
            res.json({ status: false, message: "emi_amount parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF ADD LOAN EMI DETAIL

    //START OF VIEW BUILDING LOANS
    app.post('/v1/view_building_loans', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, userType, exists, userExistMessage) {
            if (exists) {
              loans_module.view_building_loans(req.body.building_id, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW BUILDING LOANS

    //START OF CLOSE BUILDING LOAN
    app.post('/v1/close_building_loan', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("loan_id")) {
          admin_module.userExists(req.token, function (user_id, userType, exists, userExistMessage) {
            if (exists) {
              loans_module.close_building_loan(req.body.building_id, req.body.loan_id, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("loan_id") == false) {
            res.json({ status: false, message: "loan_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF CLOSE BUILDING LOAN


    //START OF EXPORT LOAN EMI ENTRIES
    app.get('/v1/export_loan_entries', function (req, res) {
      try {
        if (req.query.hasOwnProperty("building_id")
          && req.query.hasOwnProperty("loan_id")) {
          loans_module.export_loans_route(req.query.building_id, req.query.loan_id, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              // res.json({ status: true, message: message, result: result })
              const filePath = "Loan_Details_Export/loan_export_sheet.csv";
              const createCsvWriter = require('csv-writer').createObjectCsvWriter;
              const csvWriter = createCsvWriter({
                path: 'Loan_Details_Export/loan_export_sheet.csv',
                header: [
                  { id: 'DATE_OF_ENTRY', title: 'DATE_OF_ENTRY' },
                  { id: 'LOAN_TITLE', title: 'LOAN_TITLE' },
                  { id: 'BORROWED_BANK', title: 'BORROWED_BANK' },
                  { id: 'TENURE', title: 'TENURE' },
                  { id: 'PAID_MONTH', title: 'PAID_MONTH' },
                  { id: 'PAID_YEAR', title: 'PAID_YEAR' },
                  { id: 'EMI_AMOUNT', title: 'EMI_AMOUNT' },
                  { id: 'PAYMENT_MODE', title: 'PAYMENT_MODE' },
                  { id: 'PAID_ACCOUNT', title: 'PAID_ACCOUNT' },
                  { id: 'TRANSACTION_ID', title: 'TRANSACTION_ID' },
                ]
              });
              var data = [];
              for (var loan of result) {
                var loanInfo = {
                  "DATE_OF_ENTRY": loan.created_on,
                  "LOAN_TITLE": loan.title,
                  "BORROWED_BANK": loan.borrowed_bank,
                  "TENURE": loan.tenure,
                  "PAID_MONTH": loan.paid_month,
                  "PAID_YEAR": loan.paid_year,
                  "EMI_AMOUNT": loan.emi_amount,
                  "PAYMENT_MODE": loan.payment_mode,
                  "PAID_ACCOUNT": loan.paid_bank,
                  "TRANSACTION_ID": loan.transaction_id,
                }
                data.push(loanInfo);
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
          } else if (req.query.hasOwnProperty("loan_id") == false) {
            res.json({ status: false, message: "loan_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })
    //END OF EXPORT LOAN EMI ENTRIES
  }
}