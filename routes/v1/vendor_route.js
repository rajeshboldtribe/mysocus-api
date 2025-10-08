
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var vendor_module = require('../../modules/v1/vendor_module')(mongo, ObjectID, url, assert, dbb, db);
    var building_module = require('../../modules/v1/building_module')(mongo, ObjectID, url, assert, dbb, db);
    var multer = require('multer');
    var readXlsxFile = require('read-excel-file/node');
    var path = require('path');
    var fs = require('fs');

    //API for Add Vendor Details

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // vendor_name
    // vendor_service
    // vendor_govt_license_no (optional)
    // vendor_payment_type  (credit, debit, both)
    // is_fixed_payment
    // amount (optional)
    // vendor_account_no (optional)
    // vendor_bank_name (optional)
    // vendor_bank_ifsc (optional)
    // vendor_bank_branch (optional)
    // vendor_contact_info


    //Functions: add_vendor
    //Response: status, message, result


    app.post('/v1/add_vendor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty("vendor_name")
          && req.body.hasOwnProperty("vendor_service")
          && req.body.hasOwnProperty("vendor_contact_info")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              if (req.body.building_id == "undefined" || req.body.building_id == "" || req.body.building_id == undefined) {
                building_id = '';
              } else {
                building_id = new ObjectID(req.body.building_id);
              }

              if (req.body.vendor_other_contacts !== '' && req.body.vendor_other_contacts !== undefined) {
                vendor_other_contacts = JSON.parse(req.body.vendor_other_contacts)
              } else {
                vendor_other_contacts = [];
              }

              var new_vendor = {
                // VENDOR INFO
                vendor_name: req.body.vendor_name,
                vendor_contact_info: req.body.vendor_contact_info,
                vendor_image: req.body.vendor_image,
                vendor_type: req.body.vendor_type,
                vendor_service: new ObjectID(req.body.vendor_service),

                vendor_govt_license_no: req.body.vendor_govt_license_no,

                // VENDOR ID INFO
                vendor_id_type: req.body.vendor_id_type,
                vendor_id_number: req.body.vendor_id_number,
                vendor_id_image: req.body.vendor_id_image,
                // VENDOR ACCOUNT INFO
                vendor_account_no: req.body.vendor_account_no,
                vendor_bank_name: req.body.vendor_bank_name,
                vendor_bank_ifsc: req.body.vendor_bank_ifsc,
                vendor_bank_branch: req.body.vendor_bank_branch,
                building_id: building_id,
                vendor_other_contacts: vendor_other_contacts,
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true,
              };
              vendor_module.add_vendor(new_vendor, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  if (req.body.building_id == '' || req.body.building_id == undefined || req.body.building_id == "undefined") {
                    res.json({ status: true, message: message, result: result.insertedId });
                  } else {
                    building_module.add_vender_info(req.body.building_id, result.insertedId, function (result, error, message) {
                      if (error) {
                        res.json({ status: false, message: message, result: result });
                      } else {
                        res.json({ status: true, message: message, result: result });
                      }
                    })
                  }
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.body.hasOwnProperty("vendor_name") == false) {
            res.json({ status: false, message: "vendor_name parameter is missing" });
          } else if (req.body.hasOwnProperty("vendor_service") == false) {
            res.json({ status: false, message: "vendor_service parameter is missing" });
          } else if (req.body.hasOwnProperty("vendor_contact_info") == false) {
            res.json({ status: false, message: "vendor_contact_info parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Add Vendor Details

    //API for Update Vendor Details
    //Params:vendor_id,
    // building_id
    // vendor_name
    // vendor_service
    // vendor_govt_license_no (optional)
    // vendor_payment_type  (credit, debit, both)
    // is_fixed_payment
    // amount (optional)
    // vendor_account_no (optional)
    // vendor_bank_name (optional)
    // vendor_bank_ifsc (optional)
    // vendor_bank_branch (optional)
    //vendor_contact_info
    //Functions: update_vendor
    //Response: status, message, result
    app.post('/v1/update_vendor', ensureAuthorized, function (req, res) {
      try {
        if (req.body.hasOwnProperty('vendor_id')
          && req.body.hasOwnProperty("vendor_name")
          && req.body.hasOwnProperty("vendor_service")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("vendor_contact_info")
          && req.body.hasOwnProperty("vendor_other_contacts")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              vendor_module.update_vendor(
                req.body.vendor_id,
                req.body.vendor_name,
                req.body.vendor_service,
                req.body.vendor_govt_license_no,
                req.body.vendor_account_no,
                req.body.vendor_bank_name,
                req.body.vendor_bank_ifsc,
                req.body.vendor_bank_branch,
                req.body.building_id,
                req.body.vendor_contact_info,
                req.body.vendor_other_contacts,
                req.body.vendor_id_type,
                req.body.vendor_id_number,
                req.body.vendor_id_image,
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
          if (req.body.hasOwnProperty("vendor_id") == false) {
            res.json({ status: false, message: "vendor_id parameter is missing" });
          } else if (req.body.hasOwnProperty("vendor_name") == false) {
            res.json({ status: false, message: "vendor_name parameter is missing" });
          } else if (req.body.hasOwnProperty("vendor_service") == false) {
            res.json({ status: false, message: "vendor_service parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          } else if (req.body.hasOwnProperty("vendor_contact_info") == false) {
            res.json({ status: false, message: "vendor_contact_info parameter is missing" });
          } else if (req.body.hasOwnProperty("vendor_other_contacts") == false) {
            res.json({ status: false, message: "vendor_other_contacts parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of Update VendorDetails

    //API for View All Vendor Details of a Building
    //Params: user-token,building_id
    //Functions: view_building_vendor_details 
    //Response: status, message, result
    app.post('/v1/view_building_vendor_details', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              vendor_module.view_building_vendor_details(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Vendor Details of a Building

    //API for View All Vendor Details
    //Params: user-token,building_id
    //Functions: view_all_vendors 
    //Response: status, message, result
    app.post('/v1/view_all_vendors', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              if (result == 'A' && (req.body.hasOwnProperty("building_id") == false)) {
                res.json({ status: false, message: "building_id parameter is missing" });
              } else {
                if (req.body.building_id != '') {
                  vendor_module.get_all_building_vendorIds(req.body.building_id, function (vendors, error, message) {
                    vendor_module.view_all_vendors(req.body.starting_after, req.body.limit, req.body.building_id, vendors, function (result, error, message, total) {
                      if (error) {
                        res.json({ status: false, message: message });
                      } else {
                        res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                      }
                    })
                  })
                } else {
                  vendor_module.view_all_vendors(req.body.starting_after, req.body.limit, req.body.building_id, vendors, function (result, error, message, total) {
                    if (error) {
                      res.json({ status: false, message: message });
                    } else {
                      res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                    }
                  })
                }
              }
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          res.json({ status: false, message: "user-token parameter missing" });
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View All Vendor Details

    //API for View Single Vendor Details
    //Params: user-token,vendor_id
    //Functions: view_vendor 
    //Response: status, message, result
    app.post('/v1/view_vendor_detail', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("vendor_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              vendor_module.view_vendor_detail(req.body.vendor_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("vendor_id") == false) {
            res.json({ status: false, message: "vendor_id parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of View Single Vendor Details

    //API for Delete Vendor Details
    //Params: user-token,vendor_id,building_id
    //Functions: delete_vendor
    //Response: status, message, result
    app.post('/v1/delete_vendor', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("vendor_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA')) {
              vendor_module.delete_vendor(req.body.vendor_id, function (error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  building_module.delete_vender_info(req.body.vendor_id, function (error, message) {
                    if (error) {
                      res.json({ status: false, message: message });
                    } else {
                      res.json({ status: true, message: message });
                    }
                  })
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("vendor_id") == false) {
            res.json({ status: false, message: "vendor_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Delete Vendor Details

    //Start of Assign Vendor To Building

    app.post('/v1/assign_vendor_to_building', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("vendor_id")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              building_module.add_vender_info(req.body.building_id, req.body.vendor_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message, result: result });
                } else {
                  res.json({ status: true, message: 'Vendor Assigned Successfully', result: result });
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
          } else if (req.body.hasOwnProperty("vendor_id") == false) {
            res.json({ status: false, message: "vendor_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          } else if (req.body.hasOwnProperty("is_fixed_payment") == false) {
            res.json({ status: false, message: "is_fixed_payment parameter missing" });
          } else if (req.body.hasOwnProperty("vendor_payment_type") == false) {
            res.json({ status: false, message: "vendor_payment_type parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Assign Vendor To Building

    //Start of Remove Vendor From Building
    app.post('/v1/remove_venodr_from_building', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("vendor_id")
          && req.body.hasOwnProperty("building_id")
        ) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA' || result == 'A' || result == 'E')) {
              building_module.remove_vender_info(req.body.building_id, req.body.vendor_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message, result: result });
                } else {
                  res.json({ status: true, message: message, result: result });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("vendor_id") == false) {
            res.json({ status: false, message: "vendor_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of Remove Vendor From Building
    var storage = multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, 'Vendor_Details_Import/')
      },
      filename: function (req, file, callback) {
        callback(null, file.originalname);
      }
    });

    var upload = multer({ storage: storage });//this is the key

    //API FOR VENDOR DETAILS IMPORT
    //Params: user-token,file
    //Response: status, message
    app.post('/v1/vendor_excelsheet_import', ensureAuthorized, upload.single('file'), function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SA')) {
              var filepath = path.resolve('Vendor_Details_Import/vendor_details.xlsx');
              readXlsxFile(fs.createReadStream(filepath)).then((rows) => {
                var theRemovedElement = rows.shift();
                if (rows.length !== 0) {
                  var index = 0;
                  var insert_data = function (doc) {
                    var new_vendor = {
                      vendor_name: doc[0],
                      vendor_service: doc[1],
                      vendor_govt_license_no: doc[2],
                      // vendor_payment_type: doc[3],
                      // is_fixed_payment: false,
                      // amount: doc[5],
                      vendor_account_no: doc[6],
                      vendor_bank_name: doc[7],
                      vendor_bank_ifsc: doc[8],
                      vendor_bank_branch: doc[9],
                      vendor_contact_info: doc[10],
                      vendor_other_contacts: [],
                      created_by: new ObjectID(user_id),
                      created_on: new Date(),
                      active: true,
                    };

                    db.db().collection(dbb.VENDOR).insertOne(new_vendor, function (err, result) {
                      if (err) {
                        res.json({ status: false });
                      } else {
                        index++;
                        if (index < rows.length) {
                          insert_data(rows[index]);
                        } else {
                          res.json({ status: true, message: "Data Inserted Successfully" });
                        }
                      }
                    });
                  }
                  if (rows.length !== 0) {
                    insert_data(rows[index]);
                  }
                } else {
                  res.json({ status: false, message: "File is Empty" });;
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        } else {
          res.json({ status: false, message: "user-token parameter missing" });
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //API FOR VENDOR DETAILS EXPORT
    app.get('/v1/vendor_excelsheet_export', function (req, res) {
      try {
        const filePath = "Vendor_Details_Export/vendor_details.xlsx";
        res.download(filePath);
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //API To get Vendor Details based on Category
    app.post('/v1/view_vendor_by_category', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("vendor_category_id")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              vendor_module.view_vendor_by_category(req.body.starting_after, req.body.limit, req.body.building_id, req.body.vendor_category_id, function (result, error, message, total) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result, total: total, totaldata: result.length });
                }
              })
            } else {
              res.json({ status: false, message: "User Does not Exist" });
            }
          })

        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id is false" });
          } else {
            res.json({ status: false, message: "vendor_category_id is missing" });
          }
        }
      } catch (ex) {
        res.json({ status: false, message: ex });
      }
    })


    //API to search vendor by name
    app.post('/v1/search_vendor', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("keyword")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              vendor_module.search_vendor(req.body.building_id, req.body.keyword, function (result1, error, message1) {
                if (error) {
                  res.json({ status: false, message: message1 });
                } else {
                  res.json({ status: true, message: message1, result: result1 });
                }
              })
            } else {
              res.json({ status: false, message: message1 });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id is false" });
          } else {
            res.json({ status: false, message: "keyword is missing" });
          }
        }
      } catch (ex) {
        res.json({ status: false, message: ex });
      }
    })
    //End of API search vendor by name

    //API: get_building_vendors
    //Heades: user-token
    //Params: building_id
    app.post('/v1/get_building_vendors', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              vendor_module.get_building_vendors(req.body.building_id, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                } else {
                  res.json({ status: true, message: message, result: result })
                }
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })
  }
}
