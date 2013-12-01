var express = require('express'),
    http = require('http'),
    path = require('path');
var app = module.exports = express();
var request = require('request');
var graph = require('fbgraph');
var persons = require('./models/person.js');
var businesses = require('./models/business.js');
var business_benefits = require('./models/business_benefit.js');
var sessions = require('./models/session.js');
var subscriptionAction = require('./models/subscription_action.js');
var pointsAction = require('./models/points_action.js');
var simpleResponse = require('./utilities/responseWrapper');
var mongoose = require('mongoose');
var dbURL = 'mongodb://membersq:membersq@ds049337.mongolab.com:49337/membersq';
var config = require("./config.js");
mongoose.connect(dbURL);
var moment = require('moment');

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.static(path.join(__dirname, '/public')));
    app.use(express.session({ secret: 'membersq-secret' }));
});


app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
});

// Routing Views to serve html pages
app.get('/home', function(req,res){
    res.sendfile(__dirname + '/public/mypage.html');
});

app.get('/merchant', function(req,res){
    res.sendfile(__dirname + '/public/me-page.html');
}); 

app.get('/404', function(req, res){
  res.sendfile(__dirname + '/public/404.html');
});
/////##########/////


app.get('/businesses/nearby', businesses.nearby);


app.post('/authenticate', function(req, res){

    console.log("OAuth login using="+req.body.provider);
    
    if(req.body.provider==="facebook"){
        graph.setAccessToken(req.body.auth_token);
        var options = {
            timeout:  3000
            , pool:     { maxSockets:  Infinity }
            , headers:  { connection:  "keep-alive" }
        };

        graph
            .setOptions(options)
            .get("me", function(err, auth) {
                if(!err){
                    console.log("Info: user "+auth.name+" authenticated by facebook");
                    persons.findByEmail(auth.email, function(item){
                        if(item){
                            req.session.user = item;
                            var person = {
                                first_name: item.first_name,
                                last_name:item.last_name,
                                id:item._id
                            };
                            createSessionForOAuthUser(req,res,person,auth);
                        }else{
                            persons.addPersonFromFacebook(auth, function(err,item){
                                if(!err){
                                    req.session.user = item;
                                    var person = {
                                        first_name: item.first_name,
                                        last_name:item.last_name,
                                        id:item._id
                                    };
                                    createSessionForOAuthUser(req,res,person,auth);
                                }else{
                                    simpleResponse.getResponseWithError(res, 500,'','Internal Failure',{result:'failed'});
                                }
                            });
                        }
                    });
                }else{
                    simpleResponse.getResponseWithError(res, 500,'','User Not Authenticated by Facebook',{result:'failed'});
                }
            });
    }else if ((req.body.provider==="membersq") || (req.body.provider==="")) {
        
        var email = req.body.user_name,
        password = req.body.password;
        persons.findByNameEmailAndPassword(email, password, function(items){
            if(items!==null){
                items.password = 'xxxxxxx';
                req.session.user = items;
                var person = {
                    first_name: items.first_name,
                    last_name:items.last_name,
                    id:items._id
                };
                createSessionForOAuthUser(req,res,person);
            }else{
                simpleResponse.getResponseWithError(res, 500,'','User Not Authenticated',{result:'failed'});
            }
        });
    }else{
        simpleResponse.getResponseWithError(res, 500,'','User Not Authenticated',{result:'failed'});
    }

});



app.get('/sessionuser', function(req, res){
    if((req.session) && (req.session.user)){
        sessions.findByUserAgentAndSessionId(req.headers['user-agent'], req.sessionID,function(items){
            console.log("sessionuser: "+items);
            if(items.length >0){

                simpleResponse.getResponse(res,200,{user : req.session.user});
            }
            else{
                req.session.destroy();
                simpleResponse.getResponseWithError(res,404,'','Unauthorized',{});
            }
        });
    }else{
        simpleResponse.getResponseWithError(res,404,'','Unauthorized',{});
    }
});



app.get('/signout', function(req, res){
    if(req.session)
        req.session.destroy();

    simpleResponse.getResponse(res,200,{result:'passed'});

});


