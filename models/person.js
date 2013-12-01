/**
 * Created with JetBrains WebStorm.
 * User: owais
 * Date: 27/01/13
 * Time: 1:22 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var personSchema = require('../Schemas/person.js');
var simpleResponse = require('../utilities/responseWrapper');
var personModel = mongoose.model('person', personSchema, 'persons');
var SELECT_PERSON_FIELDS = 'email first_name last_name, business_subscriptions create_date member_type';
var SELECT_PERSON_FIELDS_MINI = 'first_name last_name date_of_birth gender location';

function basicPersonItem(item){
   return {user : {
                      email: item.email,
                      first_name:item.first_name,
                      last_name:item.last_name,
                      date_of_birth : item.date_of_birth,
                      gender:item.gender,
                      business_subscriptions:item.business_subscriptions,
                      addresses:item.addresses
                   },
           create_date: item.create_date
   };

};

exports.addPersonFromFacebook = function (person, callback){
   
    var personObj = {
        email : person.email,
        gender: person.gender,
        first_name : person.first_name,
        last_name : person.last_name
    };
    console.log('Adding Fb profile: ' + JSON.stringify(personObj));
    var PersonModel = mongoose.model('person', personSchema);
    var personM = new PersonModel(personObj);

    personM.save(function(err, result) {
        if (err) {
            console.log("Error:"+err);
            callback("Error: Account wasn't created",{});
        } else {
            callback(null,result);
        }
    });

}


exports.addPerson = function(req, res) {
    var person = {
        email : req.body.email,
        password: req.body.password,
        first_name : (req.body.first_name)? req.body.first_name :'',
        last_name : (req.body.last_name)? req.body.last_name :'',
        date_of_birth : {
            month:  (req.body.date_of_birth && req.body.date_of_birth.month)? req.body.date_of_birth.month :-1,
            day:  (req.body.date_of_birth && req.body.date_of_birth.day)? req.body.date_of_birth.day :-1,
            year:  (req.body.date_of_birth && req.body.date_of_birth.year)? req.body.date_of_birth.year :-1
        },
        member_type : req.body.member_type ? req.body.member_type :'user',
        address: {
            street: (req.body.address && req.body.address.street)? req.body.address.street :'',
            apartment_unit: (req.body.address && req.body.address.apartment_unit)? req.body.address.apartment_unit :'',
            city : (req.body.address && req.body.address.city)? req.body.address.city :'',
            postal_code : (req.body.address && req.body.address.postal_code)? req.body.address.postal_code :'',
            state_prov : (req.body.address && req.body.address.state_prov)? req.body.address.state_prov :'',
            state_prov_code : (req.body.address && req.body.address.state_prov_code)? req.body.address.state_prov_code :'',
            country : (req.body.address && req.body.address.country)? req.body.address.country :'',
            country_code : (req.body.address && req.body.address.country_code)? req.body.address.country_code :''
        }
    };
    console.log('Adding person: ' + JSON.stringify(person));
    var PersonModel = mongoose.model('person', personSchema);
    var personM = new PersonModel(person);

    personM.save(function(err, result) {
        if (err) {
            simpleResponse.getResponseWithError(res, 403, "","Error: Account wasn't created",{});
        } else {
            console.log('Success: ' + JSON.stringify(result));
            simpleResponse.getResponse(res,200, basicPersonItem(result));
        }
    });
};


exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving person: ' + id);
    personModel.findById(id, function(err, item) {
        simpleResponse.getResponse(res,200, basicPersonItem(item));
    });
};

exports.findByListIds = function(members, callback) {
    personModel.find({_id : { $in : members}},SELECT_PERSON_FIELDS_MINI , function(err, item) {
        callback(err, item);
    });
};

exports.findAll = function(req, res) {
    personModel.find({},SELECT_PERSON_FIELDS,function(err, items) {
        simpleResponse.getResponse(res,200, items);
    });
};

exports.findByNameEmailAndPassword = function(email, password, callback) {
    console.log('person: ' + email);
    personModel.findOne({ email : email, password : password },function(err, items) {
        callback(items);
    });
};

exports.findByEmail = function(email, callback) {
    console.log('person: ' + email);
    personModel.findOne({ email : email},function(err, item) {
        callback(item);
    });
};

exports.addBusinessToPerson = function(business_id, person_id, business_name, callback) {

    personModel.findOne({_id:person_id, business_subscriptions:{business_id: business_id}}, function(error, personItem) {
        if(error){

        }
        else if (!personItem){

            personModel.update({_id:person_id}, {$push: {'business_subscriptions' : {'business_id' : business_id, 'business_name' : business_name, 'points': 0,'active' : true }}}, {safe:true}, function(err, result) {
                if (err) {
                    console.log('Error updating person: ' + err);
                } else {
                    callback(result);
                }
            });
        }
        else{
            personModel.update({_id:person_id, 'business_subscriptions.business_id':business_id},
                {$set: {'business_subscriptions.$.active' : true }}, {safe:true}, function(err, result) {
                    if (err) {
                        console.log('Error updating person: ' + err);
                    } else {
                        console.log('' + result + ' document(s) updated');
                        callback(result);
                    }
                });
        }
    });
};

exports.removeBusinessFromPerson = function(business_id, person_id, callback) {
      
    personModel.update({_id:person_id, 'business_subscriptions.business_id':business_id},
        {$set: {'business_subscriptions.$.active' : false }}, {safe:true}, function(err, result) {
        if (err) {
            console.log('Error updating person: ' + err);
        } else {
            console.log('' + result + ' document(s) updated');
            callback(result);
        }
    });
    
};


exports.addOrRemoveLoyaltyPointsToAPersonForABusiness = function(business_id, person_id, points, callback) {

    personModel.findOne({_id:person_id, business_subscriptions:{business_id: business_id}}, function(err, personItem) {
        if (err) {
            console.log('Error updating person: ' + err);
        } else {
            personItem.business_subscriptions.points.$inc(points);
            personItem.save();
            callback(personItem);
        }
    });
};

exports.updatePerson = function(req, res) {
    var id = req.body.id;
    var person = req.body;
    console.log('Updating person: ' + id);
    console.log(JSON.stringify(person));
    personModel.findOne({_id: id}, function(err, p) {
        if (err) {
            console.log('Error updating person: ' + err);
            simpleResponse.getResponseWithError(res,500,'Unable to update' ,{});

        } else  if (!p){
            simpleResponse.getResponseWithError(res,500,'Unable to find person to update' ,{});
            res.send({'error':'Person not found'});
        }
        else{
            p.location = person.location;
            p.fist_name = person.first_name;
            p.last_name = person.last_name;
            p.phone = person.phone;
            p.date_of_birth.day = person.date_of_birth.day;
            p.date_of_birth.month = person.date_of_birth.month;
            p.date_of_birth.year = person.date_of_birth.year;
            p.save(function(err) {
                simpleResponse.getResponseWithError(res,500,'Unable to update' ,{});
            });
            console.log('' + p + ' document(s) updated');
            simpleResponse.getResponse(res,200, basicPersonItem(p));
        }
    });
}

exports.deletePerson = function(res, id) {
    console.log('Deleting person: ' + id);
    personModel.findOne({_id: id}, function(err, result) {
        if (err) {
            res.send({'error':'An error has occurred - ' + err});
        } else {
            result.active = true;
            result.save();
            console.log('' + result + ' document(s) deleted');
            simpleResponse.getResponse(res,200, basicPersonItem(result));
        }
    });
}