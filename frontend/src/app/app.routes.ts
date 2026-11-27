import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Viva Bolivia · Planificador de rutas',
    loadComponent: () =>
      import('./features/planificador/pages/planificador-page/planificador-page.component').then(
        (module) => module.PlanificadorPageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
