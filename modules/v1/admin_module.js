var ejs = require('ejs');
var nodemailer = require('nodemailer');

module.exports = function (mongo, ObjectID, url, assert, dbb, db, gmail) {

  var admin_module = {

    //Start of Email Exists
    email_exists: function (email, callBack) {
      try {
        exists = false;
        var userID = "";
        var userType = "";
        var cursor = db.db().collection(dbb.USER).find({ "email": email, "active": true });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          exists = true;
          userID = doc.user_id;
          userType = doc.user_type;
        }, function () {
          if (exists) {

            if (userID != "") {
              if (userType == "SA") {
                callBack(exists, false, "Email Already Exists!");
              } else if (userType == "A" || userType == "E") {
                var isBuildingSubscribed = false;
                var empCursor = db.db().collection(dbb.EMPLOYEE).aggregate([
                  { $match: { _id: new ObjectID(userID) } },
                  { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
                ])

                empCursor.forEach(function (doc11, err11) {
                  if (err11) {
                    callBack(exists, false, "Email Already Exists!");
                  } else {
                    if (doc11.building_details != undefined && doc11.building_details.length > 0) {
                      building_name = doc11.building_details[0].building_name;

                      var subscribeDate = new Date(doc11.building_details[0].valid_till);
                      var currentDate = new Date();
                      currentDate.setHours(0, 0, 0, 0);
                      isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                    }
                  }
                }, function () {
                  if (isBuildingSubscribed) {
                    callBack(exists, false, "Email Already Exists!");
                  } else {
                    callBack(null, false, "Your subscription period is ended, please contact MySOCUS for renewal.")
                  }
                })
              } else {
                var isBuildingSubscribed = false;
                var resCursor = db.db().collection(dbb.RESIDENT).aggregate([
                  { $match: { _id: new ObjectID(userID) } },
                  { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
                ])

                resCursor.forEach(function (doc22, err22) {
                  if (err22) {
                    callBack(exists, false, "Email Already Exists!");
                  } else {
                    if (doc22.building_details != undefined && doc22.building_details.length > 0) {
                      building_name = doc22.building_details[0].building_name;

                      var subscribeDate = new Date(doc22.building_details[0].valid_till);
                      var currentDate = new Date();
                      currentDate.setHours(0, 0, 0, 0);
                      isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                    }
                  }
                }, function () {
                  if (isBuildingSubscribed) {
                    callBack(exists, false, "Email Already Exists!");
                  } else {
                    callBack(null, false, "Your subscription period is ended, please contact MySOCUS for renewal.")
                  }
                })
              }
            } else {
              callBack(exists, false, "Email Already Exists!");
            }
          } else {
            callBack(exists, false, "");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Email Exists

    //Start of User Exists
    userExists: function (user_token, callBack) {
      try {
        var userExists = false;
        var user_type = "";
        var userID = "";
        var type_id = "";
        var cursor = db.db().collection(dbb.USER).find({ user_token: user_token, active: true });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
          type_id = doc.user_id;
          userID = doc.user_id;
        }, function () {
          if (userExists) {
            if (user_type == "SA") {
              callBack(type_id, user_type, userExists, "User-Type did not matched!");
            } else if (user_type == "A" || user_type == "E") {
              var isBuildingSubscribed = false;
              var empCursor = db.db().collection(dbb.EMPLOYEE).aggregate([
                { $match: { _id: new ObjectID(userID) } },
                { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
              ])

              empCursor.forEach(function (doc11, err11) {
                if (err11) {
                  callBack(type_id, user_type, userExists, "User-Type did not matched!");
                } else {
                  if (doc11.building_details != undefined && doc11.building_details.length > 0) {
                    building_name = doc11.building_details[0].building_name;

                    var subscribeDate = new Date(doc11.building_details[0].valid_till);
                    var currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                  }
                }
              }, function () {
                if (isBuildingSubscribed) {
                  callBack(type_id, user_type, userExists, "User-Type did not matched!");
                } else {
                  callBack('', '', false, "Your subscription period is ended, please contact MySOCUS for renewal.")
                }
              })
            } else {
              var isBuildingSubscribed = false;
              var resCursor = db.db().collection(dbb.RESIDENT).aggregate([
                { $match: { _id: new ObjectID(userID) } },
                { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
              ])

              resCursor.forEach(function (doc22, err22) {
                if (err22) {
                  callBack(type_id, user_type, userExists, "User-Type did not matched!");
                } else {
                  if (doc22.building_details != undefined && doc22.building_details.length > 0) {
                    building_name = doc22.building_details[0].building_name;

                    var subscribeDate = new Date(doc22.building_details[0].valid_till);
                    var currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    isBuildingSubscribed = subscribeDate >= currentDate ? true : false;
                  }
                }
              }, function () {
                if (isBuildingSubscribed) {
                  callBack(type_id, user_type, userExists, "User-Type did not matched!");
                } else {
                  callBack('', '', false, "Your subscription period is ended, please contact MySOCUS for renewal.")
                }
              })
            }
          } else {
            callBack('', '', userExists, "User Does not Exists!");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of User Exists

    checkUserExistsAndGetUserID: function (user_token, callBack) {
      try {
        var userExists = false;
        var user_type;
        var user_id;

        var cursor = db.db().collection(dbb.USER).find({ user_token: user_token, active: true });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_type = doc.user_type;
          user_id = doc._id;
        }, function () {
          if (userExists) {
            callBack(true, user_id, false, "User Found");
          } else {
            callBack(false, null, true, "User not found");
          }
        })
      } catch (e) {
        callBack(false, null, true, e);
      }
    },


    //Start of Get User Id
    get_user_id: function (user_token, callBack) {
      try {
        var userExists = false;
        var user_details = false;

        var cursor = db.db().collection(dbb.USER).find({ "user_token": user_token });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          user_details = { "type": doc.type, "student_id": doc._id };
        }, function () {
          if (userExists) {
            callBack(user_details, true, "User Found");
          } else {
            callBack(userExists, false, "User Does not Exists!");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Get User Id

    //Start of Get User Info
    get_user_info: function (user_token, callBack) {
      try {
        var userExists = false;
        var userId;
        var userType;
        var userName;
        var userImg;
        var empExists = false;
        var resExists = false;

        var cursor = db.db().collection(dbb.USER).find({ "user_token": user_token });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
          userId = doc.user_id;
          userType = doc.user_type;
        }, function () {
          if (userExists) {
            if (userType == E || userType == A) {
              var cusorEmp = db.db().collection(dbb.EMPLOYEE).find({ "_id": new ObjectID(userId) });
              cusorEmp.forEach(function (doc1, err1) {
                assert.equal(null, err1);
                empExists = true;
                userName = doc1.employee_name;
                userImg = doc1.employee_img;
              }, function () {
                if (empExists) {
                  callBack("User Exists", userName, userImg, false, e);
                } else {
                  callBack("User Doesnot Exists", "", "", true, e);
                }
              })
            } else if (userType == R || userType == SR) {
              var cursorRes = db.db().collection(dbb.RESIDENT).find({ "_id": new ObjectID(userId) });
              cursorRes.forEach(function (doc2, err2) {
                assert.equal(null, err2);
                resExists = true;
                userName = doc2.resident_name;
                userImg = doc2.resident_img;
              }, function () {
                if (resExists) {
                  callBack("User Exists", userName, userImg, false, e);
                } else {
                  callBack("User does not exists", "", "", true, e);
                }
              })
            }
          } else {
            callBack("User Does Not Exists", "", "", true, e)
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get User Info

    //Start of Add Admin
    add_admin: function (add_admin, callBack) {
      try {
        db.db().collection(dbb.USER).insertOne(add_admin, function (err, result) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            callBack(result, false, "Admin Added Successfully");
          }
        });
      }
      catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Add Admin

    //Start of Update Admin

    update_admin: function (admin_id, name, email, contact_no, modified_by, callBack) {
      try {

        db.db().collection(dbb.USER).updateOne({ "_id": new ObjectID(admin_id) }, {
          $set: {
            name: name,
            email: email,
            contact_no, contact_no,
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Admin Details Updated Successfully");
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Update Admin Details

    //Start of remove Admin

    remove_admin: function (admin_id, callBack) {
      try {

        db.db().collection(dbb.USER).updateOne({ "user_id": new ObjectID(admin_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            if (result == null) {
              callBack(true, "Error occured");
            } else {
              db.db().collection(dbb.EMPLOYEE).updateOne({ "_id": new ObjectID(admin_id) }, {
                $set: {
                  active: false
                }
              }, { upsert: false }, function (err1, doc) {
                if (err1) {
                  callBack(true, err1);
                } else {
                  callBack(false, "Admin Removed Successfully");
                }
              })
            }
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },

    //End of remove Admin 

    //Start of View all Admin
    view_all_admin: function (result, callBack) {
      try {
        admins = [];
        var totaldata;

        if (result == 'A') {

          var cursor = db.db().collection(dbb.USER).find({ type: { $in: ["A"] } });
          cursor.forEach(function (doc, err) {
            if (err) {
              callBack(null, true, err);
            }
            else {
              admins.push(doc);
            }
          }, function () {
            if (admins.length == 0) {
              callBack(null, true, "No Admin's Found");
            }
            else {
              db.db().collection(dbb.USER).countDocuments({ type: { $in: ["A"] } }, function (countErr, count) {
                if (!countErr) {
                  totaldata = count;
                }
                callBack(admins, false, "Admins Found", totaldata);
              })
            }
          })

        }
        else {

          var cursor = db.db().collection(dbb.USER).find({ type: { $in: ["A", "SA"] } });
          cursor.forEach(function (doc, err) {
            if (err) {
              callBack(null, true, err);
            }
            else {
              admins.push(doc);
            }
          }, function () {
            if (admins.length == 0) {
              callBack(null, true, "No Admin's Found", '');
            }
            else {
              db.db().collection(dbb.USER).countDocuments({ type: { $in: ["A", "SA"] } }, function (countErr, count) {
                if (!countErr) {
                  totaldata = count;
                }
                callBack(admins, false, "Admins Found", totaldata);
              })
            }
          })
        }
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of View all Admin


    //Start of Toggle Admin Active

    toggle_admin_active: function (admin_id, callBack) {
      try {
        var admin = false;

        var cursor = db.db().collection(dbb.USER).find({ "_id": new ObjectID(admin_id) });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            admin = doc.active;
            if (admin == true) {
              db.db().collection(dbb.USER).updateOne({ "_id": new ObjectID(admin_id) }, {
                $set: {
                  active: false,
                }
              }, { upsert: false }, function (err, result) {
                if (err) {
                  callBack(null, true, err);
                } else {
                  callBack(result, false, "Admin set to false Successfully");
                }
              });
            }
            else {
              db.db().collection(dbb.USER).updateOne({ "_id": new ObjectID(admin_id) }, {
                $set: {
                  active: true,
                }
              }, { upsert: false }, function (err, result) {
                if (err) {
                  callBack(null, true, err);
                } else {
                  callBack(result, false, "Admin set to true Successfully");
                }
              });
            }
          }
        });

      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Toggle Admin Active

    //Start Of Admin Pagination

    get_admin_details: function (starting_after, limit, callBack) {
      try {
        data = [];
        var limit = parseInt(limit);
        var starting_after = parseInt(starting_after);

        var cursor = db.db().collection(dbb.USER).find({ type: 'A' }).limit(limit).skip(starting_after);
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            data.push(doc);
          }
        }, function () {
          if (data.length == 0) {
            callBack(null, true, "No Admin Found");
          }
          else {
            callBack(data, false, "Admin Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End Of Admin Pagination


    //Start Of Building Admin Pagination

    get_building_admins: function (building_id, callBack) {
      try {
        data = [];

        var cursor = db.db().collection(dbb.EMPLOYEE).aggregate([
          { $match: { building_id: new ObjectID(building_id) } },
          { $lookup: { from: dbb.USER, localField: "_id", foreignField: "user_id", as: "user_details" } },
          { $unwind: "$user_details" },
          { $match: { "user_details.user_type": "A", "user_details.active": true } },
        ]
        );


        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            data.push({
              _id: doc.user_details._id,
              employee_name: doc.employee_name,
              employee_designation: doc.employee_designation,
              employee_img: doc.employee_img,
              employee_contact_info: doc.employee_contact_info,
              employee_email: doc.employee_email,
              user_id: doc._id,
            });
          }
        }, function () {
          if (data.length == 0) {
            callBack(null, true, "No Admin Found");
          } else {
            callBack(data, false, "Admin Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End Of Building Admin Pagination



    //Start Of Building Vendor Details

    get_building_vendors: function (building_id, callBack) {
      try {
        data = [];

        var cursor = db.db().collection(dbb.VENDOR).find({ building_id: new ObjectID(building_id) })


        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            data.push(doc);
          }
        }, function () {
          if (data.length == 0) {
            callBack(null, true, "No Vendors Found");
          }
          else {
            callBack(data, false, "Vendors Found");
          }
        })
      } catch (e) {

        callBack(null, true, e);
      }
    },
    //End Of Building Vendor Details


    //Start of Get Admin Building Name
    get_admin_building_name: function (email_id, callBack) {
      try {
        var isAdminFound = false;
        var buildingName = "";
        var adminName = "";
        var cursor = db.db().collection(dbb.EMPLOYEE).aggregate([
          { $match: { employee_email: email_id } },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } }
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, null, true, err);
          } else {
            isAdminFound = true;
            if (doc.building_details != undefined && doc.building_details.length > 0) {
              buildingName = doc.building_details[0].building_name;
            }
            adminName = doc.employee_name;
          }
        }, function () {
          if (!isAdminFound) {
            callBack(null, null, true, "Admin Not Found");
          } else {
            callBack(buildingName, adminName, false, "Admin Found");
          }
        })
      } catch (e) {
        callBack(null, null, true, e);
      }
    },
    //End of Get Admin Building Name

    // Firebase Dynamic Link Sending To Resident Email
    sendEmail: function (email_id, subject, name, building_name, callBack) {
      try {
        console.log(gmail);

        var transporter = nodemailer.createTransport({
          service: 'Zoho',
          host: 'smtp.zoho.com',
          port: 465,
          secure: true,
          auth: {
            user: gmail.from,
            pass: gmail.password
          }
        })

        ejs.renderFile(__dirname + "/views/templateAddAdmin.ejs", { name: name, username: email_id, password: "qwerty", building_name: building_name }, function (err, data) {
          if (err) {
            console.log(err);
            callBack(true, "Error in Process");
          } else {
            var mailOptions = {
              from: gmail.from,
              to: email_id, // list of receivers 
              subject: subject, // Subject line
              html: data
            };

            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log(err);
                callBack(true, "Error in Process");
              } else {
                callBack(false, "Email Sent Successfully");
              }
            });
          }
        })


      } catch (e) {
        console.log(e)
        callBack(true, e);
      }
    },

    contact_us: function (data, callBack) {
      try {

        var transporter = nodemailer.createTransport({
          service: 'Zoho',
          host: 'smtp.zoho.com',
          port: 465,
          secure: true,
          auth: {
            user: gmail.from,
            pass: gmail.password
          }
        })

        ejs.renderFile(__dirname + "/views/templateContactUs.ejs", { name: data.name, email: data.email, phone: data.phone, message: data.message }, function (err, data) {
          if (err) {
            console.log(err);
            callBack(true, "Error in Process");
          } else {
            var mailOptions = {
              from: gmail.from,
              to: gmail.from, // list of receivers 
              subject: "MySocus  - from website contact from", // Subject line
              html: data
            };

            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log(err);
                callBack(true, "Error in Process");
              } else {
                callBack(false, "Email Sent Successfully");
              }
            });
          }
        })


      } catch (e) {
        console.log(e)
        callBack(true, e);
      }
    },

    sendPasswordResetEmail: function (email_id, callBack) {
      var nodemailer = require('nodemailer');
      var request = require('request');
      var Cryptr = require('cryptr');
      cryptr = new Cryptr('abc');

      var url = "https://www.mysocus.com/?" + "type=reset_password&" + 'email_id=' + email_id;

      var options = {
        method: 'POST',
        url: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyA4AEw301mFpCHldeLw5NV1ePUZ4EGLEPs',
        headers: {
          'content-type': 'application/json'
        },
        body: {
          "dynamicLinkInfo": {
            "domainUriPrefix": "https://mysocusbuilding.page.link",
            "link": url,
            "androidInfo": {
              "androidPackageName": "com.appstone.mysocus"
            },
            "iosInfo": {
              "iosBundleId": "com.appstone.mysocus"
            },
            "navigationInfo": {
              "enableForcedRedirect": true,
            },
          },
          "suffix": {
            "option": "SHORT"
          }
        },
        json: true
      }
      request(options, function (error, response, body) {
        if (error) {
          callBack(true, error);
        } else {
          value = body.shortLink;

          var transporter = nodemailer.createTransport({
            service: 'Zoho',
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
              user: gmail.from,
              pass: gmail.password
            }
          })

          var mailOptions = {
            from: gmail.from,
            to: email_id, // list of receivers 
            subject: 'Reset Password', // Subject line
            html: value
          };

          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              callBack(true, "Error in Process");
            } else {
              callBack(false, "Reset Link sent successfully");
            }
          });
        }
      })
    },

    reset_user_password: function (email, password, callBack) {
      try {
        db.db().collection(dbb.USER).updateOne({ email: email, active: true }, {
          $set: {
            password: password
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Password reset successfully");
          }
        });
      } catch (ex) {
        callBack(true, ex);
      }
    },
  }
  return admin_module;
}