import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import announcementsData from './announcements.mock.json';
import { PostCardComponent } from '../post-card/post-card.component';

interface Announcement {
  id: number;
  author: string;
  timestamp: string;
  category: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.css'
})
export class AnnouncementListComponent {
  readonly announcements: Announcement[] = announcementsData as Announcement[];

  trackById(_index: number, announcement: Announcement): number {
    return announcement.id;
  }
}
