import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map, startWith } from 'rxjs';
import { DashboardCardComponent } from './dashboard-card/dashboard-card.component';
import { AuthService } from '../../core/services/auth.service';

interface DashboardCardCopy {
  welcomeMessage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryActionLabel: string;
  topicActionLabel: string;
  recentActionLabel: string;
}

const STANDARD_CARD_COPY: DashboardCardCopy = {
  welcomeMessage: 'Bienvenido Usuario',
  heroEyebrow: 'Dashboard',
  heroTitle: 'Research intelligence overview',
  heroSubtitle:
    'Visualise where your library is gaining impact, track emerging topics, and spot the freshest publications at a glance.',
  primaryActionLabel: 'Open article',
  topicActionLabel: 'View topic',
  recentActionLabel: 'Read summary',
};

const ADMIN_CARD_COPY: DashboardCardCopy = {
  welcomeMessage: 'Bienvenido Administrador',
  heroEyebrow: 'Admin dashboard',
  heroTitle: 'Administrative control center',
  heroSubtitle:
    'Monitor platform usage, oversee researcher activity, and coordinate upcoming initiatives from a single view.',
  primaryActionLabel: 'Ver artículo',
  topicActionLabel: 'Revisar tema',
  recentActionLabel: 'Consultar resumen',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  readonly cardCopy$ = this.authService.currentUser$.pipe(
    map((user) => (user?.role === 'admin' ? ADMIN_CARD_COPY : STANDARD_CARD_COPY)),
    startWith(STANDARD_CARD_COPY)
  );
}
