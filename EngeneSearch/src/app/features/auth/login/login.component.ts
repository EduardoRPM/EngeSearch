import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  credentials = {
    username: '',
    password: '',
  };

  isSubmitting = false;
  error: string | null = null;

  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  async handleSubmit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    if (!this.credentials.username.trim() || !this.credentials.password.trim()) {
      this.error = 'Ingresa tu usuario y contraseña.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      await this.authService.login(this.credentials.username, this.credentials.password);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = this.resolveErrorMessage(err, 'Ocurrió un problema al iniciar sesión. Intenta nuevamente.');
    } finally {
      this.isSubmitting = false;
    }
  }

  handleBack(): void {
    void this.router.navigate(['/']);
  }

  handleRegister(): void {
    void this.router.navigate(['/register']);
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.msg || error.message || fallback;
    }
    if (error instanceof Error) {
      return error.message || fallback;
    }
    return fallback;
  }
}
