import { routes } from './app.routes';
import { authGuard } from './guards/auth.guard';
import { AccountComponent } from './pages/account/account.component';
import { NeighborhoodComponent } from './pages/neighborhood/neighborhood.component';

describe('App Routes', () => {
  it('should protect account route with auth guard', () => {
    const accountRoute = routes.find((route) => route.path === 'account');

    expect(accountRoute).toBeDefined();
    expect(accountRoute?.component).toBe(AccountComponent);
    expect(accountRoute?.canActivate).toContain(authGuard);
  });

  it('should include neighborhood page in authenticated child routes', () => {
    const layoutRoute = routes.find((route) => route.path === '');
    const neighborhoodRoute = layoutRoute?.children?.find((route) => route.path === 'neighborhood');

    expect(neighborhoodRoute).toBeDefined();
    expect(neighborhoodRoute?.component).toBe(NeighborhoodComponent);
  });

  it('should include wildcard redirect to root', () => {
    const wildcardRoute = routes.find((route) => route.path === '**');

    expect(wildcardRoute?.redirectTo).toBe('');
  });
});
