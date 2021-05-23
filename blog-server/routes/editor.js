var express = require('express');
const { JsonWebTokenError } = require('jsonwebtoken');
var router = express.Router();
const jwt = require('jsonwebtoken');
const { ReplSet } = require('mongodb/lib/core');
const jwt_key = "C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c";
let client = require('../db');

router.get('/', async function(req, res, next) {

    console.log("wtf bro");
    //Check if there are cookies
    let cookie = req.cookies.jwt;
    console.log("Cookie: " + JSON.stringify(cookie));
    if(cookie === undefined){
        res.redirect(302, "/login?redirect=/editor/");
        console.log("No cookie passed, redirecting...");
    }
    else{
        try{
            jwt.verify(cookie, jwt_key);
            console.log("Good cookie");
            next();
        }
        catch(err){
            console.log("Bad cookie");
            res.redirect(302, "/login?redirect=/editor/");
        }
    }

});

module.exports = router;
