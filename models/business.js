/**
 * Created with JetBrains WebStorm.
 * User: owais
 * Date: 27/01/13
 * Time: 1:22 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var businessSchema = require('../Schemas/business.js');
var DOCUMENT_NAME = 'business';
var simpleResponse = require('../utilities/responseWrapper');
var geocoder = require('geocoder');
var businessModel = mongoose.model(DOCUMENT_NAME, businessSchema, 'businesses');
var SELECT_BUSINESS_FIELDS = 'name contact_email phone tags active images locations loyalty_programs ';
var SELECT_BUSINESS_MINI_FIELDS = 'name contact_email phone description tags active phone images locations';
businessSchema.index({'Address.location': '2d'});

exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving businesses by id: ' + id );
    businessModel.findOne({_id : id}, function(err, item) {
        res.send(item);
    });
};

// To return a subset of the business object
function modelBasicBusinessItem(item){
    return { business :{
        id: item._id,
        contact_email : item.contact_email,
        name: item.name,
        active:item.active,
        phone: item.phone,
        images: item.images,
        locations : item.locations,
        loyalty_program: item.loyalty_program,
        tags : item.tags
    }};
}


exports.nearby = function(req, res) {
    var latlng = req.query.ll;
    var unit = req.query.unit;
    var radius = req.query.radius;
    var near = req.query.near;

    console.log(latlng);
    console.log(unit);
    console.log(radius);
    console.log(near);
    if(latlng != undefined){
        var ll =  latlng.split(',');
        if(ll.length == 2){
            if(radius != undefined && unit != undefined){
              if(unit =='mi'){
                  businessModel.find({'locations.loc' : { $near : [ll[0],ll[1]], $maxDistance : radius/68.91}}, SELECT_BUSINESS_FIELDS,
                      function(err, items) {
                          if(items!=null){
                              simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
                          }else{
                              simpleResponse.getResponseWithError(res, 404,'','No match found',{});
                          }
                    });
              }
              else if (unit =='km'){
                  businessModel.find({'locations.loc': { $near : [ll[0],ll[1]], $maxDistance : radius/111.12}}, SELECT_BUSINESS_FIELDS,
                      function(err, items) {
                          if(items!=null){
                              simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
                          }else{
                              simpleResponse.getResponseWithError(res, 404,'','No match found',{});
                          }
                      });
              }
            }
        }
    }
    else if(near != undefined){
        if(radius != undefined && unit != undefined){
            geocoder.geocode(near, function ( err, data ) {
                if(data.results.length > 0){
                    if(unit =='mi'){
                        businessModel.find({'locations.loc' : { $near : [data.results[0].geometry.location.lat,data.results[0].geometry.location.lng], $maxDistance : radius/68.91}}, SELECT_BUSINESS_FIELDS,
                            function(err, items) {
                                if(items!=null){
                                    simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
                                }else{
                                    simpleResponse.getResponseWithError(res, 404,'','No match found',{});
                                }
                            });

                    }
                    else if (unit == 'km'){
                        businessModel.find({'locations.loc' : { $near : [data.results[0].geometry.location.lat,data.results[0].geometry.location.lng], $maxDistance : radius/111.12}}, SELECT_BUSINESS_FIELDS,
                            function(err, items) {
                                if(items!=null){
                                    simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
                                }else{
                                    simpleResponse.getResponseWithError(res, 404,'','No match found',{});
                                }
                            });

                    }
                }
            });

        }

    }
}


exports.getLoyaltyMembersByBusinessId = function(business_id, callback) {
    businessModel.findOne({_id : business_id}, function(err, item) {
        callback(err,item);
    });
};



exports.findByIdForBusiness = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving businesses by id: ' + id );
    businessModel.findOne({_id : id}, function(err, item) {

        var newItem = modelBasicBusinessItem(item);
        //Object.defineProperty(newItem,'business.loyalty_programs',item.loyalty_programs);
        newItem.business.loyalty_members = item.loyalty_members;
        if(item!=null){
            simpleResponse.getResponse(res, 200, newItem);
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });
};

exports.findByIdForPerson = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving businesses by id: ' + id );
    businessModel.findOne({_id : id}, function(err, item) {
        if(item!=null){
            simpleResponse.getResponse(res, 200, modelBasicBusinessItem(item));
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });
};



exports.findByLogLatKMDistance = function (log, lat, distance, res){
    var businessesList = [];

};


exports.findByNameAndAddress = function(placesArray, res, limit) {
    console.log('finding businesses by name and address: ');
    var businessList = [];
    var size = placesArray.length;
    var count = 0;
    /*
    placesArray.forEach(function(place){
        var cityName = place.city.replace(/^\s+|\s+$/g,'');
        businessModel.findOne({ name : { $regex : new RegExp(place.name, "i")}, locations: {$elemMatch : { street:  {$regex : new RegExp(place.street, "i")}, city : { $regex : new RegExp(cityName, "i") } }}} ,SELECT_BUSINESS_FIELDS,
            function(err, item) {
                count++;
                if(item!=null){
                    businessList.push(item);
                }
                if(count===size || size==limit){
                    simpleResponse.getResponse(res, 200, { count : businessList.length, businesses : businessList});
                }
        });
    });
    */
    // for testing returning all businesses
    businessModel.find({active: true} ,SELECT_BUSINESS_FIELDS,function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });

};

