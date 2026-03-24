import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, map, of, retry, switchMap } from 'rxjs';
import { PostCardComponent } from '../post-card/post-card.component';
import { SearchService } from '../services/search.service';
import {
  AnnouncementService,
  Announcement,
  CreateAnnouncementPayload
} from '../services/announcement.service';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.css'
})
export class AnnouncementListComponent implements OnInit {

  readonly fallbackAuthor = 'Community';
  private fetchRequestId = 0;
  constructor(
    private readonly searchService: SearchService,
    private readonly announcementService: AnnouncementService,
    private readonly ngZone: NgZone
  ) {}

  announcements: Announcement[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  submitErrorMessage = '';
  newPostTitle = '';
  newPostContent = '';

  ngOnInit(): void {
    this.fetchAnnouncements();
  }

  fetchAnnouncements(): void {
    const requestId = ++this.fetchRequestId;
    this.isLoading = true;
    this.errorMessage = '';

    this.announcementService
      .getAnnouncements()
      .pipe(
        retry({ count: 2, delay: 300 }),
        finalize(() => {
          this.ngZone.run(() => {
            if (requestId === this.fetchRequestId) {
              this.isLoading = false;
            }
          });
        })
      )
      .subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            if (requestId !== this.fetchRequestId) {
              return;
            }
            this.announcements = this.sortAnnouncements(data);
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            if (requestId !== this.fetchRequestId) {
              return;
            }
            console.error(error);
            this.errorMessage = 'Failed to load announcements.';
          });
        }
      });
  }

  createPost(): void {
    if (this.isSubmitting) {
      return;
    }

    const payload: CreateAnnouncementPayload = {
      title: this.newPostTitle.trim(),
      content: this.newPostContent.trim()
    };

    if (!payload.title || !payload.content) {
      this.submitErrorMessage = 'Title and content are required.';
      return;
    }

    this.isSubmitting = true;
    this.submitErrorMessage = '';

    this.announcementService
      .createAnnouncement(payload)
      .pipe(
        switchMap((createdAnnouncement) =>
          this.announcementService
            .getAnnouncements()
            .pipe(
              retry({ count: 2, delay: 300 }),
              map((announcements) => this.sortAnnouncements(announcements)),
              catchError((refreshError) => {
                console.error(refreshError);
                return of(this.sortAnnouncements([createdAnnouncement, ...this.announcements]));
              })
            )
        ),
        finalize(() => {
          this.ngZone.run(() => {
            this.isSubmitting = false;
          });
        })
      )
      .subscribe({
        next: (announcements) => {
          this.ngZone.run(() => {
            this.announcements = announcements;
            this.newPostTitle = '';
            this.newPostContent = '';
          });
        },
        error: (error: unknown) => {
          this.ngZone.run(() => {
            console.error(error);
            this.submitErrorMessage = this.getCreateErrorMessage(error);
          });
        }
      });
  }

  trackById(_index: number, announcement: Announcement): number {
    return announcement.id;
  }

  get filteredAnnouncements(): Announcement[] {
    const query = this.searchService.searchQuery().toLowerCase();

    if (!query) return this.announcements;

    return this.announcements.filter(announcement =>
      announcement.title.toLowerCase().includes(query) ||
      announcement.content.toLowerCase().includes(query) ||
      announcement.author.toLowerCase().includes(query)
    );
  }

  formatTimestamp(createdAt: string): string {
    if (!createdAt) {
      return 'Recently';
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return createdAt;
    }

    return date.toLocaleString();
  }

  private getCreateErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Failed to create announcement. Please try again.';
    }

    if (error.status === 401) {
      return 'You must be logged in to post an announcement.';
    }

    if (error.status === 0) {
      return 'Unable to reach the backend. Make sure the API is running.';
    }

    if (typeof error.error === 'string') {
      const trimmed = error.error.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    if (error.error?.error) {
      return error.error.error;
    }

    return 'Failed to create announcement. Please try again.';
  }

  private sortAnnouncements(announcements: Announcement[]): Announcement[] {
    return [...announcements].sort((a, b) => {
      const timestampA = this.getTimestampValue(a.created_at);
      const timestampB = this.getTimestampValue(b.created_at);
      if (timestampA !== timestampB) {
        return timestampB - timestampA;
      }
      return b.id - a.id;
    });
  }

  private getTimestampValue(value: string): number {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return 0;
    }
    return parsed;
  }
}
