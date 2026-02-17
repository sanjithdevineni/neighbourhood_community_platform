import { Component } from '@angular/core';
import { AnnouncementListComponent } from './announcement-list/announcement-list.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
