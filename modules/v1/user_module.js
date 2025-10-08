module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var user_module = {

    //Start of Add User

    add_user: function (new_user, callBack) {
      try {

        db.db().collection(dbb.USER).insertOne(new_user, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          } else {
            callBack(result, false, "User Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Add User

    //Start of Login
    login: function (email, password, callBack) {
      try {

        var userExists = false;
        var user_type = false;
        var cursor = db.db().collection(dbb.USER).find({ 'email': email, 'password': password });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
          type_id = doc.user_id;
          user_token = doc.user_token;
        }, function () {
          if (userExists) {
            callBack(type_id, user_type, true, "User-Type did not matched!", user_token);
          } else {
            callBack('', user_type, userExists, "User Does not Exists!", '');
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of login



    //Start of login using email and password 

    loginemail: function (email, password, callBack) {
      try {
        var isBuildingSubscribed = false;
        var userExists = false;
        var user_type = false;
        var building_found = false;
        var building_id;
        var building_name = "";
        var building_address = "";
        var building_location = [];
        var departments = null;
        var data = {};

        db.db().collection(dbb.USER).findOne({ 'email': { $regex: new RegExp(email, "i") }, 'password': password, active: true }, function (err, doc) {
          if (err) {
            callBack(false, '', '', "Incorrect credentials entered");
          } else {
            if (doc == null) {
              callBack(false, '', '', "Incorrect credentials entered");
            } else {
              user_type = doc.user_type;
              user_id = doc._id;
              type_id = doc.user_id;
              user_token = doc.user_token;
              if (user_type == "SA") {
                data = {
                  user_id: type_id,
                  user_type: user_type,
                }
                callBack(true, user_type, data, "Login successfull");
              } else if (user_type == "A" || user_type == "E") {
                var empCursor = db.db().collection(dbb.EMPLOYEE).aggregate([
                  { $match: { '_id': new ObjectID(type_id) } },
                  { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } }
                ])
                empCursor.forEach(function (doc1, err1) {
                  assert.equal(null, err1);
                  building_found = true;

                  if (doc1.building_details.length > 0 && doc1.building_details[0] != undefined) {
                    building_name = doc1.building_details[0].building_name;

                    var subscribeDate = new Date(doc1.building_details[0].valid_till);
                    var currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                  }
                  data = {
                    user_id: type_id,
                    user_type: user_type,
                    user_building_id: doc1.building_id,
                    departments: doc1.departments,
                    user_building_name: building_name,
                    is_subscribed: isBuildingSubscribed,
                  }
                }, function () {
                  if (building_found) {
                    if (isBuildingSubscribed) {
                      callBack(true, user_type, data, "Login successfull");
                    } else {
                      callBack(false, user_type, data, "Subscription has Ended Contact mySOCUS");
                    }
                  } else {
                    callBack(false, '', '', "User data not available");
                  }
                })
              } else {
                var resCursor = db.db().collection(dbb.RESIDENT).aggregate([
                  { $match: { '_id': new ObjectID(type_id) } },
                  { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
                  { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
                  { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
                ])
                resCursor.forEach(function (doc2, err2) {
                  assert.equal(null, err2);
                  building_found = true;
                  var isBuildingSubscribed = false;
                  if (doc2.building_details.length > 0 && doc2.building_details[0] != undefined) {
                    building_name = doc2.building_details[0].building_name;
                    building_address = doc2.building_details[0].building_address;
                    building_location = doc2.building_details[0].location;

                    var subscribeDate = new Date(doc2.building_details[0].valid_till);
                    var currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                  }

                  var unitNo = "";
                  if (doc2.unit_details != undefined && doc2.unit_details.length > 0) {
                    if (doc2.unit_parent_details != undefined && doc2.unit_parent_details.length > 0) {
                      unitNo = doc2.unit_parent_details[0].unit_name + " - " + doc2.unit_details[0].unit_name;
                    } else {
                      unitNo = doc2.unit_details[0].unit_name;
                    }
                  }
                  data = {
                    user_id: type_id,
                    user_type: user_type,
                    user_unit_id: doc2.unit_id,
                    user_building_id: doc2.building_id,
                    user_building_name: building_name,
                    user_building_address: building_address,
                    user_building_location: building_location,
                    user_email: doc2.resident_email,
                    user_name: doc2.resident_name,
                    user_profile_img: doc2.resident_img,
                    user_contact_info: doc2.resident_contact,
                    user_sec_contact_info: doc2.resident_sec_contact_info,
                    user_permanent_address: doc2.resident_permanent_address,
                    user_unit_no: unitNo,
                    is_residing: doc2.is_residing,
                    is_owner: doc2.is_owner,
                    is_sub_resident: doc2.is_sub_resident,
                    is_subscribed: isBuildingSubscribed,
                  }
                }, function () {
                  if (building_found) {
                    callBack(true, user_type, data, "Login successfull");
                  } else {
                    callBack(false, '', '', "User data not available");
                  }
                })
              }
            }
          }
        })
      } catch (e) {
        callBack(false, '', '', e);
      }
    },
    //End of login using email and password 


    //Start of login with mobile and password

    login_mobile_password: function (mobile, password, callBack) {
      try {
        var mob = parseInt(mobile)
        var userExists = false;
        var user_type = false;
        var cursor = db.db().collection(dbb.USER).find({ 'mobile': mob, 'password': password });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
          type_id = doc.user_id;
          user_token = doc.user_token;
        }, function () {
          if (userExists) {
            if (user_type == "A" || user_type == "E") {
              var empCursor = db.db().collection(dbb.EMPLOYEE).aggregate([
                { $match: { '_id': new ObjectID(type_id) } },
                { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } }
              ])
              empCursor.forEach(function (doc1, err1) {
                assert.equal(null, err1);
                building_found = true;
                var isBuildingSubscribed = false;
                if (doc1.building_details.length > 0 && doc1.building_details[0] != undefined) {
                  building_name = doc1.building_details[0].building_name;

                  var subscribeDate = new Date(doc1.building_details[0].valid_till);
                  var currentDate = new Date();
                  currentDate.setHours(0, 0, 0, 0);
                  isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                }
                data = {
                  user_id: type_id,
                  user_type: user_type,
                  user_building_id: doc1.building_id,
                  departments: doc1.departments,
                  user_building_name: building_name,
                  is_subscribed: isBuildingSubscribed
                }
              }, function () {
                if (building_found) {
                  if (isBuildingSubscribed) {
                    callBack(true, user_type, data, "Login successfull");
                  } else {
                    callBack(false, user_type, data, "Subscription has Ended Contact mySOCUS");
                  }
                } else {
                  callBack(false, '', '', "User data not available");
                }
              })
            } else {
              var resCursor = db.db().collection(dbb.RESIDENT).aggregate([
                { $match: { '_id': new ObjectID(type_id) } },
                { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
                { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
                { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
              ])
              resCursor.forEach(function (doc2, err2) {
                assert.equal(null, err2);
                building_found = true;
                var isBuildingSubscribed;
                if (doc2.building_details.length > 0 && doc2.building_details[0] != undefined) {
                  building_name = doc2.building_details[0].building_name;
                  building_address = doc2.building_details[0].building_address;
                  building_location = doc2.building_details[0].location;

                  var subscribeDate = new Date(doc2.building_details[0].valid_till);
                  var currentDate = new Date();
                  currentDate.setHours(0, 0, 0, 0);
                  isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                }
                var unitNo = "";
                if (doc2.unit_details != undefined && doc2.unit_details.length > 0) {
                  if (doc2.unit_parent_details != undefined && doc2.unit_parent_details.length > 0) {
                    unitNo = doc2.unit_parent_details[0].unit_name + " - " + doc2.unit_details[0].unit_name;
                  } else {
                    unitNo = doc2.unit_details[0].unit_name;
                  }
                }
                data = {
                  user_id: type_id,
                  user_type: user_type,
                  user_unit_id: doc2.unit_id,
                  user_building_id: doc2.building_id,
                  user_building_name: building_name,
                  user_building_address: building_address,
                  user_building_location: building_location,
                  user_email: doc2.resident_email,
                  user_name: doc2.resident_name,
                  user_profile_img: doc2.resident_img,
                  user_contact_info: doc2.resident_contact,
                  user_sec_contact_info: doc2.resident_sec_contact_info,
                  user_permanent_address: doc2.resident_permanent_address,
                  user_unit_no: unitNo,
                  is_residing: doc2.is_residing,
                  is_owner: doc2.is_owner,
                  is_sub_resident: doc2.is_sub_resident,
                  is_subscribed: isBuildingSubscribed
                }
              }, function () {
                if (building_found) {
                  callBack(true, user_type, data, "Login successfull");
                } else {
                  callBack(false, '', '', "User data not available");
                }
              })
            }
          } else {
            callBack('', user_type, '', userExists, "User Does not Exists!", '');
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of login with mobile and password

    //Start of login using mobile

    loginmobile: function (mobileno, callBack) {
      try {
        var building_found = false;
        var mobilenum = parseInt(mobileno)
        var userExists = false;
        var user_type = false;
        var cursor = db.db().collection(dbb.USER).find({ 'mobile': mobilenum });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
          type_id = doc.user_id;
          user_token = doc.user_token;
        }, function () {
          if (userExists) {
            if (user_type == "A" || user_type == "E") {
              var empCursor = db.db().collection(dbb.EMPLOYEE).find({ '_id': new ObjectID(type_id) });
              empCursor.forEach(function (doc1, err1) {
                assert.equal(null, err1);
                building_found = true;
                building_id = doc1.building_id;
                unit_id = doc1.unit_id;
              }, function () {
                if (building_found) {
                  callBack(type_id, user_type, building_id, unit_id, true, "User-Type did not matched!", user_token);
                } else {
                  callBack(type_id, user_type, '', '', true, "User-Type did not matched!", user_token);
                }
              })
            } else if (user_type == "R" || user_type == "SR") {
              var resCursor = db.db().collection(dbb.RESIDENT).find({ '_id': new ObjectID(type_id) });
              resCursor.forEach(function (doc2, err2) {
                assert.equal(null, err2);
                building_found = true;
                building_id = doc2.building_id;
                unit_id = doc2.unit_id;
              }, function () {
                if (building_found) {
                  callBack(type_id, user_type, building_id, unit_id, true, "User-Type did not matched!", user_token);
                } else {
                  callBack(type_id, user_type, '', '', true, "User-Type did not matched!", user_token);
                }
              })
            }
          } else {
            callBack('', user_type, '', userExists, "User Does not Exists!", '');
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of login using mobile

    //Start of User Exists

    userExists: function (mobileno, callBack) {
      try {
        var mobilenum = parseInt(mobileno)
        var userExists = false;
        var user_type = false;
        var cursor = db.db().collection(dbb.USER).find({ 'mobile': mobilenum });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
          type_id = doc.user_id;
          user_token = doc.user_token;
        }, function () {
          if (userExists) {
            callBack(type_id, user_type, true, "User-Type did not matched!", user_token);
          } else {
            callBack('', user_type, userExists, "User Does not Exists!", '');
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of User Exists


    //Start of User Email Exists

    emailExists: function (email, callBack) {
      try {

        var userExists = false;
        var user_type = false;
        var cursor = db.db().collection(dbb.USER).find({ 'email': email });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
          type_id = doc.user_id;
          user_token = doc.user_token;
        }, function () {
          if (userExists) {
            //callBack(user_id, user_type, true, "User-Type did not matched!", user_token);
            callBack(type_id, user_type, true, "User-Type did not matched!", user_token);
          } else {
            callBack('', user_type, userExists, "User Does not Exists!", '');
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of User Exists



    //Start of Update User

    update_user: function (user_id,
      user_contact_info,
      modified_by,
      callBack) {
      try {

        db.db().collection(dbb.USER).updateOne({ "user_id": new ObjectID(user_id) }, {
          $set: {
            mobile: user_contact_info,
            modified_by: modified_by,
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "User Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update User Details

    //Start of Update User

    update_user_mobile: function (user_id, user_contact_info, password, callBack) {
      try {
        db.db().collection(dbb.USER).updateOne({ "user_id": new ObjectID(user_id) }, {
          $set: {
            mobile: parseInt(user_contact_info),
            password: password,
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "User Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update User Details


    //Start of Change Password

    change_password: function (email, mobile_num, password,
      callBack) {
      try {
        if (email !== '') {
          db.db().collection(dbb.USER).updateOne({ "email": email }, {

            $set: {
              password: password,
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              callBack(null, true, err);
            } else {
              callBack(result, false, "Password Updated Successfully");
            }

          });
        }
        else {
          db.db().collection(dbb.USER).updateOne({ "mobile": mobile_num }, {

            $set: {
              password: password,
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              callBack(null, true, err);
            } else {
              callBack(result, false, "Password Updated Successfully");
            }
          });
        }


      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Change Password


    //Start of Update User Token

    update_user_token: function (user_id,
      user_token,
      fcm_token,
      callBack) {
      try {
        var data = {};
        if (fcm_token == '' || fcm_token == undefined) {
          data = {
            user_token: user_token,
            last_login_on: new Date()
          }
        }
        else {
          data = {
            user_token: user_token,
            fcm_token: fcm_token,
            last_login_on: new Date()
          }
        }

        db.db().collection(dbb.USER).updateOne({ "user_id": new ObjectID(user_id) }, {
          $set: data
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "User Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update User Token

    //Start of Update User Token SA

    update_user_token_sa: function (email,
      user_token,
      fcm_token,
      callBack) {
      try {
        var data = {};
        if (fcm_token == '' || fcm_token == undefined) {
          data = {
            user_token: user_token,
            last_login_on: new Date()
          }
        }
        else {
          data = {
            user_token: user_token,
            fcm_token: fcm_token,
            last_login_on: new Date()
          }
        }
        db.db().collection(dbb.USER).updateOne({ "email": email }, {

          $set: data
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "User Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update User Token SA


    //Start of delete User
    delete_user: function (user_id, callBack) {

      try {
        user_id = JSON.parse(user_id);
        user = [];

        for (var i = 0; i < user_id.length; i++) {
          var a = new ObjectID(user_id[i]);
          user.push(a)
        }
        db.db().collection(dbb.USER).updateMany({ "_id": { $in: user } }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          }
          else {
            //console.log(obj.result.n + " record(s) deleted");  
            callBack(false, "User Deleted");
          }
        });
      } catch (e) {

        callBack(null, true, e);
      }
    },
    //End of delete User Details
  }
  return user_module;
}