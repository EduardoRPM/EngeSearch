import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, AppRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data?.['roles'] as AppRole[]) || [];

  if (!authService.isAuthenticated()) {
    void router.navigate(['/login']);
    return false;
  }

  if (allowedRoles.length === 0 || authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  void router.navigate(['/']);
  return false;
};
