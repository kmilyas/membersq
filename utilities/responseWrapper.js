/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 10/03/13
 * Time: 6:36 PM
 * To change this template use File | Settings | File Templates.
 */

exports.getResponse = function(res,code, membersqObject){
    if(!membersqObject)
        membersqObject = {};
    var resp = {
        meta :{
            code: code
        },
        response: membersqObject
    };
    res.send(code, JSON.stringify(resp));
}

exports.getResponseWithError = function(res,code,error, errorDescription, membersqObject){
    if(!membersqObject)
        membersqObject = {};
    if(!error)
        error = "";
    if(!errorDescription)
        errorDescription = "";
    var resp = {
        meta :{
            code: code,
            errorType : error,
            error_description : errorDescription
        },
        response: membersqObject
    };

    res.send(200, JSON.stringify(resp));
}

