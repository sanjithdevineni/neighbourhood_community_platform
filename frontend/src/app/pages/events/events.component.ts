import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EventItem {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent {

  events: EventItem[] = [
    {
      id: 1,
      name: 'Block Party & BBQ',
      date: 'Feb 19',
      time: '9:15 AM',
      location: 'Willow Creek Park',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
    },
    {
      id: 2,
      name: 'Morning Yoga in the Park',
      date: 'Feb 20',
      time: '11:00 AM',
      location: 'Community Center',
      imageUrl: 'https://images.unsplash.com/photo-1554306274-f23873d9a26c'
    },
    {
      id: 3,
      name: 'Local Book Club Meeting',
      date: 'Feb 22',
      time: '6:30 PM',
      location: 'Public Library',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
    }
  ];

}
