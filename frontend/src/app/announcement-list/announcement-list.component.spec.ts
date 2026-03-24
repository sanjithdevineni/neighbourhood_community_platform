import { TestBed } from '@angular/core/testing';
import { AnnouncementListComponent } from './announcement-list.component';

describe('AnnouncementListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementListComponent]
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
    expect(component.announcements[0].content).toBe('New neighborhood update!');
    expect(component.announcements[0].timestamp).toBe('Just now');
    expect(component.newPostContent).toBe('');
    expect(component.showValidationError).toBe(false);
  });
});
