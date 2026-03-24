import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
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
  constructor(
    private readonly searchService: SearchService,
    private readonly announcementService: AnnouncementService
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
    this.isLoading = true;
    this.errorMessage = '';

    this.announcementService
      .getAnnouncements()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.announcements = data;
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Failed to load announcements.';
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
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (announcement) => {
          this.announcements = [announcement, ...this.announcements];
          this.newPostTitle = '';
          this.newPostContent = '';
        },
        error: (error: unknown) => {
          console.error(error);
          this.submitErrorMessage = this.getCreateErrorMessage(error);
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

}