app.get('/refreshtoken' ,function(req, res){
    var isTokenValid = false;
    if(req.headers['api_token']){
        var tokens = req.cookies.token.split(':');
        if(tokens.length === 3){
            sessions.findByUserAgentUserIdSeriesAndToken('mobile',tokens[0], tokens[2], function(items){
                if(items.length === 0){
                    if(items[0].token_series === tokens[1]){
                        isTokenValid = true;
                        var expiryTime =  moment.utc().add('m',30);
                        var series =  Math.round((new Date().valueOf() * Math.random())) + '';
                        var newToken = items[0].person_id +':'+ series + ':' + items[0].token_login;
                        items[0].token = newToken;
                        items[0].token_series = series;
                        items[0].token_expiry = expiryTime;
                        sessions.updateSession(items[0]);
                        simpleResponse.getResponse(res,200,{'api_token':token,'expires':expiryTime});
                    }

                    if(!isTokenValid){
                        sessions.deleteSessionByUserId(tokens[0]);
                    }
                }
            });
        }
    }
    simpleResponse.getResponseWithError(res,401,'Authorization','Unauthorized',{});
});

app.post('/login', function(req, res){
    console.log('enter login');
    var email = req.body.email,
        password = req.body.password;
    persons.findByNameEmailAndPassword(email, password, function(items){
        if(items!==null){
            items.password = 'xxxxxxx';
            req.session.user = items;
            var user = {
                first_name: items.first_name,
                last_name:items.last_name,
                user_id:items._id
            };
            console.log("is Rememberme:"+req.body.rememberme);
            if(req.body.rememberme === 'true'){
                var series =  Math.round((new Date().valueOf() * Math.random())) + '';
                var login =  Math.round((new Date().valueOf() * Math.random())) + '';

                console.log("user logged in:"+items._id);
                var token = items._id + ':' + series + ':' + login;
                var ua = '';
                if(req.body.mobile && req.body.mobile === 'true'){
                    ua = 'mobile';
                }
                else{
                    ua =  req.headers['user-agent'];
                }

                var expiryTime =  moment.utc().add('m',30);
                var session = [
                    {
                        person_id : items._id,
                        session_id : req.sessionID,
                        user_agent : ua,
                        ip : req.header('x-forwarded-for') || req.connection.remoteAddress,
                        token : token,
                        token_series : series,
                        token_login : login,
                        login_method : 'local',
                        token_expiry :expiryTime
                    }];
                sessions.addSession(session);

                if(req.body.mobile && req.body.mobile === 'true'){
                    simpleResponse.getResponse(res,200,{token: token, expires:expiryTime, user : items});
                }
                else{
                    res.cookie('token', token, {maxAge: 90000, httpOnly: true});
                    simpleResponse.getResponse(res,200,{token: token, expires:expiryTime, user : items});
                }
            }
            else{
                var session = [
                    {
                        person_id :items._id,
                        session_id : req.sessionID,
                        user_agent : req.headers['user-agent'],
                        ip : req.header('x-forwarded-for') || req.connection.remoteAddress,
                        login_method : 'local'
                    }];
                sessions.addSession(session);
                simpleResponse.getResponse(res,200,{user : items});
            }
        }
        else{
            simpleResponse.getResponseWithError(res, 500,'','Login Failure',{result:'failed'});
        }
    });
});


app.get('/businesses/big/id/:id', businesses.findByIdForBusiness); // full object
app.get('/businesses/small/id/:id', businesses.findByIdForPerson); // full object
app.get('/businesses/tags/or/:tags', businesses.findByTagOrSearch);
app.get('/businesses/tags/and/:tags', businesses.findByTagAndSearch);
app.get('/businesses/tags', businesses.findAllTags);
app.get('/businesses/big/name/:name', businesses.findAllNames);
app.get('/businesses/small/name/:name', businesses.findAllNames);
app.del('/businesses/:id', businesses.deleteBusiness);
app.get('/businesses', businesses.findAll);
app.get('/persons/id/:id', persons.findById);
app.get('/persons', persons.findAll);
app.post('/persons', persons.addPerson);
app.put('/persons', persons.updatePerson);

