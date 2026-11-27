import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError, CampoFaltanteRuta, RespuestaRuta, SolicitudRuta } from '../../models/ruta.models';
import { RutaApiService } from '../../data-access/planificador-api.service';
import { RouteRequestFormComponent } from '../../ui/route-request-form/route-request-form.component';
import { RouteResultPanelComponent } from '../../ui/route-result-panel/route-result-panel.component';

@Component({
  selector: 'app-planificador-page',
  imports: [RouteRequestFormComponent, RouteResultPanelComponent],
  templateUrl: './planificador-page.component.html',
  styleUrl: './planificador-page.component.scss',
})
export class PlanificadorPageComponent implements OnInit {
  private readonly api = inject(RutaApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiDisponible = signal<boolean | null>(null);
  protected readonly resultado = signal<RespuestaRuta | null>(null);
  protected readonly datosFaltantes = signal<CampoFaltanteRuta[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly alternativaDisponible = signal(false);

  ngOnInit(): void {
    this.api
      .salud()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => this.apiDisponible.set(respuesta.ok),
        error: () => this.apiDisponible.set(false),
      });
  }

  protected solicitarRuta(solicitud: SolicitudRuta): void {
    this.cargando.set(true);
    this.resultado.set(null);
    this.datosFaltantes.set([]);
    this.errorMessage.set(null);
    this.alternativaDisponible.set(false);

    const peticion =
      solicitud.modo === 'ia'
        ? this.api.generarConIA(solicitud.entrada)
        : this.api.generarSinIA(solicitud.entrada);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        if (respuesta.ok) {
          this.resultado.set(respuesta.datos);
          if (solicitud.modo === 'ia' && respuesta.datos.estado === 'faltan_datos') {
            this.datosFaltantes.set(respuesta.datos.faltan ?? []);
          }
          return;
        }

        this.mostrarError(respuesta);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.apiDisponible.set(false);
        const cuerpo = error.error as Partial<ApiError> | null;
        this.mostrarError(cuerpo, error.status === 503 && solicitud.modo === 'ia');
      },
    });
  }

  protected cambiarAFormularioManual(): void {
    this.errorMessage.set(null);
    this.datosFaltantes.set([]);
  }

  private mostrarError(error: Partial<ApiError> | null, ofrecerAlternativa = false): void {
    this.errorMessage.set(
      error?.error ?? 'No pudimos completar la solicitud. Revisa la conexión e inténtalo de nuevo.',
    );
    this.alternativaDisponible.set(ofrecerAlternativa);
  }
}
