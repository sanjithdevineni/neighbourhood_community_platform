import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import announcementsData from './announcements.mock.json';

interface Announcement {
  id: number;
  title: string;
  content: string;
  postedAt: string;
}

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.css'
})
export class AnnouncementListComponent {
  readonly announcements: Announcement[] = announcementsData as Announcement[];

  trackById(index: number, announcement: Announcement): number {
    return announcement.id;
  }
}
