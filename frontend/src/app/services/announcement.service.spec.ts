import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { AnnouncementService } from './announcement.service';

describe('AnnouncementService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('posts announcement with bearer token and normalizes created payload', async () => {
    localStorage.setItem('auth_token', 'jwt-token-123');

    let postedUrl = '';
    let postedBody: unknown;
    const postedHeaders: { Authorization?: string } = {};
    const httpClientStub = {
      get: () => of([]),
      post: (url: string, body: unknown, options?: { headers?: { get(name: string): string | null } }) => {
        postedUrl = url;
        postedBody = body;
        const auth = options?.headers?.get('Authorization');
        if (auth) {
          postedHeaders['Authorization'] = auth;
        }
        return of({
          ID: 77,
          Title: '  Road Closure Notice ',
          Content: 'Main St will be closed this weekend.',
          Author: '2',
          CreatedAt: '2026-03-23T10:15:00Z',
          UpdatedAt: '2026-03-23T10:15:00Z',
          DeletedAt: null
        });
      }
    } as unknown as HttpClient;

    const service = new AnnouncementService(httpClientStub);
    const created = await firstValueFrom(
      service.createAnnouncement({
        title: 'Road Closure Notice',
        content: 'Main St will be closed this weekend.'
      })
    );

    expect(postedUrl).toBe('/api/announcements');
    expect(postedBody).toEqual({
      title: 'Road Closure Notice',
      content: 'Main St will be closed this weekend.'
    });
    expect(postedHeaders['Authorization']).toBe('Bearer jwt-token-123');
    expect(created).toEqual({
      id: 77,
      title: 'Road Closure Notice',
      content: 'Main St will be closed this weekend.',
      author: '2',
      created_at: '2026-03-23T10:15:00Z',
      updated_at: '2026-03-23T10:15:00Z',
      deleted_at: null
    });
  });
});
