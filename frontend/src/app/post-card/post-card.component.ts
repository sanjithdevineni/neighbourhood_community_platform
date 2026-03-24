import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  @Input() title = '';
  @Input() category = '';
  @Input() content = '';
  @Input() imageUrl?: string;
  @Input() imageAlt = 'Post image';
  @Input() likes = 0;
  @Input() comments = 0;
  @Input() canEdit = false;
  @Input() canDelete = false;
  @Input() isDeleting = false;
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

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

  onEditClick(): void {
    this.editClicked.emit();
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}
