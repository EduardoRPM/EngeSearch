import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { UserService } from '../../core/services/user.service';
import { AppRole } from '../../core/services/auth.service';

interface ProfileData {
  name: string;
  email: string;
  role: AppRole;
  password: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  profile: ProfileData | null = null;
  isLoading = false;
  loadError = '';
  showPasswordForm = false;

  passwordForm = {
    newPassword: '',
    confirmPassword: '',
  };

  passwordMessage = '';
  passwordError = '';

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    void this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    try {
      const profile = await this.userService.fetchProfile();
      this.profile = {
        name: profile.fullName,
        email: profile.username,
        role: profile.rol,
        password: profile.password,
      };
    } catch (error) {
      console.error('Error al cargar el perfil', error);
      this.loadError = 'No se pudo cargar la informacion de tu perfil.';
      this.profile = null;
    } finally {
      this.isLoading = false;
    }
  }

  retryLoad(): void {
    void this.loadProfile();
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
  }

  savePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';

    if (!this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.passwordError = 'Completa ambos campos de contrasena.';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'Las contrasenas no coinciden.';
      return;
    }

    this.passwordMessage = 'Contrasena actualizada correctamente (demo).';
    this.passwordForm = { newPassword: '', confirmPassword: '' };
  }
}
