import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type AlertStatus = 'LIVE' | 'CLOSED' | 'UPCOMING';
type AlertTone = 'danger' | 'caution' | 'notice';

interface NeighborhoodAlert {
  id: number;
  title: string;
  location: string;
  distance: string;
  timeAgo: string;
  description: string;
  status: AlertStatus;
  tone: AlertTone;
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.css'
})
export class AlertsComponent {
  readonly tabs = ['All', 'Safety', 'Outages', 'Weather', 'Fires'];

  readonly alerts: NeighborhoodAlert[] = [
    {
      id: 1,
      title: 'Structure Fire Reported',
      location: '2249 Stadium Rd',
      distance: '1.2 mi away',
      timeAgo: '2h ago',
      description: 'Structure fire reported at 2249 Stadium Rd. Please avoid the area to allow emergency access.',
      status: 'LIVE',
      tone: 'danger'
    },
    {
      id: 2,
      title: 'Tornado Watch in Alachua Co.',
      location: 'County-wide',
      distance: '2.2 mi away',
      timeAgo: '2d ago',
      description: 'Tornado watch active from 1:00 PM to 8:00 PM EST. Stay weather-aware and monitor updates.',
      status: 'CLOSED',
      tone: 'caution'
    },
    {
      id: 3,
      title: 'Scheduled Water Maintenance',
      location: 'Pine Terrace',
      distance: '0.5 mi away',
      timeAgo: '3d ago',
      description: 'Water service will be shut off for 2 hours on Thursday morning for planned pipe repairs.',
      status: 'UPCOMING',
      tone: 'notice'
    }
  ];

  trackById(_index: number, alert: NeighborhoodAlert): number {
    return alert.id;
  }
}
