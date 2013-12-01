/**
 * Created with JetBrains WebStorm.
 * User: owais
 * Date: 27/01/13
 * Time: 1:22 PM
 * To change this template use File | Settings | File Templates.
 */
var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('ds049337.mongolab.com', 49337, {auto_reconnect : true}, {w:0, native_parser: false});
var db = new Db('membersq', server, {safe:false});

db.open(function(err, client) {
    if(err) { return console.dir(err); }
    client.authenticate('membersq', 'membersq', function(authErr, success) {
        db.collection('sessions', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'sessions' collection doesn't exist. Creating it with sample data...");
                //populateDB();
            }
            //populateDB();
        });
    });
});


exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving session: ' + id);
    db.collection('sessions', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.findByUserAgentUserIdSeriesAndToken = function(useragent,userid, token, callback){
    db.collection('sessions', function(err, collection){
        collection.find({user_agent: useragent, person_id : userid, token_login : token}).toArray(function(err, items){
            callback(items);
        });
    });
}


exports.findByUserAgentAndSessionId = function(useragent,sessionID,callback){
    console.log(useragent);
    console.log(sessionID);
    db.collection('sessions', function(err, collection){
        collection.find({user_agent: useragent, session_id : sessionID}).toArray(function(err, items){
            callback(items);
        });
    });
}

exports.findAll = function(req, res) {
    db.collection('sessions', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.addSession = function(session) {
    console.log('Adding session: ' + JSON.stringify(session));
    db.collection('sessions', function(err, collection) {
        collection.insert(session, {safe:true}, function(err, result) {
            if (err) {
               // res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                //res.send(result[0]);
            }
        });
    });
}

exports.updateSession = function(req, res) {
    var id = req.params.id;
    var session = req.session;
    console.log('Updating session: ' + id);
    console.log(JSON.stringify(session));
    db.collection('sessions', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, session, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating session: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(session);
            }
        });
    });
}

exports.deleteSession = function(req, res) {
    var id = req.params.id;
    console.log('Deleting session: ' + id);
    db.collection('sessions', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

exports.deleteSessionByUserId = function(userid) {
    db.collection('sessions', function(err, collection) {
        collection.remove({person_id : userid}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
            }
        });
    });
}

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {

    var sessions = [
        {
            person_id : '',
            session_id : '',
            user_agent : '',
            ip : '',
            token :'',
            token_series : '',
            token_expiry : '',
            login_method  : ''
        }];

    db.collection('sessions', function(err, collection) {
        collection.insert(sessions, {safe:true}, function(err, result) {});
    });
};

