import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import announcementsData from './announcements.mock.json';
import { PostCardComponent } from '../post-card/post-card.component';
import { SearchService } from '../services/search.service';

interface Announcement {
  id: number;
  author: string;
  timestamp: string;
  category: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.css'
})
export class AnnouncementListComponent {

  constructor(private searchService: SearchService) {}

  announcements: Announcement[] = [...(announcementsData as Announcement[])];
  newPostContent = '';
  showValidationError = false;

  private nextPostId = this.getNextPostId();

  createPost(): void {
    const trimmedContent = this.newPostContent.trim();
    if (!trimmedContent) {
      this.showValidationError = true;
      return;
    }

    const newPost: Announcement = {
      id: this.nextPostId++,
      author: 'You',
      timestamp: 'Just now',
      category: 'General',
      content: trimmedContent,
      likes: 0,
      comments: 0
    };

    this.announcements = [newPost, ...this.announcements];
    this.newPostContent = '';
    this.showValidationError = false;
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
      announcement.category.toLowerCase().includes(query)
    );
  }

}