exports.findByNameForPerson = function(req, res) {
    var name = req.params.name;
    console.log('Retrieving businesses by name: ' +name );
    businessModel.find({ name :  { $regex : new RegExp(name, "i") }  },SELECT_BUSINESS_FIELDS,
        function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });
};


exports.findByTagOrSearch = function(req, res) {
    var tag = req.params.tags;
    var allTags = tag.split(",");
    console.log('Retrieving businesses by tag: ' + tag );
    businessModel.find({ tags:{$in : allTags }}, SELECT_BUSINESS_FIELDS,function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });
};

exports.findByTagAndSearch = function(req, res) {
    var tag = req.params.tags;
    var allTags = tag.split(",");
    console.log('Retrieving businesses by tag: ' + tag );
    businessModel.find({ tags:{$all : allTags }}, SELECT_BUSINESS_FIELDS,function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }

    });
};


exports.findAllTags = function(req, res) {
    console.log('Retrieving all tags');
    businessModel.find().distinct('tags',function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, tags : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });
};

exports.findAll = function(req, res) {
    console.log('Retrieving all businesses');
    businessModel.find({active: true} ,SELECT_BUSINESS_FIELDS,function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, businesses : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });
};

exports.findAllNames = function(req, res) {
    console.log('Retrieving all businesses');
    businessModel.find({},{name:1},function(err, items) {
        if(items!=null){
            simpleResponse.getResponse(res, 200, { count : items.length, business_names : items});
        }else{
            simpleResponse.getResponseWithError(res, 404,'','No match found',{});
        }
    });

};

exports.addLocationToBusiness = function(business_id, person_id, callback) {
    businessModel.update({_id :business_id, 'loyalty_members.person_Id':{$ne:person_id}}
        ,{$push: {loyalty_members : {person_Id : person_id, points:0, active : true }}}
        , {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating person: ' + err);
            } else {
                console.log('' + result + ' document(s) updated');
                callback(result);
            }
        });
};

exports.findBusinessByPersonId = function(person_id, callback){
  console.log(person_id);
  businessModel.findOne({account_managers : {$exists: true},account_managers : person_id},SELECT_BUSINESS_FIELDS +' account_managers', function(err, result){
      if(err){
          console.log('Error retrieving business_Id for a person: ' + err);
      }
      else {
          console.log(result);
          callback(result);
      }
  });
};


exports.addPersonToBusiness = function(business_id, person_id, callback) {
    businessModel.update({_id :business_id}
        ,{$push: {loyalty_members : {person_Id : person_id, points:0, active : true }}}
        , {safe:true}, function(err, result) {
        if (err) {
            console.log('Error updating person: ' + err);
        } else {
            console.log('' + result + ' document(s) updated');
            callback(result);
        }
    });
};


exports.removePersonToBusiness = function(business_id, person_id, callback) {
    businessModel.update({_id :business_id, 'loyalty_members.person_Id':person_id},
        {$set: {'loyalty_members.$.active' : false }}, {safe:true}, function(err, result) {
        if (err) {
            console.log('Error updating business: ' + err);
        } else {
            console.log('' + result + ' document(s) updated');
            callback(result);
        }
    });
};

exports.addOrRemoveLoyaltyPointsToAPersonForABusiness = function(business_id, person_id, points, callback) {
    businessModel.update({id :business_id, 'loyalty_members.person_id': person_id},
        {$inc: {'loyalty_members.$.points' : points }}, {safe:true}, function(err, result) {
        if (err) {
            console.log('Error updating business: ' + err);
        } else {
            callback(result);
        }
    });
};


exports.addBusiness = function(req, res) {
    var business = {contact_email : req.body.email,
        name: req.body.name,
        active: req.body.active ? req.body.active : true,
        phone: (req.body.phone) ? req.body.phone : '',
        description: req.body.description ? req.body.description : '',
        images: req.body.images ? req.body.images : [],
        locations : req.body.locations ? req.body.locations :[],
        tags : req.body.tags ? req.body.tags : []
    };


    console.log('Adding business: ' + JSON.stringify(business));
    var BusinessModel = mongoose.model(DOCUMENT_NAME, personSchema);
    var businessM = new BusinessModel(business);

    businessM.save(function(err, result) {
        if (err) {
            simpleResponse.getResponseWithError(res,500,'An error has occurred','',{});
        } else {
            console.log('Success: ' + JSON.stringify(result));
            simpleResponse.getResponse(res,200, modelBasicBusinessItem(result));
        }
    });
}


exports.updateBusiness = function(req, res) {
    var id =  req.params.id;
    var business = req.body;
    console.log('Updating business: ' + id);
    console.log(JSON.stringify(business));

    businessModel.findByIdAndUpdate(id,{$set : business}, function(err, result) {
        if (err) {
            console.log('Error updating business: ' + err);
            res.send({'error':'An error has occurred'});
        } else {
            console.log('' + result + ' document(s) updated');
            simpleResponse.getResponse(res,200, modelBasicBusinessItem(result));
        }
    });
}

exports.deleteBusiness = function(req, res){
    var id = req.params.id;
    console.log('Deleting business: ' + id);
    businessModel.findByIdAndUpdate(id,{$set : { active : false }}, function(err, result) {
        if (err) {
            res.send({'error':'An error has occurred - ' + err});
        } else {
            console.log('' + result + ' document(s) deleted');
            simpleResponse.getResponse(res,200, modelBasicBusinessItem(result));
        }
    });
}

