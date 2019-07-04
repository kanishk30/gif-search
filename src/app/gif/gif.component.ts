import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  NgModule
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { Subject, of, fromEvent } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter
} from 'rxjs/operators';
@Component({
  selector: 'app-gif',
  templateUrl: './gif.component.html',
  styleUrls: ['./gif.component.scss']
})
export class GifComponent implements OnInit {
  
  search = '';
  imageData = [];
  image = [];
  isGIF = true;
  searchResults = [];
  fetchOne = false;
  fetchAll = false;
  displayResults = false;
  searchTextChanged = new Subject<string>();
  limits = [3, 6, 9, 12, 15, 20, 25];
  limit = 3;
  isSearching = false;
  isSearchingComplete = false;
  constructor(private httpClient: HttpClient) {}
  @ViewChild('searchInput') searchInput: ElementRef;

  ngOnInit() {
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(result => result.length > 1),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((text: string) => {
        this.searchGetCall(text).subscribe(
          next => {
            // trim is used to filter out the result having no title
            this.searchResults = next['data'].filter(e => e.title.trim());
            this.isSearchingComplete = true;
            this.isSearching = false;
            next['data'].forEach(element => {
              const object = { gif: '', static: '', url: '', isGIF: true };
              object.static = element.images['480w_still'].url;
              object.gif = element.images['downsized_medium'].url;
              object.url = object.gif;
              this.imageData.push(object);
            });
          },
          error => {
            this.isSearching = false;
            this.isSearchingComplete = true;
          }
        );
      });
  }

  searchGetCall(term: string, limit = this.limit) {
    this.imageData.length = 0;
    this.image.length = 0;
    if (term === '') {
      return of([]);
    }
    this.isSearching = true;
    this.isSearchingComplete = false;
    return this.httpClient.get(
      `http://api.giphy.com/v1/gifs/search?api_key=SqTgqUiODX49u9n09GE16RmEVuATQM2Q&q=${term}&limit=${Number(limit)}`
    );
  }

  searchAll() {
    this.fetchOne = false;
    this.fetchAll = true;
    this.displayResults = false;
  }

  selectOne(data, index) {
    this.image.length = 0;
    this.fetchOne = true;
    this.fetchAll = false;
    this.image.push(this.imageData[index]);
    this.toggleList();
  }

  replaceImage(index, source) {
    let arr = [];
    arr = source === 'one' ? [...this.image] : [...this.imageData];
    const tempURL = arr[index]['static'];
    const originalURL = arr[index]['gif'];
    if (arr[index].isGIF) {
      arr[index]['url'] = tempURL;
      arr[index].isGIF = false;
    } else {
      arr[index]['url'] = originalURL;
      arr[index].isGIF = true;
    }
  }

  toggleList() {
    if (this.search) {
      this.displayResults = !this.displayResults;
    }
  }

  searching() {
    this.displayResults = true;
  }

  handleLimitChanged(limit) {
    if (!this.search) { return };
   this.searchGetCall(this.search, limit).subscribe(
    next => {
      this.searchResults = next['data'];
      this.isSearchingComplete = true;
      this.isSearching = false;
        next['data'].forEach(element => {
          const object = { gif: '', static: '', url: '', isGIF: true };
          object.static = element.images['480w_still'].url;
          object.gif = element.images['downsized_medium'].url;
          object.url = object.gif;
          this.imageData.push(object);
        });
        this.searchAll()
    },
    error => {
      this.isSearching = false;
      this.isSearchingComplete = true;
    }
    );
  }
}
