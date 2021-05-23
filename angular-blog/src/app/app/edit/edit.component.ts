import { Component, OnInit } from '@angular/core';
import { Post } from '../post';
import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})

// The user should be able to edit the title and body of the post.
// When the user clicks on the “save” button, the post should be updated/saved at the server.
// When the user clicks on the “delete” button, the post should be deleted from the server and the displayed list.
// When the user clicks on the “preview” button, the “preview view” should open.

export class EditComponent implements OnInit {
  @Input() post:Post = new Post(); //Will listen for a post when user clicks on a post 
  @Output() savePost = new EventEmitter<Post>(); 
  @Output() deletePost = new EventEmitter<Post>(); 
  @Output() previewPost = new EventEmitter<Post>(); 
  
  constructor() { }

  ngOnInit(): void {
  }

}
