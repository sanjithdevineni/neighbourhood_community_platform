import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface EventItem {
  id: number;
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  interested: number;
  imageUrl: string;
  author: string;
  createdByUser?: boolean;
}

export interface CreateEventPayload {
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  image?: File;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${ApiConfig.baseUrl}/events`;
  private readonly tokenKey = 'auth_token';

  constructor(private readonly http: HttpClient) {}

  private extractDate(dateStr: string): string {
    if (dateStr.includes('|')) return dateStr.split('|')[0];
    return dateStr;
  }

  private extractMonth(dateStr: string): string {
    if (dateStr.includes('|')) return dateStr.split('|')[1];
    return '';
  }

  getEvents(): Observable<EventItem[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(events => events.map(e => ({
        id: e.ID,
        title: e.title,
        date: this.extractDate(e.date),
        month: this.extractMonth(e.date),
        time: e.time,
        location: e.location,
        interested: 0,
        imageUrl: e.image_url ? `${ApiConfig.baseUrl.replace('/api', '')}${e.image_url}` : '',
        author: e.author || ''
      })))
    );
  }

  createEvent(payload: CreateEventPayload): Observable<EventItem> {
    const token = localStorage.getItem(this.tokenKey);
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    
    const formData = new FormData();
    formData.append('title', payload.title);
    
    // We pack date and month into the date field since the backend schema lacks a separate month string
    formData.append('date', `${payload.date}|${payload.month}`);
    
    formData.append('time', payload.time);
    formData.append('location', payload.location);
    if (payload.image) {
      formData.append('image', payload.image);
    }
    
    return this.http.post<any>(this.apiUrl, formData, { headers }).pipe(
      map(e => ({
        id: e.ID,
        title: e.title,
        date: this.extractDate(e.date),
        month: this.extractMonth(e.date),
        time: e.time,
        location: e.location,
        interested: 0,
        imageUrl: e.image_url ? `${ApiConfig.baseUrl.replace('/api', '')}${e.image_url}` : '',
        author: e.author || ''
      }))
    );
  }
}
