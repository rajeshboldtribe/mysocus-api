module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var moment = require('moment-timezone');
  var loans_module = {

    add_building_loan: function (data, callBack) {
      try {
        db.db().collection(dbb.LOANS).insertOne(data, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Building Loan Detail Added Succesfully");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },


    add_loan_emi_entry: function (data, callBack) {
      try {
        db.db().collection(dbb.LOAN_EMI).insertOne(data, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "EMI Detail Added Succesfully");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },


    refresh_outstanding_amount: function (building_id, loan_id, emi_amount, callBack) {
      try {
        db.db().collection(dbb.LOANS).findOne({
          _id: new ObjectID(loan_id), building_id: new ObjectID(building_id)
        }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            currentOutstandingAmount = parseFloat(result.current_outstanding_amount);
            emiAmount = parseFloat(emi_amount);
            newOutstandingAmount = currentOutstandingAmount - emiAmount;

            db.db().collection(dbb.LOANS).updateOne({ _id: new ObjectID(loan_id), building_id: new ObjectID(building_id) },
              {
                $set: {
                  current_outstanding_amount: newOutstandingAmount,
                }
              }, { upsert: false }, function (err1, doc) {
                if (err1) {
                  callBack(true, "Error in updating outstanding amount");
                } else {
                  callBack(false, "EMI Detail Added succesfully");
                }
              })
          }

        })
      } catch (e) {
        callBack(true, e);
      }
    },

    view_building_loans: function (building_id, callBack) {
      try {

        var loanEntries = [];

        var cursor = db.db().collection(dbb.LOANS).aggregate([
          { $match: { building_id: new ObjectID(building_id) } },
          { $lookup: { from: dbb.LOAN_EMI, localField: "_id", foreignField: "loan_id", as: "emi_details" } },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          { $unwind: "$building_details" }
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var buildingAccounts = [];
            var emiDetails = [];
            if (doc.building_details != undefined && doc.building_details.building_accounts.length > 0) {
              buildingAccounts = doc.building_details.building_accounts;
            }

            if (doc.emi_details != undefined && doc.emi_details.length > 0) {
              for (var emi of doc.emi_details) {
                var bankInfo = {};
                if (emi.bank_id != undefined && emi.bank_id != '' && buildingAccounts.length > 0) {
                  for (var bankDetails of buildingAccounts) {
                    if (emi.bank_id.toString() == bankDetails.id.toString()) {
                      bankInfo = {
                        bank_name: bankDetails.bank_name,
                        account_no: bankDetails.account_no,
                        ifsc_code: bankDetails.ifsc_code,
                        id: bankDetails.id
                      }
                    }
                  }
                }
                var emiEntry = {
                  emi_id: emi._id,
                  emi_amount: emi.emi_amount,
                  paid_month: emi.paid_month,
                  paid_year: emi.paid_year,
                  payment_mode: emi.payment_mode,
                  bank_details: bankInfo,
                  transaction_id: emi.transaction_id
                }
                emiDetails.push(emiEntry);
              }
            }

            var loanBankDetail = {};

            if (buildingAccounts.length > 0) {
              for (var loanBank of buildingAccounts) {
                if (doc.bank_id.toString() == loanBank.id.toString()) {
                  loanBankDetail = {
                    bank_name: loanBank.bank_name,
                    account_no: loanBank.account_no,
                    ifsc_code: loanBank.ifsc_code,
                    id: loanBank.id
                  }
                }
              }
            }

            var createdOnVal = moment.tz(doc.created_on, 'Asia/Kolkata').format().replace("+05:30", ".000Z");;

            var entry = {
              _id: doc._id,
              loan_title: doc.loan_title,
              building_id: doc.building_id,
              starts_from: doc.starts_from,
              ends_on: doc.ends_on,
              loan_amount: doc.loan_amount,
              current_outstanding_amount: doc.current_outstanding_amount,
              bank_details: loanBankDetail,
              emi_details: emiDetails,
              active: doc.active,
              created_on: createdOnVal,
            }
            loanEntries.push(entry);
          }
        }, function () {
          if (loanEntries.length == 0) {
            callBack(null, true, "No Entries Found");
          } else {
            callBack(loanEntries, false, "Loan Details Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },


    close_building_loan: function (building_id, loan_id, callBack) {
      try {
        db.db().collection(dbb.LOANS).updateOne({ _id: new ObjectID(loan_id), building_id: new ObjectID(building_id) },
          {
            $set: {
              active: false,
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              callBack(true, err);
            } else {
              callBack(false, "Loan closed");
            }
          })
      } catch (e) {
        callBack(true, e);
      }
    },

    export_loans_route: function (building_id, loan_id, callBack) {
      try {
        var loanEntries = [];

        var cursor = db.db().collection(dbb.LOAN_EMI).aggregate([
          { $match: { loan_id: new ObjectID(loan_id), building_id: new ObjectID(building_id) } },
          { $lookup: { from: dbb.LOANS, localField: "loan_id", foreignField: "_id", as: "loan_details" } },
          { $unwind: "$loan_details" },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          { $unwind: "$building_details" },
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var borrwedBank = "";
            var paidFromBank = "";
            var loanTenure = "";
            var loanTitle = "";

            if (doc.loan_details != undefined && doc.loan_details != null) {
              if (doc.building_details != undefined && doc.building_details.bank_accounts != undefined
                && doc.building_details.bank_accounts.length > 0) {
                for (var bankInfo of doc.building_details.bank_accounts) {
                  if (bankInfo.id.toString() == doc.loan_details.bank_id.toString()) {
                    borrwedBank = bankInfo.bank_name;
                  } else if (bankInfo.id.toString() == doc.bank_id.toString()) {
                    paidFromBank = bankInfo.bank_name + " - " + bankInfo.account_no;
                  }
                }
              }


              var tenureStart = moment(new Date(doc.loan_details.starts_from), 'YYYY-MM-DDThh:mm:ssz').format("DD MMM YYYY");
              var tenureEnd = moment(new Date(doc.loan_details.ends_on), 'YYYY-MM-DDThh:mm:ssz').format("DD MMM YYYY");
              loanTenure = tenureStart + " - " + tenureEnd;
              loanTitle = doc.loan_details.loan_title;
            }

            var createdOnVal = moment.tz(doc.created_on, 'Asia/Kolkata').format("DD-MMM-YYYY");

            var data = {
              title: loanTitle,
              borrowed_bank: borrwedBank,
              tenure: loanTenure,
              paid_month: doc.paid_month,
              paid_year: doc.paid_year,
              emi_amount: doc.emi_amount,
              payment_mode: doc.payment_mode,
              paid_bank: paidFromBank,
              transaction_id: doc.transaction_id,
              created_on: createdOnVal
            }

            loanEntries.push(data);
          }
        }, function () {
          if (loanEntries.length == 0) {
            callBack(null, true, "No EMI Entries Found");
          } else {
            callBack(loanEntries, false, "EMI Entries Found");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
  }
  return loans_module;
}
