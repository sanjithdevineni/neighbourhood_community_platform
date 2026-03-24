import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
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

  readonly fallbackAuthor = 'Community';
  constructor(
    private readonly searchService: SearchService,
    private readonly announcementService: AnnouncementService
  ) {}

  announcements: Announcement[] = [];
  isLoading = false;
  errorMessage = '';
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
    console.log('POST API will be implemented in FE-14');
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

}
