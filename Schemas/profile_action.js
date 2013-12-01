/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 13/03/13
 * Time: 7:37 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var personSchema = require('../Schemas/person.js');

var ProfileActionsSchema = new mongoose.Schema({
    person_id: mongoose.Schema.ObjectId, ref:'person',
    personObject: personSchema,
    date : Date
});

module.exports = ProfileActionsSchema;
