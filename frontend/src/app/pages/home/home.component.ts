import { Component } from '@angular/core';
import { AnnouncementListComponent } from '../../announcement-list/announcement-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AnnouncementListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly title = 'Neighborhood Community';
}
