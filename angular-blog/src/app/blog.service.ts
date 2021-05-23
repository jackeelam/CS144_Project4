/* Copyright: Junghoo Cho (cho@cs.ucla.edu) */
/* This file was created for CS144 class at UCLA */
import { JsonPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Post } from './post';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  async fetchPosts(username: string): Promise<Post[]> {
    let response = await fetch(`/api/posts?username=${username}`);
    return response.json();
  }
    
  setPost(username: string, p: Post): Promise<Post> {

    return new Promise(async (resolve, reject) => {
        let response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'username': username,
            'postid': p.postid,
            'title': p.title,
            'body': p.body,
          })
        });

        //if successfull
        if(response.ok){
          console.log("Saved post in db " + JSON.stringify(response));
          resolve(response.json());
        }
        else{
          reject(new Error(String(response.status)));
        }
        
      });
    }

    deletePost(username: string, postid: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let response = await fetch(`/api/posts?username=${username}&postid=${postid}`, {
              method: 'DELETE',
            });

            if (response.ok) {
                resolve();
            } else {
                reject(new Error(String(response.status)));
            }
        });
    }
}
