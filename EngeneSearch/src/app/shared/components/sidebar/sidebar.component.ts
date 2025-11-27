import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, AppRole } from '../../../core/services/auth.service';

type Role = AppRole;

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
    { href: '/dashboard', label: 'Dashboard', icon: 'home', roles: ['user', 'admin'] },
    { href: '/search', label: 'Assisted search', icon: 'search', roles: ['user'] },
    { href: '/mis-articulos', label: 'My Articles', icon: 'my-articles', roles: ['user'] },
    { href: '/articles', label: 'Articles', icon: 'article', roles: ['admin'] },
    { href: '/usuarios', label: 'Users', icon: 'users', roles: ['admin'] },
    { href: '/saved', label: 'Saved', icon: 'bookmark', roles: ['user'] },
    { href: '/graph', label: 'Graph', icon: 'graph', roles: ['user'] },
    { href: '/perfil-personal', label: 'Profile', icon: 'user-circle', roles: ['user', 'admin'] },
  ];

  currentRole: Role | null = null;
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  get visibleMenuItems(): MenuItem[] {
    const role = this.currentRole;
    if (!role) {
      return [];
    }
    return this.menuItems.filter((m) => !m.roles || m.roles.includes(role));
  }

  constructor(private readonly router: Router) {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.currentRole = user?.role ?? null;
    });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }

  isActive(path: string): boolean {
    return this.router.isActive(path, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
