import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, finalize, map, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommunityEvent, CreateEventPayload, EventService } from '../../services/event.service';

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
export class EventsComponent implements OnInit, OnDestroy {
  showCreateEventForm = false;
  showOnlyUserEvents = false;
  isLoadingEvents = false;
  eventsError = '';

  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  imageError = '';
  createEventError = '';
  isCreatingEvent = false;
  private currentUserId = '';
  private refreshSubscription?: Subscription;
  private readonly monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserContext();
    this.refreshSubscription = this.route.queryParamMap
      .pipe(
        map((params) => params.get('refresh') ?? ''),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.fetchEvents();
      });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  newEvent = {
    name: '',
    date: '',
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
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (events) => {
          try {
            const normalizedEvents = Array.isArray(events) ? events : [];
            this.events = normalizedEvents.map((event) => this.mapToEventItem(event));
          } catch (error) {
            console.error(error);
            this.eventsError = 'Failed to load events.';
            this.events = [];
          }
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
    this.createEventError = '';
  }

  closeCreateEvent(): void {
    this.showCreateEventForm = false;
    this.resetForm();
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.imageError = '';
      this.selectedImageFile = null;
      this.imagePreview = null;
      this.newEvent.imageUrl = '';
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Please upload a valid image file.';
      this.imagePreview = null;
      this.selectedImageFile = null;
      this.newEvent.imageUrl = '';
      return;
    }

    this.imageError = '';
    this.createEventError = '';
    this.selectedImageFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.newEvent.imageUrl = this.imagePreview;
    };

    reader.readAsDataURL(file);
  }

  createEvent(eventForm: NgForm): void {
    if (eventForm.invalid || this.imageError || this.isCreatingEvent) {
      eventForm.control.markAllAsTouched();
      return;
    }

    const payload: CreateEventPayload = {
      title: this.newEvent.name.trim(),
      date: this.newEvent.date.trim(),
      time: this.newEvent.time.trim(),
      location: this.newEvent.location.trim(),
      image: this.selectedImageFile
    };

    if (!payload.title || !payload.date || !payload.time || !payload.location) {
      this.createEventError = 'All required fields must be filled.';
      eventForm.control.markAllAsTouched();
      return;
    }

    this.isCreatingEvent = true;
    this.createEventError = '';

    this.eventService
      .createEvent(payload)
      .pipe(finalize(() => {
        this.isCreatingEvent = false;
      }))
      .subscribe({
        next: (createdEvent) => {
          this.events = [this.mapToEventItem(createdEvent), ...this.events];
          this.resetForm();
          eventForm.resetForm();
          this.showCreateEventForm = false;
        },
        error: (error: unknown) => {
          console.error(error);
          this.createEventError = this.getCreateErrorMessage(error);
        }
      });
  }

  private resetForm(): void {
    this.newEvent = {
      name: '',
      date: '',
      time: '',
      location: '',
      interested: 0,
      imageUrl: ''
    };
    this.imagePreview = null;
    this.selectedImageFile = null;
    this.imageError = '';
    this.createEventError = '';
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

  private getCreateErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Failed to create event. Please try again.';
    }

    if (error.status === 401) {
      return 'You must be logged in to create an event.';
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

    return 'Failed to create event. Please try again.';
  }

}