// ##########  Business Benefit Actions
app.post('/businesses/addbenefit ',function (req, res) {
    var person_id = req.body.person_id;
    var benefit_Id = req.body.benefit_Id;
    if(person_id && benefit_Id){
        businesses.findBusinessByPersonId(person_id, function(result){
            if(result){
                business_benefits.addBenefitToBusiness(req, result._id, function(err, item){
                    if (err) {
                        console.log('Error updating business: ' + err);
                        simpleResponse.getResponseWithError(res, 500,'','could not add to business',{});
                    } else {
                        console.log('' + item + ' document(s) updated');
                        simpleResponse.getResponse(res,200, item);
                    }
                });
            }
        });
    }
});

app.get('/businesses/editbenefit',function (req, res) {
    var person_id = req.body.person_id;
    if(person_id ){
        businesses.findBusinessByPersonId(person_id, function(result){
            if(result){
                business_benefits.updateBusinessBenefitByBusinessIdAndBenefitId(req, result._id, function(err, item){
                    if (err) {
                        console.log('Error updating business: ' + err);
                        simpleResponse.getResponseWithError(res, 500,'','could not update business',{});
                    } else {
                        console.log('' + item + ' document(s) updated');
                        simpleResponse.getResponse(res,200, item);
                    }
                });
            }
        });
    }
    else{
        simpleResponse.getResponseWithError(res, 500,'','Make sure all data is passed correctly',{});
    }
});

app.del('/businesses/removebenefit ',function (req, res) {
    var person_id = req.body.person_id;
    var benefit_Id = req.body.benefit_Id;
    if(person_id && benefit_Id){
        businesses.findBusinessByPersonId(person_id, function(result){
            if(result){
                business_benefits.deleteBusinessBenefitByBusinessIdAndBenefitId(benefit_Id, result._id, function(err, item){
                    if (err) {
                        console.log('Error deleting business benefit: ' + err);
                        simpleResponse.getResponseWithError(res, 500,'','could not delete business',{});
                    } else {
                        console.log('' + item + ' document(s) updated');
                        simpleResponse.getResponse(res,200, item);
                    }
                });
            }
        });
    }
    else{
        simpleResponse.getResponseWithError(res, 500,'','Make sure all data is passed correctly',{});
    }
});

app.get('/businesses/listbenefits',function (req, res) {
    var person_id = req.query["person_id"];
    var business_id = req.query["business_id"];
       console.log("list benefits for business id:"+ business_id);
    if(person_id && business_id){
        business_benefits.listOfBenefitsByBusinessId(business_id, function(err, item){
            if (err) {
                console.log('Error listing benefits: ' + err);
                simpleResponse.getResponseWithError(res, 500,'','could not list benefits',{});
            } else {
                if(item.length>0){
                    console.log(item[0].benefits.length + ' benefits(s)');
                    simpleResponse.getResponse(res,200, {benefits:item[0].benefits});
                }else{
                    simpleResponse.getResponseWithError(res, 500,'','could not find any benefits',{});
                }
            }
        });
    }
    else{
        simpleResponse.getResponseWithError(res, 500,'','Make sure all data is passed correctly',{});
    }
});

// ##############

app.get('/businesses/listsubscribers',function (req, res) {
    var person_id = req.query["person_id"];
    var business_id = req.query["business_id"];
    console.log(business_id);
    console.log(person_id);
    if(person_id && business_id){
        businesses.findBusinessByPersonId(person_id, function(result){
            if(result && business_id == result._id){
                businesses.getLoyaltyMembersByBusinessId(business_id, function(err, item){
                    if (err) {
                        console.log('Error listing businesses subscribers: ' + err);
                        simpleResponse.getResponseWithError(res, 500,'','could not add to business',{});
                    } else {
                        var members = [];
                        for (var i = 0, len = item.loyalty_members.length; i < len; i++)
                        {
                            members.push(item.loyalty_members[i].person_Id);
                        }
                        persons.findByListIds(members, function(error, people){
                            if(error){
                                console.log('Error listing businesses subscribers: ' + error);
                                simpleResponse.getResponseWithError(res, 500,'','could not add to business',{});
                            }
                            else{
                                simpleResponse.getResponse(res,200, {subscribers:people});
                            }
                        });
                    }
                });
            }
            else{
                simpleResponse.getResponseWithError(res, 401,'','Unauthorized',{});
            }
        });
    }
    else{
        simpleResponse.getResponseWithError(res, 500,'','Make sure all data is passed correctly',{});
    }
});

