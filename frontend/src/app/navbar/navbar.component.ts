import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfig } from '../config/app.config';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  title = AppConfig.title;
  searchQuery = '';

  constructor(private searchService: SearchService) {}

  onSearchSubmit(event: Event) {
    event.preventDefault();  // prevent page reload
    console.log('Search submitted:', this.searchQuery);
    this.searchService.setSearchQuery(this.searchQuery);
  }

  onAccountClick() {
    console.log('Account button clicked');
  }

}
