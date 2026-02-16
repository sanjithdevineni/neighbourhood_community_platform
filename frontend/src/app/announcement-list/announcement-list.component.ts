import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
  readonly announcements: Announcement[] = [
    {
      id: 1,
      title: 'Neighborhood Clean-Up Drive',
      content: 'Join us this Saturday at 9:00 AM in the community park. Gloves and trash bags will be provided.',
      postedAt: '2h ago'
    },
    {
      id: 2,
      title: 'Water Shutdown Notice',
      content: 'Water service will be unavailable on March 3 from 10:00 AM to 1:00 PM due to pipeline maintenance.',
      postedAt: '5h ago'
    },
    {
      id: 3,
      title: 'Movie Night at the Clubhouse',
      content: 'Family movie night starts at 7:30 PM this Friday. Bring your own snacks and folding chairs.',
      postedAt: 'Yesterday'
    },
    {
      id: 4,
      title: 'Lost Dog Alert',
      content: 'A small brown beagle named Bruno was last seen near Oak Street. Contact the office if found.',
      postedAt: 'Yesterday'
    }
  ];

  trackById(index: number, announcement: Announcement): number {
    return announcement.id;
  }
}
