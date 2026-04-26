import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EventService, EventItem } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  showCreateEventForm = false;
  showEditEventForm = false;
  editingEventId: number | null = null;
  showOnlyUserEvents = false;
  isLoading = false;
  isSubmitting = false;

  currentUserId = '';

  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getStoredUser();
    if (user) {
      this.currentUserId = `${user.id}`;
    }
    this.fetchEvents();
  }

  fetchEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.events = data.map(event => ({
            ...event,
            createdByUser: event.author === this.currentUserId
          }));
        },
        error: (err) => console.error('Failed to load events:', err)
      });
  }

  imagePreview: string | null = null;
  imageFile: File | null = null;
  imageError = '';

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





  events: EventItem[] = [
    /* {
      id: 1,
      name: 'Block Party & BBQ',
      date: '19',
      month: 'FEB',
      time: '9:15 AM',
      location: 'Willow Creek Park',
      interested: 45,
      imageUrl:
        'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      name: 'Morning Yoga in the Park',
      date: '20',
      month: 'FEB',
      time: '11:00 AM',
      location: 'Community Center',
      interested: 12,
      imageUrl:
        'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 3,
      name: 'Local Book Club Meeting',
      date: '22',
      month: 'FEB',
      time: '6:30 PM',
      location: 'Public Library',
      interested: 8,
      imageUrl:
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80'
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
    } */
  ];

  get displayedEvents(): EventItem[] {
    if (this.showOnlyUserEvents) {
      return this.events.filter((event) => event.createdByUser);
    }

    return this.events;
  }

  openEditEvent(event: EventItem): void {
    this.editingEventId = event.id;
    this.editEventData = { ...event };
    this.showEditEventForm = true;
    this.imageError = '';
    this.imagePreview = event.imageUrl || null;
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

    this.imageFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.editEventData.imageUrl = this.imagePreview;
    };

    reader.readAsDataURL(file);
  }

  saveEditEvent(editForm: NgForm): void {
    if (editForm.invalid || this.imageError || !this.editingEventId) {
      editForm.control.markAllAsTouched();
      return;
    }

    this.events = this.events.map((e) => 
      e.id === this.editingEventId 
        ? { ...e, ...this.editEventData }
        : e
    );

    this.closeEditEvent();
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

    this.imageFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.newEvent.imageUrl = this.imagePreview;
    };

    reader.readAsDataURL(file);
  }

  createEvent(eventForm: NgForm): void {
    if (eventForm.invalid || this.imageError || this.isSubmitting) {
      eventForm.control.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.eventService.createEvent({
      title: this.newEvent.title,
      date: this.newEvent.date,
      month: this.newEvent.month,
      time: this.newEvent.time,
      location: this.newEvent.location,
      image: this.imageFile || undefined
    })
    .pipe(finalize(() => {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (createdEvent) => {
        createdEvent.createdByUser = true;
        this.events = [createdEvent, ...this.events];
        
        this.resetForm();
        eventForm.resetForm();
        this.showCreateEventForm = false;
      },
      error: (err) => {
        console.error('Failed to create event:', err);
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
    this.imageFile = null;
    this.imageError = '';
  }
}
