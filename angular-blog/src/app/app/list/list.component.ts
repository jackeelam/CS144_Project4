import { Component, OnInit } from '@angular/core';
import { Post } from '../post';
import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})

// List component should:
// 1. It displays all blog posts by the user.
// 2. It allows the user to “click” on a displayed post, so that they can start editing it.
// 3. It displays a “New Post” button, so that the user can start writing a new post.

export class ListComponent implements OnInit {
  @Input() posts: Post[]; //Will receive all the posts to display from app component parent
  @Output() openPost = new EventEmitter<Post>(); //When a post is clicked, emit an openPost event
  @Output() newPost = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }

}
