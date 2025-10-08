module.exports = function (mongo, ObjectID, url, assert, dbb, db, firebase_key) {
  var moment = require('moment-timezone');
  var maintenance_module = {

    add_unit_maintenance: function (data, callBack) {
      try {
        db.db().collection(dbb.UNIT_MAINTENANCE).insertOne(data, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            if (data.type === "Amenity Charges") {
              db.db().collection(dbb.AMENITIESBOOKING).updateMany({ unit_id: data.unit_id },
                {
                  $set: {
                    invoiceAdded: true
                  }
                }, { upsert: false }, function (err1, doc1) {
                  if (err1) {
                    callBack(true, err1);
                  } else {
                    callBack(false, "Maintenance Added");
                  }
                })
            } else if (data.type === "Complaints/Repairs Attended") {
              db.db().collection(dbb.COMPLAINTS).updateMany({ unit_id: data.unit_id },
                {
                  $set: {
                    invoiceAdded: true
                  }
                }, { upsert: false }, function (err2, doc2) {
                  if (err2) {
                    callBack(true, err2);
                  } else {
                    callBack(false, "Maintenance Added");
                  }
                })
            } else {
              callBack(false, "Maintenance Added");
            }
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },

    validate_maintenance_payment: function (maintenance_id, unit_id, invoice_id, bank_id, opening_balance, user_id, callBack) {
      try {
        db.db().collection(dbb.UNIT_MAINTENANCE).findOne({ "_id": new ObjectID(maintenance_id) }, function (err, doc) {
          if (err) {
            callBack(true, err);
          } else {
            var amount = parseInt(doc.amount);
            var closingBalance = opening_balance - amount;

            var invoiceIDs = [];
            var insertedInvoices = [];
            var bankID = "";

            if (bank_id != undefined && bank_id != null && bank_id != '') {
              bankID = new ObjectID(bank_id);
            }

            if (invoice_id != undefined) {
              invoiceIDs = JSON.parse(invoice_id);
              for (var invoice of invoiceIDs) {
                var isFullPaid = invoice.is_full_paid.toString().toLowerCase() == "true" ? true : false
                var data = {
                  invoice_id: new ObjectID(invoice.invoice_id),
                  is_full_paid: isFullPaid,
                }
                insertedInvoices.push(data);
              }
            }

            db.db().collection(dbb.UNIT_MAINTENANCE).updateOne({ _id: new ObjectID(maintenance_id) },
              {
                $set: {
                  opening_balance: opening_balance,
                  closing_balance: closingBalance,
                  approved: true,
                  validated_by: new ObjectID(user_id),
                  invoice_id: insertedInvoices,
                  bank_id: bankID
                }
              }, { upsert: false }, function (err1, doc1) {
                if (err1) {
                  callBack(true, err1);
                } else {
                  db.db().collection(dbb.UNIT).updateOne({ "_id": new ObjectID(unit_id) }, {
                    $set: {
                      unit_balance: closingBalance
                    }
                  }, { upsert: false }, function (err2, doc2) {
                    if (err) {
                      callBack(true, err2);
                    } else {
                      callBack(false, "Unit Balance Updated");
                    }
                  })
                }
              })
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },


    view_unit_pending_charges: function (unit_id, start_date, end_date, callBack) {
      try {
        var paidDebitIDs = [];
        var reportData = [];
        var maintenanceReports = [];
        var creditCursor;
        var debitCursor;
        var startDate;
        var endDate;
        var isDateSearchRequired = false;

        if (start_date != undefined && end_date != undefined) {
          isDateSearchRequired = true;
          startDate = new Date(start_date);
          endDate = new Date(end_date);
        }


        if (!isDateSearchRequired) {
          creditCursor = db.db().collection(dbb.UNIT_MAINTENANCE).find({ unit_id: new ObjectID(unit_id), input_type: "C" });
        } else {
          creditCursor = db.db().collection(dbb.UNIT_MAINTENANCE).find({ unit_id: new ObjectID(unit_id), input_type: "C", raised_date: { $gte: startDate, $lte: endDate } });
        }



        creditCursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, result, err);
          } else {
            if (doc.invoice_id != undefined && doc.invoice_id.length > 0) {
              for (var invoiceID of doc.invoice_id) {
                if (doc.approved == true) {
                  if (invoiceID.is_full_paid = true) {
                    paidDebitIDs.push(new ObjectID(invoiceID.invoice_id));
                  }
                } else {
                  paidDebitIDs.push(new ObjectID(invoiceID.invoice_id));
                }
              }
            }
          }
        }, function () {
          if (!isDateSearchRequired) {
            debitCursor = db.db().collection(dbb.UNIT_MAINTENANCE).find({ unit_id: new ObjectID(unit_id), input_type: "D", _id: { $nin: paidDebitIDs } });
          } else {
            debitCursor = db.db().collection(dbb.UNIT_MAINTENANCE).find({ unit_id: new ObjectID(unit_id), input_type: "D", _id: { $nin: paidDebitIDs }, raised_date: { $gte: startDate, $lte: endDate } });
          }

          debitCursor.forEach(function (doc1, err1) {
            if (doc1 != undefined) {
              reportData.push(doc1);
            }
          }, function () {
            if (reportData.length == 0) {
              callBack(null, true, "No Records Found");
            } else {
              var index = 0;
              var getUserDetails = function (entry) {
                var raisedByID = entry.raised_by;
                var validateByID = entry.validated_by;
                var reportEntry = {
                  "_id": entry._id,
                  "building_id": entry.building_id,
                  "unit_id": entry.unit_id,
                  "type": entry.type,
                  "amount": parseInt(entry.amount),
                  "raised_date": entry.raised_date,
                  "due_date": entry.due_date,
                  "payment_date": entry.payment_date,
                  "validated_by": entry.validated_by,
                  "raised_by": entry.raised_by,
                  "payment_type": entry.payment_type,
                  "input_type": entry.input_type,
                  "txn_id": entry.txn_id,
                  "invoice_id": entry.invoice_id,
                  "receipt_image": entry.receipt_image,
                  "bank_id": entry.bank_id,
                  "opening_balance": parseInt(entry.opening_balance),
                  "closing_balance": parseInt(entry.closing_balance),
                  "active": entry.active,
                  "approved": entry.approved
                }

                maintenance_module.get_user_name(raisedByID, function (raisedByName, raisedByError, message1) {
                  if (raisedByError) {
                    maintenanceReports.push(reportEntry);
                    if (index < reportData.length - 1) {
                      index++;
                      getUserDetails(reportData[index]);
                    } else {
                      callBack(maintenanceReports, false, "Unit Maintenance Reports Found");
                    }
                  } else {
                    reportEntry.raised_by = raisedByName;
                    if (validateByID != undefined && validateByID != null) {
                      maintenance_module.get_user_name(validateByID, function (validatedByName, validatedByError, messag2) {
                        if (validatedByError) {
                          maintenanceReports.push(reportEntry);
                          if (index < reportData.length - 1) {
                            index++;
                            getUserDetails(reportData[index]);
                          } else {
                            callBack(maintenanceReports, false, "Unit Maintenance Reports Found");
                          }
                        } else {
                          reportEntry.validated_by = validatedByName;
                          maintenanceReports.push(reportEntry);
                          if (index < reportData.length - 1) {
                            index++;
                            getUserDetails(reportData[index]);
                          } else {
                            callBack(maintenanceReports, false, "Unit Maintenance Reports Found");
                          }
                        }
                      })
                    } else {
                      maintenanceReports.push(reportEntry);
                      if (index < reportData.length - 1) {
                        index++;
                        getUserDetails(reportData[index]);
                      } else {
                        callBack(maintenanceReports, false, "Unit Maintenance Reports Found");
                      }
                    }
                  }
                })
              }
              getUserDetails(reportData[index]);
            }
          })
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    view_unit_maintenance: function (unit_id, start_date, end_date, limit, starting_after, callBack) {
      try {
        var cursor;
        var reportData = [];
        var maintenanceReports = [];

        var isDateSearch = false;
        var isPagination = false;
        var isDateSearchWithPagination = false;

        var sdate;
        var edate;
        var parseLimit;
        var startAfter

        if (start_date != undefined && start_date != '' && end_date != undefined && end_date != '') {
          if (limit != '' && limit != undefined && starting_after != '' && starting_after != undefined) {
            parseLimit = parseInt(limit);
            startAfter = parseInt(starting_after);
            isDateSearchWithPagination = true;
          } else {
            isDateSearch = true;
          }
          sdate = new Date(start_date);
          edate = new Date(end_date);
        } else if (limit != '' && limit != undefined && starting_after != '' && starting_after != undefined) {
          isPagination = true;
          parseLimit = parseInt(limit);
          startAfter = parseInt(starting_after);
        }


        if (isDateSearch) {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" }
          ]).sort({ _id: -1 });
        } else if (isPagination) {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "unit_id": new ObjectID(unit_id) } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" }
          ]).sort({ _id: -1 }).skip(startAfter).limit(parseLimit);
        } else if (isDateSearchWithPagination) {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" }
          ]).sort({ _id: -1 }).skip(startAfter).limit(parseLimit);
        } else {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "unit_id": new ObjectID(unit_id) } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" }
          ]).sort({ _id: -1 });
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var invoiceIDs = [];
            var bankDetails = {};
            var bankAccounts = [];

            if (doc.building_details != undefined) {
              bankAccounts = doc.building_details.building_accounts;
              if (bankAccounts != undefined && bankAccounts.length > 0) {
                for (var bank of bankAccounts) {
                  if (doc.bank_id != undefined && doc.bank_id != "") {
                    if (doc.bank_id.toString() == bank.id.toString()) {
                      bankDetails = {
                        "id": bank.id,
                        "bank_name": bank.bank_name,
                        "account_no": bank.account_no,
                        "ifsc_code": bank.ifsc_code
                      }
                    }
                  }
                }
              }
            }

            if (doc.credit_details != undefined && doc.credit_details.length > 0 && doc.invoice_id != undefined && doc.invoice_id.length > 0) {
              for (var creditData of doc.credit_details) {
                var isPartialPaid = false;
                for (var invoiceValue of doc.invoice_id) {
                  if (creditData._id.toString() == invoiceValue.invoice_id) {
                    isPartialPaid = invoiceValue.is_full_paid;
                    break;
                  }
                }
                var invoiceDetail = {
                  invoice_id: creditData._id,
                  amount: parseInt(creditData.amount),
                  type: creditData.type,
                  raised_on: creditData.raised_date,
                  due_date: creditData.due_date,
                  is_full_paid: isPartialPaid
                }
                invoiceIDs.push(invoiceDetail);
              }
            }

            var data = {
              "_id": doc._id,
              "building_id": doc.building_id,
              "unit_id": doc.unit_id,
              "type": doc.type,
              "amount": parseInt(doc.amount),
              "raised_date": doc.raised_date,
              "due_date": doc.due_date,
              "payment_date": doc.payment_date,
              "validated_by": doc.validated_by,
              "raised_by": doc.raised_by,
              "payment_type": doc.payment_type,
              "bank_details": bankDetails,
              "input_type": doc.input_type,
              "txn_id": doc.txn_id,
              "invoice_id": invoiceIDs,
              "receipt_image": doc.receipt_image,
              "opening_balance": parseInt(doc.opening_balance),
              "closing_balance": parseInt(doc.closing_balance),
              "active": doc.active,
              "approved": doc.approved,
            }

            reportData.push(data);
          }
        }, function () {
          if (reportData.length == 0) {
            callBack(null, true, "No Records Found");
          } else {
            var index = 0;
            var getUserDetails = function (entry) {
              var raisedByID = entry.raised_by;
              var validateByID = entry.validated_by;
              var reportEntry = {
                "_id": entry._id,
                "building_id": entry.building_id,
                "unit_id": entry.unit_id,
                "type": entry.type,
                "amount": parseInt(entry.amount),
                "raised_date": entry.raised_date,
                "due_date": entry.due_date,
                "payment_date": entry.payment_date,
                "validated_by": entry.validated_by,
                "raised_by": entry.raised_by,
                "payment_type": entry.payment_type,
                "bank_details": entry.bank_details,
                "input_type": entry.input_type,
                "txn_id": entry.txn_id,
                "invoice_id": entry.invoice_id,
                "receipt_image": entry.receipt_image,
                "opening_balance": parseInt(entry.opening_balance),
                "closing_balance": parseInt(entry.closing_balance),
                "active": entry.active,
                "approved": entry.approved
              }

              maintenance_module.get_user_name(raisedByID, function (raisedByName, raisedByError, message1) {
                if (raisedByError) {
                  maintenanceReports.push(reportEntry);
                  if (index < reportData.length - 1) {
                    index++;
                    getUserDetails(reportData[index]);
                  } else {
                    if (isPagination) {
                      db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                        if (!countErr) {
                          totaldata = count;
                        }
                        callBack(maintenanceReports, false, "Entries Found", totaldata);
                      });
                    } else if (isDateSearchWithPagination) {
                      db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                        if (!countErr) {
                          totaldata = count;
                        }

                        callBack(maintenanceReports, false, "Entries Found", totaldata);
                      });
                    } else {
                      callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                    }
                  }
                } else {
                  reportEntry.raised_by = raisedByName;
                  if (validateByID != undefined && validateByID != null) {
                    maintenance_module.get_user_name(validateByID, function (validatedByName, validatedByError, messag2) {
                      if (validatedByError) {
                        maintenanceReports.push(reportEntry);
                        if (index < reportData.length - 1) {
                          index++;
                          getUserDetails(reportData[index]);
                        } else {
                          if (isPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }
                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else if (isDateSearchWithPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }

                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else {
                            callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                          }
                        }
                      } else {
                        reportEntry.validated_by = validatedByName;
                        maintenanceReports.push(reportEntry);
                        if (index < reportData.length - 1) {
                          index++;
                          getUserDetails(reportData[index]);
                        } else {
                          if (isPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }
                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else if (isDateSearchWithPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }

                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else {
                            callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                          }
                        }
                      }
                    })
                  } else {
                    maintenanceReports.push(reportEntry);
                    if (index < reportData.length - 1) {
                      index++;
                      getUserDetails(reportData[index]);
                    } else {
                      if (isPagination) {
                        db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                          if (!countErr) {
                            totaldata = count;
                          }
                          callBack(maintenanceReports, false, "Entries Found", totaldata);
                        });
                      } else if (isDateSearchWithPagination) {
                        db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                          if (!countErr) {
                            totaldata = count;
                          }

                          callBack(maintenanceReports, false, "Entries Found", totaldata);
                        });
                      } else {
                        callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                      }
                    }
                  }
                }
              })
            }
            getUserDetails(reportData[index]);
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    view_building_maintenance_credits: function (building_id, start_date, end_date, limit, starting_after, callBack) {
      try {
        var cursor;
        var reportData = [];
        var maintenanceReports = [];

        var isDateSearch = false;
        var isPagination = false;
        var isDateSearchWithPagination = false;

        var sdate;
        var edate;
        var parseLimit;
        var startAfter

        if (start_date != undefined && start_date != '' && end_date != undefined && end_date != '') {
          if (limit != '' && limit != undefined && starting_after != '' && starting_after != undefined) {
            parseLimit = parseInt(limit);
            startAfter = parseInt(starting_after);
            isDateSearchWithPagination = true;
          } else {
            isDateSearch = true;
          }
          var startDateVal = moment(new Date(start_date)).format('YYYY-MM-DDT00:00:00.000+00:00');
          var endDateVal = moment(new Date(end_date)).format('YYYY-MM-DDT23:59:59.000+00:00');

          sdate = new Date(startDateVal);
          edate = new Date(endDateVal);
        } else if (limit != '' && limit != undefined && starting_after != '' && starting_after != undefined) {
          isPagination = true;
          parseLimit = parseInt(limit);
          startAfter = parseInt(starting_after);
        }


        if (isDateSearch) {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "building_id": new ObjectID(building_id), input_type: "C", raised_date: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $unwind: "$unit_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
            { $unwind: "$unit_parent_details" },
          ]).sort({ _id: -1 });
        } else if (isPagination) {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "building_id": new ObjectID(building_id), input_type: "C" } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $unwind: "$unit_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
            { $unwind: "$unit_parent_details" },
          ]).sort({ _id: -1 }).skip(startAfter).limit(parseLimit);
        } else if (isDateSearchWithPagination) {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "building_id": new ObjectID(building_id), input_type: "C", raised_date: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $unwind: "$unit_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
            { $unwind: "$unit_parent_details" },
          ]).sort({ _id: -1 }).skip(startAfter).limit(parseLimit);
        } else {
          cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
            { $match: { "building_id": new ObjectID(building_id), input_type: "C" } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
            { $unwind: "$unit_details" },
            { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
            { $unwind: "$unit_parent_details" },
          ]).sort({ _id: -1 });
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var invoiceIDs = [];
            var bankDetails = {};
            var bankAccounts = [];
            var unitNo = "";

            if (doc.building_details != undefined) {
              bankAccounts = doc.building_details.building_accounts;
              if (bankAccounts != undefined && bankAccounts.length > 0) {
                for (var bank of bankAccounts) {
                  if (doc.bank_id != undefined && doc.bank_id != "") {
                    if (doc.bank_id.toString() == bank.id.toString()) {
                      bankDetails = {
                        "id": bank.id,
                        "bank_name": bank.bank_name,
                        "account_no": bank.account_no,
                        "ifsc_code": bank.ifsc_code
                      }
                    }
                  }
                }
              }
            }

            if (doc.credit_details != undefined && doc.credit_details.length > 0 && doc.invoice_id != undefined && doc.invoice_id.length > 0) {
              for (var creditData of doc.credit_details) {
                var isPartialPaid = false;
                for (var invoiceValue of doc.invoice_id) {
                  if (creditData._id.toString() == invoiceValue.invoice_id) {
                    isPartialPaid = invoiceValue.is_full_paid;
                    break;
                  }
                }
                var invoiceDetail = {
                  invoice_id: creditData._id,
                  amount: parseInt(creditData.amount),
                  type: creditData.type,
                  raised_on: creditData.raised_date,
                  due_date: creditData.due_date,
                  is_full_paid: isPartialPaid
                }
                invoiceIDs.push(invoiceDetail);
              }
            }

            if (doc.unit_details != undefined && doc.unit_details != null) {
              if (doc.unit_parent_details != undefined && doc.unit_parent_details != null) {
                unitNo = doc.unit_parent_details.unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitNo = doc.unit_details.unit_name;
              }
            }

            var data = {
              "_id": doc._id,
              "building_id": doc.building_id,
              "unit_id": doc.unit_id,
              "unit_no": unitNo,
              "type": doc.type,
              "amount": parseInt(doc.amount),
              "raised_date": doc.raised_date,
              "due_date": doc.due_date,
              "payment_date": doc.payment_date,
              "validated_by": doc.validated_by,
              "raised_by": doc.raised_by,
              "payment_type": doc.payment_type,
              "bank_details": bankDetails,
              "input_type": doc.input_type,
              "txn_id": doc.txn_id,
              "invoice_id": invoiceIDs,
              "receipt_image": doc.receipt_image,
              "opening_balance": parseInt(doc.opening_balance),
              "closing_balance": parseInt(doc.closing_balance),
              "active": doc.active,
              "approved": doc.approved,
            }

            reportData.push(data);
          }
        }, function () {
          if (reportData.length == 0) {
            callBack(null, true, "No Records Found");
          } else {
            var index = 0;
            var getUserDetails = function (entry) {
              var raisedByID = entry.raised_by;
              var validateByID = entry.validated_by;
              var reportEntry = {
                "_id": entry._id,
                "building_id": entry.building_id,
                "unit_id": entry.unit_id,
                "unit_no": entry.unit_no,
                "type": entry.type,
                "amount": parseInt(entry.amount),
                "raised_date": entry.raised_date,
                "due_date": entry.due_date,
                "payment_date": entry.payment_date,
                "validated_by": entry.validated_by,
                "raised_by": entry.raised_by,
                "payment_type": entry.payment_type,
                "bank_details": entry.bank_details,
                "input_type": entry.input_type,
                "txn_id": entry.txn_id,
                "invoice_id": entry.invoice_id,
                "receipt_image": entry.receipt_image,
                "opening_balance": parseInt(entry.opening_balance),
                "closing_balance": parseInt(entry.closing_balance),
                "active": entry.active,
                "approved": entry.approved
              }

              maintenance_module.get_user_name(raisedByID, function (raisedByName, raisedByError, message1) {
                if (raisedByError) {
                  maintenanceReports.push(reportEntry);
                  if (index < reportData.length - 1) {
                    index++;
                    getUserDetails(reportData[index]);
                  } else {
                    if (isPagination) {
                      db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                        if (!countErr) {
                          totaldata = count;
                        }
                        callBack(maintenanceReports, false, "Entries Found", totaldata);
                      });
                    } else if (isDateSearchWithPagination) {
                      db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                        if (!countErr) {
                          totaldata = count;
                        }

                        callBack(maintenanceReports, false, "Entries Found", totaldata);
                      });
                    } else {
                      callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                    }
                  }
                } else {
                  reportEntry.raised_by = raisedByName;
                  if (validateByID != undefined && validateByID != null) {
                    maintenance_module.get_user_name(validateByID, function (validatedByName, validatedByError, messag2) {
                      if (validatedByError) {
                        maintenanceReports.push(reportEntry);
                        if (index < reportData.length - 1) {
                          index++;
                          getUserDetails(reportData[index]);
                        } else {
                          if (isPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }
                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else if (isDateSearchWithPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }

                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else {
                            callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                          }
                        }
                      } else {
                        reportEntry.validated_by = validatedByName;
                        maintenanceReports.push(reportEntry);
                        if (index < reportData.length - 1) {
                          index++;
                          getUserDetails(reportData[index]);
                        } else {
                          if (isPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }
                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else if (isDateSearchWithPagination) {
                            db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                              if (!countErr) {
                                totaldata = count;
                              }

                              callBack(maintenanceReports, false, "Entries Found", totaldata);
                            });
                          } else {
                            callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                          }
                        }
                      }
                    })
                  } else {
                    maintenanceReports.push(reportEntry);
                    if (index < reportData.length - 1) {
                      index++;
                      getUserDetails(reportData[index]);
                    } else {
                      if (isPagination) {
                        db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                          if (!countErr) {
                            totaldata = count;
                          }
                          callBack(maintenanceReports, false, "Entries Found", totaldata);
                        });
                      } else if (isDateSearchWithPagination) {
                        db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                          if (!countErr) {
                            totaldata = count;
                          }

                          callBack(maintenanceReports, false, "Entries Found", totaldata);
                        });
                      } else {
                        callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                      }
                    }
                  }
                }
              })
            }
            getUserDetails(reportData[index]);
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    export_building_maintenance_credits: function (building_id, start_date, end_date, callBack) {
      try {
        var maintenanceReports = [];
        var reportData = [];

        var sdate = new Date(start_date);
        var edate = new Date(end_date);

        var cursor = db.db().collection(dbb.UNIT_MAINTENANCE).aggregate([
          { $match: { "building_id": new ObjectID(building_id), input_type: "C", raised_date: { $gte: sdate, $lte: edate } } },
          { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "invoice_id.invoice_id", foreignField: "_id", as: "credit_details" } },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          { $unwind: "$building_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          { $unwind: "$unit_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          { $unwind: "$unit_parent_details" },
        ]);

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var invoiceIDs = [];
            var bankDetails = {};
            var bankAccounts = [];
            var unitNo = "";

            if (doc.building_details != undefined) {
              bankAccounts = doc.building_details.building_accounts;
              if (bankAccounts != undefined && bankAccounts.length > 0) {
                for (var bank of bankAccounts) {
                  if (doc.bank_id != undefined && doc.bank_id != "") {
                    if (doc.bank_id.toString() == bank.id.toString()) {
                      bankDetails = {
                        "id": bank.id,
                        "bank_name": bank.bank_name,
                        "account_no": bank.account_no,
                        "ifsc_code": bank.ifsc_code
                      }
                    }
                  }
                }
              }
            }

            if (doc.credit_details != undefined && doc.credit_details.length > 0 && doc.invoice_id != undefined && doc.invoice_id.length > 0) {
              for (var creditData of doc.credit_details) {
                var isPartialPaid = false;
                for (var invoiceValue of doc.invoice_id) {
                  if (creditData._id.toString() == invoiceValue.invoice_id) {
                    isPartialPaid = invoiceValue.is_full_paid;
                    break;
                  }
                }
                var invoiceDetail = {
                  invoice_id: creditData._id,
                  amount: parseInt(creditData.amount),
                  type: creditData.type,
                  raised_on: creditData.raised_date,
                  due_date: creditData.due_date,
                  is_full_paid: isPartialPaid
                }
                invoiceIDs.push(invoiceDetail);
              }
            }

            if (doc.unit_details != undefined && doc.unit_details != null) {
              if (doc.unit_parent_details != undefined && doc.unit_parent_details != null) {
                unitNo = doc.unit_parent_details.unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitNo = doc.unit_details.unit_name;
              }
            }

            var data = {
              "_id": doc._id,
              "building_id": doc.building_id,
              "unit_id": doc.unit_id,
              "unit_no": unitNo,
              "type": doc.type,
              "amount": parseInt(doc.amount),
              "raised_date": doc.raised_date,
              "due_date": doc.due_date,
              "payment_date": doc.payment_date,
              "validated_by": doc.validated_by,
              "raised_by": doc.raised_by,
              "payment_type": doc.payment_type,
              "bank_details": bankDetails,
              "input_type": doc.input_type,
              "txn_id": doc.txn_id,
              "invoice_id": invoiceIDs,
              "receipt_image": doc.receipt_image,
              "opening_balance": parseInt(doc.opening_balance),
              "closing_balance": parseInt(doc.closing_balance),
              "active": doc.active,
              "approved": doc.approved,
            }

            reportData.push(data);
          }
        }, function () {
          if (reportData.length == 0) {
            callBack(null, true, "No Credit Entries Found");
          } else {
            // callBack(creditEntries, false, "Credit Entries Found");
            var index = 0;
            var getUserDetails = function (entry) {
              var raisedByID = entry.raised_by;
              var validateByID = entry.validated_by;
              var reportEntry = {
                "_id": entry._id,
                "building_id": entry.building_id,
                "unit_id": entry.unit_id,
                "unit_no": entry.unit_no,
                "type": entry.type,
                "amount": parseInt(entry.amount),
                "raised_date": entry.raised_date,
                "due_date": entry.due_date,
                "payment_date": entry.payment_date,
                "validated_by": entry.validated_by,
                "raised_by": entry.raised_by,
                "payment_type": entry.payment_type,
                "bank_details": entry.bank_details,
                "input_type": entry.input_type,
                "txn_id": entry.txn_id,
                "invoice_id": entry.invoice_id,
                "receipt_image": entry.receipt_image,
                "opening_balance": parseInt(entry.opening_balance),
                "closing_balance": parseInt(entry.closing_balance),
                "active": entry.active,
                "approved": entry.approved
              }

              maintenance_module.get_user_name(raisedByID, function (raisedByName, raisedByError, message1) {
                if (raisedByError) {
                  maintenanceReports.push(reportEntry);
                  if (index < reportData.length - 1) {
                    index++;
                    getUserDetails(reportData[index]);
                  } else {
                    // if (isPagination) {
                    //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                    //     if (!countErr) {
                    //       totaldata = count;
                    //     }
                    //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                    //   });
                    // } else if (isDateSearchWithPagination) {
                    //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                    //     if (!countErr) {
                    //       totaldata = count;
                    //     }

                    //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                    //   });
                    // } else {
                    //   callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                    // }
                    callBack(maintenanceReports, false, "Reports Found");
                  }
                } else {
                  reportEntry.raised_by = raisedByName;
                  if (validateByID != undefined && validateByID != null) {
                    maintenance_module.get_user_name(validateByID, function (validatedByName, validatedByError, messag2) {
                      if (validatedByError) {
                        maintenanceReports.push(reportEntry);
                        if (index < reportData.length - 1) {
                          index++;
                          getUserDetails(reportData[index]);
                        } else {
                          // if (isPagination) {
                          //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                          //     if (!countErr) {
                          //       totaldata = count;
                          //     }
                          //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                          //   });
                          // } else if (isDateSearchWithPagination) {
                          //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                          //     if (!countErr) {
                          //       totaldata = count;
                          //     }

                          //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                          //   });
                          // } else {
                          //   callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                          // }
                          callBack(maintenanceReports, false, "Reports Found");
                        }
                      } else {
                        reportEntry.validated_by = validatedByName;
                        maintenanceReports.push(reportEntry);
                        if (index < reportData.length - 1) {
                          index++;
                          getUserDetails(reportData[index]);
                        } else {
                          // if (isPagination) {
                          //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                          //     if (!countErr) {
                          //       totaldata = count;
                          //     }
                          //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                          //   });
                          // } else if (isDateSearchWithPagination) {
                          //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                          //     if (!countErr) {
                          //       totaldata = count;
                          //     }

                          //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                          //   });
                          // } else {
                          //   callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                          // }
                          callBack(maintenanceReports, false, "Reports Found");
                        }
                      }
                    })
                  } else {
                    maintenanceReports.push(reportEntry);
                    if (index < reportData.length - 1) {
                      index++;
                      getUserDetails(reportData[index]);
                    } else {
                      // if (isPagination) {
                      //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id) }, function (countErr, count) {
                      //     if (!countErr) {
                      //       totaldata = count;
                      //     }
                      //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                      //   });
                      // } else if (isDateSearchWithPagination) {
                      //   db.db().collection(dbb.UNIT_MAINTENANCE).countDocuments({ "unit_id": new ObjectID(unit_id), raised_date: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                      //     if (!countErr) {
                      //       totaldata = count;
                      //     }

                      //     callBack(maintenanceReports, false, "Entries Found", totaldata);
                      //   });
                      // } else {
                      //   callBack(maintenanceReports, false, "Unit Maintenance Reports Found", maintenanceReports.length);
                      // }
                      callBack(maintenanceReports, false, "Reports Found");
                    }
                  }
                }
              })
            }
            getUserDetails(reportData[index]);
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },


    get_user_name: function (user_id, callBack) {
      db.db().collection(dbb.USER).findOne({ user_id: new ObjectID(user_id) }, function (err1, doc1) {
        if (err1) {
          callBack(null, true, err1)
        } else {
          if (doc1 != undefined && doc1.user_tyoe != undefined) {
            var userType = doc1.user_type;
            if (userType == 'R' || userType == 'SR') {
              db.db().collection(dbb.RESIDENT).findOne({ _id: new ObjectID(user_id) }, function (err2, doc2) {
                if (err2) {
                  callBack(null, true, err3);
                } else {
                  callBack(doc2.resident_name, false, "User Found");
                }
              })
            } else {
              db.db().collection(dbb.EMPLOYEE).findOne({ _id: new ObjectID(user_id) }, function (err3, doc3) {
                if (err3) {
                  callBack(null, true, err3);
                } else {
                  callBack(doc3.employee_name, false, "User Found");
                }
              })
            }
          } else {
            callBack(null, true, "User Not Found");
          }
        }
      })
    },

    view_unit_type_maintenance: function (unit_parent_id, callBack) {
      try {

        var unitReports = [];

        if (unit_parent_id != undefined && unit_parent_id != '') {

          var cursor = db.db().collection(dbb.UNIT).aggregate([
            { $match: { unit_parent_id: new ObjectID(unit_parent_id), active: true } },
            { $lookup: { from: dbb.UNIT_MAINTENANCE, localField: "_id", foreignField: "unit_id", as: "maintenance_details" } },
            { $lookup: { from: dbb.RESIDENT, localField: "_id", foreignField: "unit_id", as: "owner_details" } },
          ]).sort({ unit_name: 1 })

          cursor.forEach(function (doc, err) {
            if (err) {
              callBack(null, true, err);
            } else {
              var needsApproval = false;
              var ownerName = "";
              if (doc.maintenance_details != undefined && doc.maintenance_details.length > 0) {
                for (var entry of doc.maintenance_details) {
                  if (entry.approved == false) {
                    needsApproval = true;
                    break;
                  }
                }
              }

              if (doc.owner_details != undefined && doc.owner_details.length > 0) {
                ownerName = doc.owner_details[0].resident_name;
              }



              var status = "";
              if (doc.unit_balance > 10) {
                status = "Pending";
              } else {
                status = "Settled";
              }

              var unit_details = {
                "unit_id": doc._id,
                "unit_no": doc.unit_name,
                "owner_name": ownerName,
                "pending_amount": doc.unit_balance,
                "validate_payment": needsApproval,
                "status": status
              }

              unitReports.push(unit_details);
            }
          }, function () {
            if (unitReports.length == 0) {
              callBack(null, true, "No Records Found");
            } else {
              callBack(unitReports, false, "Unit Details Found");
            }
          })
        } else {
          callBack(null, true, "Unit Parent ID is missing");
        }
      } catch (e) {
        callBack(null, true, e);
      }
    },


    view_maintenance_types: function (callBack) {
      try {
        var types = [];
        var cursor = db.db().collection(dbb.MAINTENANCE_TYPE).find();

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            types.push(doc);
          }
        }, function () {
          if (types.length == 0) {
            callBack(null, true, "No Types Found");
          } else {
            callBack(types, false, "Types Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    view_unit_complaint_charges: function (unit_id, callBack) {
      try {

        var currentDate = new Date();
        var totalFee = 0;

        var cursor = db.db().collection(dbb.COMPLAINTS).find({ unit_id: new ObjectID(unit_id), complaint_completed_date: { $lte: currentDate }, invoiceAdded: false, active: true });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var complaintFee = 0;
            if (!isNaN(doc.complaint_fee)) {
              complaintFee = doc.complaint_fee;
            }
            totalFee = totalFee + complaintFee;
          }
        }, function () {
          callBack(totalFee, false, "Complaint Fees of unit populated");
        })
      } catch (e) {
        callBack(null, true, e)
      }
    },


    view_unit_pending_amount: function (unit_id, callBack) {
      try {
        db.db().collection(dbb.UNIT).findOne({ "_id": new ObjectID(unit_id) }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            var pendingFees = 0;
            if (doc.unit_balance != undefined) {
              pendingFees = doc.unit_balance;
            }
            callBack(pendingFees, false, "Balance Found");
          }
        })
      } catch (e) {
        callBack(null, true, e)
      }
    },

    view_unit_amenity_charges: function (unit_id, start_date, end_date, callBack) {
      try {
        // var sdate = new Date(start_date);
        // var edate = new Date(end_date);

        var totalFee = 0;

        var cursor = db.db().collection(dbb.AMENITIESBOOKING).find({ unit_id: new ObjectID(unit_id), invoiceAdded: false, active: true, approved: true });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var amenityFee = 0;
            if (!isNaN(doc.charges)) {
              amenityFee = doc.charges;
            }
            totalFee = totalFee + amenityFee;
          }
        }, function () {
          callBack(totalFee, false, "Complaint Fees of unit populated");
        })


      } catch (e) {
        callBack(null, true, e);
      }
    },


    insert_maintenance_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        if (row.Maintenance_Charges != 0 && row.Maintenance_Charges != "0") {
          var maintenanceCharges = parseInt(row.Maintenance_Charges);
          var openingBalance = parseInt(unit_balance);
          var closingBalance = openingBalance + maintenanceCharges;
          var type1 = "Maintenance";

          maintenance_module.insert_maintenance_entry(building_id, unit_id, type1, maintenanceCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err1, msg1) {
            var unitBalance = 0;
            if (err1) {
              unitBalance = openingBalance;
            } else {
              unitBalance = closingBalance;
            }
            if (row.Electricity_Charges != 0 && row.Electricity_Charges != "0") {
              maintenance_module.insert_electricity_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Water_Charges != 0 && row.Water_Charges != "0") {
                maintenance_module.insert_water_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
                  maintenance_module.insert_gas_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
                    maintenance_module.insert_amenity_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                  } else {
                    if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                      maintenance_module.insert_repair_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                    } else {
                      if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                        maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                      } else {
                        if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                          maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                        } else {
                          callBack(unitBalance, false, "Entry Done");
                        }
                      }
                    }
                  }
                }
              }
            }

          })
        } else {
          if (row.Electricity_Charges != 0 && row.Electricity_Charges != "0") {
            maintenance_module.insert_electricity_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
          } else {
            if (row.Water_Charges != 0 && row.Water_Charges != "0") {
              maintenance_module.insert_water_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
            } else {
              if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
                maintenance_module.insert_gas_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
              } else {
                if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
                  maintenance_module.insert_amenity_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
                } else {
                  if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                    maintenance_module.insert_repair_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
                  } else {
                    if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                      maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
                    } else {
                      if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                        maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unit_balance, row, callBack);
                      } else {
                        callBack(unitBalance, false, "Entry Done");
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        callBack(null, true, e)
      }
    },

    insert_electricity_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var electricityCharges = parseInt(row.Electricity_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + electricityCharges;
        var type = "Electricity";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, electricityCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Water_Charges != 0 && row.Water_Charges != "0") {
            maintenance_module.insert_water_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
              maintenance_module.insert_gas_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
                maintenance_module.insert_amenity_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                  maintenance_module.insert_repair_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                    maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                  } else {
                    if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                      maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                    } else {
                      callBack(unitBalance, false, "Entry Done");
                    }
                  }
                }
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_water_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var waterCharges = parseInt(row.Water_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + waterCharges;
        var type = "Water Charges";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, waterCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
            maintenance_module.insert_gas_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
              maintenance_module.insert_amenity_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                maintenance_module.insert_repair_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                  maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                    maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                  } else {
                    callBack(unitBalance, false, "Entry Done");
                  }
                }
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_gas_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var gasCharges = parseInt(row.Gas_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + gasCharges;
        var type = "Gas Charges";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, gasCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
            maintenance_module.insert_amenity_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
              maintenance_module.insert_repair_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                  maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  callBack(unitBalance, false, "Entry Done");
                }
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_amenity_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var amenityCharges = parseInt(row.Amenity_Usage_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + amenityCharges;
        var type = "Amenity Charges";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, amenityCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
            maintenance_module.insert_repair_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
              maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                callBack(unitBalance, false, "Entry Done");
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_repair_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var repairCharges = parseInt(row.Repair_Work_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + repairCharges;
        var type = "Complaints/Repairs Attended";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, repairCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
            maintenance_module.insert_sundry_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
              maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              callBack(unitBalance, false, "Entry Done");
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_sundry_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var sundryCharges = parseInt(row.Sundry_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + sundryCharges;
        var type = "Sundry Charges";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, sundryCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
            maintenance_module.insert_pending_charges_for_unit(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            callBack(unitBalance, false, "Entry Done");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_pending_charges_for_unit: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var pendingBalance = parseInt(row.Pending_Balance);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance;
        var type = "Pending Charges";

        maintenance_module.insert_maintenance_entry(building_id, unit_id, type, pendingBalance, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], function (err, msg) {
          callBack(closingBalance, false, "Entry Done");
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },


    insert_maintenance_entry: function (building_id, unit_id, type, payableAmount, user_id, openingBalance, closingBalance, dueDate, callBack) {
      try {

        var dueDateVal = moment(dueDate, "DD/MM/YYYY").format("YYYY-MM-DD");

        var newEntry = {
          building_id: new ObjectID(building_id),
          unit_id: new ObjectID(unit_id),
          type: type,
          amount: payableAmount,
          raised_date: new Date(),
          due_date: new Date(dueDateVal),
          payment_date: null,
          validated_by: null,
          payment_type: null,
          raised_by: new ObjectID(user_id),
          input_type: "D",
          txn_id: null,
          receipt_image: null,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          active: true,
          approved: true,
        }

        maintenance_module.add_unit_maintenance(newEntry, function (err, msg) {
          callBack(err, msg);
        })
      } catch (e) {
        callBack(true, e);
      }
    },

    send_payment_notification: function (unit_id, title, message, callBack) {
      try {
        var fcmTokens = [];
        var cursor = db.db().collection(dbb.RESIDENT).aggregate([
          { $match: { unit_id: new ObjectID(unit_id) } },
          { $lookup: { from: dbb.USER, localField: "_id", foreignField: "user_id", as: "user_details" } }
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(true, err);
          } else {
            if (doc.user_details.length > 0) {
              for (var userDetails of doc.user_details) {
                if (userDetails.fcm_token != null && userDetails.fcm_token != undefined) {
                  fcmTokens.push(userDetails.fcm_token);
                }
              }
            }
          }
        }, function () {
          if (fcmTokens.length == 0) {
            callBack(true, "No Users Found");
          } else {
            const firebase = require("firebase-admin");
            const serviceAccount = firebase_key;
            const firebaseToken = fcmTokens;

            if (!firebase.apps.length) {
              firebase.initializeApp({
                credential: firebase.credential.cert(serviceAccount),
                databaseURL: "https://apartment-erp.firebaseio.com"
              });
            }

            const payload = {
              notification: {
                title: title,
                body: message,
                type: 'payment',
                sound: "default",
              },
              data: {
                title: title,
                body: message,
                type: 'payment',
                sound: "default",
              }
            };

            const options = {
              priority: 'high',
              timeToLive: 60 * 60 * 24, // 1 day
            };

            firebase.messaging().sendToDevice(firebaseToken, payload, options)
              .then(function (response) {
                callBack(false, "Notification Successfully sent")
              })
              .catch(function (error) {
                callBack(true, error)
              });
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },



    ///Temporaray bulk upload for testing purpose to be removed when moving to production
    insert_maintenance_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        if (row.Maintenance_Charges != 0 && row.Maintenance_Charges != "0") {
          var maintenanceCharges = parseInt(row.Maintenance_Charges);
          var openingBalance = parseInt(unit_balance);
          var closingBalance = openingBalance + maintenanceCharges;
          var type1 = "Maintenance";

          maintenance_module.insert_maintenance_entry2(building_id, unit_id, type1, maintenanceCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err1, msg1) {
            var unitBalance = 0;
            if (err1) {
              unitBalance = openingBalance;
            } else {
              unitBalance = closingBalance;
            }
            if (row.Electricity_Charges != 0 && row.Electricity_Charges != "0") {
              maintenance_module.insert_electricity_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Water_Charges != 0 && row.Water_Charges != "0") {
                maintenance_module.insert_water_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
                  maintenance_module.insert_gas_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
                    maintenance_module.insert_amenity_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                  } else {
                    if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                      maintenance_module.insert_repair_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                    } else {
                      if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                        maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                      } else {
                        if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                          maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                        } else {
                          callBack(unitBalance, false, "Entry Done");
                        }
                      }
                    }
                  }
                }
              }
            }

          })
        } else {
          if (row.Electricity_Charges != 0 && row.Electricity_Charges != "0") {
            maintenance_module.insert_electricity_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
          } else {
            if (row.Water_Charges != 0 && row.Water_Charges != "0") {
              maintenance_module.insert_water_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
            } else {
              if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
                maintenance_module.insert_gas_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
              } else {
                if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
                  maintenance_module.insert_amenity_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
                } else {
                  if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                    maintenance_module.insert_repair_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
                  } else {
                    if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                      maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
                    } else {
                      if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                        maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unit_balance, row, callBack);
                      } else {
                        callBack(unitBalance, false, "Entry Done");
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        callBack(null, true, e)
      }
    },

    insert_electricity_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var electricityCharges = parseInt(row.Electricity_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + electricityCharges;
        var type = "Electricity";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, electricityCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Water_Charges != 0 && row.Water_Charges != "0") {
            maintenance_module.insert_water_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
              maintenance_module.insert_gas_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
                maintenance_module.insert_amenity_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                  maintenance_module.insert_repair_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                    maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                  } else {
                    if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                      maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                    } else {
                      callBack(unitBalance, false, "Entry Done");
                    }
                  }
                }
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_water_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var waterCharges = parseInt(row.Water_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + waterCharges;
        var type = "Water Charges";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, waterCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Gas_Charges != 0 && row.Gas_Charges != "0") {
            maintenance_module.insert_gas_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
              maintenance_module.insert_amenity_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
                maintenance_module.insert_repair_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                  maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                    maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                  } else {
                    callBack(unitBalance, false, "Entry Done");
                  }
                }
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_gas_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var gasCharges = parseInt(row.Gas_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + gasCharges;
        var type = "Gas Charges";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, gasCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Amenity_Usage_Charges != 0 && row.Amenity_Usage_Charges != "0") {
            maintenance_module.insert_amenity_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
              maintenance_module.insert_repair_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
                maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                  maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
                } else {
                  callBack(unitBalance, false, "Entry Done");
                }
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_amenity_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var amenityCharges = parseInt(row.Amenity_Usage_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + amenityCharges;
        var type = "Amenity Charges";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, amenityCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Repair_Work_Charges != 0 && row.Repair_Work_Charges != "0") {
            maintenance_module.insert_repair_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
              maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
                maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
              } else {
                callBack(unitBalance, false, "Entry Done");
              }
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_repair_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var repairCharges = parseInt(row.Repair_Work_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + repairCharges;
        var type = "Complaints/Repairs Attended";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, repairCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Sundry_Charges != 0 && row.Sundry_Charges != "0") {
            maintenance_module.insert_sundry_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
              maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
            } else {
              callBack(unitBalance, false, "Entry Done");
            }
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_sundry_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var sundryCharges = parseInt(row.Sundry_Charges);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance + sundryCharges;
        var type = "Sundry Charges";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, sundryCharges, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          var unitBalance = 0;
          if (err) {
            unitBalance = openingBalance;
          } else {
            unitBalance = closingBalance;
          }
          if (row.Pending_Balance != 0 && row.Pending_Balance != "0") {
            maintenance_module.insert_pending_charges_for_unit2(building_id, unit_id, user_id, unitBalance, row, callBack);
          } else {
            callBack(unitBalance, false, "Entry Done");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    insert_pending_charges_for_unit2: function (building_id, unit_id, user_id, unit_balance, row, callBack) {
      try {
        var pendingBalance = parseInt(row.Pending_Balance);
        var openingBalance = parseInt(unit_balance);
        var closingBalance = openingBalance;
        var type = "Pending Charges";

        maintenance_module.insert_maintenance_entry2(building_id, unit_id, type, pendingBalance, user_id, openingBalance, closingBalance, row["Due_Date(dd/mm/yyyy)"], row["Raised_Date(dd/mm/yyyy)"], function (err, msg) {
          callBack(closingBalance, false, "Entry Done");
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },


    insert_maintenance_entry2: function (building_id, unit_id, type, payableAmount, user_id, openingBalance, closingBalance, dueDate, raisedDate, callBack) {
      try {
        var dueDateVal = moment(dueDate, "DD/MM/YYYY").format("YYYY-MM-DD");
        var raisedDateVal = moment(raisedDate, "DD/MM/YYYY").format("YYYY-MM-DD");


        var newEntry = {
          building_id: new ObjectID(building_id),
          unit_id: new ObjectID(unit_id),
          type: type,
          amount: payableAmount,
          raised_date: new Date(raisedDateVal),
          due_date: new Date(dueDateVal),
          payment_date: null,
          validated_by: null,
          payment_type: null,
          raised_by: new ObjectID(user_id),
          input_type: "D",
          txn_id: null,
          receipt_image: null,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          active: true,
          approved: true,
        }

        maintenance_module.add_unit_maintenance(newEntry, function (err, msg) {
          callBack(err, msg);
        })
      } catch (e) {
        callBack(true, e);
      }
    },


  }
  return maintenance_module;
}