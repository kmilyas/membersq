var mongoose = require('mongoose');
var pointsActionSchema = require('../Schemas/points_action.js');
var pointsActionModel = mongoose.model('points_actions', pointsActionSchema);


exports.addPointsForBusiness = function(business_id, person_id, changeinpoints, points) {
    var ptActionModel = new pointsActionModel({business_id:business_id, person_Id:person_id,
        action:'collected', change_in_points: changeinpoints, points: points, date: new Date().now()});
    ptActionModel.save();
};

exports.removePointsForBusiness = function(business_id, person_id, changeinpoints ,points) {
    var ptActionModel = new pointsActionModel({business_id:business_id, person_Id:person_id,
        action:'redeemed', change_in_points: changeinpoints, points: points, date: new Date().now()});
    ptActionModel.save();
};