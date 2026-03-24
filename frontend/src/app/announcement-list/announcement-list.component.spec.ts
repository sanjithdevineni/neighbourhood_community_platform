import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { AnnouncementListComponent } from './announcement-list.component';
import { AnnouncementService } from '../services/announcement.service';

describe('AnnouncementListComponent', () => {
  const mockAnnouncements = [
    {
      id: 1,
      title: 'Community Meeting',
      author: 'Admin',
      content: 'Town hall this Friday.',
      created_at: '2026-03-03T20:50:00Z',
      updated_at: '2026-03-03T20:50:00Z',
      deleted_at: null
    }
  ];
  const announcementServiceStub = {
    getAnnouncements: () => of(mockAnnouncements),
    createAnnouncement: () => of(mockAnnouncements[0])
  };

  beforeEach(async () => {
    announcementServiceStub.getAnnouncements = () => of(mockAnnouncements);
    announcementServiceStub.createAnnouncement = () => of(mockAnnouncements[0]);

    await TestBed.configureTestingModule({
      imports: [AnnouncementListComponent],
      providers: [
        {
          provide: AnnouncementService,
          useValue: announcementServiceStub
        }
      ]
    }).compileComponents();
  });

  it('should load announcements from service on init', () => {
    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.announcements.length).toBe(1);
    expect(component.announcements[0].title).toBe('Community Meeting');
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should render newest announcements first even if API returns oldest first', () => {
    announcementServiceStub.getAnnouncements = () =>
      of([
        {
          id: 1,
          title: 'Older',
          author: 'Admin',
          content: 'Old post',
          created_at: '2026-03-03T20:50:00Z',
          updated_at: '2026-03-03T20:50:00Z',
          deleted_at: null
        },
        {
          id: 2,
          title: 'Newer',
          author: 'Admin',
          content: 'New post',
          created_at: '2026-03-04T20:50:00Z',
          updated_at: '2026-03-04T20:50:00Z',
          deleted_at: null
        }
      ]);

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.announcements[0].id).toBe(2);
    expect(component.announcements[1].id).toBe(1);
  });

  it('should set error state when service call fails', async () => {
    announcementServiceStub.getAnnouncements = () =>
      throwError(() => new Error('Network error'));

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('Failed to load announcements.');
  });

  it('should create announcement, update feed, and clear form', () => {
    const createdAnnouncement = {
      id: 2,
      title: 'Water Outage Notice',
      author: 'Admin',
      content: 'Water service will be down from 2-4 PM.',
      created_at: '2026-03-23T11:00:00Z',
      updated_at: '2026-03-23T11:00:00Z',
      deleted_at: null
    };
    let persistedAnnouncements = [...mockAnnouncements];
    announcementServiceStub.getAnnouncements = () => of(persistedAnnouncements);
    announcementServiceStub.createAnnouncement = () => {
      persistedAnnouncements = [createdAnnouncement, ...persistedAnnouncements];
      return of(createdAnnouncement);
    };

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.newPostTitle = 'Water Outage Notice';
    component.newPostContent = 'Water service will be down from 2-4 PM.';
    component.createPost();

    expect(component.submitErrorMessage).toBe('');
    expect(component.announcements[0].id).toBe(2);
    expect(component.announcements.length).toBe(2);
    expect(component.newPostTitle).toBe('');
    expect(component.newPostContent).toBe('');
    expect(component.isSubmitting).toBe(false);
  });

  it('should ignore stale responses from older fetch requests', () => {
    const firstResponse$ = new Subject<typeof mockAnnouncements>();
    const secondResponse$ = new Subject<typeof mockAnnouncements>();
    let fetchCallCount = 0;

    announcementServiceStub.getAnnouncements = () => {
      fetchCallCount += 1;
      return fetchCallCount === 1 ? firstResponse$ : secondResponse$;
    };

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.fetchAnnouncements();

    secondResponse$.next([
      {
        id: 99,
        title: 'Newest Snapshot',
        author: 'Admin',
        content: 'Latest API response.',
        created_at: '2026-03-24T00:00:00Z',
        updated_at: '2026-03-24T00:00:00Z',
        deleted_at: null
      }
    ]);
    secondResponse$.complete();

    firstResponse$.next(mockAnnouncements);
    firstResponse$.complete();

    expect(component.announcements[0].id).toBe(99);
  });

  it('should prevent create request when title or content is empty', () => {
    let createCalled = false;
    announcementServiceStub.createAnnouncement = () => {
      createCalled = true;
      return of(mockAnnouncements[0]);
    };

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.newPostTitle = '   ';
    component.newPostContent = 'Missing title';
    component.createPost();

    expect(createCalled).toBe(false);
    expect(component.submitErrorMessage).toBe('Title and content are required.');
  });

  it('should set submit error when create call fails with auth error', () => {
    announcementServiceStub.createAnnouncement = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { error: 'Invalid token' }
          })
      );

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.newPostTitle = 'Road Work';
    component.newPostContent = 'Road work starts tomorrow.';
    component.createPost();

    expect(component.isSubmitting).toBe(false);
    expect(component.submitErrorMessage).toBe('You must be logged in to post an announcement.');
  });
});
