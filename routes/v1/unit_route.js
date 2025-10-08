// const building_module = require('../../modules/v1/building_module');

module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db);
    var unit_module = require('../../modules/v1/unit_module')(mongo, ObjectID, url, assert, dbb, db);
    var resident_module = require('../../modules/v1/resident_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var building_module = require('../../modules/v1/building_module')(mongo, ObjectID, url, assert, dbb, db);

    var multer = require('multer');
    var readXlsxFile = require('read-excel-file/node');
    var path = require('path');
    var fs = require('fs');

    //API for Add Unit Details

    //headers : user-token (admin/super admin)
    // params :
    // unit_name
    // square_feet
    // unit_desc (optional)
    // unit_type_id
    // building_id

    //Functions: add_unit_details
    //Response: status, message, result


    app.post('/v1/add_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("unit_name")
          && req.body.hasOwnProperty("square_feet")
          && req.body.hasOwnProperty("unit_type_id")
          && req.body.hasOwnProperty("unit_parent_id")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              var unit_parent_id = null;
              if (req.body.unit_parent_id !== 'null') {
                unit_parent_id = new ObjectID(req.body.unit_parent_id);
              }
              var new_unit = {
                unit_name: req.body.unit_name,
                square_feet: req.body.square_feet,
                unit_desc: req.body.unit_desc,
                unit_type_id: new ObjectID(req.body.unit_type_id),
                unit_parent_id: unit_parent_id,
                building_id: new ObjectID(req.body.building_id),
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                unit_balance: 0,
                active: true,
              };
              unit_module.add_unit_details(new_unit, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result.insertedId });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("unit_name") == false) {
            res.json({ status: false, message: "unit_name parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_parent_id") == false) {
            res.json({ status: false, message: "unit_parent_id parameter is missing" });
          } else if (req.body.hasOwnProperty("square_feet") == false) {
            res.json({ status: false, message: "square_feet parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_type_id") == false) {
            res.json({ status: false, message: "unit_type_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Unit Details

    //API for Get Unit Details

    //Params: user-token
    //Functions: view_all_unit 
    //Response: status, message, result

    app.post('/v1/view_all_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              unit_module.view_all_unit(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Get Unit_Details


    //Start of Get Unit Details By Unit Type Id

    //Params: user-token
    //Functions: get_unit_type_info 
    //Response: status, message, result

    app.post('/v1/get_unit_type_info', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("unit_type_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              unit_module.get_unit_type_info2(req.body.starting_after, req.body.limit, req.body.building_id, req.body.unit_type_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_type_id") == false) {
            res.json({ status: false, message: "unit_type_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Get Unit Details By Unit Type Id


    //Start of Get Final Unit Details

    app.post('/v1/get_final_unit_info', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("unit_id")
        ) {
          if (req.body.unit_id == "null") {
            req.body.unit_id = null;
          }
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              unit_module.get_final_unit_info(req.body.starting_after, req.body.limit, req.body.building_id, req.body.unit_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Get Final Unit Details

    //Start of Get Single Unit Details

    //Params: user-token
    //Functions: get_unit_info 
    //Response: status, message, result

    app.post('/v1/get_unit_info', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("unit_parent_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              unit_module.get_unit_info2(req.body.building_id, req.body.unit_parent_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Get Single Unit Details



    //API for Update Unit Details

    //Params: unit_id, unit_name,square_feet, unit_desc,unit_type_id,building_id , user-token
    //Functions: update_unit
    //Response: status, message, result

    app.post('/v1/update_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty('unit_id')
          && req.body.hasOwnProperty("unit_name")
          && req.body.hasOwnProperty("unit_desc")
          && req.body.hasOwnProperty("square_feet")
          && req.body.hasOwnProperty("unit_type_id")
          && req.body.hasOwnProperty("unit_parent_id")
          && req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              unit_module.edit_single_unit(
                req.body.unit_id,
                req.body.unit_name,
                req.body.square_feet,
                req.body.unit_desc,
                req.body.unit_type_id,
                req.body.unit_parent_id,
                user_id,
                function (result, error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message, result: req.body.unit_id });
                  }
                })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_name") == false) {
            res.json({ status: false, message: "unit_name parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_desc") == false) {
            res.json({ status: false, message: "unit_desc parameter is missing" });
          } else if (req.body.hasOwnProperty("square_feet") == false) {
            res.json({ status: false, message: "square_feet parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_parent_id") == false) {
            res.json({ status: false, message: "unit_parent_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_type_id") == false) {
            res.json({ status: false, message: "unit_type_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Update Unit Details


    //API for Delete Single Unit Details

    //Params: user-token,unit_id,building_id
    //Functions: delete_single_unit_details
    //Response: status, message, result

    app.post('/v1/delete_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              unit_module.delete_units(req.body.unit_id, req.body.building_id, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Delete Single Unit Details


    //Start of Get Unit Details

    app.post('/v1/get_unit_details', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("unit_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              unit_module.get_unit_details(req.body.unit_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });
    //End of Get Unit Details


    //Start of Search Unit Details

    app.post('/v1/search_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("keyword")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              unit_module.search_unit(req.body.building_id, req.body.keyword, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          });
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id" == false)) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else if (req.body.hasOwnProperty("keyword") == false) {
            res.json({ status: false, message: "keyword parameter missing" });
          }
        }
      } catch (e) {
        res.json({ status: false, message: e });
      }
    });

    //End of Search Unit Details

    var storage = multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, 'Unit_Details_Import/')
      },
      filename: function (req, file, callback) {
        callback(null, file.originalname);
      }
    });

    var upload = multer({ storage: storage });//this is the key

    //API FOR UNIT DETAILS IMPORT

    //Params: user-token,file
    //Response: status, message

    app.post('/v1/unit_excelsheet_import', ensureAuthorized, upload.single('file'), function (req, res) {
      try {
        var resident_emails = [];
        if (req.headers.hasOwnProperty("user-token")
          && req.headers.hasOwnProperty("building-id")
          && req.headers.hasOwnProperty("unit-parent-type-id")
          && req.headers.hasOwnProperty("unit-parent-id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'E')) {
              unit_module.get_child_unit_type_id(req.headers['unit-parent-type-id'], function (unit_type_id, err, msg) {
                if (err) {
                  res.json({ status: false, message: msg });
                } else {
                  var fileName = "Unit_Details_Import/" + req.file.originalname;
                  var filepath = path.resolve(fileName);
                  const csv = require('csv-parser');
                  const fs = require('fs');

                  var existingResident = 0;
                  var count = 0;
                  var totalCount = 0;

                  var totalRows = [];

                  fileBuffer = fs.readFileSync(filepath);
                  split_lines = fileBuffer.toString().trim().split("\n");
                  totalCount = split_lines.length - 1;




                  building_module.get_building_name(req.headers['building-id'], function (building_name, error, message) {
                    if (err) {
                      res.json({ status: false, message: "Building Details not found" });
                    } else {
                      fs.createReadStream(filepath)
                        .pipe(csv())
                        .on('data', (rows) => {

                          totalRows.push(rows);
                          // if (rows.Unit_Name != undefined && rows.Unit_Name != '' &&
                          //   rows.Square_Feet != undefined && rows.Unit_Description != undefined &&
                          //   rows.Resident_Name != undefined && rows.Resident_Name != '' &&
                          //   rows.Resident_Email != undefined && rows.Resident_Email != '' &&
                          //   rows.Resident_Contact_Number != undefined && rows.Resident_Contact_Number != '' &&
                          //   rows.Resident_Permanent_Address != undefined && rows["is_residing(Yes/No)"] != undefined) {

                          //   if (rows.Parking_Space != undefined && rows.Parking_Space !== '') {
                          //     var parkingArray = rows.Parking_Space.split(",");
                          //   } else {
                          //     var parkingArray = []
                          //   }
                          //   resident_module.checkResidentExistsForBulkUpload(rows.Resident_Email.trim().toLowerCase(), rows.Resident_Contact_Number.trim(), rows.Tenant_Email.trim().toLowerCase(), rows.Tenant_Contact_Number.trim(), req.headers['building-id'], function (residentExists, message) {
                          //     if (residentExists) {
                          //       count++;
                          //       existingResident++;
                          //       if (count == totalCount) {
                          //         printUploadMessage(totalCount, existingResident, true, resident_emails, res, false);
                          //       }
                          //     } else {

                          //       var unitName = rows.Unit_Name != undefined && rows.Unit_Name != null ? rows.Unit_Name.trim() : "";
                          //       var squareFeet = rows.Square_Feet != undefined && rows.Square_Feet != null ? rows.Square_Feet.trim() : "";
                          //       var unitDescription = rows.Unit_Description != undefined && rows.Unit_Description != null ? rows.Unit_Description.trim() : ""

                          //       var new_unit = {
                          //         unit_name: unitName,
                          //         square_feet: squareFeet,
                          //         unit_desc: unitDescription,
                          //         unit_type_id: new ObjectID(unit_type_id),
                          //         unit_parent_id: new ObjectID(req.headers['unit-parent-id']),
                          //         building_id: new ObjectID(req.headers['building-id']),
                          //         parking_space: parkingArray,
                          //         created_by: new ObjectID(user_id),
                          //         created_on: new Date(),
                          //         unit_balance: 0,
                          //         active: true
                          //       };

                          //       db.db().collection(dbb.UNIT).insertOne(new_unit, function (err, result) {
                          //         if (err) {
                          //           res.json({ status: false });
                          //         } else {
                          //           var unit_id = result.insertedId;
                          //           var new_tenant = null;
                          //           if (rows.Resident_Name !== '') {
                          //             var new_resident = {
                          //               resident_name: rows.Resident_Name.trim(),
                          //               resident_email: rows.Resident_Email.trim().toLowerCase(),
                          //               resident_img: '',
                          //               resident_contact_info: rows.Resident_Contact_Number.trim(),
                          //               resident_sec_contact_info: 0,
                          //               resident_id_proof: [],
                          //               resident_permanent_address: rows.Resident_Permanent_Address.trim(),
                          //               resident_vehicle_details: [],
                          //               is_sub_resident: false,
                          //               is_owner: true,
                          //               is_residing: rows["is_residing(Yes/No)"].trim().toLowerCase() == 'yes' ? true : false,
                          //               unit_id: new ObjectID(result.insertedId),
                          //               building_id: new ObjectID(req.headers['building-id']),
                          //               created_by: new ObjectID(user_id),
                          //               created_on: new Date(),
                          //               active: true
                          //             };

                          //             if (rows["is_residing(Yes/No)"].trim().toLowerCase() == 'no') {
                          //               new_tenant = {
                          //                 resident_name: rows.Tenant_Name.trim(),
                          //                 resident_email: rows.Tenant_Email.trim().toLowerCase(),
                          //                 resident_img: '',
                          //                 resident_contact_info: rows.Tenant_Contact_Number.trim(),
                          //                 resident_sec_contact_info: 0,
                          //                 resident_id_proof: [],
                          //                 resident_permanent_address: rows.Tenant_Permanent_Address.trim(),
                          //                 resident_vehicle_details: [],
                          //                 is_sub_resident: false,
                          //                 is_owner: false,
                          //                 is_residing: true,
                          //                 unit_id: new ObjectID(result.insertedId),
                          //                 building_id: new ObjectID(req.headers['building-id']),
                          //                 created_by: new ObjectID(user_id),
                          //                 created_on: new Date(),
                          //                 active: true
                          //               };
                          //             }
                          //             resident_module.insertResidentDetailsFromBulkUpload(new_resident, function (result, error, message) {
                          //               if (!error) {
                          //                 var new_res = {
                          //                   resident_id: result,
                          //                   building_id: req.headers['building-id'],
                          //                   unit_id: unit_id,
                          //                   resident_email: new_resident.resident_email,
                          //                   resident_contact_info: new_resident.resident_contact_info,
                          //                   is_owner: new_resident.is_owner,
                          //                   is_sub_resident: new_resident.is_sub_resident,
                          //                   is_residing: new_resident.is_residing,
                          //                   building_name: building_name
                          //                 }
                          //                 resident_emails.push(new_res);
                          //                 if (rows["is_residing(Yes/No)"].trim().toLowerCase() == 'no') {
                          //                   resident_module.insertResidentDetailsFromBulkUpload(new_tenant, function (result1, error1, message1) {
                          //                     if (!error1) {
                          //                       var new_ten = {
                          //                         resident_id: result1,
                          //                         building_id: req.headers['building-id'],
                          //                         unit_id: unit_id,
                          //                         resident_email: new_tenant.resident_email,
                          //                         resident_contact_info: new_tenant.resident_contact_info,
                          //                         is_owner: new_tenant.is_owner,
                          //                         is_sub_resident: new_tenant.is_sub_resident,
                          //                         is_residing: new_tenant.is_residing,
                          //                         building_name: building_name
                          //                       }
                          //                       resident_emails.push(new_ten);
                          //                     }
                          //                     count++;
                          //                     if (count == totalCount) {
                          //                       printUploadMessage(totalCount, existingResident, true, resident_emails, res, false);
                          //                     }
                          //                   })
                          //                 } else {
                          //                   count++;
                          //                   if (count == totalCount) {
                          //                     printUploadMessage(totalCount, existingResident, true, resident_emails, res, false);
                          //                   }
                          //                 }
                          //               }
                          //             })
                          //           }
                          //         }
                          //       })
                          //     }
                          //   })
                          // } else {
                          //   count++;
                          //   if (count == totalCount) {
                          //     printUploadMessage(totalCount, existingResident, true, resident_emails, res, true);
                          //   }
                          // }
                        })
                        .on('end', () => {
                          var performUnitInfo = function (rows) {
                            if (rows.Unit_Name != undefined && rows.Unit_Name != '' &&
                              rows.Square_Feet != undefined && rows.Unit_Description != undefined &&
                              rows.Resident_Name != undefined && rows.Resident_Name != '' &&
                              rows.Resident_Email != undefined && rows.Resident_Email != '' &&
                              rows.Resident_Contact_Number != undefined && rows.Resident_Contact_Number != '' &&
                              rows.Resident_Permanent_Address != undefined && rows["is_residing(Yes/No)"] != undefined) {

                              if (rows.Parking_Space != undefined && rows.Parking_Space !== '') {
                                var parkingArray = rows.Parking_Space.split(",");
                              } else {
                                var parkingArray = []
                              }
                              resident_module.checkResidentExistsForBulkUpload(rows.Resident_Email.trim().toLowerCase(), rows.Resident_Contact_Number.trim(), rows.Tenant_Email.trim().toLowerCase(), rows.Tenant_Contact_Number.trim(), req.headers['building-id'], function (residentExists, message) {
                                if (residentExists) {
                                  count++;
                                  existingResident++;
                                  if (count == totalCount) {
                                    printUploadMessage(totalCount, existingResident, true, resident_emails, res, false);
                                  } else {
                                    performUnitInfo(totalRows[count]);
                                  }
                                } else {

                                  var unitName = rows.Unit_Name != undefined && rows.Unit_Name != null ? rows.Unit_Name.trim() : "";
                                  var squareFeet = rows.Square_Feet != undefined && rows.Square_Feet != null ? rows.Square_Feet.trim() : "";
                                  var unitDescription = rows.Unit_Description != undefined && rows.Unit_Description != null ? rows.Unit_Description.trim() : ""

                                  var new_unit = {
                                    unit_name: unitName,
                                    square_feet: squareFeet,
                                    unit_desc: unitDescription,
                                    unit_type_id: new ObjectID(unit_type_id),
                                    unit_parent_id: new ObjectID(req.headers['unit-parent-id']),
                                    building_id: new ObjectID(req.headers['building-id']),
                                    parking_space: parkingArray,
                                    created_by: new ObjectID(user_id),
                                    created_on: new Date(),
                                    unit_balance: 0,
                                    active: true
                                  };

                                  db.db().collection(dbb.UNIT).insertOne(new_unit, function (err, result) {
                                    if (err) {
                                      res.json({ status: false });
                                    } else {
                                      var unit_id = result.insertedId;
                                      var new_tenant = null;
                                      if (rows.Resident_Name !== '') {
                                        var new_resident = {
                                          resident_name: rows.Resident_Name.trim(),
                                          resident_email: rows.Resident_Email.trim().toLowerCase(),
                                          resident_img: '',
                                          resident_contact_info: rows.Resident_Contact_Number.trim(),
                                          resident_sec_contact_info: 0,
                                          resident_id_proof: [],
                                          resident_permanent_address: rows.Resident_Permanent_Address.trim(),
                                          resident_vehicle_details: [],
                                          is_sub_resident: false,
                                          is_owner: true,
                                          is_residing: rows["is_residing(Yes/No)"].trim().toLowerCase() == 'yes' ? true : false,
                                          unit_id: new ObjectID(result.insertedId),
                                          building_id: new ObjectID(req.headers['building-id']),
                                          created_by: new ObjectID(user_id),
                                          created_on: new Date(),
                                          active: true
                                        };

                                        if (rows["is_residing(Yes/No)"].trim().toLowerCase() == 'no') {
                                          new_tenant = {
                                            resident_name: rows.Tenant_Name.trim(),
                                            resident_email: rows.Tenant_Email.trim().toLowerCase(),
                                            resident_img: '',
                                            resident_contact_info: rows.Tenant_Contact_Number.trim(),
                                            resident_sec_contact_info: 0,
                                            resident_id_proof: [],
                                            resident_permanent_address: rows.Tenant_Permanent_Address.trim(),
                                            resident_vehicle_details: [],
                                            is_sub_resident: false,
                                            is_owner: false,
                                            is_residing: true,
                                            unit_id: new ObjectID(result.insertedId),
                                            building_id: new ObjectID(req.headers['building-id']),
                                            created_by: new ObjectID(user_id),
                                            created_on: new Date(),
                                            active: true
                                          };
                                        }
                                        resident_module.insertResidentDetailsFromBulkUpload(new_resident, function (result, error, message) {
                                          if (!error) {
                                            var new_res = {
                                              resident_id: result,
                                              building_id: req.headers['building-id'],
                                              unit_id: unit_id,
                                              resident_email: new_resident.resident_email,
                                              resident_contact_info: new_resident.resident_contact_info,
                                              is_owner: new_resident.is_owner,
                                              is_sub_resident: new_resident.is_sub_resident,
                                              is_residing: new_resident.is_residing,
                                              building_name: building_name
                                            }
                                            resident_emails.push(new_res);
                                            if (rows["is_residing(Yes/No)"].trim().toLowerCase() == 'no') {
                                              resident_module.insertResidentDetailsFromBulkUpload(new_tenant, function (result1, error1, message1) {
                                                if (!error1) {
                                                  var new_ten = {
                                                    resident_id: result1,
                                                    building_id: req.headers['building-id'],
                                                    unit_id: unit_id,
                                                    resident_email: new_tenant.resident_email,
                                                    resident_contact_info: new_tenant.resident_contact_info,
                                                    is_owner: new_tenant.is_owner,
                                                    is_sub_resident: new_tenant.is_sub_resident,
                                                    is_residing: new_tenant.is_residing,
                                                    building_name: building_name
                                                  }
                                                  resident_emails.push(new_ten);
                                                }
                                                count++;
                                                if (count == totalCount) {
                                                  printUploadMessage(totalCount, existingResident, true, resident_emails, res, false);
                                                } else {
                                                  performUnitInfo(totalRows[count]);
                                                }
                                              })
                                            } else {
                                              count++;
                                              if (count == totalCount) {
                                                printUploadMessage(totalCount, existingResident, true, resident_emails, res, false);
                                              } else {
                                                performUnitInfo(totalRows[count]);
                                              }
                                            }
                                          }
                                        })
                                      }
                                    }
                                  })
                                }
                              })
                            } else {
                              count++;
                              if (count == totalCount) {
                                printUploadMessage(totalCount, existingResident, true, resident_emails, res, true);
                              } else {
                                performUnitInfo(totalRows[count]);
                              }
                            }
                          }
                          performUnitInfo(totalRows[count]);
                        });
                    }
                  })
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.headers.hasOwnProperty("building-id" == false)) {
            res.json({ status: false, message: "building-id parameter missing" });
          } else if (req.headers.hasOwnProperty("unit-parent-id") == false) {
            res.json({ status: false, message: "unit-parent-id parameter missing" });
          } else if (req.headers.hasOwnProperty("unit-parent-type-id") == false) {
            res.json({ status: false, message: "unit-parent-type-id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    var printUploadMessage = function (totalCount, existingResident, status, resident_emails, res, incorrectFileType) {
      if (incorrectFileType) {
        res.json({ status: false, message: "Incorrect file type" });
      } else {
        var message = ""
        if (existingResident > 0) {
          if (existingResident == totalCount) {
            message = "Data not inserted as the email address or phone number already exists";
          } else {
            var uploadCount = totalCount - existingResident;
            var uploadCountmsg = "";
            if (uploadCount == 1) {
              uploadCountmsg = uploadCount + " unit";
            } else {
              uploadCountmsg = uploadCount + " units";
            }
            message = uploadCountmsg + " inserted and email invite sent, couldn't upload " + existingResident + " units as their email address or phone number already exist in the system";
          }
        } else {
          message = "Data Inserted & Email Notification Sent Successfully";
        }

        var index = 0;
        var sendResidentEmail = function (currentResident) {
          resident_module.sendEmail(currentResident.resident_id, currentResident.building_id, currentResident.unit_id,
            currentResident.resident_email, currentResident.resident_contact_info, currentResident.is_owner, currentResident.is_sub_resident, currentResident.is_residing, currentResident.building_name,
            function (error, emailMessage) {
              index++;
              if (index < resident_emails.length) {
                sendResidentEmail(resident_emails[index]);
              } else {
                res.json({ status: status, message: message });
              }
            })
        }
        if (resident_emails.length > 0) {
          sendResidentEmail(resident_emails[index]);
        } else {
          res.json({ status: false, message: message });
        }
      }
    }

    //API FOR UNIT DETAILS EXPORT
    app.get('/v1/unit_excelsheet_export', function (req, res) {
      try {
        const filePath = "Unit_Details_Export/unit_details.csv";
        res.download(filePath);
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });


    //Start of View All Parent Units
    app.post('/v1/view_all_parent_units', ensureAuthorized, function (req, res) {
      if (req.headers.hasOwnProperty("user-token")
        && req.body.hasOwnProperty("building_id")
        && req.body.hasOwnProperty("type_parent_id")) {
        admin_module.userExists(req.token, function (user_id, result, exists, message) {
          if (exists) {
            unit_module.view_all_parent_units(req.body.building_id, req.body.type_parent_id, function (result, error, message) {
              if (error) {
                res.json({ status: false, message: message });
              } else {
                res.json({ status: true, message: message, result: result });
              }
            })
          } else {
            res.json({ status: false, message: "User does not exists" });
          }
        })

      } else {
        if (req.headers.hasOwnProperty("user-token") == false) {
          res.json({ status: false, message: "user-token parameter is missing" });
        } else if (req.body.hasOwnProperty("building_id") == false) {
          res.json({ status: false, message: "building_id parameter is missing" });
        } else {
          res.json({ status: false, message: "type_parent_id parameter is missing" });
        }
      }

    });
    //End of View All Parent Units



    //API for Add Parking Unit Details

    //headers : user-token (admin/super admin)
    // params :
    // unit_id
    // building_id
    // parking_spaces:[]

    //Functions: add_parking_unit
    //Response: status, message, result


    app.post('/v1/add_parking_unit', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("parking_spaces")
          && req.body.hasOwnProperty("unit_id")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'A' || result == 'E')) {
              var new_parking = {
                parking_spaces: JSON.parse(req.body.parking_spaces),
                unit_id: new ObjectID(req.body.unit_id),
                building_id: new ObjectID(req.body.building_id),
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true,
              };
              unit_module.add_parking_unit(new_parking, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result.insertedId });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("parking_spaces") == false) {
            res.json({ status: false, message: "parking_spaces parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of Add Parking Unit Details


    //START OF GET UNIT BALANCE
    app.post('/v1/get_unit_balance', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") &&
          req.body.hasOwnProperty("unit_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              unit_module.get_unit_balance(req.body.unit_id, function (result, error, message) {
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
          if (req.body.hasOwnProperty("unit_id") == false) {
            res.json({ status: false, message: "unit_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //END OF GET UNIT BALANCE
  }
}
