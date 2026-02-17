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

  onSearchSubmit() {
    this.searchService.setSearchQuery(this.searchQuery);
  }

  onAccountClick() {
    console.log('Account button clicked');
  }

}
