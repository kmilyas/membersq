var mongoose = require('mongoose');
var subscriptionActionSchema = require('../Schemas/subscription_action.js');
var subscriptionActionModel = mongoose.model('subscription_actions', subscriptionActionSchema);


exports.addSubscriptionToPerson = function(business_id, person_id) {
    var subActionModel = new subscriptionActionModel({business_id:business_id, person_id: person_id, subscribed:true, date: Date.now()});
    subActionModel.save();
};
exports.removeSubscriptionToPerson = function(business_id, person_id) {
    var subActionModel = new subscriptionActionModel({business_id:business_id, person_id: person_id, subscribed:false, date: Date.now()});
    subActionModel.save();
};
