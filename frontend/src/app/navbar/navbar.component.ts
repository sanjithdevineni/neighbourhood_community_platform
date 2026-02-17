import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  appTitle = 'Neighbourhood Connect';

  onSearch(event: Event) {
    event.preventDefault();
    console.log('Search triggered');
  }

}
