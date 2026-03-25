import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService, LoginResult } from '../../services/auth.service';

describe('LoginComponent', () => {
  const loginResult: LoginResult = {
    token: 'jwt-token',
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      created_at: '2026-03-24T12:00:00Z'
    }
  };

  const authServiceStub: {
    login: (payload: { email: string; password: string }) => Observable<LoginResult>;
    storeAuthSession: (result: LoginResult) => void;
  } = {
    login: () => of(loginResult),
    storeAuthSession: () => undefined
  };

  beforeEach(async () => {
    authServiceStub.login = () => of(loginResult);
    authServiceStub.storeAuthSession = () => undefined;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
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
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const loginSpy = vi.spyOn(authServiceStub, 'login');

    component.onSubmit();

    expect(component.loginForm.controls.email.touched).toBe(true);
    expect(component.loginForm.controls.password.touched).toBe(true);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('should submit login successfully, store session, and navigate home', () => {
    vi.useFakeTimers();

    try {
      const fixture = TestBed.createComponent(LoginComponent);
      const component = fixture.componentInstance;
      const router = TestBed.inject(Router);

      const storeSpy = vi
        .spyOn(authServiceStub, 'storeAuthSession')
        .mockImplementation(() => undefined);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.loginForm.setValue({
        email: 'john@example.com',
        password: 'password123'
      });
      component.onSubmit();

      expect(storeSpy).toHaveBeenCalledWith(loginResult);
      expect(component.successMessage).toContain('Login successful');
      expect(component.errorMessage).toBe('');
      expect(component.isSubmitting).toBe(false);

      vi.advanceTimersByTime(800);
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show invalid credentials message on 401', () => {
    authServiceStub.login = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { error: 'invalid credentials' }
          })
      );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.loginForm.setValue({
      email: 'john@example.com',
      password: 'wrong-password'
    });
    component.onSubmit();

    expect(component.isSubmitting).toBe(false);
    expect(component.errorMessage).toBe('Invalid email or password.');
  });
});
