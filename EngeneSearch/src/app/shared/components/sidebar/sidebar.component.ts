import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

type Role = 'user' | 'admin';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  roles?: Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly menuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/search', label: 'Assisted search', icon: 'search' },
    { href: '/mis-articulos', label: 'Mis articulos', icon: 'my-articles', roles: ['user', 'admin'] },
    { href: '/usuarios', label: 'Usuarios', icon: 'users', roles: ['admin'] },
    { href: '/saved', label: 'Saved', icon: 'bookmark' },
    { href: '/graph', label: 'Graph', icon: 'graph' },
  ];

  // Placeholder for role-based visibility. Replace with real auth service later.
  currentRole: Role = 'admin';

  get visibleMenuItems(): MenuItem[] {
    return this.menuItems.filter((m) => !m.roles || m.roles.includes(this.currentRole));
  }

  constructor(private readonly router: Router) {}

  isActive(path: string): boolean {
    return this.router.isActive(path, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
