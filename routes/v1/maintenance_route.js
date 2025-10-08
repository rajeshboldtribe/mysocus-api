module.exports = {

  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, firebase_key, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var maintenance_module = require('../../modules/v1/maintenance_module')(mongo, ObjectID, url, assert, dbb, db, firebase_key);
    var unit_module = require('../../modules/v1/unit_module')(mongo, ObjectID, url, assert, dbb, db);

    var multer = require('multer');
    var readXlsxFile = require('read-excel-file/node');
    var path = require('path');
    var fs = require('fs');

    //START OF ADD UNIT MAINTENANCE
    app.post('/v1/add_unit_maintenance', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("unit_id") &&
          req.body.hasOwnProperty("type") &&
          req.body.hasOwnProperty("amount") &&
          req.body.hasOwnProperty("due_date")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists && (result == 'A' || result == 'E')) {
              unit_module.get_unit_balance(req.body.unit_id, function (balance, error, getBalanceMessage) {
                var openingBalance = 0;
                var closingBalance = 0;
                var payableAmount = parseInt(req.body.amount);
                if (!error) {
                  openingBalance = parseInt(balance);
                }
                closingBalance = openingBalance + payableAmount;

                var newEntry = {
                  building_id: new ObjectID(req.body.building_id),
                  unit_id: new ObjectID(req.body.unit_id),
                  type: req.body.type,
                  amount: payableAmount,
                  raised_date: new Date(),
                  due_date: new Date(req.body.due_date),
                  payment_date: null,
                  validated_by: null,
                  payment_type: null,
                  raised_by: new ObjectID(user_id),
                  input_type: "D",
                  txn_id: null,
                  invoice_id: [],
                  receipt_image: null,
                  opening_balance: openingBalance,
                  closing_balance: closingBalance,
                  bank_id: "",
                  active: true,
                  approved: true,
                }

                unit_module.update_unit_balance(req.body.unit_id, closingBalance, function (updateError, updateMessage) {
                  if (updateError) {
                    res.json({ status: false, message: updateMessage });
                  } else {
                    maintenance_module.add_unit_maintenance(newEntry, function (insertError, insertMessage) {
                      if (insertError) {
                        res.json({ status: false, message: insertMessage });
                      } else {
                        maintenance_module.send_payment_notification(req.body.unit_id, "Charges Raised", "A new charge has been added", function (notificationError, notificationMessage) {
                          res.json({ status: true, message: "Entry Inserted Successfully" });
                        })
                      }
                    })
                  }
                })
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          });
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("type") == false) {
            res.json({ status: false, message: "type parameter is missing" });
          } else if (req.body.hasOwnProperty("amount") == false) {
            res.json({ status: false, message: "amount parameter is missing" });
          } else if (req.body.hasOwnProperty("due_date") == false) {
            res.json({ status: false, message: "due_date parameter is missing" });
          }

        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF ADD UNIT MAINTENANCE


    //START OF PAY UNIT MAINTENANCE
    app.post('/v1/pay_unit_maintenance', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("unit_id") &&
          req.body.hasOwnProperty("type") &&
          req.body.hasOwnProperty("amount") &&
          req.body.hasOwnProperty("invoice_id") &&
          req.body.hasOwnProperty("raised_date") &&
          req.body.hasOwnProperty("payment_type")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {

              unit_module.get_unit_balance(req.body.unit_id, function (balance, balanceError, balanceMessage) {
                if (balanceError) {
                  res.json({ status: false, message: balanceMessage });
                } else {
                  var isApproved = false;
                  var payableAmount = parseInt(req.body.amount)
                  var openingBalance = parseInt(balance);
                  var closingBalance = openingBalance - payableAmount;
                  var validateBy = null;
                  var bankID = "";
                  if (result == "A" || result == "E") {
                    isApproved = true;
                    validateBy = new ObjectID(user_id);
                    if (req.body.bank_id != null && req.body.bank_id != undefined && req.body.bank_id != '') {
                      bankID = new ObjectID(req.body.bank_id);
                    }
                  } else {
                    isApproved = false;
                  }

                  var invoiceIDs = [];
                  var insertInvoices = [];
                  if (req.body.invoice_id != undefined && req.body.invoice_id.length > 0) {
                    invoiceIDs = JSON.parse(req.body.invoice_id);
                    for (var invoice of invoiceIDs) {
                      var data = {
                        invoice_id: new ObjectID(invoice.invoice_id),
                        is_full_paid: invoice.is_full_paid
                      }
                      insertInvoices.push(data);
                    }
                  }

                  var newEntry = {
                    building_id: new ObjectID(req.body.building_id),
                    unit_id: new ObjectID(req.body.unit_id),
                    type: req.body.type,
                    amount: payableAmount,
                    raised_date: new Date(req.body.raised_date),
                    payment_date: new Date(),
                    due_date: new Date(req.body.due_date),
                    invoice_id: insertInvoices,
                    validated_by: validateBy,
                    raised_by: new ObjectID(user_id),
                    payment_type: req.body.payment_type,
                    input_type: "C",
                    txn_id: req.body.txn_id,
                    receipt_image: req.body.receipt_image,
                    opening_balance: openingBalance,
                    closing_balance: closingBalance,
                    active: true,
                    bank_id: bankID,
                    approved: isApproved,
                  }

                  maintenance_module.add_unit_maintenance(newEntry, function (insertError, insertMessage) {
                    if (insertError) {
                      res.json({ status: false, message: insertMessage });
                    } else {
                      if (result == "A" || result == "E") {
                        unit_module.update_unit_balance(req.body.unit_id, closingBalance, function (unitBalError, unitBalMessage) {
                          res.json({ status: !unitBalError, message: unitBalMessage });
                        })
                      } else {
                        res.json({ status: true, message: "Payment Receipt sent awaiting admin confirmation" });
                      }

                    }
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
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("type") == false) {
            res.json({ status: false, message: "type parameter is missing" });
          } else if (req.body.hasOwnProperty("amount") == false) {
            res.json({ status: false, message: "amount parameter is missing" });
          } else if (req.body.hasOwnProperty("invoice_id") == false) {
            res.json({ status: false, message: "invoice_id parameter is missing" });
          } else if (req.body.hasOwnProperty("raised_date") == false) {
            res.json({ status: false, message: "raised_date parameter is missing" });
          } else if (req.body.hasOwnProperty("payment_date") == false) {
            res.json({ status: false, message: "payment_date parameter is missing" });
          } else if (req.body.hasOwnProperty("payment_type") == false) {
            res.json({ status: false, message: "payment_type parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF PAY UNIT MAINTENANCE

    //START OF VALIDATE MAINTENANCE PAYMENT
    app.post('/v1/validate_maintenance_payment', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("maintenance_id") &&
          req.body.hasOwnProperty("unit_id") &&
          req.body.hasOwnProperty("invoice_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              unit_module.get_unit_balance(req.body.unit_id, function (unitBalance, balanceError, balanceMessage) {
                if (balanceError) {
                  res.json({ status: false, message: balanceMessage });
                } else {
                  var openingBalance = parseInt(unitBalance);
                  maintenance_module.validate_maintenance_payment(req.body.maintenance_id, req.body.unit_id, req.body.invoice_id, req.body.bank_id, openingBalance, user_id, function (validateError, validateMessage) {
                    if (validateError) {
                      res.json({ status: false, message: validateMessage });
                    } else {
                      maintenance_module.send_payment_notification(req.body.unit_id, "Payment Approved", "Your payment has been approved", function (notificationError, notificationMessage) {
                        res.json({ status: true, message: "Payment Receipt Validated Succesfully" });
                      })

                    }
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
          } else if (req.body.hasOwnProperty("maintenance_id") == false) {
            res.json({ status: false, message: "maintenance_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("invoice_id") == false) {
            res.json({ status: false, message: "invoice_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VALIDATE MAINTENANCE PAYMENT


    //START OF VIEW UNIT PENDING MAINTENANCE
    app.post('/v1/view_unit_pending_charges', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_unit_pending_charges(req.body.unit_id, req.body.start_date, req.body.end_date, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW UNIT PENDING MAINTENANCE


    //START OF VIEW UNIT MAINTENANCE
    app.post('/v1/view_unit_maintenance', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              var limit = "";
              var starting_after = "";
              if (req.body.limit != undefined) {
                limit = req.body.limit.toString();
              }
              if (req.body.starting_after != undefined) {
                starting_after = req.body.starting_after.toString();
              }
              maintenance_module.view_unit_maintenance(req.body.unit_id, req.body.start_date, req.body.end_date, limit, starting_after, function (result, error, message, totalData) {
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
            res.json({ status: false, message: "user-token header is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW UNIT MAINTENANCE

    //START OF VIEW UNIT TYPE MAINTENANCE
    app.post('/v1/view_unit_type_maintenance', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_parent_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_unit_type_maintenance(req.body.unit_parent_id, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("unit_parent_id") == false) {
            res.json({ status: false, message: "unit_parent_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW UNIT TYPE MAINTENANCE




    //START OF VIEW MAINTENANCE TYPES
    app.post('/v1/view_maintenance_types', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_maintenance_types(function (result, error, message) {
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
    //END OF VIEW MAINTENANCE TYPES

    //START OF GET UNIT COMPLAINT CHARGES
    app.post('/v1/view_unit_complaint_charges', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_unit_complaint_charges(req.body.unit_id, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("start_date") == false) {
            res.json({ status: false, message: "start_date parameter is missing" });
          } else if (req.body.hasOwnProperty("end_date") == false) {
            res.json({ status: false, message: "end_date parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF GET UNIT COMPLAINT CHARGES

    //START OF GET UNIT PENDING AMOUNT
    app.post('/v1/view_unit_pending_amount', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_unit_pending_amount(req.body.unit_id, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF GET UNTI PENDING AMOUNT


    //START OF GET UNIT AMENITY CHARGES
    app.post('/v1/view_unit_amenity_charges', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_unit_amenity_charges(req.body.unit_id, req.body.start_date, req.body.end_date, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
          // else if (req.body.hasOwnProperty("start_date") == false) {
          //   res.json({ status: false, message: "start_date parameter is missing" });
          // } else if (req.body.hasOwnProperty("end_date") == false) {
          //   res.json({ status: false, message: "end_date parameter is missing" });
          // }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF GET UNITY AMENITY CHARGES

    //START OF EXPORT MAINTENANCE CSV 2
    app.get('/v1/export_maintenance_excelsheet', function (req, res) {
      try {
        if (req.query.hasOwnProperty("unit_parent_id") &&
          req.query.hasOwnProperty("building_id")) {

          unit_module.get_units_from_parent_id(req.query.unit_parent_id, req.query.building_id, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              const filePath = "Maintenance_Details_Export/maintenance_export_sheet.csv";
              const createCsvWriter = require('csv-writer').createObjectCsvWriter;
              const csvWriter = createCsvWriter({
                path: 'Maintenance_Details_Export/maintenance_export_sheet.csv',
                header: [
                  { id: 'Unit_No', title: 'Unit_No' },
                  { id: 'Maintenance_Charges', title: 'Maintenance_Charges' },
                  { id: 'Electricity_Charges', title: 'Electricity_Charges' },
                  { id: 'Water_Charges', title: 'Water_Charges' },
                  { id: 'Gas_Charges', title: 'Gas_Charges' },
                  { id: 'Amenity_Usage_Charges', title: 'Amenity_Usage_Charges' },
                  { id: 'Repair_Work_Charges', title: 'Repair_Work_Charges' },
                  { id: 'Sundry_Charges', title: 'Sundry_Charges' },
                  { id: 'Pending_Balance', title: 'Pending_Balance' },
                  { id: 'Due_Date', title: 'Due_Date(dd/mm/yyyy)' },
                  //Tobe Removed while production
                  // { id: 'Raised_Date', title: 'Raised_Date(dd/mm/yyyy)' },
                ]
              });

              var data = [];
              for (var unit of result) {
                {
                  var unitInfo = {
                    "Unit_No": unit.unit_name,
                    "Maintenance_Charges": "",
                    "Electricity_Charges": "",
                    "Water_Charges": "",
                    "Gas_Charges": "",
                    "Amenity_Usage_Charges": unit.unit_amenity_balance,
                    "Repair_Work_Charges": unit.unit_complaint_balance,
                    "Sundry_Charges": "",
                    "Pending_Balance": unit.unit_balance,
                    "Due_Date": "",
                    //Tobe Removed while production
                    // "Raised_Date": ""
                  }
                  data.push(unitInfo);
                }
              }

              csvWriter
                .writeRecords(data)
                .then(() => {
                  console.log('The CSV file was written successfully')
                  res.download(filePath);
                });
            }
          })
        } else {
          if (req.query.hasOwnProperty("unit_parent_id") == false) {
            res.json({ status: false, message: "unit_parent_id parameter is missing" });
          } else if (req.query.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })
    //END OF EXPORT MAINTENANCE CSV 2


    //START OF IMPORT MAINTENANCE CSV
    var storage = multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, 'Maintenance_Details_Import/')
      },
      filename: function (req, file, callback) {
        callback(null, file.originalname);
      }
    });



    var upload = multer({ storage: storage });//this is the key

    app.post('/v1/import_maintenance_sheet', ensureAuthorized, upload.single('file'), function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.headers.hasOwnProperty("building-id") &&
          req.headers.hasOwnProperty("unit-parent-id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists && (result == 'A' || result == 'E')) {
              var buildingID = req.headers['building-id'];
              unit_module.get_units_from_parent_id(req.headers['unit-parent-id'], req.headers['building-id'], function (units, unitFetchError, unitFetchMessage) {
                if (unitFetchError) {
                  res.json({ status: false, message: unitFetchMessage });
                } else {
                  if (req.file != undefined && req.file.originalname != undefined && req.file.originalname != null) {
                    var fileName = "Maintenance_Details_Import/" + req.file.originalname;
                    var filePath = path.resolve(fileName);
                    const csv = require('csv-parser');
                    const fs = require('fs');

                    fileBuffer = fs.readFileSync(filePath);
                    splitLines = fileBuffer.toString().trim().split("\n");
                    var totalCount = splitLines.length - 1;
                    var count = 0;


                    fs.createReadStream(filePath)
                      .pipe(csv())
                      .on('data', (rows) => {
                        var unitNo = rows.Unit_No;
                        for (var unit of units) {
                          if (unit.unit_name == unitNo) {
                            //To be fixed before production
                            maintenance_module.insert_maintenance_charges_for_unit(buildingID, unit.unit_id, user_id, unit.unit_balance, rows, function (closingBalance, err, msg) {
                              // maintenance_module.insert_maintenance_charges_for_unit2(buildingID, unit.unit_id, user_id, unit.unit_balance, rows, function (closingBalance, err, msg) {
                              if (!err) {
                                unit_module.update_unit_balance(unit.unit_id, closingBalance, function (err1, msg1) {
                                  maintenance_module.send_payment_notification(req.body.unit_id, "Charges Raised", "A new charge has been added", function (notificationError, notificationMessage) {
                                    count++;
                                    if (count == totalCount) {
                                      res.json({ status: true, message: "upload done" });
                                    }
                                  });
                                })
                              }

                            })
                            break
                          }
                        }
                      })
                  } else {
                    res.json({ status: false, message: "No File Selected" });
                  }
                }
              })
            } else {
              res.json({ status: false, message: userExistMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token header is missing" });
          } else if (req.headers.hasOwnProperty("building-id") == false) {
            res.json({ status: false, message: "building-id parameter is missing" });
          } else if (req.headers.hasOwnProperty("unit-parent-id") == false) {
            res.json({ status: false, message: "unit-parent-id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF IMPORT MAINTENANCE CSV

    //START OF VIEW BUILDING MAINTENANCE CREDITS
    app.post('/v1/view_building_maintenance_credits', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistMessage) {
            if (exists) {
              maintenance_module.view_building_maintenance_credits(req.body.building_id, req.body.start_date, req.body.end_date, req.body.limit, req.body.starting_after, function (result, error, message, totalData) {
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
            res.json({ status: false, message: "user-token header is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF VIEW BUILDING MAINTENANCE CREDITS


    //START OF EXPORT BUILDING MAINTENANCE CREDITS
    app.get('/v1/export_building_maintenance_credits', function (req, res) {
      try {
        if (req.query.hasOwnProperty("building_id")
          && req.query.hasOwnProperty("start_date")
          && req.query.hasOwnProperty("end_date")) {
          maintenance_module.export_building_maintenance_credits(req.query.building_id, req.query.start_date, req.query.end_date, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              // res.json({ status: true, message: message, result: result });
              const filePath = "Exports/maintenance_credit_exports.csv";
              const createCsvWriter = require('csv-writer').createObjectCsvWriter;
              const csvWriter = createCsvWriter({
                path: 'Exports/maintenance_credit_exports.csv',
                header: [
                  { id: 'UNIT_NO', title: 'UNIT_NO' },
                  { id: 'CHARGES', title: 'CHARGES' },
                  { id: 'AMOUNT', title: 'AMOUNT' },
                  { id: 'RAISED_ON', title: 'RAISED_ON' },
                  { id: 'DUE_ON', title: 'DUE_ON' },
                  { id: 'PAID_ON', title: 'PAID_ON' },
                  { id: 'PAYMENT_MODE', title: 'PAYMENT_MODE' },
                  { id: 'BANK_ACCOUNT', title: 'BANK_ACCOUNT' },
                  { id: 'TRANSACTION_ID', title: 'TRANSACTION_ID' },
                ]
              });

              var data = [];
              for (var maintenance of result) {
                var maintenanceInfo = {
                  "UNIT_NO": maintenance.unit_no,
                  "CHARGES": maintenance.type,
                  "AMOUNT": maintenance.amount,
                  "RAISED_ON": maintenance.raised_date,
                  "DUE_ON": maintenance.due_date,
                  "PAID_ON": maintenance.payment_date,
                  "PAYMENT_MODE": maintenance.payment_type,
                  "BANK_ACCOUNT": maintenance.bank_details.bank_name,
                  "TRANSACTION_ID": maintenance.txn_id
                }
                data.push(maintenanceInfo);
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
        res.json({ status: false, message: "Failed at try " + er });
      }
    })
    //END OF EXPORT BUILDING MAINTENANCE CREDITS

  }
}