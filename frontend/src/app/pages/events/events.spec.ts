import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EventsComponent } from './events.component';

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show no-events empty state by default', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');

    expect(emptyState).not.toBeNull();
    expect(emptyState?.textContent).toContain('No events available');
  });

  it('should show empty state when viewing only user events and none exist', () => {
    component.showOnlyUserEvents = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');

    expect(emptyState).not.toBeNull();
    expect(emptyState?.textContent).toContain('No events created yet');
    expect(compiled.querySelector('.header-actions .create-event-btn')).toBeNull();
  });

  it('should open create event modal from empty state action', () => {
    component.showOnlyUserEvents = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyStateCreateButton = compiled.querySelector('.empty-state .create-event-btn') as HTMLButtonElement;

    emptyStateCreateButton.click();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.showCreateEventForm).toBe(true);
    expect(compiled.querySelector('.event-modal-overlay')).not.toBeNull();
  });

  it('should keep form invalid when required fields are empty', () => {
    component.openCreateEvent();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('form') as HTMLFormElement;

    expect(form.checkValidity()).toBe(false);
  });

  it('should create a user event and reset the form state', () => {
    const initialEventCount = component.events.length;
    component.newEvent = {
      name: 'Neighborhood Cleanup',
      date: '30',
      month: 'APR',
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

    expect(component.events.length).toBe(initialEventCount + 1);
    expect(component.events[0].createdByUser).toBe(true);
    expect(component.showCreateEventForm).toBe(false);
    expect(component.newEvent.name).toBe('');
  });

  it('should show delete button only for user-created events', () => {
    component.events = [
      {
        id: 1001,
        name: 'User Event',
        date: '15',
        month: 'APR',
        time: '5:00 PM',
        location: 'UF Campus',
        interested: 10,
        imageUrl: 'https://example.com/user-event.jpg',
        createdByUser: true
      },
      {
        id: 1002,
        name: 'Community Event',
        date: '16',
        month: 'APR',
        time: '6:00 PM',
        location: 'Downtown',
        interested: 20,
        imageUrl: 'https://example.com/community-event.jpg',
        createdByUser: false
      }
    ];
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButtons = compiled.querySelectorAll('.delete-btn');

    expect(deleteButtons.length).toBe(1);
  });

  it('should delete event when user confirms', () => {
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
    expect(component.events.length).toBe(0);
    confirmSpy.mockRestore();
  });

  it('should keep event when user cancels delete confirmation', () => {
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

    expect(component.events.length).toBe(1);
    confirmSpy.mockRestore();
  });
});
