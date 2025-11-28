import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { UsersService } from '../../core/services/users.service';

interface UserCard {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: UserCard[] = [];

  showEditModal = false;
  showDeleteModal = false;
  selectedUser: UserCard | null = null;
  newRole: UserCard['role'] = 'user';
  showResultModal = false;
  resultTitle = '';
  resultMessage = '';
  resultIsError = false;

  constructor(private readonly usersService: UsersService) {}

  ngOnInit(): void {
    void this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      const res = await this.usersService.getAll();
      const raw = Array.isArray(res?.result) ? res.result : [];
      this.users = raw.map((u, idx) => ({
        id: u._id ?? `u-${idx + 1}`,
        username: u.username ?? 'sin-usuario',
        // Always mask password on the UI
        password: '********',
        role: this.mapRole(u.rol),
      }));
    } catch (err) {
      console.error('Error loading users', err);
    }
  }

  private mapRole(role: string | undefined): UserCard['role'] {
    if (role === 'admin') return 'admin';
    return 'user';
  }

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

  async confirmRoleChange(): Promise<void> {
    if (!this.selectedUser) {
      return;
    }
    const targetRole = this.newRole;
    try {
      await this.usersService.updateRole(this.selectedUser.id, targetRole);
      this.users = this.users.map((u) =>
        u.id === this.selectedUser!.id ? { ...u, role: targetRole } : u
      );
      this.showSuccess('Rol actualizado', `El rol se actualizo a ${targetRole}.`);
    } catch (err) {
      console.error('Error updating user role', err);
      this.showError('Error', 'No se pudo actualizar el rol. Intenta nuevamente.');
    } finally {
      this.closeModals();
    }
  }

  confirmDelete(): void {
    void this.deleteSelectedUser();
  }

  private async deleteSelectedUser(): Promise<void> {
    if (!this.selectedUser) {
      return;
    }
    const idToDelete = this.selectedUser.id;
    try {
      await this.usersService.delete(idToDelete);
      this.users = this.users.filter((u) => u.id !== idToDelete);
      this.showSuccess('Usuario eliminado', 'El usuario se elimino correctamente.');
    } catch (err) {
      console.error('Error deleting user', err);
      this.showError('Error', 'No se pudo eliminar el usuario. Intenta nuevamente.');
    } finally {
      this.closeModals();
    }
  }

  private showSuccess(title: string, message: string): void {
    this.resultTitle = title;
    this.resultMessage = message;
    this.resultIsError = false;
    this.showResultModal = true;
  }

  private showError(title: string, message: string): void {
    this.resultTitle = title;
    this.resultMessage = message;
    this.resultIsError = true;
    this.showResultModal = true;
  }

  closeResultModal(): void {
    this.showResultModal = false;
  }
}
