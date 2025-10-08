module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var sharing_wall_module = {

    //Start of Add create_sharewall_post

    create_sharewall_post: function (new_post, callBack) {
      try {

        db.db().collection(dbb.SHARINGWALL).insertOne(new_post, function (err, result, message) {
          if (err) {
            callBack(null, true, "Error Occurred");
          }
          else {
            callBack(result, false, "Post Added Successfully");
          }

        })
      } catch (e) {
        callBack(null, true, e);
      }
    },

    //End of Add create_sharewall_post


    //Start of edit_sharewall_post

    edit_sharewall_post: function (post_id,
      comments,
      building_id,
      img,
      user_id,
      callBack) {
      try {

        db.db().collection(dbb.SHARINGWALL).updateOne({ "_id": new ObjectID(post_id), user_id: new ObjectID(user_id), building_id: new ObjectID(building_id) }, {

          $set: {
            comments: comments,
            img: JSON.parse(img),
            building_id: new ObjectID(building_id),
            modified_by: new ObjectID(user_id),
            modified_on: new Date()
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(null, true, "Error Occurred");
          } else {
            callBack(result, false, "Post Details Updated Successfully");
          }

        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of edit_sharewall_post


    //Start of get_sharewall_posts

    get_sharewall_posts: function (starting_after, limit, building_id, callBack) {
      try {

        totaldata = [];
        sharing_wall = [];


        if (limit == '' && starting_after == '' || limit == undefined && starting_after == undefined) {
          var cursor = db.db().collection(dbb.SHARINGWALL).find({ building_id: new ObjectID(building_id), active: true }).sort({ _id: -1 });
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.SHARINGWALL).find({ building_id: new ObjectID(building_id), active: true }).sort({ _id: -1 }).skip(starting_after).limit(limit);
        }

        var abc = 'ooo'

        cursor.forEach(function (doc2, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            totaldata.push(doc2);
          }
        }, function () {
          if (totaldata.length == 0) {
            callBack(null, true, "No Post Found");
          }
          else {
            var index = 0;

            var getPostInfo = function (singledata) {
              var post_id = singledata._id;
              var comments = singledata.comments;
              var img = singledata.img;
              var posted_on = singledata.posted_on;
              var likesCount = singledata.likesCount;
              var likedBy = singledata.likedBy;
              var userId = singledata.user_id;
              var result = {};

              var userTypeFound = false;
              var userType;

              var cursorUsType = db.db().collection(dbb.USER).find({ "user_id": new ObjectID(userId) })
              cursorUsType.forEach(function (doc4, err4) {
                assert.equal(null, err4);
                userTypeFound = true;
                userType = doc4.user_type;
                if (userType == "E" || userType == "A") {
                  var cusorEmp = db.db().collection(dbb.EMPLOYEE).find({ "_id": new ObjectID(userId) })
                  cusorEmp.forEach(function (doc5, err5) {
                    assert.equal(null, err5);

                    result["_id"] = post_id;
                    result["comments"] = comments;
                    result["img"] = img;
                    result["posted_on"] = posted_on;
                    result["likesCount"] = likesCount;
                    result["likedBy"] = likedBy;
                    result["username"] = doc5.employee_name;
                    result["userimg"] = doc5.employee_img;

                    sharing_wall.push(result);

                  }, function () {

                    if (userTypeFound) {

                      if (index < totaldata.length) {
                        getPostInfo(totaldata[index]);
                        index++;
                      } else {
                        callBack(sharing_wall, false, "Post Found", totaldata.length);
                      }
                    }
                  })
                }
                else {
                  var cursorRes = db.db().collection(dbb.RESIDENT).find({ "_id": new ObjectID(userId) })

                  cursorRes.forEach(function (doc6, err6) {

                    assert.equal(null, err6);
                    result["_id"] = post_id;
                    result["comments"] = comments;
                    result["img"] = img;
                    result["posted_on"] = posted_on;
                    result["likesCount"] = likesCount;
                    result["likedBy"] = likedBy;
                    result["username"] = doc6.resident_name;
                    result["userimg"] = doc6.resident_img;
                    result["user_id"] = userId;

                    sharing_wall.push(result);

                  }, function () {

                    if (userTypeFound) {

                      if (index < totaldata.length) {
                        getPostInfo(totaldata[index]);
                        index++;
                      } else {
                        callBack(sharing_wall, false, "Post Found", totaldata.length);
                      }
                    }
                  })
                }
              }, function () {


              })
            }
            getPostInfo(totaldata[index]);
            index++;
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of get_sharewall_posts  

    //Start of get_sharewall_user_posts

    get_sharewall_user_posts: function (starting_after, limit, building_id, user_id, callBack) {
      try {
        sharing_wall = [];
        var totaldata;


        if (limit == '' && starting_after == '' || limit == undefined && starting_after == undefined) {
          var cursor = db.db().collection(dbb.SHARINGWALL).find({ building_id: new ObjectID(building_id), user_id: new ObjectID(user_id), active: true });
        }
        else {
          var limit = parseInt(limit);
          var starting_after = parseInt(starting_after);
          var cursor = db.db().collection(dbb.SHARINGWALL).find({ building_id: new ObjectID(building_id), user_id: new ObjectID(user_id), active: true }).skip(starting_after).limit(limit);
        }
        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            sharing_wall.push(doc);
          }
        }, function () {
          if (sharing_wall.length == 0) {
            callBack(null, true, "No Post Found", '');
          } else {
            db.db().collection(dbb.SHARINGWALL).countDocuments({ building_id: new ObjectID(building_id), user_id: new ObjectID(user_id), active: true }, function (countErr, count) {
              if (!countErr) {
                totaldata = count;
              }

              callBack(sharing_wall, false, "Post Found", totaldata);
            })
          }
        })

      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of get_sharewall_user_posts

    //Start of delete_sharewall_post

    delete_sharewall_post: function (post_id, building_id, callBack) {
      try {
        post_id = JSON.parse(post_id);
        post = [];

        for (var i = 0; i < post_id.length; i++) {
          var a = new ObjectID(post_id[i]);
          post.push(a)
        }

        db.db().collection(dbb.SHARINGWALL).updateMany({ "_id": { $in: post }, building_id: new ObjectID(building_id) }, {
          $set: {
            active: false
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "Post Deleted");
          }
        });
      } catch (e) {

        callBack(true, e);
      }
    },
    //End of delete_sharewall_post


    //Start of delete user share wall post
    delete_user_share_post: function (post_id, building_id, callBack) {
      try {
        db.db().collection(dbb.SHARINGWALL).updateOne({ "_id": new ObjectID(post_id), "building_id": new ObjectID(building_id) }, {
          $set: {
            active: false,
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          }
          else {
            callBack(false, "Post Deleted");
          }
        })
      } catch (er) {
        callBack(true, er);
      }
    },
    //End of delete user share wall post


    //Start of User Exists

    userExists: function (user_id, post_id, callBack) {
      try {
        var userExists = false;
        var cursor = db.db().collection(dbb.SHARINGWALL).find({ "user_id": new ObjectID(user_id), "_id": new ObjectID(post_id) });

        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          userExists = true;

        }, function () {
          if (userExists) {
            callBack(userExists, "User-Type did not matched!");
          } else {
            callBack(userExists, "User Does not Exists!");
          }

        })
      } catch (e) {
        callBack(true, e);
      }
    },

    //End of User Exists


    //Start of Like Sharewall Post

    sharewall_like_post: function (
      post_id,
      like_by,
      callBack) {
      try {
        likes_users = [];
        like_count = '';
        var cursor = db.db().collection(dbb.SHARINGWALL).find({ "_id": new ObjectID(post_id) })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            like_count = parseInt(doc.likesCount);
            likes_users = doc.likedBy;
          }
        }, function () {
          like_count = parseInt(like_count) + 1
          likes_users.push(like_by)

          db.db().collection(dbb.SHARINGWALL).updateOne({ "_id": new ObjectID(post_id) }, {
            $set: {
              likesCount: like_count,
              likedBy: likes_users
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              callBack(null, true, err);
            } else {
              var cursor2 = db.db().collection(dbb.SHARINGWALL).find({ "_id": new ObjectID(post_id) });
              var postfound = false;
              var comments;
              var img;
              var posted_on;
              var likesCount;
              var likedBy;
              var userId;
              var result = {};
              var userTypeFound = false;
              var userType;

              cursor2.forEach(function (doc1, err1) {
                assert.equal(null, err1);
                postfound = true;
                comments = doc1.comments;
                img = doc1.img;
                posted_on = doc1.posted_on;
                likesCount = doc1.likesCount;
                likedBy = doc1.likedBy;
                userId = doc1.user_id;
              }, function () {
                if (postfound) {
                  var cursorUsType = db.db().collection(dbb.USER).find({ "user_id": new ObjectID(userId) })
                  cursorUsType.forEach(function (doc4, err4) {
                    assert.equal(null, err4);
                    userTypeFound = true;
                    userType = doc4.user_type;
                    if (userType == "E" || userType == "A") {
                      var cusorEmp = db.db().collection(dbb.EMPLOYEE).find({ "_id": new ObjectID(userId) })
                      cusorEmp.forEach(function (doc5, err5) {
                        assert.equal(null, err5);
                        result["_id"] = post_id;
                        result["comments"] = comments;
                        result["img"] = img;
                        result["posted_on"] = posted_on;
                        result["likesCount"] = likesCount;
                        result["likedBy"] = likedBy;
                        result["username"] = doc5.employee_name;
                        result["userimg"] = doc5.employee_img;
                      }, function () {
                        if (userTypeFound) {
                          callBack(result, false, "Post Liked Successfully");
                        } else {
                          callBack(null, true, err4);
                        }
                      })
                    } else {
                      var cursorRes = db.db().collection(dbb.RESIDENT).find({ "_id": new ObjectID(userId) })
                      cursorRes.forEach(function (doc6, err6) {
                        assert.equal(null, err6);
                        result["_id"] = post_id;
                        result["comments"] = comments;
                        result["img"] = img;
                        result["posted_on"] = posted_on;
                        result["likesCount"] = likesCount;
                        result["likedBy"] = likedBy;
                        result["username"] = doc6.resident_name;
                        result["userimg"] = doc6.resident_img;
                      }, function () {
                        if (userTypeFound) {
                          callBack(result, false, "Post Liked Successfully");
                        } else {
                          callBack(null, true, err4);
                        }
                      })
                    }
                  })

                } else {
                  callBack(null, true, err1);
                }
              })
            }
          });
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Like Sharewall Post

    //Start of DisLike Sharewall Post

    sharewall_dislike_post: function (
      post_id,
      dislike_by,
      callBack) {
      try {
        likes_users = [];
        like_count = '';
        var cursor = db.db().collection(dbb.SHARINGWALL).find({ "_id": new ObjectID(post_id) })

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          }
          else {
            like_count = parseInt(doc.likesCount);
            likes_users = doc.likedBy
          }
        }, function () {
          like_count = parseInt(like_count) - 1
          var index = (likes_users.indexOf(dislike_by)) + 1;
          if (index > -1) {
            if (index >= 2) {
              likes_users.splice(index, 1);
            } else {
              likes_users = [];
            }
          }
          db.db().collection(dbb.SHARINGWALL).updateOne({ "_id": new ObjectID(post_id) }, {
            $set: {
              likesCount: like_count,
              likedBy: likes_users
            }
          }, { upsert: false }, function (err, result) {
            if (err) {
              callBack(null, true, err);
            } else {
              var cursor1 = db.db().collection(dbb.SHARINGWALL).find({ "_id": new ObjectID(post_id) });
              var postFound = false;
              var comments;
              var img;
              var posted_on;
              var likesCount;
              var likedBy;
              var userId;
              var result = {};
              var userTypeFound = false;
              var userType;
              cursor1.forEach(function (doc1, err1) {
                assert.equal(null, err1);
                postFound = true;
                comments = doc1.comments;
                img = doc1.img;
                posted_on = doc1.posted_on;
                likesCount = doc1.likesCount;
                likedBy = doc1.likedBy;
                userId = doc1.user_id;
              }, function () {
                if (postFound) {
                  var cursorUsType = db.db().collection(dbb.USER).find({ "user_id": new ObjectID(userId) })
                  cursorUsType.forEach(function (doc4, err4) {
                    assert.equal(null, err4);
                    userTypeFound = true;
                    userType = doc4.user_type;
                    if (userType == "E" || userType == "A") {
                      var cusorEmp = db.db().collection(dbb.EMPLOYEE).find({ "_id": new ObjectID(userId) })
                      cusorEmp.forEach(function (doc5, err5) {
                        assert.equal(null, err5);
                        result["_id"] = post_id;
                        result["comments"] = comments;
                        result["img"] = img;
                        result["posted_on"] = posted_on;
                        result["likesCount"] = likesCount;
                        result["likedBy"] = likedBy;
                        result["username"] = doc5.employee_name;
                        result["userimg"] = doc5.employee_img;
                      }, function () {
                        if (userTypeFound) {
                          callBack(result, false, "Post Liked Successfully");
                        } else {
                          callBack(null, true, err4);
                        }
                      })
                    } else {
                      var cursorRes = db.db().collection(dbb.RESIDENT).find({ "_id": new ObjectID(userId) })
                      cursorRes.forEach(function (doc6, err6) {
                        assert.equal(null, err6);
                        result["_id"] = post_id;
                        result["comments"] = comments;
                        result["img"] = img;
                        result["posted_on"] = posted_on;
                        result["likesCount"] = likesCount;
                        result["likedBy"] = likedBy;
                        result["username"] = doc6.resident_name;
                        result["userimg"] = doc6.resident_img;
                      }, function () {
                        if (userTypeFound) {
                          callBack(result, false, "Post Liked Successfully");
                        } else {
                          callBack(null, true, err4);
                        }
                      })
                    }
                  })
                } else {
                  callBack(null, true, err1);
                }
              })
            }
          });
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of sharewall_dislike_post


  }
  return sharing_wall_module;
}