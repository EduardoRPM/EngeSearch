import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './my-articles.component.html',
  styleUrls: ['./my-articles.component.css'],
})
export class MyArticlesComponent {
  showForm = false;
  viewMode: 'grid' | 'list' = 'grid';
  // placeholder for articles count
  articlesCount = 0;

  openForm() {
    this.showForm = true;
  }

  toggleView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  closeForm() {
    this.showForm = false;
  }

  onSave() {
    // Por ahora no hay lógica; se puede implementar más tarde
    this.closeForm();
  }

  onSend() {
    // Por ahora no hay lógica; se puede implementar más tarde
    this.closeForm();
  }
}
