﻿var mongoose = require('mongoose');
var bcrypt = require('bcrypt-node');

// define the schema for our user model
var userSchema = mongoose.Schema({
    general: {
        created      : Date,
        lastLogin    : Date,
        username     : String
        //lovedSongs   : []
        //lovedStations : []
        //friends      : []
    },
    local            : {
        email        : String,
        password     : String,
        name         : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);