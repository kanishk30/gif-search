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
  isResultPresent = true;

  constructor(private httpClient: HttpClient) {}
  @ViewChild('searchInput') searchInput: ElementRef;

  ngOnInit() {
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        // Get the value
        map((event: any) => event.target.value),
        // Trigger search only for more than one character
        filter(result => result.length > 1),
        // Trigger API request only after 300 milliseconds
        debounceTime(300),
        // Check if current search term is different from previous one
        distinctUntilChanged()
      )
      .subscribe((text: string) => {
        this.searchGetCall(text).subscribe(
          next => {
            // trim is used to filter out the result having no title
            this.searchResults = next['data'].filter(e => e.title.trim());
            this.isSearchingComplete = true;
            this.isSearching = false;
            if (next['data'].length === 0) {
              this.isResultPresent = false;
            } else {
              this.isResultPresent = true;
              next['data'].forEach(element => {
                const object = { gif: '', static: '', url: '', isGIF: true, isLiked: false, id: '' };
                object.static = element.images['480w_still'].url;
                object.gif = element.images['downsized_medium'].url;
                object.url = object.gif;
                object.id = element.id;
                object.isLiked = localStorage.getItem(object.id) === 'true';
                this.imageData.push(object);
              });
            }
          },
          error => {
            this.isSearching = false;
            this.isSearchingComplete = true;
          }
        );
      });
  }

  initialize() {
    // Like a refresh, when clicked on logo
    this.search = '';
    this.searchResults = [];
    this.displayResults = false;
    this.image = [];
    this.imageData = [];
    this.fetchOne = false;
    this.fetchAll = false;
    this.isSearching = false;
    this.isSearchingComplete = false;
    this.isResultPresent = true;
  }

  searchGetCall(term: string, limit = this.limit) {
    // API request based on search call
    this.imageData.length = 0;
    this.image.length = 0;
    if (term === '') {
      return of([]);
    }
    this.isSearching = true;
    this.isSearchingComplete = false;
    return this.httpClient.get(
      `http://api.giphy.com/v1/gifs/search?api_key=SqTgqUiODX49u9n09GE16RmEVuATQM2Q&q=${term}&limit=${Number(
        limit
      )}`
    );
  }

  searchAll() {
    // When clicked on search icon, request all images
    this.fetchOne = false;
    this.fetchAll = true;
    this.displayResults = false;
  }

  selectOne(data, index) {
    // Select from the list to fetch image
    this.image.length = 0;
    this.fetchOne = true;
    this.fetchAll = false;
    this.image.push(this.imageData[index]);
    this.toggleList();
  }

  replaceImage(index, source) {
    // To convert GIF to JPG and vice-versa
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
    // Show hide the list
    if (this.search) {
      this.displayResults = !this.displayResults;
    }
  }

  searching() {
    // On key press, show list of suggestions
    this.displayResults = true;
    this.imageData = [];
  }

  handleLimitChanged(limit) {
    // On changing the limits
    if (!this.search) {
      return;
    }
    this.searchGetCall(this.search, limit).subscribe(
      next => {
        this.searchResults = next['data'];
        this.isSearchingComplete = true;
        this.isSearching = false;
        if (next['data'].length === 0) {
          this.isResultPresent = false;
        } else {
          this.isResultPresent = true;
          next['data'].forEach(element => {
            const object = { gif: '', static: '', url: '', isGIF: true, isLiked: false, id: '' };
            object.static = element.images['480w_still'].url;
            object.gif = element.images['downsized_medium'].url;
            object.url = object.gif;
            object.id = element.id;
            object.isLiked = localStorage.getItem(object.id) === 'true';
            this.imageData.push(object);
          });
          this.searchAll();
        }
      },
      error => {
        this.isSearching = false;
        this.isSearchingComplete = true;
      }
    );
  }

  btnClicked(data) {
    data.isLiked = !data.isLiked;
    localStorage.setItem(data.id, data.isLiked);
  }
}
