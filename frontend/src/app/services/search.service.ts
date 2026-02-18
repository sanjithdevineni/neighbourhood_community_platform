import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  searchQuery = signal('');

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

}
