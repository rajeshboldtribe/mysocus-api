module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
  var polling_module = {

    create_poll: function (new_poll, callBack) {
      try {
        db.db().collection(dbb.POLLING).insertOne(new_poll, function (err, result) {
          if (err) {
            callBack(true, "Poll could not be created. Try again later.");
          } else {
            callBack(false, "Poll created successfully");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Add Poll

    //Start of Delete Poll
    delete_poll: function (poll_id, callBack) {
      try {
        db.db().collection(dbb.POLLING).updateOne({ "_id": new ObjectID(poll_id) }, {
          $set: {
            active: false,
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Poll Deleted successfully");
          }
        })
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Delete Poll


    //Start of Answer Poll
    poll_answered: function (poll_id, selected_option, user_id, callBack) {
      try {
        db.db().collection(dbb.POLLING).updateOne({ "_id": new ObjectID(poll_id) }, {
          $push: {
            answers: {
              user_id: user_id,
              option: selected_option
            }
          }
        }, { upsert: false }, function (err, result) {
          if (err) {
            callBack(true, err);
          } else {
            callBack(false, "Answer stored successfully");
          }
        });
      } catch (e) {
        callBack(true, e);
      }
    },
    //End of Answer Poll

    //Start of Get Poll
    get_poll: function (building_id, callBack) {
      try {
        var poll = [];
        var cursor = db.db().collection(dbb.POLLING).find({ "building_id": new ObjectID(building_id), active: true });

        cursor.forEach(function (doc, err) {
          if (err) {
            callBack(null, true, err);
          } else {
            data = {
              poll_id: doc._id,
              building_id: doc.building_id,
              question: doc.question,
              options: doc.options,
              answers: doc.answers,
              created_on: doc.created_on,
            }
            poll.push(data);
          }
        }, function () {
          if (poll.length == 0) {
            callBack(null, true, "No Poll Found");
          } else {
            callBack(poll, false, "Poll Found");
          }
        })
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Poll

    //Start of Get Poll Results
    get_poll_result: function (poll_id, callBack) {
      try {
        var pollResult = [];
        db.db().collection(dbb.POLLING).findOne({ "_id": new ObjectID(poll_id) }, function (err, doc) {
          if (err) {
            callBack(null, true, err);
          } else {
            var answers = doc.answers;
            var result = [];
            if (answers.length > 0) {
              for (answerItem of answers) {
                var optionIndex = parseInt(answerItem.option);
                if (result[optionIndex] == undefined) {
                  result[optionIndex] = 1;
                } else {
                  var currentCount = result[optionIndex];
                  currentCount++;
                  result[optionIndex] = currentCount;
                }
              }

              for (var i = 0; i < doc.options.length; i++) {
                var noAnswered = 0;
                if (result[i] != undefined) {
                  noAnswered = result[i];
                }
                var data = {
                  option: doc.options[i],
                  no_answered: noAnswered,
                  total_answered: answers.length,
                  answer_percentage: Math.round((noAnswered / answers.length) * 100)
                }
                pollResult.push(data);
              }

              if (pollResult.length == 0) {
                callBack(null, true, "No Answers Available");
              } else {
                callBack(pollResult, false, "Answers Available");
              }
            } else {
              callBack(null, true, "No Answers Available");
            }
          }
        });
      } catch (e) {
        callBack(null, true, e);
      }
    },
    //End of Get Poll Results

  }
  return polling_module;
}