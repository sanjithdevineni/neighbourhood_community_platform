import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { AnnouncementService } from './announcement.service';

describe('AnnouncementService', () => {
  it('normalizes snake_case payload fields', async () => {
    let requestedUrl = '';
    const httpClientStub = {
      get: (url: string) => {
        requestedUrl = url;
        return of([
          {
            id: 1,
            title: ' Neighborhood Watch ',
            content: 'Meeting tonight at 7 PM.',
            author: 'Admin',
            created_at: '2026-03-03T20:50:00Z',
            updated_at: '2026-03-03T21:00:00Z',
            deleted_at: null
          }
        ]);
      }
    } as unknown as HttpClient;

    const service = new AnnouncementService(httpClientStub);
    const announcements = await firstValueFrom(service.getAnnouncements());

    expect(requestedUrl).toBe('/api/announcements');
    expect(announcements[0]).toEqual({
      id: 1,
      title: 'Neighborhood Watch',
      content: 'Meeting tonight at 7 PM.',
      author: 'Admin',
      created_at: '2026-03-03T20:50:00Z',
      updated_at: '2026-03-03T21:00:00Z',
      deleted_at: null
    });
  });

  it('normalizes PascalCase payload fields to frontend shape', async () => {
    const httpClientStub = {
      get: () =>
        of([
          {
            ID: 42,
            Title: '  Community Meeting This Friday  ',
            Content: 'We will discuss the new parking rules.',
            Author: '1',
            CreatedAt: '2026-03-03T20:50:00Z',
            UpdatedAt: '2026-03-03T20:50:00Z',
            DeletedAt: null
          }
        ])
    } as unknown as HttpClient;

    const service = new AnnouncementService(httpClientStub);
    const announcements = await firstValueFrom(service.getAnnouncements());

    expect(announcements[0].id).toBe(42);
    expect(announcements[0].title).toBe('Community Meeting This Friday');
    expect(announcements[0].content).toBe('We will discuss the new parking rules.');
    expect(announcements[0].author).toBe('1');
    expect(announcements[0].created_at).toBe('2026-03-03T20:50:00Z');
    expect(announcements[0].updated_at).toBe('2026-03-03T20:50:00Z');
    expect(announcements[0].deleted_at).toBeNull();
  });
});
