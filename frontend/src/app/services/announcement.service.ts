import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface Announcement {
  id: number;
  title: string;
  author: string;
  content: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private readonly apiUrl = `${ApiConfig.baseUrl}/announcements`;

  constructor(private http: HttpClient) {}

  getAnnouncements(): Observable<Announcement[]> {
    return this.http
      .get<Announcement[]>(this.apiUrl)
      .pipe(
        map((announcements) =>
          announcements.map((announcement) => ({
            ...announcement,
            title: announcement.title?.trim() || 'Announcement'
          }))
        )
      );
  }
}
