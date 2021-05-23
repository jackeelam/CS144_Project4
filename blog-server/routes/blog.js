let express = require('express');
let router = express.Router();
let client = require('../db');
const commonmark = require('commonmark');

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

router.get('/:username', async function(req, res){
    console.log("Just username passed with startid = " + req.query.start);

    let blogposts = client.db('BlogServer');
    let username = req.params.username;
    
    //Check if username is passed in parameter and is in db
    let user = await blogposts.collection('Users').findOne({username:username});
    if(username === undefined || user === null){
        res.status(404);
        res.send("No user found");
        return;
    }
    //If optional parameter is passed, make sure that the start id passed is less than or equal to the largest postid
    else if(req.query.start !== undefined ){
        
        let startid = parseInt(req.query.start);
        console.log("startid: " + startid);

        //Max post is in Users collection
        let max_post = await blogposts.collection('Users').findOne({username:username});
        let max_postid = max_post.postid;

        // let max_post = await blogposts.collection('Posts').find({username:username}).sort({postid:-1}).limit(1).toArray();
        // let max_postid = max_post[0].postid;
        console.log("max postid: " + max_postid);

        //If somehow max_post is not found 
        if(max_post === null || isNaN(startid)){
            res.status(404);
            res.send("Start postid is NaN or max_post cannot be found in Users");
        }
        //Or if starid is greater than max_postid
        else if(startid > max_postid){
            res.status(404);
            res.send("Invalid start postid, startid is greater than max postid");
        }
        //Else everything is valid and can display
        else{
            //Retrieve the next 5 posts >= startid. Convert title and body to html and times to date objects
            let post_array = await blogposts.collection('Posts').find( {$and:[{username:username, postid: {$gte: startid} }]} ).sort({postid:1}).limit(5).toArray();
            console.log('post length: ' + post_array.length);
            for(let i = 0; i < post_array.length;i++){
                post_array[i].title = writer.render(reader.parse(post_array[i].title));
                post_array[i].body = writer.render(reader.parse(post_array[i].body));
                post_array[i].created = new Date(post_array[i].created).toString();
                post_array[i].modified = new Date(post_array[i].modified).toString();
            }
            //Check if there are more than 5 posts to display. If there is, add next link and set startid
            let has_next = false; 
            let posts_after_start = await blogposts.collection('Posts').find( {$and:[{username:username, postid: {$gte: startid} }]} ).sort({postid:1}).toArray();
            let next_start_id = 0;
            if(posts_after_start.length > 5){
                has_next = true;
                next_start_id = posts_after_start[5].postid; //get the 6th post's postid
                console.log('More than 5 posts given start');
            }
            res.status(200);
            res.render('post', {start_id: next_start_id, has_next:has_next, username:username, posts:post_array});

        }
    }
    //if startid has not been passed
    else{
        console.log("Just username passed without startid");

        //Retrieve the first 5 posts from user
        let post_array = await blogposts.collection('Posts').find({username:username}).sort({postid:1}).limit(5).toArray();
        //idk if u have to check if user has no posts
        res.status(200);
        for(let i = 0; i < post_array.length;i++){
            post_array[i].title = writer.render(reader.parse(post_array[i].title));
            post_array[i].body = writer.render(reader.parse(post_array[i].body));
            post_array[i].created = new Date(post_array[i].created).toString();
            post_array[i].modified = new Date(post_array[i].modified).toString();
        }
        //Now check if there are more than 5 posts. If there is, set next link and startid
        let p = await blogposts.collection('Posts').find({username:username}).toArray();
        let num_posts = p.length;
        let has_next = false; 
        
        if(num_posts > 5){
            has_next = true;
            let start_id = p[5].postid; //get the 6th post's postid
            res.render('post', {start_id: start_id, has_next:has_next, username:username, posts:post_array});
            console.log('More than 5 posts');
        }
        else{
            //post.ejs, passing json object of posts
            res.render('post', {posts:post_array, has_next:has_next});
        }
        
    }

});

//Requires username and postid
router.get('/:username/:postid', async function(req, res){
    console.log("Passed in username and postid");
    let has_next = false;
    let username = req.params.username;
    let postid = parseInt(req.params.postid);

    //Find specific postid given username
    let blogposts = client.db('BlogServer');
    let post = await blogposts.collection('Posts').findOne( {$and:[{username:username, postid: postid}]});
    //Input validation
    if(post === null || isNaN(postid) || username === undefined){
        res.status(404);
        res.send("No post found");
        return;
    }
    //Else we found the post
    else{
        res.status(200);
        post.title = writer.render(reader.parse(post.title));
        post.body = writer.render(reader.parse(post.body));
        post.created = new Date(post.created).toString();
        post.modified = new Date(post.modified).toString();
        const posts = [post];
        //post.ejs, passing json object of posts
        res.render('post', {posts:posts, has_next:has_next});
    }
});

module.exports = router;
