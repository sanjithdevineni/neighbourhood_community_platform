import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { NavbarComponent } from './navbar.component';
import { SearchService } from '../services/search.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to account page when account button is clicked', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onAccountClick();

    expect(navigateSpy).toHaveBeenCalledWith(['/account']);
  });

  it('should submit search query without page reload', () => {
    const searchService = TestBed.inject(SearchService);
    const setSearchSpy = vi.spyOn(searchService, 'setSearchQuery');
    const preventDefault = vi.fn();
    component.searchQuery = 'road repairs';

    component.onSearchSubmit({ preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(setSearchSpy).toHaveBeenCalledWith('road repairs');
    expect(searchService.searchQuery()).toBe('road repairs');
  });
});
