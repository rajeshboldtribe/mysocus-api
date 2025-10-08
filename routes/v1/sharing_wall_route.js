
module.exports = {
  configure: function (app, mongo, ObjectID, url, assert, dbb, ensureAuthorized, db, gmail) {
    var admin_module = require('../../modules/v1/admin_module')(mongo, ObjectID, url, assert, dbb, db, gmail);
    var sharing_wall_module = require('../../modules/v1/sharing_wall_module')(mongo, ObjectID, url, assert, dbb, db);

    //API for create_sharewall_post

    //headers : user-token (admin/super admin)
    // params :
    // building_id
    // user_id
    // comments
    // img(optional)
    // posted_on(date)
    // likesCount(Integer)(by backend)
    // likedBy[Array of userIds](by backend)

    //Functions: create_sharewall_post
    //Response: status, message, result


    app.post('/v1/create_sharewall_post', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty("building_id")
          && req.body.hasOwnProperty("comments")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SR' || result == 'A' || result == 'R' || result == 'E')) {

              var new_post = {
                building_id: new ObjectID(req.body.building_id),
                user_id: user_id,
                comments: req.body.comments,
                img: JSON.parse(req.body.img),
                posted_on: new Date(req.body.posted_on),
                likesCount: 0,
                likedBy: [],
                created_by: new ObjectID(user_id),
                created_on: new Date(),
                active: true,
              };
              sharing_wall_module.create_sharewall_post(new_post, function (result, error, message) {
                if (error) {
                  res.json({ status: false, message: message });
                }
                else {
                  res.json({ status: true, message: message, result: result.insertedId });
                }
              })
            }
            else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("comments") == false) {
            res.json({ status: false, message: "comments parameter is missing" });
          }

          else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          }

          else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }

        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of create_sharewall_post


    //API for edit_sharewall_post

    //Params:user-token (header)
    // post_id
    // building_id
    // user_id
    // comments
    // img(optional)

    //Functions: edit_sharewall_post
    //Response: status, message, result

    app.post('/v1/edit_sharewall_post', ensureAuthorized, function (req, res) {
      try {

        if (req.body.hasOwnProperty('post_id')
          && req.body.hasOwnProperty("comments")
          && req.body.hasOwnProperty("building_id")
          && req.headers.hasOwnProperty("user-token")) {

          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SR' || result == 'A' || result == 'R' || result == 'E')) {
              sharing_wall_module.userExists(user_id, req.body.post_id, function (is_exists, message) {
                if (is_exists) {
                  sharing_wall_module.edit_sharewall_post(
                    req.body.post_id,
                    req.body.comments,
                    req.body.building_id,
                    req.body.img,
                    user_id,
                    function (result, error, message) {
                      if (error) {
                        res.json({ status: false, message: message });
                      } else {
                        res.json({ status: true, message: message, result: req.body.post_id });
                      }
                    })
                } else {
                  res.json({ status: false, message: 'User Id not allowed for Edit' });
                }
              })
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.body.hasOwnProperty("post_id") == false) {
            res.json({ status: false, message: "post_id parameter is missing" });
          } else if (req.body.hasOwnProperty("comments") == false) {
            res.json({ status: false, message: "comments parameter is missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter is missing" });
          } else if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter is missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: "failed at try" });
      }
    });
    //End of edit_sharewall_post

    //API for get_sharewall_posts

    //Params: user-token,building_id
    //Functions: get_sharewall_posts
    //Response: status, message, result

    app.post('/v1/get_sharewall_posts', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists) {
              sharing_wall_module.get_sharewall_posts(req.body.starting_after, req.body.limit, req.body.building_id, function (result, error, message, total) {
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
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of get_sharewall_posts


    //API for get_sharewall_user_posts

    //Params: user-token,building_id
    //Functions: get_sharewall_posts
    //Response: status, message, result

    app.post('/v1/get_sharewall_user_posts', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'SR' || result == 'A' || result == 'R' || result == 'E')) {
              sharing_wall_module.get_sharewall_user_posts(req.body.starting_after, req.body.limit, req.body.building_id, user_id, function (result, error, message, total) {
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
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of get_sharewall_user_posts


    //API for delete_sharewall_post

    //Params: user-token,post_id,building_id
    //Functions: delete_sharewall_post
    //Response: status, message, result

    app.post('/v1/delete_sharewall_post', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("post_id")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'A' || result == 'SR' || result == 'E')) {
              if (result == 'A') {
                sharing_wall_module.delete_sharewall_post(req.body.post_id, req.body.building_id, function (error, message) {
                  if (error) {
                    res.json({ status: false, message: message });
                  } else {
                    res.json({ status: true, message: message });
                  }
                })
              } else {
                var posts = JSON.parse(req.body.post_id);
                sharing_wall_module.userExists(user_id, posts[0], function (is_exists, message) {
                  if (is_exists) {
                    sharing_wall_module.delete_sharewall_post(req.body.post_id, req.body.building_id, function (error, message) {
                      if (error) {
                        res.json({ status: false, message: message });
                      } else {
                        res.json({ status: true, message: message });
                      }
                    })
                  } else {
                    res.json({ status: false, message: 'User Id not allowed for Edit' });
                  }
                })
              }
            } else {
              res.json({ status: false, message: message });
            }
          })
        }
        else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("post_id") == false) {
            res.json({ status: false, message: "post_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of  delete_sharewall_post


    //API for delete_user_post
    app.post('/v1/delete_user_share_post', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token")
          && req.body.hasOwnProperty("post_id")
          && req.body.hasOwnProperty("building_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, userExistsMessage) {
            if (exists) {
              sharing_wall_module.delete_user_share_post(req.body.post_id, req.body.building_id, function (error, message) {
                res.json({ status: !error, message: message });
              })
            } else {
              res.json({ status: false, message: userExistsMessage });
            }
          })
        } else {
          if (req.headers.hasOwnProperty("user-token") == false) {
            res.json({ status: false, message: "user-token parameter missing" });
          } else if (req.body.hasOwnProperty("post_id") == false) {
            res.json({ status: false, message: "post_id parameter missing" });
          } else if (req.body.hasOwnProperty("building_id") == false) {
            res.json({ status: false, message: "building_id parameter missing" });
          }
        }
      } catch (er) {
        res.json({ status: false, message: er });
      }
    })
    //End of API delete_user_post


    //API for sharewall_like_post

    //Params: user-token
    // post_id

    //Functions: sharewall_like_post
    //Response: status, message, result

    app.post('/v1/sharewall_like_post', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("post_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'A' || result == 'SR')) {
              sharing_wall_module.sharewall_like_post(req.body.post_id, user_id, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("post_id") == false) {
            res.json({ status: false, message: "post_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });

    //End of sharewall_like_post


    //API for sharewall_dislike_post

    //Params: user-token
    // post_id

    //Functions: sharewall_dislike_post
    //Response: status, message, result

    app.post('/v1/sharewall_dislike_post', ensureAuthorized, function (req, res) {
      try {
        if (req.headers.hasOwnProperty("user-token") && req.body.hasOwnProperty("post_id")) {
          admin_module.userExists(req.token, function (user_id, result, exists, message) {
            if (exists && (result == 'R' || result == 'A' || result == 'SR' || result == 'E')) {
              sharing_wall_module.sharewall_dislike_post(req.body.post_id, user_id, function (result, error, message) {
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
          } else if (req.body.hasOwnProperty("post_id") == false) {
            res.json({ status: false, message: "post_id parameter is missing" });
          }
        }
      }
      catch (er) {
        res.json({ status: false, message: er });
      }
    });
    //End of sharewall_dislike_post
  }
}
