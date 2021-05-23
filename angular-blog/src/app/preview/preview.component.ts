import { Component, OnInit } from '@angular/core';
import { Parser, HtmlRenderer } from 'commonmark';
import { Post } from '../post';
import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnInit {
  @Input() post: Post;
  @Output() editPost = new EventEmitter<Post>();

  reader = new Parser();
  writer = new HtmlRenderer();

  constructor() { }

  ngOnInit(): void {

  }

  convertMarkdownHtml(markdown: string): string{
    
    return this.writer.render(this.reader.parse(markdown));
    
  }

}
