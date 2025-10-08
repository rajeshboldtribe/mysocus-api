module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var legal_module = {

    get_terms_conditions: function (callBack) {
      try {
        db.db().collection(dbb.LEGAL).findOne({ active: true }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(doc.terms, false, "Terms and Conditions found");
          }
        })
      } catch (er) {
        callBack(null, true, er);
      }
    },

    get_privacy_policy: function (callBack) {
      try {
        db.db().collection(dbb.LEGAL).findOne({ active: true }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(doc.privacy_policy, false, "Terms and Conditions found");
          }
        })
      } catch (er) {
        callBack(null, true, er);
      }
    },
  }
  return legal_module;
}