import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { MainLayoutComponent } from './features/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SearchComponent } from './features/search/search.component';
import { SavedComponent } from './features/saved/saved.component';
import { GraphComponent } from './features/graph/graph.component';
import { MyArticlesComponent } from './features/my-articles/my-articles.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';
import { UsersComponent } from './features/users/users.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ArticlesComponent } from './features/articles/articles.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard], data: { roles: ['admin', 'user'] } },
      { path: 'search', component: SearchComponent, canActivate: [roleGuard], data: { roles: ['user'] } },
      { path: 'mis-articulos', component: MyArticlesComponent, canActivate: [roleGuard], data: { roles: ['user'] } },
      { path: 'articles', component: ArticlesComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'usuarios', component: UsersComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'saved', component: SavedComponent, canActivate: [roleGuard], data: { roles: ['user'] } },
      { path: 'graph', component: GraphComponent, canActivate: [roleGuard], data: { roles: ['user'] } },
      { path: 'perfil-personal', component: ProfileComponent, canActivate: [roleGuard], data: { roles: ['admin', 'user'] } },
      { path: 'admin', component: AdminDashboardComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
    ],
  },
  { path: '**', redirectTo: '' },
];
