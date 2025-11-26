import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';

interface ProfileData {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  profile: ProfileData = {
    name: 'Ana Martinez',
    email: 'ana.martinez@example.com',
    role: 'admin',
  };

  passwordForm = {
    newPassword: '',
    confirmPassword: '',
  };

  passwordMessage = '';
  passwordError = '';

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

    // Solo demo: no persiste cambios
    this.passwordMessage = 'Contrasena actualizada correctamente (demo).';
    this.passwordForm = { newPassword: '', confirmPassword: '' };
  }
}
