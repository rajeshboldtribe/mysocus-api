module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var vendor_module = {

    //Start of Add Vendor Details

    add_vendor: function (new_vendor, callBack) {
      try {
        db.db().collection(dbb.VENDOR).insertOne(new_vendor, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "Vendor Details Added Successfully");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add Vendor Details


    //Start of Update Vendor Details

    update_vendor: function (vendor_id,
      vendor_name,
      vendor_service,
      vendor_govt_license_no,
      vendor_account_no,
      vendor_bank_name,
      vendor_bank_ifsc,
      vendor_bank_branch,
      building_id,
      vendor_contact_info,
      vendor_other_contacts,
      vendor_id_type,
      vendor_id_number,
      vendor_id_image,
      modified_by,
      callBack) {
      try {
        db.db().collection(dbb.VENDOR).updateOne({ "_id": new ObjectID(vendor_id) }, {
          $set: {
            vendor_name: vendor_name,
            vendor_service: new ObjectID(vendor_service),
            vendor_govt_license_no: vendor_govt_license_no,
            vendor_account_no: vendor_account_no,
            vendor_bank_name: vendor_bank_name,
            vendor_bank_ifsc: vendor_bank_ifsc,
            vendor_bank_branch: vendor_bank_branch,
            vendor_other_contacts: JSON.parse(vendor_other_contacts),
            vendor_contact_info: vendor_contact_info,
            modified_by: new ObjectID(modified_by),
            vendor_id_type: vendor_id_type,
            vendor_id_number: vendor_id_number,
            vendor_id_image: vendor_id_image,
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, err);
          } else {
            callBack(result, false, "Vendor Details Updated Successfully");
          }

        });
      } catch (e) {
        console.log(e);
        callBack(null, true, e);
      }
    },
    //End of Update Vendor Details



    //Start of View All Vendors of a Building

    view_building_vendor_details: function (starting_after, limit, building_id, callBack) {
      try {
        vendor = [];
        var vendorIds = [];
        var totaldata;
        var buildingName;

        var cursor = db.db().collection(dbb.BUILDING).find({ _id: new ObjectID(building_id) });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err, '');
          } else {
            totaldata = doc.vendors.length;
            vendorIds = doc.vendors;
            buildingName = doc.building_name;
          }
        }, function () {
          if (vendorIds.length == 0) {
            callBack(null, true, "No Vendors Found", '');
          } else {
            var index = 0;
            var getVendorDetails = function (vendorDetail) {

              var vencursor = db.db().collection(dbb.VENDOR).aggregate([
                { $match: { _id: new ObjectID(vendorDetail.vendor_id) } },
                { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
                { $unwind: "$vendor_cat_details" }
              ]).collation({ locale: "en" }).sort({ venodr_name: 1 })

              vencursor.forEach(function (doc2, err2) {
                if (err2) {
                  callBack(null, true, err2, '');
                } else {

                  var vendorService = "";
                  var addedby = "";
                  var isEdit = false;
                  if (doc2.vendor_cat_details != undefined) {
                    vendorService = doc2.vendor_cat_details.vendor_category_name;
                  }

                  if (doc2.building_id == "" || doc2.building_id == undefined) {
                    addedby = "SOCUS";
                    isEdit = false;
                  } else {
                    addedby = buildingName;
                    isEdit = true;
                  }

                  var data = {
                    vendor_id: doc2._id,
                    vendor_name: doc2.vendor_name,
                    vendor_service: vendorService,
                    vendor_contact_info: doc2.vendor_contact_info,
                    vendor_image: doc2.vendor_image,
                    vendor_idproof_image: doc2.vendor_id_image,
                    vendor_type: doc2.vendor_type,
                    vendor_other_contacts: doc2.vendor_other_contacts,
                    added_by: addedby,
                    can_edit: isEdit
                  }
                  vendor.push(data);
                }
              }, function () {
                if (index < vendorIds.length) {
                  getVendorDetails(vendorIds[index]);
                  index++;
                } else {

                  callBack(vendor, false, "Vendors Found", totaldata);
                }
              })
            }
            getVendorDetails(vendorIds[index]);
            index++;
          }
        })

      } catch (e) {
        callBack(null, true, e, '');
      }
    },
    //End of View All Vendor of a Building

    //Start of Get All Building Vendor IDs
    get_all_building_vendorIds: function (building_id, callBack) {
      try {
        var vendorIDs = [];
        var vendors = [];
        var cursor = db.db().collection(dbb.BUILDING).find({ _id: new ObjectID(building_id) });
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            vendorIDs = doc.vendors;
          }
        }, function () {
          if (vendorIDs.length > 0) {
            var index = 0;
            var populateVendorID = function (ven) {
              vendors.push(ven.vendor_id.toString());

              index++;
              if (index < vendorIDs.length) {
                populateVendorID(vendorIDs[index]);
              } else {
                callBack(vendors, false, "Vendors Found");
              }
            }

            populateVendorID(vendorIDs[index]);

          } else {
            callBack(null, true, "Vendors Not Found for this building");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get All Building Vendor IDs

    //Start of View All Vendors
    view_all_vendors: function (starting_after, limit, building_id, vendorsList, callBack) {
      try {
        vendor = [];
        var totaldata;
        var starting_after = starting_after;
        var limit = limit;
        if (building_id == null || building_id == '') {
          var match = { active: true }
        }
        else {
          var match = { active: true, $or: [{ building_id: '' }, { building_id: new ObjectID(building_id) }] }
        }

        if (limit == undefined || starting_after == undefined) {
          var cursor = db.db().collection(dbb.VENDOR).aggregate([
            { $match: match },
            { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          ]).collation({ locale: "en" }).sort({ vendor_name: 1 })
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);

          var cursor = db.db().collection(dbb.VENDOR).aggregate([
            { $match: match },
            { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
            { $lookup: { from: dbb.BUILDING, localField: "building_id", foreignField: "_id", as: "building_details" } },
          ]).collation({ locale: "en" }).sort({ vendor_name: 1 }).skip(starting_after).limit(limit);
        }
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            console.log(doc._id.toString())
            var vendorService = "";
            var addedBy = "";
            if (doc.vendor_cat_details.length > 0 && doc.vendor_cat_details[0] != undefined) {
              vendorService = doc.vendor_cat_details[0].vendor_category_name;
            }
            if (doc.building_details.length > 0 && doc.building_details[0] != undefined && doc.building_details[0] != "") {
              addedBy = doc.building_details[0].building_name
            } else {
              addedBy = "SOCUS";
            }
            data = {
              vendor_id: doc._id,
              vendor_name: doc.vendor_name,
              vendor_service: vendorService,
              vendor_contact_info: doc.vendor_contact_info,
              added_by: addedBy
            }
            if (vendorsList != null && vendorsList != undefined && vendorsList.length > 0) {
              console.log(vendorsList);
              console.log(doc._id.toString());
              if (!vendorsList.includes(doc._id.toString())) {
                vendor.push(data);
              }
            } else {
              vendor.push(data);
            }

          }
        }, function () {
          if (vendor.length == 0) {
            callBack(vendor, true, "No Vendor Found", '');
          }
          else {
            db.db().collection(dbb.VENDOR).countDocuments(match, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(vendor, false, "Vendor Found", totaldata);

            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View All Vendor


    //Start of View Single Vendors

    view_vendor_detail: function (vendor_id, callBack) {
      try {
        vendor = [];

        var cursor = db.db().collection(dbb.VENDOR).aggregate([
          { $match: { _id: new ObjectID(vendor_id) } },
          { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
          { $unwind: "$vendor_cat_details" }
        ])
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            var vendorService = "";
            if (doc.vendor_cat_details != undefined) {
              vendorService = doc.vendor_cat_details.vendor_category_name;
            }
            doc.vendor_service_name = vendorService
            vendor.push(doc)
            vendors = doc;
          }
        }, function () {
          if (vendor.length == 0) {
            callBack(null, true, "No Vendor Found");
          }
          else {
            callBack(vendors, false, "Vendor Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of View Single Vendors

    //Start of Delete Vendor

    delete_vendor: function (vendor_id, callBack) {
      try {
        vendor_id = JSON.parse(vendor_id);
        vendor = [];

        for (var i = 0; i < vendor_id.length; i++) {
          var a = new ObjectID(vendor_id[i]);
          vendor.push(a)
        }
        db.db().collection(dbb.VENDOR).updateMany({ "_id": { $in: vendor } }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {

          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "Vendor Deleted");
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of Delete Vendor


    //Start of View Vendors By Category
    view_vendor_by_category: function (starting_after, limit, building_id, vendor_category_id, callBack) {
      try {
        vendor = [];
        var vendorIds = [];
        var totaldata;

        var cursor = db.db().collection(dbb.BUILDING).find({ _id: new ObjectID(building_id) });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err, '');
          } else {
            totaldata = doc.vendors.length;
            vendorIds = doc.vendors;
          }
        }, function () {
          if (vendorIds.length == 0) {
            callBack(null, true, "No Vendors Found", '');
          } else {
            var index = 0;
            var getVendorDetails = function (vendorDetail) {

              var vencursor = db.db().collection(dbb.VENDOR).aggregate([
                { $match: { _id: new ObjectID(vendorDetail.vendor_id) } },
                { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
                { $unwind: "$vendor_cat_details" }
              ])

              vencursor.forEach(function (doc2, err2) {
                if (err2) {
                  callBack(null, true, err2, '');
                } else {
                  var vendorService = "";
                  if (doc2.vendor_cat_details != undefined) {
                    if (doc2.vendor_cat_details._id == vendor_category_id) {
                      vendorService = doc2.vendor_cat_details.vendor_category_name;
                      var data = {
                        vendor_id: doc2._id,
                        vendor_name: doc2.vendor_name,
                        vendor_service: vendorService,
                        vendor_contact_info: doc2.vendor_contact_info,
                        vendor_image: doc2.vendor_image,
                        vendor_idproof_image: doc2.vendor_id_image,
                        vendor_type: doc2.vendor_type,
                        vendor_other_contacts: doc2.vendor_other_contacts,
                      }
                      vendor.push(data);
                    }
                  }
                }
              }, function () {
                if (index < vendorIds.length) {
                  getVendorDetails(vendorIds[index]);
                  index++;
                } else {
                  callBack(vendor, false, "Vendors Found", totaldata);
                }
              })
            }
            getVendorDetails(vendorIds[index]);
            index++;
          }
        })

      } catch (e) {
        callBack(null, true, e, '');
      }
    },
    //End of View Vendors By Category

    //Start of Search Vendor by Name
    search_vendor: function (building_id, keyword, callBack) {
      try {
        var buildingVendorIDs = [];
        var vendorDetail = [];
        var cursor = db.db().collection(dbb.BUILDING).find({ _id: new ObjectID(building_id), active: true })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            buildingVendorIDs = doc.vendors;
          }
        }, function () {
          if (buildingVendorIDs.length == 0) {
            callBack(null, true, "No Vendors available for this building");
          } else {
            var index = 0;
            var getVendorInfo = function (buildingVendor) {
              var vencur = db.db().collection(dbb.VENDOR).aggregate([
                { $match: { _id: new ObjectID(buildingVendor.vendor_id) } },
                { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
              ])

              vencur.forEach(function (doc1, err1) {
                if (err1) {
                  if (index < buildingVendorIDs.length - 1) {
                    index++;
                    getVendorInfo(buildingVendorIDs[index]);
                  } else {
                    if (vendorDetail.length == 0) {
                      callBack(null, true, "No Vendors available for this building");
                    } else {
                      callBack(vendorDetail, false, "Vendors Found");
                    }
                  }
                } else {
                  if (doc1.vendor_name.toLowerCase().includes(keyword.toLowerCase())) {
                    var vendorCategory = "";
                    if (doc1.vendor_cat_details.length > 0 && doc1.vendor_cat_details[0] != undefined) {
                      vendorCategory = doc1.vendor_cat_details[0].vendor_category_name;
                    }
                    var data = {
                      vendor_id: doc1._id,
                      vendor_name: doc1.vendor_name,
                      vendor_service: vendorCategory,
                      vendor_contact_info: doc1.vendor_contact_info,
                      vendor_type: doc1.vendor_type,
                      vendor_image: doc1.vendor_image,
                    }
                    vendorDetail.push(data);
                  }
                }
              }, function () {
                if (index < buildingVendorIDs.length - 1) {
                  index++;
                  getVendorInfo(buildingVendorIDs[index]);
                } else {
                  if (vendorDetail.length == 0) {
                    callBack(null, true, "No Vendors available for this building");
                  } else {
                    callBack(vendorDetail, false, "Vendors Found");
                  }
                }
              })
            }

            getVendorInfo(buildingVendorIDs[index]);

          }
        })
      } catch (ex) {
        callBack(null, true, ex);
      }
    },
    //End of Search Vendor by Name


    //Start of Vendor Visit Entry
    vendor_visitor_entry: function (vendor_entry, callBack) {
      try {
        db.db().collection(dbb.VENDOR_ENTRIES).insertOne(vendor_entry, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          } else {
            callBack(result, false, "Vendor Entry Added Successfully");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Vendor Visit Entry


    //Start of get building vendors
    get_building_vendors: function (building_id, callBack) {
      try {

        var vendors = [];
        var cursor = db.db().collection(dbb.BUILDING).aggregate([
          { $match: { "_id": new ObjectID(building_id) } },
          { $lookup: { from: dbb.VENDOR, localField: "vendors.vendor_id", foreignField: "_id", as: "vendor_details" } },
          { $lookup: { from: dbb.VENDORCATEGORIES, localField: "vendor_details.vendor_service", foreignField: "_id", as: "vendor_cat_details" } },
        ])

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            var vendorService = "";
            var vendorName = "";
            var vendorContactInfo = "";
            var addedBy = "";
            var vendorId = "";

            if (doc.vendor_details != undefined && doc.vendor_details.length > 0) {
              for (var vendor of doc.vendor_details) {
                vendorId = vendor._id;
                vendorName = vendor.vendor_name;
                vendorContactInfo = vendor.vendor_contact_info;
                if (doc.vendor_cat_details != undefined && doc.vendor_cat_details.length > 0) {
                  for (var vendorCat of doc.vendor_cat_details) {
                    if (vendorCat._id.toString() == vendor.vendor_service.toString()) {
                      vendorService = vendorCat.vendor_category_name;
                      break
                    }
                  }
                }
                data = {
                  vendor_id: vendorId,
                  vendor_name: vendorName,
                  vendor_service: vendorService,
                  vendor_contact_info: vendorContactInfo,
                  added_by: addedBy
                }
                vendors.push(data);
              }
            }
          }
        }, function () {
          if (vendors.length == 0) {
            callBack(null, true, "No Vendors Found");
          } else {
            callBack(vendors, false, "Vendors Found");
          }
        })
      } catch (er) {
        callBack(null, true, er);
      }
    },
    //End of get building vendors

  }
  return vendor_module;
}