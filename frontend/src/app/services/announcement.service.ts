import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Announcement {
  ID: number;
  title: string;
  content: string;
  author: string;
  CreatedAt: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private apiUrl = '/api/announcements';

  constructor(private http: HttpClient) {}

  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl);
  }

  createAnnouncement(data: { content: string; category: string }): Observable<Announcement> {
    return this.http.post<Announcement>(this.apiUrl, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

}
