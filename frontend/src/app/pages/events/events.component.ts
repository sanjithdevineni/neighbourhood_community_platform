import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, finalize, map, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CreateEventPayload, EventService, CommunityEvent } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

interface EventItem {
  id: number;
  title: string;
  eventDate: string;
  date: string;
  month: string;
  time: string;
  location: string;
  interested: number;
  is_interested?: boolean;
  imageUrl: string;
  author: string;
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
  showEditEventForm = false;
  editingEventId: number | null = null;
  showOnlyUserEvents = false;

  isLoadingEvents = false;
  eventsError = '';

  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  imageError = '';
  createEventError = '';
  deleteEventError = '';
  isCreatingEvent = false;
  deletingEventIds = new Set<number>();
  private currentUserId = '';
  private refreshSubscription?: Subscription;
  private readonly monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  editImageFile: File | null = null;
  isUpdatingEvent = false;
  editErrorMessage = '';

  newEvent = {
    title: '',
    date: '',
    month: '',
    time: '',
    location: '',
    interested: 0,
    imageUrl: ''
  };

  editEventData: Partial<EventItem> = {
    title: '',
    eventDate: '',
    date: '',
    month: '',
    time: '',
    location: '',
    interested: 0,
    imageUrl: ''
  };

  events: EventItem[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
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

  fetchEvents(): void {
    this.isLoadingEvents = true;
    this.eventsError = '';
    this.deleteEventError = '';

    this.eventService
      .getEvents()
      .pipe(finalize(() => {
        this.isLoadingEvents = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.events = data.map((e) => this.mapToEventItem(e));
        },
        error: (error: unknown) => {
          console.error(error);
          this.eventsError = this.getFetchErrorMessage(error);
        }
      });
  }

  deleteEvent(id: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this event?');

    if (!confirmDelete) {
      return;
    }

    this.deleteEventError = '';
    this.deletingEventIds = new Set(this.deletingEventIds).add(id);

    this.eventService
      .deleteEvent(id)
      .pipe(finalize(() => {
        const nextDeletingIds = new Set(this.deletingEventIds);
        nextDeletingIds.delete(id);
        this.deletingEventIds = nextDeletingIds;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.events = this.events.filter(event => String(event.id) !== String(id));
          this.deleteEventError = '';
          this.toastService.success('Event deleted successfully');
        },
        error: (error: unknown) => {
          console.error(error);
          this.deleteEventError = this.getDeleteErrorMessage(error);
          this.toastService.error(this.deleteEventError);
        }
      });
  }

  get displayedEvents(): EventItem[] {
    if (this.showOnlyUserEvents) {
      return this.events.filter((event) => this.isOwnedByCurrentUser(event.author));
    }
    return this.events;
  }

  openEditEvent(event: EventItem): void {
    this.editingEventId = event.id;
    this.editEventData = {
      ...event,
      eventDate: this.getDateInputValue(event.eventDate)
    };
    
    this.showEditEventForm = true;
    this.imageError = '';
    this.imagePreview = event.imageUrl || null;
    this.editImageFile = null;
  }

  closeEditEvent(): void {
    this.showEditEventForm = false;
    this.editingEventId = null;
    this.resetForm();
  }

  onEditImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.imageError = '';
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Please upload a valid image file.';
      this.imagePreview = null;
      this.editEventData.imageUrl = '';
      return;
    }

    this.editImageFile = file;
    this.imageError = '';

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.editEventData.imageUrl = this.imagePreview;
    };

    reader.readAsDataURL(file);
  }

  saveEditEvent(editForm: NgForm): void {
    if (editForm.invalid || this.imageError || !this.editingEventId || this.isUpdatingEvent) {
      editForm.control.markAllAsTouched();
      return;
    }

    this.isUpdatingEvent = true;
    this.editErrorMessage = '';

    this.eventService.updateEvent({
      id: this.editingEventId,
      title: this.editEventData.title || '',
      date: this.editEventData.eventDate || '',
      time: this.editEventData.time || '',
      location: this.editEventData.location || '',
      image: this.editImageFile
    }).pipe(finalize(() => {
      this.isUpdatingEvent = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (updatedEvent) => {
        const eventId = this.editingEventId;
        this.closeEditEvent();

        if (!eventId) {
          return;
        }

        const mapped = this.mapToEventItem(updatedEvent);
        this.events = this.events.map((e) => (e.id === eventId ? mapped : e));
        this.toastService.success('Event updated successfully');
      },
      error: (err) => {
        console.error('Update failed', err);
        this.toastService.error('Server failed to update event.');
      }
    });
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

    const combinedDate = `${this.newEvent.month} ${this.newEvent.date}`.trim();
    const payload: CreateEventPayload = {
      title: this.newEvent.title.trim(),
      date: combinedDate,
      time: this.newEvent.time.trim(),
      location: this.newEvent.location.trim(),
      image: this.selectedImageFile
    };

    this.isCreatingEvent = true;
    this.createEventError = '';

    this.eventService
      .createEvent(payload)
      .pipe(finalize(() => {
        this.isCreatingEvent = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (createdEvent) => {
          this.events = [this.mapToEventItem(createdEvent), ...this.events];
          this.createEventError = '';
          this.toastService.success('Event created successfully');
          this.resetForm();
          eventForm.resetForm();
          this.showCreateEventForm = false;
        },
        error: (error: unknown) => {
          console.error(error);
          this.createEventError = this.getCreateErrorMessage(error);
          this.toastService.error(this.createEventError);
        }
      });
  }

  toggleInterest(event: EventItem): void {
    this.eventService.toggleInterest(event.id).subscribe({
      next: (res) => {
        event.interested = res.interested_count;
        event.is_interested = res.is_interested;
        
        if (res.is_interested) {
          this.toastService.success('You are now interested in this event!');
        } else {
          this.toastService.info('No longer interested in this event.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Interest toggle failed', err);
        if (err.status === 401) {
          this.toastService.error('You must be logged in to express interest.');
        } else {
          this.toastService.error('Failed to update interest. Please try again.');
        }
      }
    });
  }

  private resetForm(): void {
    this.newEvent = {
      title: '',
      date: '',
      month: '',
      time: '',
      location: '',
      interested: 0,
      imageUrl: ''
    };
    this.imagePreview = null;
    this.imageError = '';
    this.createEventError = '';
    this.editImageFile = null;
    this.editErrorMessage = '';
  }

  private mapToEventItem(event: CommunityEvent): EventItem {
    const badge = this.getDateBadge(event.date);
    const author = String(event.author ?? '');
    return {
      id: event.id,
      title: event.title,
      eventDate: event.date,
      date: badge.day,
      month: badge.month,
      time: event.time,
      location: event.location,
      interested: event.interested_count,
      is_interested: event.is_interested,
      imageUrl: event.image_url,
      author,
      createdByUser: this.isOwnedByCurrentUser(author)
    };
  }

  private getDateInputValue(dateValue: string): string {
    const trimmed = (dateValue ?? '').trim();
    if (!trimmed) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isOwnedByCurrentUser(author?: string): boolean {
    return this.currentUserId !== '' && String(author ?? '') === this.currentUserId;
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

  private getDeleteErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Failed to delete event. Please try again.';
    }

    if (error.status === 401) {
      return 'You must be logged in to delete this event.';
    }

    if (error.status === 403) {
      return 'You can only delete events you created.';
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

    return 'Failed to delete event. Please try again.';
  }
}
