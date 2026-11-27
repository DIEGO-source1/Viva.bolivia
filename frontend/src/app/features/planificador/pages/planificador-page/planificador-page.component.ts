import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly ubicacionUsuario = signal<{ lat: number; lng: number } | null>(null);
  protected readonly errorUbicacion = signal<string | null>(null);
  protected readonly buscandoUbicacion = signal(false);

  protected solicitarUbicacion(): void {
    if (!('geolocation' in navigator)) {
      this.errorUbicacion.set('Este navegador no permite compartir la ubicación.');
      return;
    }
    this.buscandoUbicacion.set(true);
    this.errorUbicacion.set(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ubicacionUsuario.set({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        this.buscandoUbicacion.set(false);
      },
      (error) => {
        this.buscandoUbicacion.set(false);
        this.errorUbicacion.set(
          error.code === error.PERMISSION_DENIED
            ? 'No se concedió permiso de ubicación. Puedes seguir usando el mapa buscando un lugar manualmente.'
            : 'No pudimos obtener tu ubicación. Comprueba el GPS o la conexión e inténtalo de nuevo.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  protected get mapEmbedUrl(): SafeResourceUrl {
    const location = this.ubicacionUsuario();
    const stops = this.resultado()?.ruta?.paradas ?? [];
    const routePlaces = stops
      .map((stop) => `${stop.lugar.nombre}, ${stop.lugar.zona ?? 'Cochabamba'}, Bolivia`)
      .filter(Boolean);
    const query = routePlaces.length
      ? routePlaces.join(' → ')
      : location
        ? `${location.lat},${location.lng}`
        : 'Cochabamba, Bolivia';
    const zoom = routePlaces.length > 1 ? 12 : 13;
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  protected get routeStops(): { orden: number; nombre: string; zona: string }[] {
    return (this.resultado()?.ruta?.paradas ?? []).map((stop) => ({
      orden: stop.orden,
      nombre: stop.lugar.nombre,
      zona: stop.lugar.zona ?? 'Cochabamba',
    }));
  }

  protected get routeSummary(): string {
    const stops = this.routeStops;
    if (!stops.length) return 'Mapa centrado en Cochabamba';
    if (stops.length === 1) return `Destino: ${stops[0].nombre}`;
    return `${stops.length} paradas · ${stops[0].nombre} → ${stops[stops.length - 1].nombre}`;
  }

  protected get googleMapsRouteUrl(): string {
    const stops = this.resultado()?.ruta?.paradas ?? [];
    const origin = this.ubicacionUsuario();
    const first = stops[0]?.lugar;
    const last = stops[stops.length - 1]?.lugar;
    if (!first || !last) {
      return origin
        ? `https://www.google.com/maps/search/?api=1&query=${origin.lat},${origin.lng}`
        : 'https://www.google.com/maps/search/?api=1&query=Cochabamba,Bolivia';
    }
    const originText = origin ? `${origin.lat},${origin.lng}` : `${first.lat},${first.lng}`;
    const destinationText = `${last.lat},${last.lng}`;
    const waypoints = stops.slice(0, -1).slice(0, 9).map((stop) => `${stop.lugar.lat},${stop.lugar.lng}`).join('|');
    const waypointParam = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originText)}&destination=${encodeURIComponent(destinationText)}${waypointParam}&travelmode=driving`;
  }

  protected get nearbyStayUrl(): string {
    const origin = this.ubicacionUsuario();
    const stops = this.resultado()?.ruta?.paradas ?? [];
    const destination = stops[stops.length - 1]?.lugar;
    const query = destination
      ? `hoteles cerca de ${destination.nombre}, ${destination.zona ?? 'Cochabamba'}`
      : origin
        ? `hoteles cerca de ${origin.lat},${origin.lng}`
        : 'hoteles en Cochabamba Bolivia';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

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
