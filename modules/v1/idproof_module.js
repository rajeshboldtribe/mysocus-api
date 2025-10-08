module.exports = function (mongo, ObjectID, url, assert, dbb, db) {
    var idproof_module = {

        //Start of Add Id Proof
        add_id_proof: function (new_idproof, callBack) {
            try {

                db.db().collection(dbb.IDPROOF).insertOne(new_idproof, function (err, result) {
                    if (err) {
                        callBack(null, true, "Error Occurred");
                    }
                    else {
                        callBack(result, false, "Idproof Added Successfully");
                    }

                })
            } catch (e) {
                callBack(null, true, e);
            }
        },

        //End of Add Idproof


        //Start of Update Idproof

        update_id_proof: function (proof_id,
            proof_name,
            modified_by,
            callBack) {
            try {
                db.db().collection(dbb.IDPROOF).updateOne({ "_id": new ObjectID(proof_id)}, {
                    $set: {
                        proof_name: proof_name,
                        modified_by: new ObjectID(modified_by),
                        modified_on: new Date()
                    }
                }, { upsert: false }, function (err, result) {
                    if (err) {
                        callBack(null, true, err);
                    } else {
                        callBack(result, false, "Idproof Details Updated Successfully");
                    }

                });
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of Update Idproof



        //Start of View All Idproof

        view_all_idproof: function (callBack) {
            try {
                idproof = [];

                var cursor = db.db().collection(dbb.IDPROOF).find({active:true})

                cursor.forEach(function (doc, err) {
                    if (err) {
                        callBack(null, true, err);
                    }

                    else {
                        idproof.push(doc);
                    }
                }, function () {
                    if (idproof.length == 0) {
                        callBack(null, true, "No Idproof Found");
                    }
                    else {
                        callBack(idproof, false, "Idproof Found");
                    }
                })
            } catch (e) {
                callBack(null, true, e);
            }
        },
        //End of View All Idproof


        
        //Start of Delete Idproof

        delete_id_proof: function (proof_id, callBack) {
            try {
                proof_id=JSON.parse(proof_id);
                proof=[];

                for(var i=0;i<proof_id.length;i++){
                    var a=new ObjectID(proof_id[i]);
                    proof.push(a)
                }
                db.db().collection(dbb.IDPROOF).updateMany({ "_id": { $in: proof } }, {
                    $set: {
                        active: false
                    }
                }, { upsert: false }, function (err, result) {

                    if (err) {
                        callBack(true, err);
                    }
                    else {
                         callBack(false, "Idproof Deleted");
                    }
                });
            } catch (e) {

                callBack(true, e);
            }
        },
        //End of Delete Idproof

    }
    return idproof_module;
}