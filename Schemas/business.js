var mongoose = require('mongoose');

var BusinessSchema = new mongoose.Schema({
    contact_email : {type: String, required:true, lowercase: true, trim: true},
    name: {type: String, required:true, index : {unique : true}},
    active:{type: Boolean, required:true, default: true},
    phone: String,
    description: { type: String, required: true, default: '' },
    images: [{  // Array of images
        kind: {
            type: String,
            enum: ['thumbnail', 'catalog', 'detail', 'zoom'],
            required: true
        },
        url: { type: String, required: true }
    }],
    locations : [{ // Array of store locations
        contact_email : String,
        city: { type: String, required: true, default: '' },
        country: String,
        pos: {
            log : {type: Number, required : true},
            lat : {type: Number, required : true}
        },
        loc: { type: [Number], index: '2d'},
        country_code : String,
        postal_code : String,
        state_prov: String,
        state_prov_code :String,
        tel: String,
        street: String,
        unit_suite: String
    }],
    account_string :[{type: String}],
    account_managers :[{type: mongoose.Schema.ObjectId, ref:'person'}],
    loyalty_members :[{     // list of loyalty members
        person_Id:  {type: mongoose.Schema.ObjectId, ref:'person'},
        points: Number,
        active: {type: Boolean, default: true}
    }]
    
});

module.exports = BusinessSchema;

