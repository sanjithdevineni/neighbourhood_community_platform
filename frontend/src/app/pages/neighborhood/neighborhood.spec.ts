import { TestBed } from '@angular/core/testing';
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
});
