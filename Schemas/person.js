/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 04/03/13
 * Time: 9:52 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 02/03/13
 * Time: 8:42 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
//,
    //bcrypt = require(bcrypt),
    //SALT_WORK_FACTOR = 10,
// these values can be whatever you want - we're defaulting to a
// max of 5 attempts, resulting in a 2 hour lock
    //MAX_LOGIN_ATTEMPTS = 5,
    //LOCK_TIME = 2 * 60 * 60 * 1000;

var PersonSchema = new mongoose.Schema({
    email:  {
        type : String,
        required : true,
        unique: true
    },
    business_Id : String,
    first_name: String,
    last_name: String,
    date_of_birth: {
        month: {type: Number},
        day: {type: Number},
        year: {type: Number}
    },
    gender: {
        type: String,
        enum : ['male', 'female' ]
    },
    member_type: {
        type: String,
        enum : ['merchant', 'user' ]
    },
    password: String,
    login_attempts: { type: Number, required: true, default: 0},
    lock_until: { type: Number },
    qr_code: String,
    region: String,
    active : {
        type: Boolean,
        required :true,
        default: true
    },
    location : String,
    address: {               // Array of addresses
            street: String,
            apartment_unit: String,
            postal_code: String,
            city: String,
            state_prov: String,
            state_prov_code : String,
            country: String,
            country_code: String,
            active: Boolean
    },
    business_subscriptions: [{ // Array of subscriptions
        business_id: {
            type: mongoose.Schema.ObjectId,
            ref:'businesses',
            required :true
        },
        business_name: String,
        points: {
            type: Number,
            required :true
        },
        active: {
            type: Boolean,
            required :true,
            default: true
        }
    }],
    tags : [String], // Array of tags
    updated   : { type: Date, default: Date.now },
    created   : Date
});

PersonSchema.pre('save', function (next) {
    if (this.isNew)
        this.created = Date.now();

    this.updated = Date.now();

    next();
});

module.exports = PersonSchema;
