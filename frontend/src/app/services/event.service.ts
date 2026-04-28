import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

interface RawEvent {
  id?: number;
  ID?: number;
  title?: string;
  Title?: string;
  date?: string;
  Date?: string;
  time?: string;
  Time?: string;
  location?: string;
  Location?: string;
  image_url?: string;
  imageUrl?: string;
  ImageURL?: string;
  author?: string | number;
  Author?: string | number;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
  deleted_at?: string | null;
  DeletedAt?: string | null;
}

export interface CommunityEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  image_url: string;
  author: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateEventPayload {
  title: string;
  date: string;
  time: string;
  location: string;
  image?: File | null;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${ApiConfig.baseUrl}/events`;
  private readonly tokenKey = 'auth_token';

  constructor(private readonly http: HttpClient) {}

  private normalizeImageUrl(rawImageUrl: string | undefined): string {
    const value = (rawImageUrl ?? '').trim();
    if (!value) {
      return '';
    }

    if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
      return value;
    }

    const normalizedPath = value.replaceAll('\\', '/').replace(/^\.?\//, '');
    if (normalizedPath.startsWith('uploads/')) {
      return `/${normalizedPath}`;
    }

    return value;
  }

  private normalizeEvent(raw: RawEvent): CommunityEvent {
    const rawImageUrl = raw.image_url ?? raw.imageUrl ?? raw.ImageURL;
    return {
      id: raw.id ?? raw.ID ?? 0,
      title: (raw.title ?? raw.Title ?? '').trim() || 'Community Event',
      date: raw.date ?? raw.Date ?? '',
      time: raw.time ?? raw.Time ?? '',
      location: raw.location ?? raw.Location ?? '',
      image_url: this.normalizeImageUrl(rawImageUrl),
      author: String(raw.author ?? raw.Author ?? ''),
      created_at: raw.created_at ?? raw.CreatedAt ?? '',
      updated_at: raw.updated_at ?? raw.UpdatedAt,
      deleted_at: raw.deleted_at ?? raw.DeletedAt ?? null
    };
  }

  getEvents(): Observable<CommunityEvent[]> {
    return this.http
      .get<RawEvent[] | null>(this.apiUrl)
      .pipe(map((events) => (events ?? []).map((event) => this.normalizeEvent(event))));
  }

  createEvent(payload: CreateEventPayload): Observable<CommunityEvent> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('date', payload.date);
    formData.append('time', payload.time);
    formData.append('location', payload.location);

    if (payload.image) {
      formData.append('image', payload.image);
    }

    const token = localStorage.getItem(this.tokenKey);
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : undefined;

    return this.http
      .post<RawEvent>(this.apiUrl, formData, { headers })
      .pipe(map((event) => this.normalizeEvent(event)));
  }

  deleteEvent(eventId: number): Observable<void> {
    const token = localStorage.getItem(this.tokenKey);
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : undefined;

    return this.http
      .delete(`${this.apiUrl}/${eventId}`, { headers, observe: 'response', responseType: 'text' })
      .pipe(map(() => undefined));
  }
}
