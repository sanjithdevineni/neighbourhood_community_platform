import { Component } from '@angular/core';
import { AnnouncementListComponent } from './announcement-list/announcement-list.component';

@Component({
  selector: 'app-root',
  imports: [AnnouncementListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly title = 'Neighborhood Community';
}
