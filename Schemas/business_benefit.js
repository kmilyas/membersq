/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 09/05/13
 * Time: 10:18 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');

var BusinessBenefitSchema = new mongoose.Schema({
    business_Id:  {type: mongoose.Schema.ObjectId, ref:'business'},
    terms: String,
    benefits: [{ // list of benefits
        name: {type: String, required:true},
        description: String,
        person_Id:  {type: mongoose.Schema.ObjectId, ref:'person'},
        point_value: {type: Number, required:true},
        active: {
            type:Boolean,
            required:true,
            default: true
        },
        images: [{  // Array of images
            kind: {
                type: String,
                enum: ['thumbnail', 'catalog', 'detail', 'zoom'],
                required: true
            },
            url: { type: String, required: true }
        }]
    }],
    images: [{  // Array of images
        kind: {
            type: String,
            enum: ['thumbnail', 'catalog', 'detail', 'zoom'],
            required: true
        },
        url: { type: String, required: true }
    }]
});

module.exports = BusinessBenefitSchema;

/**
 * Created with JetBrains WebStorm.
 * User: Owais
 * Date: 11/05/13
 * Time: 12:44 PM
 * To change this template use File | Settings | File Templates.
 */
