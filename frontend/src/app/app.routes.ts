import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { EventsComponent } from './pages/events/events.component';
import { LayoutComponent } from './layout/layout.component';
import { SignupComponent } from './pages/signup/signup.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'alerts', component: AlertsComponent },
      { path: 'events', component: EventsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
