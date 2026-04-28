import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { EventService } from './event.service';

describe('EventService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('posts multipart event creation payload with auth token and normalizes response', async () => {
    localStorage.setItem('auth_token', 'jwt-token-123');

    let postedUrl = '';
    let postedTitle = '';
    let postedDate = '';
    let postedTime = '';
    let postedLocation = '';
    let postedImageName = '';
    const postedHeaders: { Authorization?: string } = {};

    const imageFile = new File(['image-content'], 'event.jpg', { type: 'image/jpeg' });
    const httpClientStub = {
      get: () => of([]),
      post: (url: string, body: unknown, options?: { headers?: { get(name: string): string | null } }) => {
        postedUrl = url;
        if (body instanceof FormData) {
          postedTitle = String(body.get('title') ?? '');
          postedDate = String(body.get('date') ?? '');
          postedTime = String(body.get('time') ?? '');
          postedLocation = String(body.get('location') ?? '');
          const image = body.get('image');
          if (image instanceof File) {
            postedImageName = image.name;
          }
        }
        const auth = options?.headers?.get('Authorization');
        if (auth) {
          postedHeaders['Authorization'] = auth;
        }
        return of({
          ID: 77,
          Title: 'Neighborhood Cleanup',
          Date: '2026-05-12',
          Time: '10:00 AM',
          Location: 'Depot Park',
          ImageURL: '/uploads/new-event.jpg',
          Author: '5',
          CreatedAt: '2026-05-01T13:30:00Z',
          UpdatedAt: '2026-05-01T13:30:00Z',
          DeletedAt: null
        });
      }
    } as unknown as HttpClient;

    const service = new EventService(httpClientStub);
    const created = await firstValueFrom(
      service.createEvent({
        title: 'Neighborhood Cleanup',
        date: '2026-05-12',
        time: '10:00 AM',
        location: 'Depot Park',
        image: imageFile
      })
    );

    expect(postedUrl).toBe('/api/events');
    expect(postedTitle).toBe('Neighborhood Cleanup');
    expect(postedDate).toBe('2026-05-12');
    expect(postedTime).toBe('10:00 AM');
    expect(postedLocation).toBe('Depot Park');
    expect(postedImageName).toBe('event.jpg');
    expect(postedHeaders['Authorization']).toBe('Bearer jwt-token-123');
    expect(created).toEqual({
      id: 77,
      title: 'Neighborhood Cleanup',
      date: '2026-05-12',
      time: '10:00 AM',
      location: 'Depot Park',
      image_url: '/uploads/new-event.jpg',
      author: '5',
      created_at: '2026-05-01T13:30:00Z',
      updated_at: '2026-05-01T13:30:00Z',
      deleted_at: null
    });
  });

  it('normalizes relative upload paths to absolute /uploads paths', async () => {
    const httpClientStub = {
      get: () =>
        of([
          {
            id: 5,
            title: 'Movie Night',
            date: '2026-06-02',
            time: '8:00 PM',
            location: 'Town Square',
            image_url: 'uploads/movie-night.jpg',
            author: 3,
            created_at: '2026-06-01T10:00:00Z'
          },
          {
            id: 6,
            title: 'Picnic',
            date: '2026-06-03',
            time: '11:00 AM',
            location: 'Lake Park',
            image_url: './uploads/picnic.jpg',
            author: 3,
            created_at: '2026-06-01T11:00:00Z'
          }
        ])
    } as unknown as HttpClient;

    const service = new EventService(httpClientStub);
    const events = await firstValueFrom(service.getEvents());

    expect(events[0].image_url).toBe('/uploads/movie-night.jpg');
    expect(events[1].image_url).toBe('/uploads/picnic.jpg');
  });

  it('sends authenticated delete request for event deletion', async () => {
    localStorage.setItem('auth_token', 'jwt-token-123');

    let deleteUrl = '';
    let deleteAuthHeader = '';
    const httpClientStub = {
      get: () => of([]),
      delete: (url: string, options?: { headers?: { get(name: string): string | null } }) => {
        deleteUrl = url;
        deleteAuthHeader = options?.headers?.get('Authorization') ?? '';
        return of({ message: 'Event deleted successfully' });
      }
    } as unknown as HttpClient;

    const service = new EventService(httpClientStub);
    await firstValueFrom(service.deleteEvent(101));

    expect(deleteUrl).toBe('/api/events/101');
    expect(deleteAuthHeader).toBe('Bearer jwt-token-123');
  });
});
