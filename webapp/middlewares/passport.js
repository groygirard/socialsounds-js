﻿var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('../models/user');
var configAuth = require('../config/auth');

module.exports = function (passport) {
    
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    
    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, email, password, done) {
        
        // asynchronous
        process.nextTick(function () {
            
            email = email.toLowerCase();
            //  Whether we're signing up or connecting an account, we'll need
            //  to know if the email address is in use.
            User.findOne({ 'local.email': email }, function (err, existingUser) {
                
                // if there are any errors, return the error
                if (err)
                    return done(err);
                
                // check to see if there's already a user with that email
                if (existingUser) {
                    return done(null, false, req.session.sessionFlash = {
                        type: 'invalid_credentials_error',
                        message: 'Email is already registered.'
                    });
                }
                   
                //  If we're logged in, we're connecting a new local account.
                if (req.user) {
                    var user = req.user;
                    
                    // update the current users general informations
                    user.general.lastLogin = new Date();
                    // update the current users local informations
                    user.local.email = email;
                    user.local.password = user.generateHash(password);
                    user.save(function (err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                } 
                //  We're not logged in, so we're creating a brand new user.
                else {
                    // create the user
                    var newUser = new User();
                    
                    // set all the current user general informations
                    newUser.general.created = new Date();
                    newUser.general.lastLogin = new Date();
                    newUser.general.username = email;
                    // set all the current user local informations
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    
                    newUser.save(function (err) {
                        if (err)
                            throw err;
                        
                        return done(null, newUser);
                    });
                }

            });
        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function (req, email, password, done) { // callback with email and password from our form
        
        email = email.toLowerCase();
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' : email }, function (err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            
            // if no user is found or password is invalid, return the message
            if (!user || !user.validPassword(password))
                return done(null, 
                            false, 
                            req.session.sessionFlash = {
                                type: 'invalid_credentials_error',
                                message: 'Invalid email or password.'
                }); 
            
            // all is well, return successful user
            return done(null, user);
        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
        
        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true,
        profileFields: ['id', 'emails', 'name']

    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {
        
        // asynchronous
        process.nextTick(function () {

            if (!req.user) {

                // find the user in the database based on their facebook id
                User.findOne({ 'facebook.id' : profile.id }, function (err, user) {
                    
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);
                    
                    // if the user is found, then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        var newUser = new User();
                        
                        // set all the current users general informations
                        newUser.general.created = new Date();
                        newUser.general.lastLogin = new Date();
                        if (!newUser.general.username) {
                            newUser.general.username = profile.name.givenName + ' ' + profile.name.familyName;;
                        }
                        // set all of the facebook information in our user model
                        newUser.facebook.id = profile.id; // set the users facebook id                   
                        newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                        newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                        if (profile.emails) {
                            newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                        }
                        
                        // save our user to the database
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            
                            // if successful, return the new user
                            return done(null, newUser);
                        });
                    }

                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session
                
                // update the current users general informations
                user.general.lastLogin = new Date();
                // update the current users facebook credentials
                user.facebook.id = profile.id;
                user.facebook.token = token;
                user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = profile.emails[0].value;
                
                // save the user
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });

    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({
        
        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true

    },
    function (req, token, refreshToken, profile, done) {
        
        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Twitter
        process.nextTick(function () {

            if (!req.user) {
                
                User.findOne({ 'twitter.id' : profile.id }, function (err, user) {
                    
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);
                    
                    // if the user is found then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser = new User();
                        
                        // set all the current users general informations
                        newUser.general.created = new Date();
                        newUser.general.lastLogin = new Date();
                        if (!newUser.general.username) {
                            newUser.general.username = profile.displayName;
                        }
                        // set all of the user data that we need
                        newUser.twitter.id = profile.id;
                        newUser.twitter.token = token;
                        newUser.twitter.username = profile.username;
                        newUser.twitter.displayName = profile.displayName;
                        
                        // save our user into the database
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            } else {
                // user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session
                
                // update the current users general informations
                user.general.lastLogin = new Date();
                // update the current users twitter credentials
                user.twitter.id = profile.id;
                user.twitter.token = token;
                user.twitter.username = profile.username;
                user.twitter.displayName = profile.displayName;

                // save the user
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });

    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
        
        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true

    },
    function (req, token, refreshToken, profile, done) {
        
        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function () {
            
            if (!req.user) {
                
                // try to find the user based on their google id
                User.findOne({ 'google.id' : profile.id }, function (err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {
                        
                        // if a user is found, log them in
                        return done(null, user);
                    } else {
                        // if the user isnt in our database, create a new user
                        var newUser = new User();
                        
                        // set all the current users general informations
                        newUser.general.created = new Date();
                        newUser.general.lastLogin = new Date();
                        if (!newUser.general.username) {
                            newUser.general.username = profile.displayName;
                        }
                        // set all of the relevant information
                        newUser.google.id = profile.id;
                        newUser.google.token = token;
                        newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value; // pull the first email
                        
                        // save the user
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            } else {
                // user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session
                
                // update the current users general informations
                user.general.lastLogin = new Date();
                // update the current users google credentials
                user.google.id = profile.id;
                user.google.token = token;
                user.google.name = profile.displayName;
                user.google.email = profile.emails[0].value;
                
                // save the user
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });

    }));
};