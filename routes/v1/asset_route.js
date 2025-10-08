module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var asset_module = require('../../modules/v1/asset_module')(mongo, ObjectID, url, assert, dbb, db);

    var multer = require('multer');
    var readXlsxFile = require('read-excel-file/node');
    var path = require('path');
    var fs = require('fs');

    //START OF VIEW ASSET TYPE
    app.post('/v1/view_asset_type', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              asset_module.view_asset_types(function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    })
    //END OF VIEW ASSET TYPE

    //START OF ADD ASSET ENTRY
    app.post('/v1/add_asset_entry', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id") &&
          req.body.hasOwnProperty("asset_type") &&
          req.body.hasOwnProperty("asset_name") &&
          req.body.hasOwnProperty("amount") &&
          req.body.hasOwnProperty("payment_mode")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              var bankAccount = "";
              var gstPercentage = 0;
              var gstAmount = 0.00;
              var totalAmount = 0.00;
              var amountVal = 0.00;
              if (req.body.bank_account != undefined && req.body.bank_account != null && req.body.bank_account != '') {
                bankAccount = new ObjectID(req.body.bank_account);
              }
              if (req.body.gst_percentage != undefined && req.body.gst_percentage != null && req.body.gst_percentage != '') {
                gstPercentage = parseInt(req.body.gst_percentage);
              }
              if (req.body.gst_amount != undefined && req.body.gst_amount != null && req.body.gst_amount != '') {
                gstAmount = parseFloat(req.body.gst_amount);
              }

              amountVal = parseFloat(req.body.amount);
              totalAmount = gstAmount + amountVal;
              
              var newAssetEntry = {
                building_id: new ObjectID(req.body.building_id),
                asset_type: new ObjectID(req.body.asset_type),
                asset_name: req.body.asset_name,
                amount: amountVal,
                payment_mode: req.body.payment_mode,
                bank_account_id: bankAccount,
                gst_percentage: gstPercentage,
                gst_amount: gstAmount,
                comments: req.body.comments,
                transaction_id: req.body.transaction_id,
                total_amount: totalAmount,
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true
              }
              asset_module.add_asset_entry(newAssetEntry, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.headers.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("asset_type") == false) {
            res.json({ status: false, message: "asset_type parameter is missing" });
          } else if (req.headers.hasOwnProperty("asset_name") == false) {
            res.json({ status: false, message: "asset_name parameter is missing" });
          } else if (req.headers.hasOwnProperty("amount") == false) {
            res.json({ status: false, message: "amount parameter is missing" });
          } else if (req.headers.hasOwnProperty("payment_mode") == false) {
            res.json({ status: false, message: "payment_mode parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    })
    //END OF ADD ASSET ENTRY

    //START OF VIEW ASSET ENTRY
    app.post('/v1/view_asset_entries', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              asset_module.view_asset_entry(req.body.building_id, req.body.limit, req.body.starting_after, req.body.start_date, req.body.end_date, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, totaldata: total });
                }
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.headers.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    })
    //END OF VIEW ASSET ENTRY


    //START OF EXPORT ASSET ENTRIES
    app.get('/v1/export_asset_entries', function (req, res) {
      try {
        if (req.query.hasOwnProperty("building_id")
          && req.query.hasOwnProperty("start_date")
          && req.query.hasOwnProperty("end_date")) {
          asset_module.export_asset_entries(req.query.building_id, req.query.start_date, req.query.end_date, function (result, error, message) {
            if (error) {
              res.json({ status: false, message: message });
            } else {
              // res.json({ status: true, message: message, result: result });
              const filePath = "Asset_Details_Export/asset_export_sheet.csv";
              const createCsvWriter = require('csv-writer').createObjectCsvWriter;
              const csvWriter = createCsvWriter({
                path: 'Asset_Details_Export/asset_export_sheet.csv',
                header: [
                  { id: 'DATE_OF_ENTRY', title: 'DATE_OF_ENTRY' },
                  { id: 'NAME', title: 'NAME' },
                  { id: 'TYPE', title: 'TYPE' },
                  { id: 'AMOUNT', title: 'AMOUNT' },
                  { id: 'GST%', title: 'GST%' },
                  { id: 'GST_AMOUNT', title: 'GST_AMOUNT' },
                  { id: 'TOTAL_AMOUNT', title: 'TOTAL_AMOUNT' },
                  { id: 'PAYMENT_MODE', title: 'PAYMENT_MODE' },
                  { id: 'BANK_ACCOUNT', title: 'BANK_ACCOUNT' },
                  { id: 'TRANSACTION_ID', title: 'TRANSACTION_ID' },
                  { id: 'COMMENT', title: 'COMMENT' },
                ]
              });
              var data = [];
              for (var asset of result) {
                var assetInfo = {
                  "DATE_OF_ENTRY": asset.created_on,
                  "NAME": asset.asset_name,
                  "TYPE": asset.asset_type,
                  "AMOUNT": asset.amount,
                  "GST%": asset.gst_percentage,
                  "GST_AMOUNT": asset.gst_amount,
                  "TOTAL_AMOUNT": asset.total_amount,
                  "PAYMENT_MODE": asset.payment_mode,
                  "BANK_ACCOUNT": asset.bank_account,
                  "TRANSACTION_ID": asset.transaction_id,
                  "COMMENT": asset.comments
                }
                data.push(assetInfo);
              }
              csvWriter
                .writeRecords(data)
                .then(() => {
                  res.download(filePath);
                });
            }
          });
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
    //END OF EXPORT ASSET ENTRIES
  }
}