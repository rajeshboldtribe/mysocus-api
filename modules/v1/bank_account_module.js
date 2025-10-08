module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var banking_module = {

    add_bank_account: function (building_id, bank_account, callBack) {
      try {
        bank_account.id = new ObjectID();
        db.db().collection(dbb.BUILDING).updateOne({ _id: new ObjectID(building_id) }, {
          $push: {
            building_accounts: bank_account
          }
        }, { upsert: false }, function (err, doc) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "bank account added");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },

    view_bank_accounts: function (building_id, callBack) {
      try {
        db.db().collection(dbb.BUILDING).findOne({ _id: new ObjectID(building_id) }, function (err, result) {
          if (err) {
            callBack(null, true, "No bank accounts found");
          } else {
            callBack(result.building_accounts, false, "Bank accounts found");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },


    view_bank_account_roles: function (callBack) {
      try {
        bankaccountroles = [];
        var cursor = db.db().collection(dbb.BANKACCOUNT_ROLES).find();

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            bankaccountroles.push(doc);
          }
        }, function () {
          if (bankaccountroles.length == 0) {
            callBack(null, true, "No Roles Found");
          } else {
            callBack(bankaccountroles, false, "No Roles Found");
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },

    delete_bank_account: function (building_id, bank_account_id, callBack) {
      try {
        db.db().collection(dbb.BUILDING).updateOne({ _id: new ObjectID(building_id) }, {
          $pull: {
            building_accounts: { id: new ObjectID(bank_account_id) }
          }
        }, { upsert: false }, function (err, doc) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "bank account removed");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

  }
  return banking_module;
}