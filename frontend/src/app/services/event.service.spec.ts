import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { EventService } from './event.service';

describe('EventService', () => {
  it('normalizes snake_case event payload fields', async () => {
    let requestedUrl = '';
    const httpClientStub = {
      get: (url: string) => {
        requestedUrl = url;
        return of([
          {
            id: 1,
            title: ' Community BBQ ',
            date: '2026-04-20',
            time: '5:00 PM',
            location: 'Central Park Pavilion',
            image_url: '/uploads/example.jpg',
            author: 7,
            created_at: '2026-04-10T14:23:15Z'
          }
        ]);
      }
    } as unknown as HttpClient;

    const service = new EventService(httpClientStub);
    const events = await firstValueFrom(service.getEvents());

    expect(requestedUrl).toBe('/api/events');
    expect(events[0]).toEqual({
      id: 1,
      title: 'Community BBQ',
      date: '2026-04-20',
      time: '5:00 PM',
      location: 'Central Park Pavilion',
      image_url: '/uploads/example.jpg',
      author: '7',
      created_at: '2026-04-10T14:23:15Z',
      updated_at: undefined,
      deleted_at: null
    });
  });

  it('normalizes PascalCase fields and fallback defaults', async () => {
    const httpClientStub = {
      get: () =>
        of([
          {
            ID: 42,
            Title: ' ',
            Date: '2026-05-02',
            Time: '9:00 AM',
            Location: 'Depot Park',
            ImageURL: '/uploads/depot.jpg',
            Author: '9',
            CreatedAt: '2026-05-01T13:30:00Z',
            UpdatedAt: '2026-05-01T13:35:00Z',
            DeletedAt: null
          }
        ])
    } as unknown as HttpClient;

    const service = new EventService(httpClientStub);
    const events = await firstValueFrom(service.getEvents());

    expect(events[0]).toEqual({
      id: 42,
      title: 'Community Event',
      date: '2026-05-02',
      time: '9:00 AM',
      location: 'Depot Park',
      image_url: '/uploads/depot.jpg',
      author: '9',
      created_at: '2026-05-01T13:30:00Z',
      updated_at: '2026-05-01T13:35:00Z',
      deleted_at: null
    });
  });
});
