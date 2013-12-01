/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 11/05/13
 * Time: 12:41 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Created with JetBrains WebStorm.
 * User: owais
 * Date: 27/01/13
 * Time: 1:22 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var businessBenefitSchema = require('../Schemas/business_benefit.js');
var DOCUMENT_NAME = 'business_benefits';
var simpleResponse = require('../utilities/responseWrapper');
var businessBenefitModel = mongoose.model(DOCUMENT_NAME, businessBenefitSchema, 'business_benefits');
var SELECT_BUSINESS_FIELDS = 'name contact_email phone tags active images locations loyalty_programs ';
var SELECT_BUSINESS_MINI_FIELDS = 'name contact_email phone description tags active phone images locations';


exports.addBusinessBenefit = function(req, res) {
    var business_id = req.body.business_Id;
    var businessBenefit = {
        person_id : req.body.person_Id,
        name: req.body.name,
        description: req.body.description ? req.body.description : '',
        images: req.body.images ? req.body.images : [],
        points : req.body.points ? req.body.points :0,
        tags : req.body.tags ? req.body.tags : []
    };

    var businessM = new businessBenefitModel(businessBenefit);

    businessM.save(function(err, result) {
        if (err) {
            simpleResponse.getResponseWithError(res,500,'An error has occurred','',{});
        } else {
            console.log('Success: ' + JSON.stringify(result));
            simpleResponse.getResponse(res,200, result);
        }
    });
}


exports.updateBusinessBenefit = function(req, res) {
    var id =  req.params.id;
    var business = req.body;
    console.log('Updating business: ' + id);
    console.log(JSON.stringify(business));

    businessBenefitModel.findByIdAndUpdate(id,{$set : business}, function(err, result) {
        if (err) {
            console.log('Error updating business: ' + err);
            res.send({'error':'An error has occurred'});
        } else {
            console.log('' + result + ' document(s) updated');
            simpleResponse.getResponse(res,200, result);
        }
    });
}

exports.addBenefitToBusiness = function(req, business_Id, callback) {
    var business_id = business_Id;
    var person_id = req.body.person_Id;
    var name = req.body.name;
    var description = req.body.description ? req.body.description : '';
    var images = req.body.images ? req.body.images : [];
    var points = req.body.points ? req.body.points :0;
    var tags = req.body.tags ? req.body.tags : [];


    businessBenefitModel.findOne({business_Id : business_id}, function(err, item) {
        if(!item){
            var b = businessBenefitModel({business_Id:business_id});
            b.save(function(err, res) {
                callback(err, item);
            });
        }

        businessBenefitModel.update({business_Id:business_id, 'benefits_list.name':{$ne:name}}
            ,{$push: {benefits : {
                person_id : person_id,
                name : name,
                description : description,
                images : images,
                point_value : points,
                tags : tags,
                active : true
            }}}
            , {safe:true}, function(err, result) {
                callback(err, result);
            });
    });
};

exports.deleteBusinessBenefitByBusinessIdAndBenefitId = function(benefit_Id, business_Id, callback) {
    businessBenefitModel.update({business_Id :business_Id, 'benefits._id':benefit_Id},
        {$set: {'benefits.$.active' : false }}, {safe:true}, function(err, result) {
            callback(err, result);
    });
};

exports.updateBusinessBenefitByBusinessIdAndBenefitId = function(req, businessId, callback) {
    var business_id = req.body.businessId;
    var benefit_Id = req.body.benefit_Id;
    businessBenefitModel.findOne({business_Id : business_id, 'benefits._id':benefit_Id} , function(err, item) {
        console.log(item);


        if(item && item.benefits.length > 0){
            var benefit = null;
            for (var i = 0, len = item.benefits.length; i < len; i++)
            {
                console.log(item.benefits[i]._id);
                if(item.benefits[i]._id == benefit_Id){
                    benefit = item.benefits[i];
                    console.log(benefit);
                    break;
                }
            }

            if(benefit){
                console.log('' + item + ' document(s) updated');
                var name = req.body.name ? req.body.name : benefit.name;
                var description = req.body.description ? req.body.description : (benefit.description ? benefit.description : '');
                var images = req.body.images ? req.body.images : benefit.images;
                var points = req.body.points ? req.body.points : benefit.point_value;
                var tags = req.body.tags ? req.body.tags : benefit.tags;

                businessBenefitModel.update({business_Id :business_id, 'benefits._id':benefit_Id},
                    {$set: {'benefits.$.active' : false,
                        'benefits.$.name' : name,
                        'benefits.$.description' : description,
                        'benefits.$.images' : images,
                        'benefits.$.point_value' : points,
                        'benefits.$.tags' : tags
                    }}, {safe:true}, function(err, result) {
                        callback(err, result);
                    });
            }
        }
    });
};


exports.listOfBenefitsByBusinessId = function(business_id, callback) {
    businessBenefitModel.find({business_Id : business_id}, 'benefits' , function(err, item) {
        callback(err, item);
    });
};




