import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SignupComponent } from './signup.component';
import { AuthService, SignupUser } from '../../services/auth.service';

describe('SignupComponent', () => {
  const createdUser: SignupUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2026-03-24T12:00:00Z'
  };

  const authServiceStub: {
    signup: (payload: { name: string; email: string; password: string }) => Observable<SignupUser>;
  } = {
    signup: () => of(createdUser)
  };

  beforeEach(async () => {
    authServiceStub.signup = () => of(createdUser);

    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceStub
        }
      ]
    }).compileComponents();
  });

  it('should mark fields touched and not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(SignupComponent);
    const component = fixture.componentInstance;
    const signupSpy = vi.spyOn(authServiceStub, 'signup');

    component.onSubmit();

    expect(component.signupForm.controls.name.touched).toBe(true);
    expect(component.signupForm.controls.email.touched).toBe(true);
    expect(component.signupForm.controls.password.touched).toBe(true);
    expect(signupSpy).not.toHaveBeenCalled();
  });

  it('should submit signup successfully and navigate to login', () => {
    vi.useFakeTimers();

    try {
      const fixture = TestBed.createComponent(SignupComponent);
      const component = fixture.componentInstance;
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.signupForm.setValue({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      component.onSubmit();

      expect(component.successMessage).toContain('Account created successfully');
      expect(component.errorMessage).toBe('');
      expect(component.isSubmitting).toBe(false);
      expect(component.signupForm.getRawValue()).toEqual({
        name: '',
        email: '',
        password: ''
      });

      vi.advanceTimersByTime(1200);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show conflict error when signup returns 409', () => {
    authServiceStub.signup = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { error: 'duplicate email' }
          })
      );

    const fixture = TestBed.createComponent(SignupComponent);
    const component = fixture.componentInstance;

    component.signupForm.setValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    component.onSubmit();

    expect(component.isSubmitting).toBe(false);
    expect(component.errorMessage).toBe(
      'Email already registered. Try logging in or use a different email.'
    );
  });
});
