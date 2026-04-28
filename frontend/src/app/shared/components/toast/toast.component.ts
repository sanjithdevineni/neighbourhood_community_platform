import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastMessage, ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit, OnDestroy {
  activeToasts: ToastMessage[] = [];
  private subscription?: Subscription;

  constructor(
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.toastService.toasts$.subscribe(toast => {
      this.activeToasts.push(toast);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration || 4000);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  removeToast(id: number) {
    this.activeToasts = this.activeToasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }
}
