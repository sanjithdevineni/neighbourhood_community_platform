import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AnnouncementListComponent } from '../../announcement-list/announcement-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AnnouncementListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly trends = [
    { topic: 'Summer Festival 2026', activity: '42 neighbors discussing' },
    { topic: 'Road repairs on Main St', activity: '12 neighbors discussing' },
    { topic: 'New Bakery Opening', activity: '89 neighbors discussing' }
  ];

  readonly recommendations = [
    { name: 'Pizza Palace', rating: '4.8', reviews: 120, badge: 'P' },
    { name: 'Green Grocers', rating: '4.5', reviews: 85, badge: 'G' }
  ];
}
