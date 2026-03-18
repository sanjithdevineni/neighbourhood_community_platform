import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostCardComponent } from '../post-card/post-card.component';
import { SearchService } from '../services/search.service';
import { AnnouncementService, Announcement } from '../services/announcement.service';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.css'
})
export class AnnouncementListComponent implements OnInit {

  constructor(
    private searchService: SearchService,
    private announcementService: AnnouncementService
  ) {}

  announcements: Announcement[] = [];
  isLoading = false;
  errorMessage = '';
  newPostContent = '';
  showValidationError = false;

  ngOnInit(): void {
    this.fetchAnnouncements();
  }

  fetchAnnouncements(): void {
    this.isLoading = true;

    this.announcementService.getAnnouncements().subscribe({
      next: (data) => {
        this.announcements = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load announcements';
        this.isLoading = false;
      }
    });
  }

  private nextPostId = this.getNextPostId();

  createPost(): void {
    const trimmedContent = this.newPostContent.trim();

    if (!trimmedContent) {
      this.showValidationError = true;
      return;
    }

    const payload = {
      content: trimmedContent,
      category: 'General'
    };

    this.announcementService.createAnnouncement(payload).subscribe({
      next: () => {
        this.newPostContent = '';
        this.showValidationError = false;

        // Refresh list after successful creation
        this.fetchAnnouncements();
      },
      error: (error) => {
        console.error('Create failed:', error);
        alert('Failed to create announcement');
      }
    });
  }

  onContentChange(): void {
    if (this.showValidationError && this.newPostContent.trim()) {
      this.showValidationError = false;
    }
  }

  trackById(_index: number, announcement: Announcement): number {
    return announcement.id;
  }

  private getNextPostId(): number {
    const maxExistingId = this.announcements.reduce((maxId, announcement) => {
      return announcement.id > maxId ? announcement.id : maxId;
    }, 0);
    return maxExistingId + 1;
  }

  get filteredAnnouncements(): Announcement[] {
    const query = this.searchService.searchQuery().toLowerCase();

    if (!query) return this.announcements;

    return this.announcements.filter(announcement =>
      announcement.content.toLowerCase().includes(query) ||
      announcement.author.toLowerCase().includes(query) ||
      (announcement.category?.toLowerCase().includes(query) ?? false)
    );
  }

}
