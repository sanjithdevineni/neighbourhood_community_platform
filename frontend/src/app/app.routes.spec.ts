import { routes } from './app.routes';
import { authGuard } from './guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { AccountComponent } from './pages/account/account.component';
import { NeighborhoodComponent } from './pages/neighborhood/neighborhood.component';

describe('App Routes', () => {
  it('should redirect root path to login', () => {
    const rootRedirectRoute = routes.find((route) => route.path === '' && route.redirectTo === 'login');

    expect(rootRedirectRoute).toBeDefined();
    expect(rootRedirectRoute?.pathMatch).toBe('full');
  });

  it('should protect account route with auth guard', () => {
    const accountRoute = routes.find((route) => route.path === 'account');

    expect(accountRoute).toBeDefined();
    expect(accountRoute?.component).toBe(AccountComponent);
    expect(accountRoute?.canActivate).toContain(authGuard);
  });

  it('should include neighborhood page in authenticated child routes', () => {
    const layoutRoute = routes.find((route) => route.component === LayoutComponent);
    const neighborhoodRoute = layoutRoute?.children?.find((route) => route.path === 'neighborhood');

    expect(neighborhoodRoute).toBeDefined();
    expect(neighborhoodRoute?.component).toBe(NeighborhoodComponent);
  });

  it('should include wildcard redirect to root', () => {
    const wildcardRoute = routes.find((route) => route.path === '**');

    expect(wildcardRoute?.redirectTo).toBe('login');
  });
});
