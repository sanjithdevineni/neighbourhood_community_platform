import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AccountComponent } from './account.component';
import { AuthService, LoginUser } from '../../services/auth.service';

describe('AccountComponent', () => {
  const authServiceStub: {
    getStoredUser: () => LoginUser | null;
    clearAuthSession: () => void;
  } = {
    getStoredUser: () => ({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Community member since 2024.',
      created_at: '2026-03-01T12:00:00Z'
    }),
    clearAuthSession: () => undefined
  };

  beforeEach(async () => {
    authServiceStub.getStoredUser = () => ({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Community member since 2024.',
      created_at: '2026-03-01T12:00:00Z'
    });
    authServiceStub.clearAuthSession = () => undefined;

    await TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceStub
        }
      ]
    }).compileComponents();
  });

  it('should render user details and initials from stored user', () => {
    const fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.initials).toBe('JD');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John Doe');
    expect(compiled.textContent).toContain('john@example.com');
    expect(compiled.textContent).toContain('Community member since 2024.');
  });

  it('should show placeholder bio when bio is missing', () => {
    authServiceStub.getStoredUser = () => ({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      created_at: '2026-03-01T12:00:00Z'
    });

    const fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Bio');
    expect(compiled.textContent).toContain('Tell us something about yourself!');
  });

  it('should render back to home button and navigate home on click', () => {
    const fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const homeButton = compiled.querySelector('.home-btn') as HTMLButtonElement;

    expect(homeButton).not.toBeNull();
    expect(homeButton.textContent).toContain('Back to Home');

    homeButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should clear auth session and navigate to login on logout', async () => {
    const fixture = TestBed.createComponent(AccountComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);

    const clearSpy = vi.spyOn(authServiceStub, 'clearAuthSession').mockImplementation(() => undefined);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onLogout();

    expect(clearSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
