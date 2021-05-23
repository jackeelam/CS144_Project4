var express = require('express');
const { JsonWebTokenError } = require('jsonwebtoken');
var router = express.Router();
const jwt = require('jsonwebtoken');
const { ReplSet } = require('mongodb/lib/core');
const jwt_key = "C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c";
let client = require('../db');

/* GET all user's posts or specific postid. Username must be passed in the params*/
router.get('/posts', async function(req, res, next) {
    let username = req.query.username;
    let postid = parseInt(req.query.postid);

    //Check if there are cookies
    let cookie = req.cookies.jwt;
    console.log("Cookie: " + JSON.stringify(req.cookies));
    console.log("Cookie 2: " + cookie);
    if(cookie === undefined){
        res.status(401);
        console.log("No cookie passed");
        res.send("No cookie was passed");
    }
    
    else{
        try{
            let decoded = jwt.verify(cookie, jwt_key);
            let decoded_username = decoded.usr;
            
            if(decoded_username !== username){
                console.log("Decoded cookie username:" + decoded.usr);
                console.log("Path username:" + username);
                res.status(401);
                res.send("Decoded cookie username and path username are not the same");
                console.log("Decoded cookie username and path username are not the same");
            }
            
            //DB stuff
            else{
                
                let blogposts = client.db('BlogServer');

                //If invalid postid was passed or username was not passed
                if((req.query.postid !== undefined && isNaN(postid)) || username === undefined){
                    res.status(400);
                    res.send("Invalid postid or no username");
                }
                //Now retrieve all the posts by user if no postid was passed
                else if(req.query.postid === undefined){
                    let user_row = await blogposts.collection('Users').findOne({username:username});
                    let posts_array = await blogposts.collection('Posts').find({username:username}).toArray();
                    
                    res.type('application/json');
                    res.status(200);
                    if(posts_array.length === 0 || user_row === null){
                        res.json([]);
                    }
                    else{
                        res.json(posts_array);
                    }
                }
                //Retrieve user and postid
                else{
                    let post = await blogposts.collection('Posts').findOne({ $and:[{username:username}, {postid:postid}] });
                    if(post === null){
                        res.status(404);
                        res.send("Could not find user's specific post!");
                    }
                    else{
                        res.status(200);
                        res.json(post);
                    }
                }
            }
            
        }
        catch(err){
            console.log("Bad cookie" + err);
            res.status(401);
        }
    }
    
  
});

/* DELETE user post */
router.delete('/posts', async function(req, res, next) {
    let username = req.query.username;
    let postid = parseInt(req.query.postid);

    //Check if there are cookies
    let cookie = req.cookies.jwt;
    console.log("Cookie: " + JSON.stringify(req.cookies));
    console.log("Cookie 2: " + cookie);
    if(cookie === undefined){
        res.status(401);
        console.log("No cookie passed");
        res.send("No cookie was passed");
    }
    
    else{

        try{
            let decoded = jwt.verify(cookie, jwt_key);
            let decoded_username = decoded.usr;
            
            if(decoded_username !== username){
                console.log("Decoded cookie username:" + decoded.usr);
                console.log("Path username:" + username);
                res.status(401);
                res.send("Decoded cookie username and path username are not the same");
                console.log("Decoded cookie username and path username are not the same");
            }
            //Added for missing postid
            else if(isNaN(postid)){
                res.status(400);
                res.send("Did not pass postid or postid is not integer");
            }
            else{
                let blogposts = client.db('BlogServer');

                let post = await blogposts.collection('Posts').findOne({ $and: [{username:username}, {postid:postid}] });
                if(post === null){
                    res.status(404);
                    res.send("Could not find post to delete");
                }
                else{
                    let deleted = await blogposts.collection('Posts').deleteOne({ $and: [{username:username}, {postid:postid}] });
                    res.status(204);
                    res.send("Successfully deleted");
                    //console.log("deleted returns: " + JSON.stringify(deleted.result));
                }
            }
            

        }

        catch(err){
            console.log("Bad cookie" + err);
            res.status(401);
        }
        
        
    }
    

  });

  /* POST home page. */
router.post('/posts', async function(req, res, next) {
    let username = req.body.username;
    let postid = parseInt(req.body.postid);
    let title = req.body.title;
    let body = req.body.body;

    //Check if there are cookies
    let cookie = req.cookies.jwt;
    console.log("Cookie: " + JSON.stringify(req.cookies));
    console.log("Cookie 2: " + cookie);
    if(cookie === undefined){
        res.status(401);
        console.log("No cookie passed");
        res.send("No cookie was passed");
    }
    
    else{
        try{
            let decoded = jwt.verify(cookie, jwt_key);
            let decoded_username = decoded.usr;
            
            //Invalid cookie
            if(decoded_username !== username){
                console.log("Decoded cookie username:" + decoded.usr);
                console.log("Path username:" + username);
                res.status(401);
                res.send("Decoded cookie username and path username are not the same");
                console.log("Decoded cookie username and path username are not the same");
            }
            //Invalid user input
            else if(isNaN(postid) || username === undefined || title === undefined || body === undefined){
                res.status(400);
                res.send("Did not specify all the required parameters in body");
            }
            
            //DB stuff
            else{
                let blogposts = client.db('BlogServer');
                if(postid === 0){
                    let created = Date.now();
                    let modified = Date.now();
                    let user_row = await blogposts.collection('Users').findOne({username:username});
                    //Check if user_row is null?
                    let maxid = user_row.maxid;
                    let update_row = await blogposts.collection('Users').updateOne({username:username}, {$set: {maxid: (maxid + 1)}});
                    let insert_row = await blogposts.collection('Posts').insertOne({postid: (maxid+1), username:username, created:created, modified:modified, title:title, body:body});
                    res.status(201);
                    res.json({postid:maxid+1, created:created, modified:modified});
                }
                else if(postid > 0){
                    let modified = Date.now();
                    
                    let update = await blogposts.collection('Posts').updateOne({ $and:[{username:username}, {postid:postid}] }, {$set: {modified: modified, title:title, body:body}});
                    console.log(JSON.stringify(update));
                    //if successful
                    if(update.result.nModified === 1){
                        res.status(200);
                        res.json({modified:modified});
                    }
                    //Check if update was unsucessful
                    else{
                        res.status(404);
                        res.send("Could not update");
                    }
                }
            }
        }
        catch(err){
            console.log("Bad cookie" + err);
            res.status(401);
        }

    }
  });

module.exports = router;
