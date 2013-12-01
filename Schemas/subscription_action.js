/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 13/03/13
 * Time: 7:37 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');

var SubscriptionActionsSchema = new mongoose.Schema({
    person_id: {type: mongoose.Schema.ObjectId, ref:'person'},
    business_id: {type: mongoose.Schema.ObjectId, ref:'business'},
    subscribed : { type: Boolean, required: true, default : true},
    reason : {type: String},
    date : {type: Date, default : Date.now()}
});

module.exports = SubscriptionActionsSchema;

