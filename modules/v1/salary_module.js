module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var moment = require('moment-timezone');
  var salary_module = {
    view_employee_vendor_list: function (building_id, payable_month, payable_year, callBack) {
      try {
        var empvendorList = [];


        var empCursor = db.db().collection(dbb.EMPLOYEE).find({ building_id: new ObjectID(building_id), active: true });

        empCursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var empData = {
              _id: doc._id,
              name: doc.employee_name,
              image: doc.employee_img,
              type: "Employee",
              phone_number: doc.employee_contact_info,
              salary: doc.employee_salary_amount,
              bank_account_details: {
                account_no: doc.employee_bank_account_no,
                bank_name: doc.employee_bank_name,
                ifsc_code: doc.employee_bank_ifsc_code
              }
            }
            empvendorList.push(empData);
          }
        }, function () {
          var vendorCursor = db.db().collection(dbb.BUILDING).aggregate([
            { $match: { _id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.VENDOR, localField: "vendors.vendor_id", foreignField: "_id", as: "vendor_details" } },
            { $unwind: "$vendor_details" }
          ])

          vendorCursor.forEach(function (doc1, err1) {
            if (err1) {
              callBack(null, true, "Vendor Cursor " + err1);
            } else {
              if (doc1.vendor_details != undefined && doc1.vendor_details != null) {
                var vendorData = {
                  _id: doc1.vendor_details._id,
                  type: "Vendor",
                  name: doc1.vendor_details.vendor_name,
                  image: doc1.vendor_details.vendor_image,
                  phone_number: doc1.vendor_details.vendor_contact_info,
                  salary: "",
                  bank_account_details: {
                    account_no: doc1.vendor_details.vendor_account_no,
                    bank_name: doc1.vendor_details.vendor_bank_name,
                    ifsc_code: doc1.vendor_details.vendor_bank_ifsc
                  }
                }
                empvendorList.push(vendorData);
              }
            }
          }, function () {
            if (empvendorList.length == 0) {
              callBack(null, true, "No Employee or Vendors found");
            } else {
              var paidIDs = [];
              var paymentCursor = db.db().collection(dbb.SALARY).find({ building_id: new ObjectID(building_id), payable_month: payable_month, payable_year: payable_year });

              paymentCursor.forEach(function (doc2, err2) {
                if (err2 == null && doc2.salary_paid != undefined && doc2.salary_paid != null && doc2.salary_paid.length > 0) {
                  for (var i = 0; i < doc2.salary_paid.length; i++) {
                    paidIDs.push(doc2.salary_paid[i]._id);
                  }
                }
              }, function () {
                if (paidIDs.length == 0) {
                  callBack(empvendorList, false, "Employee or Vendors Found");
                } else {
                  var nonPaidList = [];
                  for (var empVendor of empvendorList) {
                    if (!paidIDs.includes(empVendor._id.toString())) {
                      nonPaidList.push(empVendor);
                    }
                  }
                  callBack(nonPaidList, false, "Employee or Vendors Found");
                }
              })
            }
          })
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    add_salary_entry: function (newEntry, callBack) {
      try {
        db.db().collection(dbb.SALARY).insertOne(newEntry, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Salary entry added");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },


    view_salary_entries: function (building_id, limit, starting_after, start_date, end_date, callBack) {
      try {
        var salaryEntries = [];
        var limit = parseInt(limit);
        var starting_after = parseInt(starting_after);
        var isSearchWithDate = false;

        var cursor;

        if (start_date != undefined && start_date != '' && end_date != undefined && end_date != '') {
          isSearchWithDate = true;
          var startDateSearch = new Date(start_date);
          startDateSearch.setDate(startDateSearch.getDate() - 1);
          var endDateSearch = new Date(end_date);


          var startDateVal = moment(startDateSearch).format('YYYY-MM-DDT18:30:00.000+00:00');
          var endDateVal = moment(endDateSearch).format('YYYY-MM-DDT18:29:59.000+00:00');

          sdate = new Date(startDateVal);
          edate = new Date(endDateVal);

          cursor = db.db().collection(dbb.SALARY).aggregate([
            { $match: { building_id: new ObjectID(building_id), created_on: { $gte: sdate, $lte: edate } } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" }
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit)
        } else {
          cursor = db.db().collection(dbb.SALARY).aggregate([
            { $match: { building_id: new ObjectID(building_id) } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" }
          ]).sort({ _id: -1 }).skip(starting_after).limit(limit)
        }


        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err, 0);
          } else {
            var bankAccount = {};
            if (doc.bank_account_id != '' && doc.bank_account_id != null &&
              doc.building_details != undefined && doc.building_details != null) {
              var buildingBankAccounts = doc.building_details.building_accounts;
              if (buildingBankAccounts != null && buildingBankAccounts.length > 0) {
                for (var account of buildingBankAccounts) {
                  if (account.id.toString() == doc.bank_account_id.toString()) {
                    bankAccount = {
                      bank_name: account.bank_name,
                      _id: account.id,
                      ifsc_code: account.ifsc_code,
                      account_no: account.account_no
                    }
                  }
                }
              }
            }



            var data = {
              _id: doc._id,
              building_id: doc.building_id,
              payable_month: doc.payable_month,
              payable_year: doc.payable_year,
              salary_paid: doc.salary_paid,
              payment_type: doc.payment_type,
              bank_account: bankAccount,
              created_on: doc.created_on,
            }


            salaryEntries.push(data);
          }
        }, function () {
          if (salaryEntries.length == 0) {
            callBack(null, true, "No Salary Entries Found", 0);
          } else {
            if (isSearchWithDate) {
              db.db().collection(dbb.SALARY).countDocuments({ "building_id": new ObjectID(building_id), created_on: { $gte: sdate, $lte: edate } }, function (countErr, count) {
                if (!countErr) {
                  totaldata = count;
                }
                callBack(salaryEntries, false, "Entries Found", totaldata);
              });
            } else {
              db.db().collection(dbb.SALARY).countDocuments({ "building_id": new ObjectID(building_id) }, function (countErr, count) {
                if (!countErr) {
                  totaldata = count;
                }

                callBack(salaryEntries, false, "Entries Found", totaldata);
              });
            }
          }
        });

      } catch (e) {
        callBack(null, true, e, 0);
      }
    },

    export_salary_entries: function (building_id, start_date, end_date, callBack) {
      try {
        var startDateVal = moment(new Date(start_date)).format('YYYY-MM-DDT00:00:00.000+00:00');
        var endDateVal = moment(new Date(end_date)).format('YYYY-MM-DDT23:59:59.000+00:00');

        sdate = new Date(startDateVal);
        edate = new Date(endDateVal);
        var salaryEntries = [];

        var cursor = db.db().collection(dbb.SALARY).aggregate([
          { $match: { building_id: new ObjectID(building_id), created_on: { $gte: sdate, $lte: edate } } },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          { $unwind: "$building_details" }
        ]).sort({ _id: 1 });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var buildingBankDetails = "";
            if (doc.bank_account_id != '' && doc.bank_account_id != null &&
              doc.building_details != undefined && doc.building_details != null) {
              var buildingBankAccounts = doc.building_details.building_accounts;
              if (buildingBankAccounts != null && buildingBankAccounts.length > 0) {
                for (var account of buildingBankAccounts) {
                  if (account.id.toString() == doc.bank_account_id.toString()) {
                    // bankAccount = {
                    //   bank_name: account.bank_name,
                    //   _id: account.id,
                    //   ifsc_code: account.ifsc_code,
                    //   account_no: account.account_no
                    // }
                    buildingBankDetails = account.bank_name + " - " + account.account_no;
                    break;
                  }
                }
              }
            }

            var createdOnVal = moment.tz(doc.created_on, 'Asia/Kolkata').format("DD-MMM-YYYY");

            if (doc.salary_paid != undefined && doc.salary_paid.length > 0) {
              for (var salary of doc.salary_paid) {
                var data = {
                  created_on: createdOnVal,
                  payable_year: doc.payable_year,
                  payable_month: doc.payable_month,
                  name: salary.name,
                  role: salary.type,
                  phone_number: salary.phone_number,
                  salary: salary,
                  payment_type: doc.payment_type,
                  building_account: buildingBankDetails,
                  receiver_account: salary.bank_account_details.bank_name + " - " + salary.bank_account_details.account_no,
                }
                salaryEntries.push(data);
              }
            }

          }
        }, function () {
          if (salaryEntries.length == 0) {
            callBack(null, true, "No Salary Entries Found");
          } else {
            callBack(salaryEntries, false, "Entries Found");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
  }
  return salary_module;
}