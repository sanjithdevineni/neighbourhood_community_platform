import { TestBed } from '@angular/core/testing';
import { AlertsComponent } from './alerts.component';

describe('AlertsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AlertsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render at least two alert cards', () => {
    const fixture = TestBed.createComponent(AlertsComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.alert-card');

    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('should show alerts page heading', () => {
    const fixture = TestBed.createComponent(AlertsComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Alerts in Point West');
  });
});
