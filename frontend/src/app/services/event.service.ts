import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${ApiConfig.baseUrl}/events`;

  constructor(private readonly http: HttpClient) {}

  private normalizeEvent(raw: RawEvent): CommunityEvent {
    return {
      id: raw.id ?? raw.ID ?? 0,
      title: (raw.title ?? raw.Title ?? '').trim() || 'Community Event',
      date: raw.date ?? raw.Date ?? '',
      time: raw.time ?? raw.Time ?? '',
      location: raw.location ?? raw.Location ?? '',
      image_url: raw.image_url ?? raw.imageUrl ?? raw.ImageURL ?? '',
      author: String(raw.author ?? raw.Author ?? ''),
      created_at: raw.created_at ?? raw.CreatedAt ?? '',
      updated_at: raw.updated_at ?? raw.UpdatedAt,
      deleted_at: raw.deleted_at ?? raw.DeletedAt ?? null
    };
  }

  getEvents(): Observable<CommunityEvent[]> {
    return this.http
      .get<RawEvent[]>(this.apiUrl)
      .pipe(map((events) => events.map((event) => this.normalizeEvent(event))));
  }
}
