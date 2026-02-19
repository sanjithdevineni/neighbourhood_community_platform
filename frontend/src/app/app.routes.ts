import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { EventsComponent } from './pages/events/events.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'alerts', component: AlertsComponent },
  { path: 'events', component: EventsComponent },
];
