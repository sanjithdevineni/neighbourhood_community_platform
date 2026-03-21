import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Announcement {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  category?: string;
  imageUrl?: string;
  likes?: number;
  comments?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private apiUrl = 'http://localhost:8080/api/announcements';
  // change port/path based on your Go backend

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
