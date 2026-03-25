import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const authServiceStub: {
    isAuthenticated: () => boolean;
  } = {
    isAuthenticated: () => false
  };

  beforeEach(() => {
    authServiceStub.isAuthenticated = () => false;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceStub
        }
      ]
    });
  });

  it('should allow navigation when authenticated', () => {
    authServiceStub.isAuthenticated = () => true;
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('should redirect to login when unauthenticated', () => {
    authServiceStub.isAuthenticated = () => false;
    const router = TestBed.inject(Router);
    const expectedTree = router.createUrlTree(['/login']);
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toEqual(expectedTree);
  });
});
