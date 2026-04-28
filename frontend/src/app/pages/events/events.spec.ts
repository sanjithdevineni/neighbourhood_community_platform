import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EventsComponent } from './events.component';
import { AuthService } from '../../services/auth.service';
import { CommunityEvent, CreateEventPayload, EventService } from '../../services/event.service';

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;
  let routeQueryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const eventServiceStub: {
    getEvents: () => Observable<CommunityEvent[]>;
    createEvent: (payload: CreateEventPayload) => Observable<CommunityEvent>;
    deleteEvent: (id: number) => Observable<void>;
  } = {
    getEvents: () => of([]),
    createEvent: (payload: CreateEventPayload) =>
      of({
        id: 999,
        title: payload.title,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        image_url: '',
        author: '1',
        created_at: '2026-04-10T14:23:15Z'
      }),
    deleteEvent: () => of(undefined)
  };
  const authServiceStub: {
    getStoredUser: () => { id: number; name: string; email: string; created_at: string } | null;
  } = {
    getStoredUser: () => null
  };

  beforeEach(async () => {
    eventServiceStub.getEvents = () => of([]);
    eventServiceStub.createEvent = (payload: CreateEventPayload) =>
      of({
        id: 999,
        title: payload.title,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        image_url: '',
        author: '1',
        created_at: '2026-04-10T14:23:15Z'
      });
    eventServiceStub.deleteEvent = () => of(undefined);
    authServiceStub.getStoredUser = () => null;
    routeQueryParamMap$ = new BehaviorSubject(convertToParamMap({ refresh: '0' }));

    await TestBed.configureTestingModule({
      imports: [EventsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: routeQueryParamMap$.asObservable()
          }
        },
        {
          provide: EventService,
          useValue: eventServiceStub
        },
        {
          provide: AuthService,
          useValue: authServiceStub
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and map backend events to UI fields on init', () => {
    authServiceStub.getStoredUser = () => ({
      id: 7,
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2026-04-01T10:00:00Z'
    });
    eventServiceStub.getEvents = () =>
      of([
        {
          id: 1,
          title: 'Community BBQ',
          date: '2099-04-20',
          time: '5:00 PM',
          location: 'Central Park Pavilion',
          image_url: '/uploads/1712345678_abc123.jpg',
          author: '7',
          created_at: '2026-04-10T14:23:15Z'
        }
      ]);

    fixture.detectChanges();

    expect(component.events.length).toBe(1);
    expect(component.events[0].name).toBe('Community BBQ');
    expect(component.events[0].date).toBe('20');
    expect(component.events[0].month).toBe('APR');
    expect(component.events[0].imageUrl).toBe('/uploads/1712345678_abc123.jpg');
    expect(component.events[0].createdByUser).toBe(true);
  });

  it('should refetch events when events refresh query param changes', () => {
    const getEventsSpy = vi.fn(() => of([]));
    eventServiceStub.getEvents = getEventsSpy;

    fixture.detectChanges();
    expect(getEventsSpy).toHaveBeenCalledTimes(1);

    routeQueryParamMap$.next(convertToParamMap({ refresh: '1' }));
    expect(getEventsSpy).toHaveBeenCalledTimes(2);
  });

  it('should show error state when fetch fails', () => {
    eventServiceStub.getEvents = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 0
          })
      );

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorState = compiled.querySelector('.error-state');

    expect(errorState).not.toBeNull();
    expect(component.eventsError).toBe('Unable to reach the backend. Make sure the API is running.');
  });

  it('should show loading state while events are being fetched', () => {
    eventServiceStub.getEvents = () =>
      new Observable<CommunityEvent[]>(() => {
        return () => undefined;
      });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const loadingState = compiled.querySelector('.loading-state');
    const hostCard = compiled.querySelector('.host-card');

    expect(loadingState?.textContent).toContain('Loading events...');
    expect(hostCard).toBeNull();
  });

  it('should show only host card when there are no events', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hostCard = compiled.querySelector('.host-card');
    const eventCards = compiled.querySelectorAll('.event-card:not(.host-card)');
    const emptyNote = compiled.querySelector('.events-empty-note');

    expect(hostCard).not.toBeNull();
    expect(eventCards.length).toBe(0);
    expect(emptyNote?.textContent).toContain('No events available');
  });

  it('should show \"No events created yet\" when filtering to your events with none present', () => {
    component.showOnlyUserEvents = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hostCard = compiled.querySelector('.host-card');
    const emptyNote = compiled.querySelector('.events-empty-note');

    expect(hostCard).not.toBeNull();
    expect(emptyNote?.textContent).toContain('No events created yet');
  });

  it('should show fetched events and keep host card at the end', () => {
    eventServiceStub.getEvents = () =>
      of([
        {
          id: 10,
          title: 'Morning Yoga in the Park',
          date: '2099-04-20',
          time: '7:00 AM',
          location: 'Riverside Park',
          image_url: '/uploads/yoga.jpg',
          author: '3',
          created_at: '2026-04-10T14:23:15Z'
        }
      ]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hostCard = compiled.querySelector('.host-card');
    const eventCards = compiled.querySelectorAll('.event-card:not(.host-card)');
    const emptyNote = compiled.querySelector('.events-empty-note');

    expect(eventCards.length).toBe(1);
    expect(hostCard).not.toBeNull();
    expect(emptyNote).toBeNull();
  });

  it('should hide empty note when showing only user events that exist', () => {
    authServiceStub.getStoredUser = () => ({
      id: 3,
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2026-04-01T10:00:00Z'
    });
    eventServiceStub.getEvents = () =>
      of([
        {
          id: 10,
          title: 'My Event',
          date: '2099-04-20',
          time: '7:00 AM',
          location: 'Riverside Park',
          image_url: '/uploads/yoga.jpg',
          author: '3',
          created_at: '2026-04-10T14:23:15Z'
        }
      ]);

    component.showOnlyUserEvents = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const eventCards = compiled.querySelectorAll('.event-card:not(.host-card)');
    const emptyNote = compiled.querySelector('.events-empty-note');

    expect(eventCards.length).toBe(1);
    expect(emptyNote).toBeNull();
  });

  it('should show all events in default view including user-created ones', () => {
    authServiceStub.getStoredUser = () => ({
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2026-04-01T10:00:00Z'
    });
    eventServiceStub.getEvents = () =>
      of([
        {
          id: 1,
          title: 'My Event',
          date: '2099-04-20',
          time: '7:00 AM',
          location: 'Riverside Park',
          image_url: '/uploads/yoga.jpg',
          author: '2',
          created_at: '2026-04-10T14:23:15Z'
        },
        {
          id: 2,
          title: 'Other Event',
          date: '2099-04-21',
          time: '8:00 AM',
          location: 'Depot Park',
          image_url: '/uploads/other.jpg',
          author: '3',
          created_at: '2026-04-10T14:23:16Z'
        }
      ]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const eventCards = compiled.querySelectorAll('.event-card:not(.host-card)');

    expect(component.displayedEvents.length).toBe(2);
    expect(eventCards.length).toBe(2);
  });

  it('should keep past and upcoming events from the API', () => {
    eventServiceStub.getEvents = () =>
      of([
        {
          id: 11,
          title: 'Old Event',
          date: '2000-01-01',
          time: '8:00 AM',
          location: 'Old Park',
          image_url: '',
          author: '2',
          created_at: '2000-01-01T10:00:00Z'
        },
        {
          id: 12,
          title: 'Upcoming Event',
          date: '2099-01-01',
          time: '9:00 AM',
          location: 'Future Park',
          image_url: '',
          author: '2',
          created_at: '2098-12-01T10:00:00Z'
        }
      ]);

    fixture.detectChanges();

    expect(component.events.length).toBe(2);
    expect(component.events[0].name).toBe('Old Event');
    expect(component.events[1].name).toBe('Upcoming Event');
  });

  it('should keep form invalid when required fields are empty', () => {
    component.openCreateEvent();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('form') as HTMLFormElement;

    expect(form.checkValidity()).toBe(false);
  });

  it('should create an event via API and reset form state', () => {
    authServiceStub.getStoredUser = () => ({
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2026-04-01T10:00:00Z'
    });
    const createEventSpy = vi.fn((payload: CreateEventPayload) =>
      of({
        id: 4001,
        title: payload.title,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        image_url: '/uploads/new.jpg',
        author: '1',
        created_at: '2026-04-10T14:23:15Z'
      })
    );
    eventServiceStub.createEvent = createEventSpy;

    fixture.detectChanges();
    const initialEventCount = component.events.length;
    component.newEvent = {
      name: 'Neighborhood Cleanup',
      date: '2026-04-30',
      time: '10:00 AM',
      location: 'Depot Park',
      interested: 0,
      imageUrl: ''
    };
    const mockForm = {
      invalid: false,
      control: { markAllAsTouched: () => undefined },
      resetForm: () => undefined
    };

    component.createEvent(mockForm as never);

    expect(createEventSpy).toHaveBeenCalledTimes(1);
    expect(component.events.length).toBe(initialEventCount + 1);
    expect(component.events[0].createdByUser).toBe(true);
    expect(component.events[0].imageUrl).toBe('/uploads/new.jpg');
    expect(component.showCreateEventForm).toBe(false);
    expect(component.newEvent.name).toBe('');
  });

  it('should show create error when API event creation fails', () => {
    eventServiceStub.createEvent = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401
          })
      );

    fixture.detectChanges();
    component.newEvent = {
      name: 'Neighborhood Cleanup',
      date: '2026-04-30',
      time: '10:00 AM',
      location: 'Depot Park',
      interested: 0,
      imageUrl: ''
    };
    const mockForm = {
      invalid: false,
      control: { markAllAsTouched: () => undefined },
      resetForm: () => undefined
    };

    component.createEvent(mockForm as never);

    expect(component.createEventError).toBe('You must be logged in to create an event.');
    expect(component.showCreateEventForm).toBe(false);
  });

  it('should show delete button only for user-created events', () => {
    authServiceStub.getStoredUser = () => ({
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2026-04-01T10:00:00Z'
    });
    eventServiceStub.getEvents = () =>
      of([
        {
          id: 1001,
          title: 'User Event',
          date: '2099-04-15',
          time: '5:00 PM',
          location: 'UF Campus',
          image_url: 'https://example.com/user-event.jpg',
          author: '1',
          created_at: '2026-04-10T14:23:15Z'
        },
        {
          id: 1002,
          title: 'Community Event',
          date: '2099-04-16',
          time: '6:00 PM',
          location: 'Downtown',
          image_url: 'https://example.com/community-event.jpg',
          author: '2',
          created_at: '2026-04-10T14:23:16Z'
        }
      ]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButtons = compiled.querySelectorAll('.delete-btn');

    expect(deleteButtons.length).toBe(1);
  });

  it('should delete event when user confirms', () => {
    const deleteEventSpy = vi.fn(() => of(undefined));
    eventServiceStub.deleteEvent = deleteEventSpy;
    component.events = [
      {
        id: 2001,
        name: 'To Delete',
        date: '20',
        month: 'APR',
        time: '7:00 PM',
        location: 'Depot Park',
        interested: 5,
        imageUrl: 'https://example.com/delete.jpg',
        createdByUser: true
      }
    ];
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteEvent(2001);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteEventSpy).toHaveBeenCalledWith(2001);
    expect(component.events.length).toBe(0);
    confirmSpy.mockRestore();
  });

  it('should keep event when user cancels delete confirmation', () => {
    const deleteEventSpy = vi.fn(() => of(undefined));
    eventServiceStub.deleteEvent = deleteEventSpy;
    component.events = [
      {
        id: 3001,
        name: 'Keep Event',
        date: '21',
        month: 'APR',
        time: '7:30 PM',
        location: 'Bo Diddley Plaza',
        interested: 9,
        imageUrl: 'https://example.com/keep.jpg',
        createdByUser: true
      }
    ];
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteEvent(3001);

    expect(deleteEventSpy).not.toHaveBeenCalled();
    expect(component.events.length).toBe(1);
    confirmSpy.mockRestore();
  });

  it('should show delete error and keep event when API delete fails', () => {
    eventServiceStub.deleteEvent = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403
          })
      );
    component.events = [
      {
        id: 3002,
        name: 'Protected Event',
        date: '22',
        month: 'APR',
        time: '8:00 PM',
        location: 'Town Hall',
        interested: 4,
        imageUrl: 'https://example.com/protected.jpg',
        createdByUser: true
      }
    ];
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteEvent(3002);

    expect(component.events.length).toBe(1);
    expect(component.deleteEventError).toBe('You can only delete events you created.');
    confirmSpy.mockRestore();
  });
});
