import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AnnouncementListComponent } from './announcement-list.component';
import { AnnouncementService } from '../services/announcement.service';

describe('AnnouncementListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementListComponent],
      providers: [
        {
          provide: AnnouncementService,
          useValue: {
            getAnnouncements: () => of([])
          }
        }
      ]
    }).compileComponents();
  });

  it('should block empty post submissions', () => {
    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    const initialCount = component.announcements.length;

    component.newPostContent = '   ';
    component.createPost();

    expect(component.announcements.length).toBe(initialCount);
    expect(component.showValidationError).toBe(true);
  });

  it('should prepend new post and clear input after submit', () => {
    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    const initialCount = component.announcements.length;

    component.newPostContent = '  New neighborhood update!  ';
    component.createPost();

    expect(component.announcements.length).toBe(initialCount + 1);
    expect(component.announcements[0].title).toBe('Community Update');
    expect(component.announcements[0].content).toBe('New neighborhood update!');
    expect(component.announcements[0].created_at).toBeTruthy();
    expect(component.newPostContent).toBe('');
    expect(component.showValidationError).toBe(false);
  });
});
