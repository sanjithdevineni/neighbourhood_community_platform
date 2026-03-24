import { TestBed } from '@angular/core/testing';
import { PostCardComponent } from './post-card.component';

describe('PostCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCardComponent]
    }).compileComponents();
  });

  it('should render icons row', () => {
    const fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('author', 'Test Author');
    fixture.componentRef.setInput('timestamp', 'Now');
    fixture.componentRef.setInput('category', 'General');
    fixture.componentRef.setInput('content', 'Test content');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.interaction-row button');
    expect(buttons.length).toBe(3);
  });

  it('should not render image when imageUrl is not provided', () => {
    const fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('author', 'Test Author');
    fixture.componentRef.setInput('timestamp', 'Now');
    fixture.componentRef.setInput('category', 'General');
    fixture.componentRef.setInput('content', 'Test content');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.post-image')).toBeNull();
  });

  it('should render image when imageUrl is provided', () => {
    const fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('author', 'Test Author');
    fixture.componentRef.setInput('timestamp', 'Now');
    fixture.componentRef.setInput('category', 'General');
    fixture.componentRef.setInput('content', 'Test content');
    fixture.componentRef.setInput('imageUrl', 'https://example.com/post.jpg');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.post-image')).not.toBeNull();
  });

  it('should render delete button when canDelete is true', () => {
    const fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('author', 'Test Author');
    fixture.componentRef.setInput('timestamp', 'Now');
    fixture.componentRef.setInput('category', 'General');
    fixture.componentRef.setInput('content', 'Test content');
    fixture.componentRef.setInput('canDelete', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.delete-btn')).not.toBeNull();
  });

  it('should emit deleteClicked when delete is clicked', () => {
    const fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('author', 'Test Author');
    fixture.componentRef.setInput('timestamp', 'Now');
    fixture.componentRef.setInput('category', 'General');
    fixture.componentRef.setInput('content', 'Test content');
    fixture.componentRef.setInput('canDelete', true);

    let emitted = false;
    fixture.componentInstance.deleteClicked.subscribe(() => {
      emitted = true;
    });
    fixture.detectChanges();

    const deleteButton = (fixture.nativeElement as HTMLElement).querySelector('.delete-btn') as HTMLButtonElement;
    deleteButton.click();

    expect(emitted).toBe(true);
  });
});
