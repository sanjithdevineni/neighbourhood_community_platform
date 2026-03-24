import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

interface RawAnnouncement {
  id?: number;
  ID?: number;
  title?: string;
  Title?: string;
  content?: string;
  Content?: string;
  author?: string;
  Author?: string;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
  deleted_at?: string | null;
  DeletedAt?: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  author: string;
  content: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
}

export interface UpdateAnnouncementPayload {
  id: number;
  title?: string;
  content?: string;
}

export interface DeleteAnnouncementPayload {
  id: number;
}

export interface DeleteAnnouncementResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private readonly apiUrl = `${ApiConfig.baseUrl}/announcements`;
  private readonly tokenKey = 'auth_token';

  constructor(private readonly http: HttpClient) {}

  private normalizeAnnouncement(raw: RawAnnouncement): Announcement {
    return {
      id: raw.id ?? raw.ID ?? 0,
      title: (raw.title ?? raw.Title ?? '').trim() || 'Announcement',
      content: raw.content ?? raw.Content ?? '',
      author: raw.author ?? raw.Author ?? '',
      created_at: raw.created_at ?? raw.CreatedAt ?? '',
      updated_at: raw.updated_at ?? raw.UpdatedAt,
      deleted_at: raw.deleted_at ?? raw.DeletedAt ?? null
    };
  }

  getAnnouncements(): Observable<Announcement[]> {
    return this.http
      .get<RawAnnouncement[]>(this.apiUrl)
      .pipe(map((announcements) => announcements.map((raw) => this.normalizeAnnouncement(raw))));
  }

  createAnnouncement(payload: CreateAnnouncementPayload): Observable<Announcement> {
    const token = localStorage.getItem(this.tokenKey);
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : undefined;

    return this.http
      .post<RawAnnouncement>(this.apiUrl, payload, { headers })
      .pipe(map((raw) => this.normalizeAnnouncement(raw)));
  }

  updateAnnouncement(payload: UpdateAnnouncementPayload): Observable<Announcement> {
    const token = localStorage.getItem(this.tokenKey);
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : undefined;

    return this.http
      .post<RawAnnouncement>(`${this.apiUrl}/update`, payload, { headers })
      .pipe(map((raw) => this.normalizeAnnouncement(raw)));
  }

  deleteAnnouncement(payload: DeleteAnnouncementPayload): Observable<DeleteAnnouncementResponse> {
    const token = localStorage.getItem(this.tokenKey);
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : undefined;

    return this.http.post<DeleteAnnouncementResponse>(`${this.apiUrl}/delete`, payload, { headers });
  }
}
