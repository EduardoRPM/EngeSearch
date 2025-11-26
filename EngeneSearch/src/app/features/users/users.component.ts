import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';

interface UserCard {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  users: UserCard[] = [
    {
      id: 'u-1',
      name: 'Juan Perez',
      email: 'juan.perez@example.com',
      password: '********',
      role: 'admin',
    },
  ];

  showEditModal = false;
  showDeleteModal = false;
  selectedUser: UserCard | null = null;
  newRole: UserCard['role'] = 'user';

  editRole(user: UserCard): void {
    this.selectedUser = user;
    this.newRole = user.role;
    this.showEditModal = true;
  }

  deleteUser(user: UserCard): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  confirmRoleChange(): void {
    // Solo visualización: no persiste cambios
    this.closeModals();
  }

  confirmDelete(): void {
    // Solo visualización: no elimina
    this.closeModals();
  }
}
