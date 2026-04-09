import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subscription, timer, timeout, TimeoutError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
  isSubmitting = false;
  passwordVisible = false;
  successMessage = '';
  errorMessage = '';

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private redirectSub?: Subscription;
  private submitSafetyTimer?: ReturnType<typeof setTimeout>;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.startSubmitSafetyTimer();
    this.cdr.detectChanges();

    const payload = this.loginForm.getRawValue();

    this.authService
      .login(payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.clearSubmitSafetyTimer();
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (result) => {
          this.authService.storeAuthSession(result);
          this.successMessage = 'Login successful. Redirecting to home...';
          this.cdr.detectChanges();

          this.redirectSub?.unsubscribe();
          this.redirectSub = timer(800).subscribe(() => {
            void this.router.navigate(['/']);
          });
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error);
          this.cdr.detectChanges();
        }
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  getFieldError(fieldName: 'email' | 'password'): string {
    const field = this.loginForm.controls[fieldName];
    if (!field.touched) {
      return '';
    }

    if (field.hasError('required')) {
      return fieldName === 'email' ? 'Email is required.' : 'Password is required.';
    }

    if (fieldName === 'email' && field.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return '';
  }

  ngOnDestroy(): void {
    this.redirectSub?.unsubscribe();
    this.clearSubmitSafetyTimer();
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Login request timed out. Please try again.';
    }

    if (!(error instanceof HttpErrorResponse)) {
      return 'Login failed. Please try again.';
    }

    if (error.status === 0) {
      return 'Unable to reach the backend. Make sure the API is running.';
    }

    if (error.status === 401) {
      return 'Invalid email or password.';
    }

    if (error.status >= 500) {
      return 'Server error during login. Please try again in a moment.';
    }

    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error) as { error?: string; details?: string };
        if (parsed?.error) {
          return parsed.error;
        }
        if (parsed?.details) {
          return parsed.details;
        }
      } catch {
        if (error.error.trim()) {
          return error.error;
        }
      }
    }

    if (error.error?.error) {
      return error.error.error;
    }

    if (error.error?.details) {
      return error.error.details;
    }

    return 'Login failed. Please try again.';
  }

  private startSubmitSafetyTimer(): void {
    this.clearSubmitSafetyTimer();
    this.submitSafetyTimer = setTimeout(() => {
      if (!this.isSubmitting) {
        return;
      }
      this.isSubmitting = false;
      this.errorMessage = 'Login request took too long. Please try again.';
      this.cdr.detectChanges();
    }, 16000);
  }

  private clearSubmitSafetyTimer(): void {
    if (!this.submitSafetyTimer) {
      return;
    }
    clearTimeout(this.submitSafetyTimer);
    this.submitSafetyTimer = undefined;
  }
}
