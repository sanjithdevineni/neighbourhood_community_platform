import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subscription, timer, timeout, TimeoutError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnDestroy {
  isSubmitting = false;
  passwordVisible = false;
  successMessage = '';
  errorMessage = '';

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private redirectSub?: Subscription;
  private submitSafetyTimer?: ReturnType<typeof setTimeout>;

  readonly signupForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.startSubmitSafetyTimer();

    const payload = this.signupForm.getRawValue();

    this.authService
      .signup(payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.clearSubmitSafetyTimer();
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Account created successfully. Redirecting to login...';
          this.signupForm.reset();

          this.redirectSub?.unsubscribe();
          this.redirectSub = timer(1200).subscribe(() => {
            void this.router.navigate(['/login']);
          });
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error);
        }
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  getFieldError(fieldName: 'name' | 'email' | 'password'): string {
    const field = this.signupForm.controls[fieldName];

    if (!field.touched) {
      return '';
    }

    if (field.hasError('required')) {
      if (fieldName === 'name') return 'Full name is required.';
      if (fieldName === 'email') return 'Email is required.';
      return 'Password is required.';
    }

    if (fieldName === 'email' && field.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (fieldName === 'password' && field.hasError('minlength')) {
      return 'Password must be at least 8 characters.';
    }

    return '';
  }

  ngOnDestroy(): void {
    this.redirectSub?.unsubscribe();
    this.clearSubmitSafetyTimer();
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Signup request timed out. Please try again.';
    }

    if (!(error instanceof HttpErrorResponse)) {
      return 'Signup failed. Please try again.';
    }

    if (error.status === 0) {
      return 'Unable to reach the backend. Make sure the API is running.';
    }

    if (error.status === 409) {
      return 'Email already registered. Try logging in or use a different email.';
    }

    if (error.status >= 500) {
      return 'Server error during signup. Please try again in a moment.';
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

    return 'Signup failed. Please try again.';
  }

  private startSubmitSafetyTimer(): void {
    this.clearSubmitSafetyTimer();
    this.submitSafetyTimer = setTimeout(() => {
      if (!this.isSubmitting) {
        return;
      }
      this.isSubmitting = false;
      this.errorMessage = 'Signup request took too long. Please try again.';
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
