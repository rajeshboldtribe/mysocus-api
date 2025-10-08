module.exports = function (mongo, ObjectID, url, assert, dbb, db, firebase_key, gmail) {
  var moment = require('moment-timezone');
  var ejs = require('ejs');
  var enotice_module = {

    //Start of Add E-notice

    add_enotice: function (new_notice, callBack) {
      try {
        db.db().collection(dbb.ENOTICE).insertOne(new_notice, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            db.db().collection(dbb.BUILDING).findOne({ _id: new ObjectID(new_notice.building_id), active: true }, function (err, doc) {
              if (err) {
                callBack(null, true, "No building found");
              } else {
                callBack(doc.building_name, false, "E-notice Added Successfully");
              }
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add E-notice


    //Start of Update E-notice

    update_enotice: function (enotice_id,
      notice_title,
      notice_valid_till,
      notice_generated_date,
      notice_target,
      notice_desc,
      building_id,
      modified_by,
      callBack) {
      try {
        db.db().collection(dbb.ENOTICE).updateOne({ "_id": new ObjectID(enotice_id) }, {
          $set: {
            notice_title: notice_title,
            notice_valid_till: new Date(notice_valid_till),
            notice_generated_date: new Date(notice_generated_date),
            notice_target: notice_target,
            notice_desc: notice_desc,
            building_id: new ObjectID(building_id),
            modified_by: new ObjectID(modified_by),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Notice Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update E-notice



    //Start of View All E-notice
    view_enotice: function (starting_after, limit, building_id, callBack) {
      try {
        enotice = [];
        var totaldata;
        if (limit == '' && starting_after == '') {
          var cursor = db.db().collection(dbb.ENOTICE).find({ building_id: new ObjectID(building_id), active: true }).sort({ _id: -1 });
        } else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.ENOTICE).find({ building_id: new ObjectID(building_id), active: true }).skip(starting_after).limit(limit).sort({ _id: -1 });
        }

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var noticeValidTill = moment(new Date(doc.notice_valid_till), 'YYYY-MM-DDThh:mm:ssz').tz('Asia/Kolkata').format().replace("+05:30", ".000Z");
            var noticedGeneratedOn = moment.tz(doc.notice_generated_date, 'Asia/Kolkata').format().replace("+05:30", ".000Z");

            var data = {
              _id: doc._id,
              notice_title: doc.notice_title,
              notice_valid_till: noticeValidTill,
              notice_generated_date: noticedGeneratedOn,
              notice_target: doc.notice_target,
              notice_desc: doc.notice_desc,
              building_id: doc.building_id,
              created_by: doc.created_by,
              created_on: doc.created_on,
              active: doc.active,
              read_users: doc.read_users,
            }

            enotice.push(data);
          }
        }, function () {
          if (enotice.length == 0) {
            callBack(null, true, "No E-notice Found", '');
          }
          else {
            db.db().collection(dbb.ENOTICE).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }
              callBack(enotice, false, "E-notice  Found", totaldata);
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All E-notice

    //Start of Delete E-notice

    delete_enotice: function (enotice_id, building_id, callBack) {
      try {
        enotice_id = JSON.parse(enotice_id);
        enotice = [];

        for (var i = 0; i < enotice_id.length; i++) {
          var a = new ObjectID(enotice_id[i]);
          enotice.push(a)
        }
        db.db().collection(dbb.ENOTICE).updateMany({ "_id": { $in: enotice }, building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "E-Notice Deleted");
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of Delete E-notice


    //Start of Mark Notification Read
    mark_notification_read: function (enotice_id, user_id, callBack) {
      try {
        enotice_id = JSON.parse(enotice_id);
        enotice = [];
        for (var i = 0; i < enotice_id.length; i++) {
          var a = new ObjectID(enotice_id[i]);
          enotice.push(a)
        }
        db.db().collection(dbb.ENOTICE).updateMany({ "_id": { $in: enotice } },
          { $push: { "read_users": user_id } },
          { upsert: false }, function (err, result) {
            if (err) {
              callBack(true, err);
            } else {
              callBack(false, "Mark Read Successfully");
            }
          })
      } catch (ex) {
        callBack(true, ex);
      }
    },
    //End of Mark Notification Read 

    enotice_pushnotification2: function (notification_title, notification_body, targetArray, building_id, building_name, callBack) {
      try {
        var targetArray = JSON.parse(targetArray);
        let user_ids = [];
        if (targetArray.includes("E")) {
          enotice_module.getEmployeeIds(building_id, user_ids, function (user_id) {
            if (targetArray.includes("R")) {
              enotice_module.getResidentIds(building_id, user_id, function (user_id2) {
                enotice_module.sendNotification(user_id2, notification_title, notification_body, building_name, callBack);
              })
            } else {
              enotice_module.sendNotification(user_id, notification_title, notification_body, building_name, callBack);
            }
          })
        } else if (targetArray.includes("R")) {
          enotice_module.getResidentIds(building_id, user_ids, function (user_id) {
            enotice_module.sendNotification(user_id, notification_title, notification_body, building_name, callBack);
          })
        }

      } catch (e) {
        callBack(null, true, e);
      }
    },

    getResidentIds: function (building_id, user_ids, callBack) {
      //GET ALL RESIDENTS OF THIS BUILDING
      var res_cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id) });
      res_cursor.forEach(function (doc, err) {
        if (err) {
          // callBack(null, true, err);
        }
        else {
          user_ids.push(doc._id)
        }
      }, function () {
        callBack(user_ids);
      })
    },

    getEmployeeIds: function (building_id, user_ids, callBack) {
      //GET ALL EMPLOYEES OF THIS BUILDING
      var res_cursor = db.db().collection(dbb.EMPLOYEE).find({ building_id: new ObjectID(building_id) });
      res_cursor.forEach(function (doc, err) {
        if (err) {
          // callBack(null, true, err);
        }
        else {
          user_ids.push(doc._id)
        }
      }, function () {
        callBack(user_ids);
      })
    },

    sendNotification: function (user_ids, notification_title, notification_body, building_name, callBack) {
      var cursor = db.db().collection(dbb.USER).find({ user_id: { $in: user_ids } });
      let emails = [];
      let fcm_token = [];
      cursor.forEach(function (doc, err) {
        if (err) {
          //send error

        } else {
          emails.push(doc.email);
          if (doc.fcm_token) {
            fcm_token.push(doc.fcm_token);
          }
        }
      }, function () {
        // SEND PUSH NOTIFICATION
        if (emails.length > 0 && fcm_token.length > 0) {
          const firebase = require("firebase-admin");
          const serviceAccount = firebase_key;
          const firebaseToken = fcm_token;

          if (!firebase.apps.length) {
            firebase.initializeApp({
              credential: firebase.credential.cert(serviceAccount),
              databaseURL: "https://apartment-erp.firebaseio.com"
            });
          }

          const payload = {
            notification: {
              title: notification_title,
              body: notification_body,
              type: 'enotice',
              sound: "default",
            },
            data: {
              title: notification_title,
              body: notification_body,
              type: 'enotice',
              sound: "default",
            }
          };

          const options = {
            priority: 'high',
            timeToLive: 60 * 60 * 24, // 1 day
          };

          firebase.messaging().sendToDevice(firebaseToken, payload, options)
            .then(function (response) {
              // SEND EMAIL
              var nodemailer = require('nodemailer');
              var request = require('request');
              var Cryptr = require('cryptr');
              cryptr = new Cryptr('abc');

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
              ejs.renderFile(__dirname + "/views/templateAddNotice.ejs", { title: notification_title, body: notification_body, building_name: building_name }, function (err, data) {
                if (err) {
                  console.log(err);
                  callBack(true, "Error in Process");
                } else {
                  var mailOptions = {
                    from: gmail.from,
                    bcc: emails, // list of receivers 
                    subject: 'Notification from Socus', // Subject line
                    html: data
                  };

                  transporter.sendMail(mailOptions, function (err, info) {
                    if (err) {
                      callBack(true, "Error in Process");
                    }
                    else {
                      callBack(false, "Email Send Successfully");
                    }
                  });
                }
              })

            })
            .catch(function (error) {
              console.log(error);
              callBack(true, "Something has gone wrong!")
            });
        } else {
          callBack(true, "No users found in target audience")
        }
      })
    },

    //Start of Push notification

    //CODE WRITTEN BY SOUMYA
    //NOT BEING USED ANYWHERE
    //KEPT ONLY FOR SHOWCASE PURPOSE
    enotice_pushnotification: function (notification_title, notification_body, targetArray, building_id, callBack) {
      try {
        targetArray = JSON.parse(targetArray)

        if (targetArray.length == 3) {
          var target = targetArray[0] + targetArray[1] + targetArray[2]
        }
        else if (targetArray.length == 2) {
          var target = targetArray[0] + targetArray[1];
        }
        else {
          var target = targetArray[0]
        }

        if (target == 'A') {
          var cursorCondition = { user_type: 'A' }
        }
        else if (target == 'E') {
          var cursorCondition = { user_type: 'E' };
        }
        else if (target == 'R') {
          var cursorCondition = { user_type: 'R' };
        }
        else if (target == 'AER') {
          var cursorCondition = { $or: [{ user_type: 'E' }, { user_type: 'A' }, { user_type: 'R' }] }
        }
        else if (target == 'AE') {
          var cursorCondition = { $or: [{ user_type: 'A' }, { user_type: 'E' }] }
        }
        else if (target == 'ER') {
          var cursorCondition = { $or: [{ user_type: 'E' }, { user_type: 'R' }] }
        }
        else if (target == 'AR') {
          var cursorCondition = { $or: [{ user_type: 'A' }, { user_type: 'R' }] }
        }

        var cursor = db.db().collection(dbb.USER).find(cursorCondition);
        users = [];

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            if (doc.fcm_token !== null && doc.fcm_token !== '' && doc.fcm_token !== undefined) {
              users.push(doc.fcm_token);
            }
          }
        }, function () {
          if (users.length == 0) {
            callBack(false, "E-Notice Added Successfully,But No Users Found With FCM Token", false);
          }
          else {

            const firebase = require("firebase-admin");
            const serviceAccount = firebase_key;
            const firebaseToken = users;

            if (!firebase.apps.length) {

              firebase.initializeApp({
                credential: firebase.credential.cert(serviceAccount),
                databaseURL: "https://apartment-erp.firebaseio.com"
              });
            }

            const payload = {
              data: {
                title: notification_title,
                body: notification_body,
                type: 'enotice'
              }

            };

            const options = {
              priority: 'high',
              timeToLive: 60 * 60 * 24, // 1 day
            };

            firebase.messaging().sendToDevice(firebaseToken, payload, options)
              .then(function (response) {

                callBack(false, "E-Notice Added Successfully & Successfully sent", true)
              })
              .catch(function (error) {

                callBack(true, "Something has gone wrong!", false)
              });
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //Enf Of Push Notification
  }
  return enotice_module;
}