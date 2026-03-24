import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementListComponent],
      providers: [
        {
          provide: AnnouncementService,
          useValue: {
            getAnnouncements: () => of(mockAnnouncements)
          }
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

  it('should set error state when service call fails', async () => {
    const service = TestBed.inject(AnnouncementService);
    spyOn(service, 'getAnnouncements').and.returnValue(
      throwError(() => new Error('Network error'))
    );

    const fixture = TestBed.createComponent(AnnouncementListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('Failed to load announcements.');
  });
});
