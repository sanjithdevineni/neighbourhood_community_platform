import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeighborhoodComponent } from './neighborhood.component';

describe('NeighborhoodComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeighborhoodComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NeighborhoodComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render neighborhood heading and map controls', () => {
    const fixture = TestBed.createComponent(NeighborhoodComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Neighborhood Map');
    expect(compiled.textContent).toContain('Zoom in');
    expect(compiled.textContent).toContain('Zoom out');
  });

  it('should show map categories and list items', () => {
    const fixture = TestBed.createComponent(NeighborhoodComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const categories = compiled.querySelectorAll('.category-button');
    const items = compiled.querySelectorAll('.landmark-card li');

    expect(categories.length).toBe(3);
    expect(compiled.textContent).toContain('Restaurants');
    expect(compiled.textContent).toContain('Shopping');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it('should switch visible items when category changes', () => {
    const fixture = TestBed.createComponent(NeighborhoodComponent);
    const component = fixture.componentInstance;

    expect(component.selectedCategory).toBe('Landmarks');

    component.selectCategory('Restaurants');

    expect(component.selectedCategory).toBe('Restaurants');
    expect(component.visibleItems.some((item) => item.name.includes('Sushi'))).toBe(true);
  });

  it('should focus a selected item on the map when marker exists', () => {
    const fixture = TestBed.createComponent(NeighborhoodComponent);
    const component = fixture.componentInstance as any;
    const restaurant = component.categoryData.Restaurants[0];
    const flyToSpy = vi.fn();
    const removeSpy = vi.fn();
    const openPopupSpy = vi.fn();

    component.map = { flyTo: flyToSpy, remove: removeSpy };
    component.categoryMarkers.set(restaurant.name, { openPopup: openPopupSpy });

    component.focusItem(restaurant);

    expect(component.activeItemName).toBe(restaurant.name);
    expect(flyToSpy).toHaveBeenCalled();
    expect(openPopupSpy).toHaveBeenCalled();
  });
});
