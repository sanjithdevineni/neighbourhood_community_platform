import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, map, of, retry, switchMap } from 'rxjs';
import { PostCardComponent } from '../post-card/post-card.component';
import { SearchService } from '../services/search.service';
import { AuthService } from '../services/auth.service';
import {
  AnnouncementService,
  Announcement,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload
} from '../services/announcement.service';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.css'
})
export class AnnouncementListComponent implements OnInit, OnDestroy {

  readonly fallbackAuthor = 'Community';
  private fetchRequestId = 0;
  private destroyed = false;
  constructor(
    private readonly searchService: SearchService,
    private readonly authService: AuthService,
    private readonly announcementService: AnnouncementService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  announcements: Announcement[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  submitErrorMessage = '';
  newPostTitle = '';
  newPostContent = '';
  currentUserId = '';
  currentUserName = '';
  isEditModalOpen = false;
  isUpdatingAnnouncement = false;
  editErrorMessage = '';
  editingAnnouncementId: number | null = null;
  editTitle = '';
  editContent = '';

  ngOnInit(): void {
    this.loadCurrentUserContext();
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
          if (requestId === this.fetchRequestId) {
            this.isLoading = false;
            this.safeDetectChanges();
          }
        })
      )
      .subscribe({
        next: (data) => {
          if (requestId !== this.fetchRequestId) {
            return;
          }
          this.announcements = this.sortAnnouncements(data);
          this.safeDetectChanges();
        },
        error: (error) => {
          if (requestId !== this.fetchRequestId) {
            return;
          }
          console.error(error);
          this.errorMessage = 'Failed to load announcements.';
          this.safeDetectChanges();
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
          this.isSubmitting = false;
          this.safeDetectChanges();
        })
      )
      .subscribe({
        next: (announcements) => {
          this.announcements = announcements;
          this.newPostTitle = '';
          this.newPostContent = '';
          this.safeDetectChanges();
        },
        error: (error: unknown) => {
          console.error(error);
          this.submitErrorMessage = this.getCreateErrorMessage(error);
          this.safeDetectChanges();
        }
      });
  }

  openEditModal(announcement: Announcement): void {
    if (!this.isOwnedByCurrentUser(announcement)) {
      return;
    }

    this.editingAnnouncementId = announcement.id;
    this.editTitle = announcement.title;
    this.editContent = announcement.content;
    this.editErrorMessage = '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.isUpdatingAnnouncement = false;
    this.editErrorMessage = '';
    this.editingAnnouncementId = null;
    this.editTitle = '';
    this.editContent = '';
  }

  saveEdit(): void {
    if (!this.editingAnnouncementId || this.isUpdatingAnnouncement) {
      return;
    }

    const payload: UpdateAnnouncementPayload = {
      id: this.editingAnnouncementId,
      title: this.editTitle.trim(),
      content: this.editContent.trim()
    };

    if (!payload.title || !payload.content) {
      this.editErrorMessage = 'Title and content are required.';
      this.safeDetectChanges();
      return;
    }

    this.isUpdatingAnnouncement = true;
    this.editErrorMessage = '';

    this.announcementService
      .updateAnnouncement(payload)
      .pipe(
        finalize(() => {
          this.isUpdatingAnnouncement = false;
          this.safeDetectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          this.announcements = this.sortAnnouncements(
            this.announcements.map((announcement) =>
              announcement.id === updated.id ? updated : announcement
            )
          );
          this.closeEditModal();
          this.safeDetectChanges();
        },
        error: (error: unknown) => {
          console.error(error);
          this.editErrorMessage = this.getUpdateErrorMessage(error);
          this.safeDetectChanges();
        }
      });
  }

  trackById(_index: number, announcement: Announcement): number {
    return announcement.id;
  }

  isOwnedByCurrentUser(announcement: Announcement): boolean {
    if (!this.currentUserId) {
      return false;
    }
    return announcement.author === this.currentUserId;
  }

  getAuthorDisplayName(announcement: Announcement): string {
    if (!announcement.author) {
      return this.fallbackAuthor;
    }

    if (announcement.author === this.currentUserId && this.currentUserName) {
      return this.currentUserName;
    }

    if (/^\d+$/.test(announcement.author)) {
      return `User ${announcement.author}`;
    }

    return announcement.author;
  }

  get composerInitials(): string {
    const source = this.currentUserName.trim() || this.fallbackAuthor;
    const names = source.split(' ').filter(Boolean);
    return names
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join('');
  }

  get filteredAnnouncements(): Announcement[] {
    const query = this.searchService.searchQuery().toLowerCase();

    if (!query) return this.announcements;

    return this.announcements.filter(announcement =>
      announcement.title.toLowerCase().includes(query) ||
      announcement.content.toLowerCase().includes(query) ||
      this.getAuthorDisplayName(announcement).toLowerCase().includes(query)
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

  private getUpdateErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Failed to update announcement. Please try again.';
    }

    if (error.status === 401) {
      return 'You must be logged in to edit announcements.';
    }

    if (error.status === 403) {
      return 'You can only edit your own announcements.';
    }

    if (error.status === 404) {
      return 'Announcement not found.';
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

    return 'Failed to update announcement. Please try again.';
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

  private loadCurrentUserContext(): void {
    const user = this.authService.getStoredUser();
    if (!user) {
      this.currentUserId = '';
      this.currentUserName = '';
      return;
    }

    this.currentUserId = `${user.id}`;
    this.currentUserName = user.name?.trim() ?? '';
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private safeDetectChanges(): void {
    if (this.destroyed) {
      return;
    }
    this.cdr.detectChanges();
  }
}
