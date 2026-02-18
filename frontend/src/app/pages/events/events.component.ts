import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EventItem {
  id: number;
  name: string;
  date: string;
  month: string;
  time: string;
  location: string;
  interested: number;
  imageUrl: string;
  createdByUser?: boolean;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],  // 👈 ADD THIS
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})

export class EventsComponent {

  showCreateEventForm = false;

  newEvent = {
    name: '',
    date: '',
    month: '',
    time: '',
    location: '',
    interested: 0,
    imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94'
  };

  openCreateEvent() {
    this.showCreateEventForm = true;
  }

  closeCreateEvent() {
    this.showCreateEventForm = false;
  }

  createEvent() {

    const newEventWithId = {
      id: Date.now(),  // simple unique ID
      ...this.newEvent
    };

    this.events = [
      newEventWithId,
      ...this.events
    ];

    this.closeCreateEvent();

    this.newEvent = {
      name: '',
      date: '',
      month: '',
      time: '',
      location: '',
      interested: 0,
      imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94'
    };
  }




  events: EventItem[] = [
    {
      id: 1,
      name: 'Block Party & BBQ',
      date: '19',
      month: 'FEB',
      time: '9:15 AM',
      location: 'Willow Creek Park',
      interested: 45,
      imageUrl: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      name: 'Morning Yoga in the Park',
      date: '20',
      month: 'FEB',
      time: '11:00 AM',
      location: 'Community Center',
      interested: 12,
      imageUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 3,
      name: 'Local Book Club Meeting',
      date: '22',
      month: 'FEB',
      time: '6:30 PM',
      location: 'Public Library',
      interested: 8,
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 4,
      name: 'Saturday Farmers Market',
      date: '24',
      month: 'FEB',
      time: '8:00 AM',
      location: 'Town Center',
      interested: 124,
      imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80'
    }
  ];

}