app.post('/businesssubscription', function (req, res) {

    console.log("subscibing to:"+req.body.business_id);
    persons.addBusinessToPerson(req.body.business_id,req.body.person_id,req.body.business_name, function(result){
            if(result >0 ){
                subscriptionAction.addSubscriptionToPerson(req.body.business_id,req.body.person_id);
                businesses.addPersonToBusiness(req.body.business_id,req.body.person_id, function(item){
                        simpleResponse.getResponse(res,200,item);
                    }
                );
            }
        }
    );
});

app.del('/businesssubscription', function (req, res) {
    console.log(req.body);
    var person_id = req.body.person_id,
        business_id = req.body.business_id;

    persons.removeBusinessFromPerson(business_id,person_id, function(result){
            if(result > 0){
                subscriptionAction.removeSubscriptionToPerson(business_id,person_id);
                businesses.removePersonToBusiness(business_id,person_id, function(item){
                        simpleResponse.getResponse(res,200,item);
                    }
                );
            }
        }
    );
});

app.put('/loyaltypoints', function (req, res) {
    console.log(req.body);
    var person_id = req.body.person_id,
        business_id = req.body.business_id,
        points = req.body.points;

    console.log(req.body.business_id);
    persons.addOrRemoveLoyaltyPointsToAPersonForABusiness(business_id,person_id,points, function(result){
            if(result > 0){
                pointsAction.addPointsForBusiness(business_id,person_id,points,result.points);
                businesses.addOrRemoveLoyaltyPointsToAPersonForABusiness(business_id, person_id, points, function(item){
                        simpleResponse.getResponse(res,200,item);
                    }
                );
            }
        }
    );
});

app.del('/loyaltypoints', function (req, res) {
    console.log(req.body);
    var person_id = req.body.person_id,
        business_id = req.body.business_id,
        points = req.body.points;

    console.log(req.body.business_id);
    persons.addOrRemoveLoyaltyPointsToAPersonForABusiness(business_id,person_id, 0 - points, function(result){
            if(result > 0){
                pointsAction.removePointsForBusiness(business_id,person_id,0-points,result.points);
                businesses.addOrRemoveLoyaltyPointsToAPersonForABusiness(business_id, 0 - person_id, points, function(item){
                        simpleResponse.getResponse(res,200,item);
                    }
                );
            }
        }
    );
});
app.delete('/persons/:id', persons.deletePerson);


