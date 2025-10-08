var ejs = require('ejs');

module.exports = function (mongo, ObjectID, url, assert, dbb, db, gmail) {
  var resident_module = {

    //Start of Add Resident Details

    add_resident: function (new_resident, callBack) {
      try {

        db.db().collection(dbb.RESIDENT).insertOne(new_resident, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          } else {
            callBack(result, false, "Resident Details Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add  Resident Details


    //Start of Create Resident Details

    create_resident: function (new_resident, callBack) {
      try {
        db.db().collection(dbb.RESIDENT).insertOne(new_resident, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred", null);
          } else {
            db.db().collection(dbb.BUILDING).findOne({ _id: new_resident.building_id }, function (err1, doc) {
              if (err1) {
                callBack(null, true, err1)
              } else {
                callBack(result, false, "Resident Details Added Successfully", doc.building_name);
              }
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Create  Resident Details


    //Start of Update Resident Details

    update_resident: function (
      resident_id,
      resident_name,
      resident_img,
      resident_contact_info,
      resident_sec_contact_info,
      resident_permanent_address,
      is_residing,
      is_owner,
      is_sub_resident,
      resident_id_proof,
      callBack) {
      try {
        var idProofs = JSON.parse(resident_id_proof);
        db.db().collection(dbb.RESIDENT).updateOne({ "_id": new ObjectID(resident_id) }, {
          $set: {
            resident_name: resident_name,
            resident_img: resident_img,
            resident_contact_info: resident_contact_info,
            resident_sec_contact_info: resident_sec_contact_info,
            resident_permanent_address: resident_permanent_address,
            is_residing: is_residing,
            is_owner: is_owner,
            is_sub_resident: is_sub_resident,
            resident_id_proof: idProofs,
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Resident Details Updated Successfully");
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update  Resident Details

    //Start of Update Resident Mobile Details
    update_resident_mobile: function (
      resident_id,
      resident_name,
      resident_img,
      resident_contact_info,
      resident_sec_contact_info,
      resident_permanent_address,
      is_residing,
      is_owner,
      is_sub_resident,
      resident_id_proof,
      callBack) {
      try {
        var isOwner = is_owner.toLowerCase() == "true" ? true : false;
        var isSubResident = is_sub_resident.toLowerCase() == "true" ? true : false;
        var isResiding = is_residing.toLowerCase() == "true" ? true : false;
        db.db().collection(dbb.RESIDENT).updateOne({ "_id": new ObjectID(resident_id) }, {
          $set: {
            resident_name: resident_name,
            resident_img: resident_img,
            resident_contact_info: resident_contact_info,
            resident_sec_contact_info: resident_sec_contact_info,
            resident_permanent_address: resident_permanent_address,
            is_residing: isResiding,
            is_owner: isOwner,
            is_sub_resident: isSubResident,
            resident_id_proof: JSON.parse(resident_id_proof)
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Resident Details Updated Successfully");
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Update  Resident Mobile Details


    //Start of Add Vehicle to Resident
    add_vehicle_to_resident: function (resident_id, resident_vehicle_details, callBack) {
      try {
        var vehDetails = JSON.parse(resident_vehicle_details);
        db.db().collection(dbb.RESIDENT).updateOne({ "_id": new ObjectID(resident_id) }, {
          $push: {
            "resident_vehicle_details": vehDetails
          }
        }, { upser: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Vehicle assigned to Resident");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }

    },
    //End of Add Vehicle Details

    //Start of Remove Vehicle from Resident
    remove_vehicle_from_resident: function (resident_id, resident_vehicle_details, callBack) {
      try {
        var vehDetails = JSON.parse(resident_vehicle_details);
        db.db().collection(dbb.RESIDENT).updateOne({ "_id": new ObjectID(resident_id) }, {
          $pull: {
            "resident_vehicle_details": vehDetails
          }
        }, { upser: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Vehilce assigned from Resident");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }

    },
    //End of Remove Vehicle from Resident


    //Start of Search Resident 

    search_residents: function (keyword, building_id, callBack) {
      try {
        var totaldata;
        var cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), active: true, resident_contact_info: { $regex: keyword, $options: 'i' } });

        var cursor = db.db().collection(dbb.RESIDENT).aggregate([
          { $match: { building_id: new ObjectID(building_id), active: true, resident_contact_info: { $regex: keyword, $options: 'i' } } },
          { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          { $unwind: "$building_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          { $unwind: "$unit_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
          { $unwind: "$unit_parent_details" },
        ])

        resident = [];

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var buildingName = "";
            var unitNo = "";
            if (doc.unit_details != undefined && doc.unit_details != null) {
              if (doc.unit_parent_details != undefined && doc.unit_parent_details != null) {
                unitNo = doc.unit_parent_details.unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitNo = doc.unit_details.unit_name;
              }
            }

            if (doc.building_details != undefined && doc.building_details != null) {
              buildingName = doc.building_details.building_name;
            }

            var data = {
              building_id: doc.building_id,
              is_owner: doc.is_owner,
              is_residing: doc.is_residing,
              is_sub_resident: doc.is_sub_resident,
              _id: doc._id,
              resident_name: doc.resident_name,
              resident_contact_info: doc.resident_contact_info,
              resident_sec_contact_info: doc.resident_sec_contact_info,
              unit_no: unitNo,
              unit_id: doc.unit_id,
              building_name: buildingName,
              resident_email: doc.resident_email,
              resident_img: doc.resident_img
            }
            resident.push(data);

          }
        }, function () {
          if (resident.length == 0) {
            callBack(0, true, "No Resident Found", '');
          } else {
            callBack(resident, false, "Resident Found", totaldata);
          }
        })

      } catch (e) {
        console.log(e);
        callBack(null, true, e);
      }
    },
    //End of Search Resident


    //Start of View All Resident Details

    view_all_residents: function (starting_after, limit, building_id, callBack) {
      try {
        var totaldata;


        if (limit == '' && starting_after == '') {

          var cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), active: true })
        } else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), active: true }).skip(starting_after).limit(limit);
        }

        resident = [];

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            resident.push(doc);
          }
        }, function () {
          if (resident.length == 0) {
            callBack(0, true, "No Resident Found", '');
          } else {
            db.db().collection(dbb.RESIDENT).countDocuments({ building_id: new ObjectID(building_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(resident, false, "Resident Found", totaldata);
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All  Resident Details


    //Start of View Single Resident Details

    view_resident: function (resident_id, callBack) {
      try {
        resident = '';

        var cursor = db.db().collection(dbb.RESIDENT).find({ "_id": new ObjectID(resident_id), active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            resident = doc;
          }
        }, function () {
          if (resident.length == 0) {
            callBack(null, true, "No Resident Found");
          } else {
            callBack(resident, false, "Resident Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View Single  Resident Details

    remove_resident: function (resident_id, callBack) {
      try {
        db.db().collection(dbb.RESIDENT).deleteOne({ "_id": new ObjectID(resident_id) }, function (err, obj) {
          if (err) {
            callBack(true, err);
          } else {
            db.db().collection(dbb.USER).deleteOne({ "user_id": new ObjectID(resident_id) }, function (err, obj) {
              if (err) {
                callBack(true, err);
              } else {
                callBack(false, "Resident removed successfully");
              }
            });
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },

    //Start of Delete  Resident Details
    delete_resident: function (resident_id, building_id, callBack) {
      try {
        resident_id = JSON.parse(resident_id);
        resident = [];

        for (var i = 0; i < resident_id.length; i++) {
          var a = new ObjectID(resident_id[i]);
          resident.push(a)
        }

        db.db().collection(dbb.RESIDENT).updateMany({ "_id": { $in: resident }, building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          } else {
            db.db().collection(dbb.USER).updateMany({ "user_id": { $in: resident } }, {
              $set: {
                active: false
              }
            }, { upsert: false }, function (err, result) {
              if (err) {
                callBack(true, err);
              } else {
                callBack(false, "Resident Deleted");
              }
            });
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Delete  Resident Details


    // Firebase Dynamic Link Sending To Resident Email
    sendEmail: function (resident_id, building_id, unit_id, resident_email, resident_contact_info, is_owner, is_sub_resident, is_residing, building_name, callBack) {
      try {

        var nodemailer = require('nodemailer');
        var request = require('request');
        var Cryptr = require('cryptr');
        cryptr = new Cryptr('abc');

        var url = 'https://www.mysocus.com/?' +
          'type=create_resident&' +
          'resident_id=' + resident_id + '&' +
          'building_id=' + building_id + '&' +
          'unit_id=' + unit_id + '&' +
          'resident_email=' + resident_email.trim().toLowerCase() + '&' +
          'resident_contact_info=' + resident_contact_info.trim() + '&' +
          'is_owner=' + is_owner + '&' +
          'is_sub_resident=' + is_sub_resident + '&' +
          'is_residing=' + is_residing

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
          if (error) throw error;

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
          });

          ejs.renderFile(__dirname + "/views/template.ejs", { name: "", link: value, building_name: building_name }, function (err, data) {
            if (err) {
              console.log(err);
              callBack(true, "Error in Process");
            } else {
              var mailOptions = {
                from: gmail.from,
                to: resident_email, // list of receivers 
                subject: 'Socus - You have been invited',
                html: data
              };

              transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                  console.log(err);
                  callBack(true, "Error in Process");
                } else {
                  callBack(false, "Resident Added & Registration Link Send Successfully");
                }
              });
            }
          })
        })
      } catch (e) {
        callBack(true, e);
      }
    },

    createandsendDynamicLinkForResident: function (resident, callBack) {
      try {
        var nodemailer = require('nodemailer');
        var request = require('request');
        var Cryptr = require('cryptr');
        cryptr = new Cryptr('abc');

        var url = 'https://www.mysocus.com/?' +
          'type=create_resident&' +
          'resident_id=' + resident.resident_id + '&' +
          'building_id=' + resident.building_id + '&' +
          'unit_id=' + resident.unit_id + '&' +
          'resident_email=' + resident.resident_email + '&' +
          'resident_contact_info=' + resident.resident_contact_info + '&' +
          'is_owner=' + resident.is_owner + '&' +
          'is_sub_resident=' + resident.is_sub_resident + '&' +
          'is_residing=' + resident.is_residing

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
                "iosBundleId": "com.appstone.socus"
              },

            }
          },
          json: true
        }

        request(options, function (error, response, body) {
          if (error) {
            callBack(true, error);
          } else {
            value = body.shortLink;
            console.log(body);

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
              to: resident.resident_email, // list of receivers 
              subject: 'E-notice', // Subject line
              html: value
            };

            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log(err);
                callBack(true, "Error in Process");
              } else {
                callBack(false, "Resident Added & Registration Link Send Successfully");
              }
            });
          }
        })

      } catch (e) {
        callBack(true, e);
      }
    },

    checkResidentExists: function (user_email, user_contact_info, building_id, callBack) {
      try {
        var userExists = false;
        if (user_email != "" && user_email != undefined) {
          var cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), resident_email: user_email, active: true });
          cursor.forEach(function (doc, err) {
            assert.equal(null, err);
            userExists = true;
          }, function () {
            if (userExists) {
              callBack(userExists, false, "User Exists");
            } else {
              callBack(userExists, false, "User Does not Exists");
            }
          })
        } else {
          var phnCursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), resident_contact_info: parseInt(user_contact_info) });
          phnCursor.forEach(function (doc1, err1) {
            assert.equal(null, err1);
            userExists = true;
          }, function () {
            if (userExists) {
              callBack(userExists, false, "User Exists");
            } else {
              callBack(userExists, true, err1);
            }
          })
        }
      } catch (e) {
        callBack(null, true, e)
      }
    },

    checkResidentExistsForBulkUpload: function (user_email, user_contact_info, tenant_email, tenant_contact_info, building_id, callBack) {
      try {

        var userEmail = user_email != undefined && user_email != '' ? user_email : '';
        var tenantEmail = tenant_email != undefined && tenant_email != '' ? tenant_email : '';
        var userContactInfo = user_contact_info != undefined && user_contact_info != '' ? user_contact_info : '';
        var tenantContactInfo = tenant_contact_info != undefined && tenant_contact_info != '' ? tenant_contact_info : '';

        if (userEmail != tenantEmail && userContactInfo != tenantContactInfo) {
          resident_module.checkUserEmailExistsUserModule(user_email.trim(), function (exists, message) {
            if (exists) {
              callBack(true, "User Exists");
            } else {
              if (user_contact_info != undefined && user_contact_info != '') {
                resident_module.checkUserPhoneExists(user_contact_info.trim(), building_id, function (userPhoneExists, message) {
                  if (userPhoneExists) {
                    callBack(true, "User Exists");
                  } else {
                    if (tenant_email != undefined && tenant_email != '') {
                      resident_module.checkUserEmailExistsUserModule(tenant_email.trim(), function (tenantEmailExists, message2) {
                        if (tenantEmailExists) {
                          callBack(true, "User Exists");
                        } else {
                          resident_module.checkUserPhoneExists(tenant_contact_info.trim(), building_id, function (tenantPhoneExists, message3) {
                            if (tenantPhoneExists) {
                              callBack(true, "User Exists");
                            } else {
                              callBack(false, "User Does not exist");
                            }
                          })
                        }
                      })
                    } else if (tenant_contact_info != undefined && tenant_contact_info != '') {
                      resident_module.checkUserPhoneExists(tenant_contact_info.trim(), building_id, function (tenantPhoneExists, message3) {
                        if (tenantPhoneExists) {
                          callBack(true, "User Exists");
                        } else {
                          callBack(false, "User Does not exist");
                        }
                      })
                    } else {
                      callBack(false, "User Does not exist");
                    }
                  }
                })
              } else {
                callBack(false, "User Does not exist");
              }
            }
          })
        } else {
          callBack(true, "User and Tenant Info are same");
        }
      } catch (e) {
        callBack(true, e);
      }
    },

    checkUserEmailExists: function (email, building_id, callBack) {
      try {
        var userExists = false;
        var cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), resident_email: email, active: true });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
        }, function () {
          if (userExists) {
            callBack(true, "User Exists");
          } else {
            callBack(false, "User Does not Exists");
          }
        })
      } catch (e) {
        callBack(false, e);
      }
    },

    checkUserEmailExistsUserModule: function (email, callBack) {
      try {
        var userExists = false;
        var cursor = db.db().collection(dbb.USER).find({ email: email, active: true });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
        }, function () {
          if (userExists) {
            callBack(true, "User Exists");
          } else {
            callBack(false, "User Does not Exists");
          }
        })
      } catch (e) {
        callBack(false, e);
      }
    },

    checkUserPhoneExists: function (phone_no, building_id, callBack) {
      try {
        var userExists = false;
        var cursor = db.db().collection(dbb.RESIDENT).find({ building_id: new ObjectID(building_id), resident_contact_info: phone_no, active: true });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
        }, function () {
          if (userExists) {
            callBack(true, "User Exists");
          } else {
            callBack(false, "User Does not Exists");
          }
        })
      } catch (e) {
        callBack(false, e);
      }
    },

    checkUserPhoneExistsUserModule: function (phone_no, callBack) {
      try {
        var phoneNo = parseInt(phone_no);
        var userExists = false;
        var cursor = db.db().collection(dbb.USER).find({ mobile: phoneNo, active: true });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;
        }, function () {
          if (userExists) {
            callBack(true, "User Exists");
          } else {
            callBack(false, "User Does not Exists");
          }
        })
      } catch (e) {
        callBack(false, e);
      }
    },

    insertResidentDetailsFromBulkUpload: function (new_resident, callBack) {
      try {
        var user = null;
        db.db().collection(dbb.RESIDENT).insertOne(new_resident, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            user = {
              user_id: doc.insertedId,
              email: new_resident.resident_email,
              password: "qwerty",
              mobile: parseInt(new_resident.resident_contact_info),
              user_type: "R",
              user_token: "",
              fcm_token: "",
              active: true
            }

            db.db().collection(dbb.USER).insertOne(user, function (err2, doc2) {
              if (err2) {
                callBack(null, true, err2);
              } else {
                callBack(doc.insertedId, false, "Resident Added Succesfully");
              }
            })
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //Start of Search Resident by Vehicle Number
    search_resident_by_vehicle_number: function (building_id, vehicle_number, callBack) {
      try {
        var residentDetails = [];

        var cursor = db.db().collection(dbb.RESIDENT).aggregate([
          { $match: { building_id: new ObjectID(building_id), "resident_vehicle_details.vehicle_regd_num": { $regex: vehicle_number, $options: 'i' } } },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          { $unwind: "$unit_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var unitName = "";
            if (doc.unit_details != undefined) {
              if (doc.unit_parent_details.length > 0 && doc.unit_parent_details[0] != undefined) {
                unitName = doc.unit_parent_details[0].unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitName = doc.unit_details.unit_name;
              }
            }

            var data = {
              resident_id: doc._id,
              resident_name: doc.resident_name,
              resident_img: doc.resident_img,
              unit_no: unitName,
              building_id: doc.building_id,
              resident_vehicle_details: doc.resident_vehicle_details,
              resident_contact_info: doc.resident_contact_info
            }

            residentDetails.push(data);
          }
        }, function () {
          if (residentDetails.length == 0) {
            callBack(null, true, "No Residents Found");
          } else {
            callBack(residentDetails, false, "Residents Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Search Resident by Vehicle Number


    //Start of Search Resident by Mobile Number
    search_resident_by_mobile_number: function (building_id, mobile_number, callBack) {
      try {
        var residentDetails = [];

        var cursor = db.db().collection(dbb.RESIDENT).aggregate([
          { $match: { building_id: new ObjectID(building_id), resident_contact_info: { $regex: mobile_number, $options: 'i' } } },
          { $lookup: { from: dbb.UNIT, localField: "unit_id", foreignField: "_id", as: "unit_details" } },
          { $unwind: "$unit_details" },
          { $lookup: { from: dbb.UNIT, localField: "unit_details.unit_parent_id", foreignField: "_id", as: "unit_parent_details" } },
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var unitName = "";
            if (doc.unit_details != undefined) {
              if (doc.unit_parent_details.length > 0 && doc.unit_parent_details[0] != undefined) {
                unitName = doc.unit_parent_details[0].unit_name + " - " + doc.unit_details.unit_name;
              } else {
                unitName = doc.unit_details.unit_name;
              }
            }

            var data = {
              resident_id: doc._id,
              resident_name: doc.resident_name,
              resident_img: doc.resident_img,
              unit_no: unitName,
              building_id: doc.building_id,
              resident_vehicle_details: doc.resident_vehicle_details,
              resident_contact_info: doc.resident_contact_info
            }

            residentDetails.push(data);
          }
        }, function () {
          if (residentDetails.length == 0) {
            callBack(null, true, "No Residents Found");
          } else {
            callBack(residentDetails, false, "Residents Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Search Resident by Mobile Number

    //Start of checking if profile completed
    check_profile_completed: function (building_id, resident_id, callBack) {
      try {
        db.db().collection(dbb.RESIDENT).findOne({ building_id: new ObjectID(building_id), _id: new ObjectID(resident_id) }, function (err, doc) {
          if (err) {
            callBack(false, err);
          } else {
            if (doc.resident_id_proof != undefined && doc.resident_id_proof.length > 0) {
              callBack(true, "Profile Completed");
            } else {
              callBack(false, "Profile not completed");
            }
          }
        })
      } catch (e) {
        callBack(false, e);
      }
    },
    //End of checking if profile completed
  }
  return resident_module;
}