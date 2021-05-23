import { Component } from '@angular/core';
import { Post } from './post';
import { POSTS } from './fake_posts';
import { BlogService } from './blog.service';
import * as cookie from 'cookie';

enum AppState { List, Edit, Preview };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-blog';
  posts: Post[];
  // posts = POSTS.sort(function(a, b) { return a.postid - b.postid; }); //Set posts to be from the fake posts array
  currentPost:Post;
  AppStateEnum = AppState; //to use in the template
  appState: AppState; //enum
  cookies: { [key: string]: string; } = cookie.parse(document.cookie);
  username: string;

  // jwt = parseJWT(this.cookies.jwt);
  // username = this.jwt.usr;

  //Fetch all the initial posts
  constructor(private blogService: BlogService) {
    if(this.cookies.jwt !== undefined){
      console.log("jwt cookie passed in angular");
      let jwt = parseJWT(this.cookies.jwt);
      this.username = jwt.usr;

      console.log("cookie: " + this.username);
      blogService.fetchPosts(this.username)
      .then( (posts) => 
        {
        this.posts = posts.sort(function(a, b) { return a.postid - b.postid; }); 
        this.onHashChange(); //in case of deep link
      })
        .catch(err => console.log(err));

      
      window.addEventListener("hashchange", () => this.onHashChange());
    }
    
    
    // this.onHashChange();
    //Initially look at the window hash to determine current post and appState
  }

  //Ensure that appState and currentPost are set to appropriate values given fragment id
  onHashChange(){
    console.log("Hash: " + window.location.hash);
    let parsed_hash_arr = window.location.hash.split('/');
    console.log(parsed_hash_arr);
    //If we get list url
    if(window.location.hash === '#/'){
      console.log('List');
      this.appState = AppState.List;
    }
    //Else edit or preview
    else if(parsed_hash_arr.length == 3 && parsed_hash_arr[0] === '#'){
      let postid = parseInt(parsed_hash_arr[2]);

      //If not valid postid, don't do anything
      if(isNaN(postid)){
        console.log("Not a valid postid");
      }
      //New post will set appState to Edit, but current post is a new post
      else if(parsed_hash_arr[1] === 'edit' && postid === 0){
        console.log("New Post");
        const post:Post = new Post();
        this.currentPost = post;
        this.appState = AppState.Edit;
      }
      //Edit url but numeric postid
      else if(parsed_hash_arr[1] === 'edit'){
        //If you find postid, then change appstate to edit. Else back to list
        let i = 0;
        for(i = 0; i < this.posts.length; i++){
          if(postid === this.posts[i].postid){
            this.currentPost = this.posts[i];
            this.appState = AppState.Edit;
            break;
          }
        }
        //Cannot find postid, just display list
        if(i === this.posts.length){
          this.appState = AppState.List;
        }
        console.log("Edit");
      }
      //Preview url
      else if(parsed_hash_arr[1] === 'preview'){
        let i = 0;
        for(i = 0; i < this.posts.length; i++){
          if(postid === this.posts[i].postid){
            this.currentPost = this.posts[i];
            this.appState = AppState.Preview;
            break;
          }
        }
        //Cannot find postid, just display list
        if(i === this.posts.length){
          this.appState = AppState.List;
        }
        console.log("Preview");
      }
    }
  }
  //List component handlers
  openPostHandler(post: Post){
    window.location.hash = `#/edit/${post.postid}`;
    console.log("Opened post: " + post.title + " " + post.postid);
    // this.currentPost = post;
    // this.appState = AppState.Edit;
  }
  newPostHandler(){
    console.log("New Post!");
    window.location.hash = `#/edit/0`;
    // const post:Post = new Post();
    // this.appState = AppState.Edit;
    // this.currentPost = post;
  }

  //Edit component handlers. Should call REST api to do the actions, but will do mock for now
  savePostHandler(post: Post){
    console.log("Saving post jfalw;kejf");
    
    
    //in database, add new post if postid is 0 or update existing
    this.blogService.setPost(this.username, post).then(ret_post => { 
      if(post.postid === 0 ){
        this.currentPost = post;
        this.currentPost.created = ret_post.created;
        this.currentPost.modified = ret_post.modified;
        this.currentPost.postid = ret_post.postid;
      }
      else{
        this.currentPost = post;
        this.currentPost.modified = ret_post.modified;
      }
      console.log("Saved postid " + this.currentPost.postid);
    })
    .catch(err => console.log(err));
    this.blogService.fetchPosts(this.username).then((ret_posts) => 
    { 
      this.posts = ret_posts.sort(function(a, b) { return a.postid - b.postid; });
      window.location.hash = `#/edit/${this.currentPost.postid}`;
    })
      .catch(err => console.log(err));
    // window.location.hash = `#/edit/${this.currentPost.postid}`;
    // this.appState = AppState.Edit;
  }

  //On delete should not show edit or preview
  deletePostHandler(post: Post){

    // this.appState = AppState.List;
    window.location.hash = `#/`;
    console.log("Delete post");
    if(post.postid !== 0){
      this.blogService.deletePost(this.username, post.postid).catch(err => console.log(err));
      this.blogService.fetchPosts(this.username).then((ret_posts) => 
      { 
        this.posts = ret_posts.sort(function(a, b) { return a.postid - b.postid; });
      })
        .catch(err => console.log(err));
    }
    
  }

  previewPostHandler(post: Post){
    window.location.hash = `#/preview/${post.postid}`;
    // this.appState = AppState.Preview;
    console.log("Preview post");
    // this.currentPost = post;
  }

  // event handlers for preview component events
  editPostHandler(post: Post){
    console.log("Edit post");
    window.location.hash = `#/edit/${post.postid}`;
    // this.currentPost=post;
    // this.appState = AppState.Edit;
  }

}

function parseJWT(token) 
{
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
}
