import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommunityEvent, EventService } from '../../services/event.service';

interface EventItem {
  id: number;
  name: string;
  date: string;
  month: string;
  time: string;
  location: string;
  interested: number;
  imageUrl: string;
  author?: string;
  createdByUser?: boolean;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  showCreateEventForm = false;
  showOnlyUserEvents = false;
  isLoadingEvents = false;
  eventsError = '';

  imagePreview: string | null = null;
  imageError = '';
  private currentUserId = '';
  private readonly monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserContext();
    this.fetchEvents();
  }

  newEvent = {
    name: '',
    date: '',
    month: '',
    time: '',
    location: '',
    interested: 0,
    imageUrl: ''
  };

  deleteEvent(id: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this event?');

    if (!confirmDelete) {
      return;
    }

    this.events = this.events.filter(event => event.id !== id);
  }
  events: EventItem[] = [];

  fetchEvents(): void {
    this.isLoadingEvents = true;
    this.eventsError = '';

    this.eventService
      .getEvents()
      .pipe(finalize(() => {
        this.isLoadingEvents = false;
      }))
      .subscribe({
        next: (events) => {
          this.events = events
            .filter((event) => this.isUpcomingEvent(event.date))
            .map((event) => this.mapToEventItem(event));
        },
        error: (error: unknown) => {
          console.error(error);
          this.eventsError = this.getFetchErrorMessage(error);
        }
      });
  }

  get displayedEvents(): EventItem[] {
    if (this.showOnlyUserEvents) {
      return this.events.filter((event) => event.createdByUser);
    }

    return this.events;
  }

  openCreateEvent(): void {
    this.showCreateEventForm = true;
    this.imageError = '';
  }

  closeCreateEvent(): void {
    this.showCreateEventForm = false;
    this.resetForm();
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.imageError = '';
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Please upload a valid image file.';
      this.imagePreview = null;
      this.newEvent.imageUrl = '';
      return;
    }

    this.imageError = '';

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.newEvent.imageUrl = this.imagePreview;
    };

    reader.readAsDataURL(file);
  }

  createEvent(eventForm: NgForm): void {
    if (eventForm.invalid || this.imageError) {
      eventForm.control.markAllAsTouched();
      return;
    }

    const newEventWithId: EventItem = {
      id: Date.now(),
      ...this.newEvent,
      createdByUser: true
    };

    this.events = [newEventWithId, ...this.events];

    this.resetForm();
    eventForm.resetForm();
    this.showCreateEventForm = false;
  }

  private resetForm(): void {
    this.newEvent = {
      name: '',
      date: '',
      month: '',
      time: '',
      location: '',
      interested: 0,
      imageUrl: ''
    };
    this.imagePreview = null;
    this.imageError = '';
  }

  private mapToEventItem(event: CommunityEvent): EventItem {
    const badge = this.getDateBadge(event.date);
    return {
      id: event.id,
      name: event.title,
      date: badge.day,
      month: badge.month,
      time: event.time,
      location: event.location,
      interested: 0,
      imageUrl: event.image_url,
      author: event.author,
      createdByUser: this.currentUserId !== '' && event.author === this.currentUserId
    };
  }

  private getDateBadge(dateValue: string): { day: string; month: string } {
    const trimmed = dateValue.trim();
    if (!trimmed) {
      return { day: '', month: '' };
    }

    const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateMatch) {
      const monthIndex = Number(isoDateMatch[2]) - 1;
      return {
        day: String(Number(isoDateMatch[3])).padStart(2, '0'),
        month: this.monthLabels[monthIndex] ?? ''
      };
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        day: String(parsed.getDate()).padStart(2, '0'),
        month: this.monthLabels[parsed.getMonth()] ?? ''
      };
    }

    return { day: trimmed, month: '' };
  }

  private isUpcomingEvent(dateValue: string): boolean {
    const trimmed = dateValue.trim();
    if (!trimmed) {
      return true;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return true;
    }

    const eventDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return eventDay >= todayStart;
  }

  private loadCurrentUserContext(): void {
    const user = this.authService.getStoredUser();
    this.currentUserId = user ? `${user.id}` : '';
  }

  private getFetchErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Failed to load events.';
    }

    if (error.status === 0) {
      return 'Unable to reach the backend. Make sure the API is running.';
    }

    if (typeof error.error === 'string') {
      const trimmed = error.error.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    if (error.error?.error) {
      return error.error.error;
    }

    return 'Failed to load events.';
  }
}
