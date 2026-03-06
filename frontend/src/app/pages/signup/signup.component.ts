import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';

interface ApiErrorResponse {
  error?: string;
  details?: string;
}

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

  readonly signupForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.signupForm.getRawValue();

    this.authService.signup(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Account created successfully. Redirecting to login...';
        this.signupForm.reset();

        this.redirectSub?.unsubscribe();
        this.redirectSub = timer(1200).subscribe(() => {
          void this.router.navigate(['/login']);
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
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
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to reach the backend. Make sure the API is running.';
    }

    const response = error.error as ApiErrorResponse;
    if (response?.error) {
      return response.error;
    }

    if (response?.details) {
      return response.details;
    }

    return 'Signup failed. Please try again.';
  }
}
