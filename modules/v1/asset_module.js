module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var moment = require('moment-timezone');
  var asset_module = {

    //Start of View Asset Types
    view_asset_types: function (callBack) {
      try {
        var assetTypes = [];
        var cursor = db.db().collection(dbb.ASSET_TYPES).find();

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(true, err);
          } else {
            assetTypes.push(doc);
          }
        }, function () {
          if (assetTypes.length == 0) {
            callBack(null, true, "No Asset Type Found");
          } else {
            callBack(assetTypes, false, "Asset Types Found");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of View Asset Types

    //Start of Add Asset Entry
    add_asset_entry: function (newEntry, callBack) {
      try {
        db.db().collection(dbb.ASSET).insertOne(newEntry, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Entry Inserted");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Add Asset Entry

    //Start of View Asset Entries
    view_asset_entry: function (building_id, limit, startingAfter, start_date, end_date, callBack) {
      try {
        var assetEntries = [];
        var isSearchDate = false;
        var isPagination = false;
        var isSearchWithPagination = false;
        var cursor;

        var startingAfter;
        var limit;
        var sdate;
        var edate;

        if (start_date != undefined && start_date != null && start_date != '' && end_date != undefined && end_date != null && end_date != '') {
          if (limit != '' && limit != undefined && startingAfter != '' && startingAfter != undefined) {
            isSearchWithPagination = true;
            startingAfter = parseInt(startingAfter);
            limit = parseInt(limit);
          } else {
            isSearchDate = true;
          }

          var startDateSearch = new Date(start_date);
          startDateSearch.setDate(startDateSearch.getDate() - 1);
          var endDateSearch = new Date(end_date);


          var startDateVal = moment(startDateSearch).format('YYYY-MM-DDT18:30:00.000+00:00');
          var endDateVal = moment(endDateSearch).format('YYYY-MM-DDT18:29:59.000+00:00');

          sdate = new Date(startDateVal);
          edate = new Date(endDateVal);
        } else if (limit != '' && limit != undefined && startingAfter != '' && startingAfter != undefined) {
          isPagination = true;
          startingAfter = parseInt(startingAfter);
          limit = parseInt(limit);
        }


        if (isPagination) {
          cursor = db.db().collection(dbb.ASSET).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.ASSET_TYPES, localField: "asset_type", foreignField: "_id", as: "asset_type_detail" } },
            { $unwind: "$asset_type_detail" },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
          ]).sort({ _id: -1 }).skip(startingAfter).limit(limit);
        } else if (isSearchDate) {
          cursor = db.db().collection(dbb.ASSET).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true, created_on: { $gt: sdate, $lt: edate } } },
            { $lookup: { from: dbb.ASSET_TYPES, localField: "asset_type", foreignField: "_id", as: "asset_type_detail" } },
            { $unwind: "$asset_type_detail" },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
          ]).sort({ _id: -1 })
        } else if (isSearchWithPagination) {
          cursor = db.db().collection(dbb.ASSET).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true, created_on: { $gt: sdate, $lt: edate } } },
            { $lookup: { from: dbb.ASSET_TYPES, localField: "asset_type", foreignField: "_id", as: "asset_type_detail" } },
            { $unwind: "$asset_type_detail" },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
          ]).sort({ _id: -1 }).skip(startingAfter).limit(limit);
        } else {
          cursor = db.db().collection(dbb.ASSET).aggregate([
            { $match: { building_id: new ObjectID(building_id), active: true } },
            { $lookup: { from: dbb.ASSET_TYPES, localField: "asset_type", foreignField: "_id", as: "asset_type_detail" } },
            { $unwind: "$asset_type_detail" },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
            { $unwind: "$building_details" },
          ]).sort({ _id: -1 })
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var assetType = "";
            var bankAccount = {};
            if (doc.asset_type_detail != undefined && doc.asset_type_detail != null) {
              assetType = doc.asset_type_detail.type;
            }
            if (doc.building_details != undefined && doc.building_details != null) {
              var buildingBankAccounts = doc.building_details.building_accounts;
              if (buildingBankAccounts != null && buildingBankAccounts.length > 0) {
                for (var account of buildingBankAccounts) {
                  if (account.id.toString() == doc.bank_account_id.toString()) {
                    bankAccount = {
                      _id: account._id,
                      account_no: account.account_no,
                      bank_name: account.bank_name,
                      ifsc_code: account.ifsc_code
                    }
                  }
                }
              }
            }
            
            var asset = {
              _id: doc._id,
              building_id: doc.building_id,
              asset_type: assetType,
              asset_name: doc.asset_name,
              amount: doc.amount,
              payment_mode: doc.payment_mode,
              bank_account: bankAccount,
              gst_percentage: doc.gst_percentage,
              gst_amount: doc.gst_amount,
              comments: doc.comments,
              created_on: doc.created_on,
              transaction_id: doc.transaction_id,
              total_amount: doc.total_amount,
            }
            assetEntries.push(asset);
          }
        }, function () {
          if (assetEntries.length == 0) {
            callBack(null, true, "No Entries Found");
          } else {
            if (isSearchWithPagination) {
              db.db().collection(dbb.ASSET).countDocuments({ building_id: new ObjectID(building_id), created_on: { $gt: sdate, $lt: edate } }, function (countErr, count) {
                if (!countErr) {
                  totaldata = count;
                }
                callBack(assetEntries, false, "Entries Found", totaldata);
              });
            } else if (isPagination) {
              db.db().collection(dbb.ASSET).countDocuments({ building_id: new ObjectID(building_id) }, function (countErr, count) {
                if (!countErr) {
                  totaldata = count;
                }
                callBack(assetEntries, false, "Entries Found", totaldata);
              });
            } else {
              callBack(assetEntries, false, "Entries Found", assetEntries.length);
            }

          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View Asset Entries


    //Start of export asset entries
    export_asset_entries: function (building_id, start_date, end_date, callBack) {
      try {
        var startDateVal = moment(new Date(start_date)).format('YYYY-MM-DDT00:00:00.000+00:00');
        var endDateVal = moment(new Date(end_date)).format('YYYY-MM-DDT23:59:59.000+00:00');

        sdate = new Date(startDateVal);
        edate = new Date(endDateVal);
        var assetEntries = [];

        var cursor = db.db().collection(dbb.ASSET).aggregate([
          { $match: { building_id: new ObjectID(building_id), active: true, created_on: { $gt: sdate, $lt: edate } } },
          { $lookup: { from: dbb.ASSET_TYPES, localField: "asset_type", foreignField: "_id", as: "asset_type_detail" } },
          { $unwind: "$asset_type_detail" },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          { $unwind: "$building_details" },
        ]).sort({ _id: -1 })


        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var assetType = "";
            var bankName = "";
            if (doc.asset_type_detail != undefined && doc.asset_type_detail != null) {
              assetType = doc.asset_type_detail.type;
            }
            if (doc.building_details != undefined && doc.building_details != null) {
              var buildingBankAccounts = doc.building_details.building_accounts;
              if (buildingBankAccounts != null && buildingBankAccounts.length > 0) {
                for (var account of buildingBankAccounts) {
                  if (account.id.toString() == doc.bank_account_id.toString()) {
                    bankName = account.bank_name + " - " + account.account_no;
                  }
                }
              }
            }

            var createdOnVal = moment.tz(doc.created_on, 'Asia/Kolkata').format("DD-MMM-YYYY");

            var asset = {
              _id: doc._id,
              building_id: doc.building_id,
              asset_type: assetType,
              asset_name: doc.asset_name,
              amount: doc.amount,
              payment_mode: doc.payment_mode,
              bank_account: bankName,
              gst_percentage: doc.gst_percentage,
              gst_amount: doc.gst_amount,
              comments: doc.comments,
              created_on: createdOnVal,
              transaction_id: doc.transaction_id,
              total_amount: doc.total_amount,
            }
            assetEntries.push(asset);
          }
        }, function () {
          if (assetEntries.length == 0) {
            callBack(null, true, "No Asset Entries Available")
          } else {
            callBack(assetEntries, false, "Asset Entries Available");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of export asset entries
  }
  return asset_module;
}