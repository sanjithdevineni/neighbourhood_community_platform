import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css'
})
export class PostCardComponent {
  @Input() author = '';
  @Input() timestamp = '';
  @Input() category = '';
  @Input() content = '';
  @Input() imageUrl?: string;
  @Input() imageAlt = 'Post image';
  @Input() likes = 0;
  @Input() comments = 0;

  get authorInitials(): string {
    const names = this.author.trim().split(' ').filter(Boolean);
    if (names.length === 0) {
      return 'NA';
    }
    return names
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join('');
  }
}
