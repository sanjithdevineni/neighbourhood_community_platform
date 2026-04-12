import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginUser } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly bioPlaceholder = 'Tell us something about yourself!';

  readonly user: LoginUser | null = this.authService.getStoredUser();

  get displayName(): string {
    const name = this.user?.name?.trim();
    if (name) {
      return name;
    }

    return 'Neighbor';
  }

  get displayEmail(): string {
    const email = this.user?.email?.trim();
    if (email) {
      return email;
    }

    return 'Not provided';
  }

  get hasBio(): boolean {
    return !!this.user?.bio?.trim();
  }

  get displayBio(): string {
    const bio = this.user?.bio?.trim();
    if (bio) {
      return bio;
    }

    return this.bioPlaceholder;
  }

  get initials(): string {
    const tokens = this.displayName
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return 'N';
    }

    const first = tokens[0][0];
    const second = tokens.length > 1 ? tokens[tokens.length - 1][0] : '';
    return `${first}${second}`.toUpperCase();
  }

  onLogout(): void {
    this.authService.clearAuthSession();
    void this.router.navigate(['/login']);
  }

  onBackToHome(): void {
    void this.router.navigate(['/']);
  }
}
