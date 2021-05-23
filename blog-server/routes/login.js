var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
let client = require('../db');
const jwt = require('jsonwebtoken');
const jwt_key = "C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c";
const jwt_header = {
    "alg": "HS256",
    "typ": "JWT"
  };


/* GET login page. */
router.get('/', function(req, res, next) {
    //Return HTML page form with 2 input elements username and password
    //Once user presses submit, page shoud issue POST request given optional redirect
    let redirect = req.query.redirect;
    let has_redirect = false;
    if(redirect!== undefined){
        has_redirect = true;
        console.log("Redirect: " + redirect);
    }
    res.render('login', { redirect: redirect, has_redirect:has_redirect });
});

/* POST login page. */
router.post('/', async function(req, res, next) {
    let redirect = req.body.redirect;
    let has_redirect = false;
    
    //Check if redirect was passed
    if(redirect!== undefined){
        has_redirect = true;
        console.log("Redirect in POST :" + redirect);
    }

    let blogposts = client.db('BlogServer');

    //Get username and password from POST body
    let username = req.body.username;
    let password = req.body.password;

    console.log("Body:" + JSON.stringify(req.body));
    console.log("Username:" + username);
    console.log("Password:" + password);

    //If username and password are not passed 
    if(username === undefined || password === undefined){
        res.status(401);
        res.send("Did not pass username and password");
    }
    //Both username and password are passed
    else{
        //Check if username and password(after encrytpion has a match)
        let user_password_combo = await blogposts.collection('Users').findOne({username:username});
        //If user is not found in db
        if(user_password_combo === null){
            res.status(401);
            res.render('login', { redirect: redirect, has_redirect:has_redirect });
        }
        //Else they are and we must check the password
        else{
            
            //Set token if the passwords match. compareSync(unhashed password input, hashed input)
            if(bcrypt.compareSync(password, user_password_combo.password)){
                console.log("Password matches!");

                //Expiration is 2 hours from now in seconds
                let expiration = (Math.floor(Date.now()/1000)) + (2*60*60);
                const jwt_payload = {
                    "exp": expiration,
                    "usr": username
                  }

                //Must set the cookie before sending anything!
                var token = jwt.sign(jwt_payload, jwt_key, {header: jwt_header});
                res.cookie('jwt', token);

                if(has_redirect === false){
                    res.status(200);
                    res.send("Authentication successful, no redirect!");
                }
                else{
                    console.log("Password matches and will redirect");
                    res.redirect(redirect);
                }
            }
            //else send login page again
            else{
                console.log("Passwords did not match");
                res.status(401);
                res.render('login', { redirect: redirect, has_redirect:has_redirect });
            }
        }
    }
});

module.exports = router;

