/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 13/03/13
 * Time: 7:37 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');

var PointsActionsSchema = new mongoose.Schema({
    person_id: {type: mongoose.Schema.ObjectId, ref:'person'},
    business_id: {type: mongoose.Schema.ObjectId, ref:'business'},
    action : { type: String, enum: ['redeemed', 'collected'], required: true},
    change_in_points : Number,
    points : Number,
    points_campaign : {type: String},
    date : Date
});

module.exports = PointsActionsSchema;