function checkLogin(req, res, next){

    var isTokenValid;
    var tokens;
    if(req.headers['api_token']){
        isTokenValid = false;
        tokens = req.headers['api_token'].split(':');
        if(tokens.length === 3){
            sessions.findByUserAgentUserIdSeriesAndToken('mobile',tokens[0], tokens[2], function(items){
                if(items.length > 0){
                    if(items[0].token_series === tokens[1]){

                        var timenow =  moment.utc();
                        if(items[0].token_expiry.diff(timenow,'minutes') >  0){
                            sessions.deleteSessionByUserId(tokens[0]);
                            simpleResponse.getResponseWithError(res,401,'','Unauthorized',{});
                        }
                        else{
                            isTokenValid = true;
                        }
                    }

                    if(!isTokenValid){
                        //Theft assumed and remove all sessions
                        sessions.deleteSessionByUserId(tokens[0]);
                        simpleResponse.getResponseWithError(res,401,'','Unauthorized',{});
                    }
                }
            });
            next();
        }
    }
    if(req.session.user){
        next();
    }
    else if(!req.cookies.token){
        simpleResponse.getResponseWithError(res,401,'','Unauthorized',{});
    }
    else if(req.cookies.token){
        isTokenValid = false;
        tokens = req.cookies.token.split(':');
        if(tokens.length === 3){
            sessions.findByUserAgentUserIdSeriesAndToken(req.headers['user-agent'],tokens[0], tokens[2], function(items){
                if(items.length === 0){
                    if(items[0].token_series === tokens[1]){
                        isTokenValid = true;
                        var series =  Math.round((new Date().valueOf() * Math.random())) + '';
                        var newToken = items[0].person_id +':'+ series + ':' + items[0].token_login;
                        items[0].token = newToken;
                        items[0].token_series = series;
                        res.cookie('token', newToken, {maxAge: 10, httpOnly: true});
                        sessions.updateSession(items[0]);
                        req.session.user = items[0];
                    }

                    if(!isTokenValid){
                        //Theft assumed and remove all sessions
                        res.clearCookie('token');
                        sessions.deleteSessionByUserId(tokens[0]);
                        simpleResponse.getResponseWithError(res,401,'','Unauthorized',{});
                    }
                }
            });
        }
    }


    if(!isTokenValid){
        res.clearCookie('token');
        simpleResponse.getResponseWithError(res,401,'','Unauthorized',{});
    }

    next();
}

function createSessionForOAuthUser(req,res,person,auth){
    var series =  Math.round((new Date().valueOf() * Math.random())) + '';
    var login =  Math.round((new Date().valueOf() * Math.random())) + '';

    console.log("user logged in:"+person.id);
    var token = person.id + ':' + series + ':' + login;
    var ua = '';
    if(req.body.mobile && req.body.mobile === 'true'){
        ua = 'mobile';
    }
    else{
        ua =  req.headers['user-agent'];
    }

    var expiryTime =  moment.utc().add('m',30);
    var session = [
        {
            person_id : person.id,
            session_id : req.sessionID,
            user_agent : ua,
            ip : req.header('x-forwarded-for') || req.connection.remoteAddress,
            token : token,
            token_series : series,
            token_login : login,
            login_method : 'local',
            token_expiry :expiryTime
        }];
    sessions.addSession(session);

    if(req.body.mobile && req.body.mobile === 'true'){
        simpleResponse.getResponse(res,200,{token: token, expires:expiryTime, user : person});
    }
    else{
        res.cookie('token', token, {maxAge: 90000, httpOnly: true});
        simpleResponse.getResponse(res,200,{token: token, expires:expiryTime, user : person});
    }
}


var GooglePlaces = require('googleplaces');
var googlePlaces = new GooglePlaces(config.webUISettings.googleApiKey, 'json');
var parameters = {
    location:[42.4763958, -71.1804901],
    types: "Restaurants, Cafe",
    radius: 16000,
    keyword:"Border"
};

app.get('/businesses/search', function(req, res){

    var request = req.query;
    var categories = request.categoryId;
    var limit = (request.limit?request.limit:config.webUISettings.resultSize);
    parameters = { types: categories, radius: request.radius, name:request.query, location:[request.ll]};
    googlePlaces.placeSearch(parameters, function (response) {
        var places = [];
        if(response.results){

            response.results.forEach(function(gPlaces){

                //console.log(gPlaces.name);
                var address = gPlaces.vicinity.split(',');
                if(address.length>1)
                    places.push({name: gPlaces.name, street: address[0], city: address[1] });
                else
                    places.push({name: gPlaces.name, street: address[0], city: "" });
                });

        }
        businesses.findByNameAndAddress(places, res, limit);
    });
});


app.get('/mapitemdetails', function(req, res){
    googlePlaces.placeSearch(parameters, function (response) {
        googlePlaces.placeDetailsRequest({reference:response.results[0].reference}, function (response) {

            simpleResponse.getResponse(res,200,response.result);
        });
    });
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.sendfile(__dirname + '/public/404.html');
});

var port = process.env.PORT || 9980;
app.listen(port);


