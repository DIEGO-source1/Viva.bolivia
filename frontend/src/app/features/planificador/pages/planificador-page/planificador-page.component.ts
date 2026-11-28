import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError, CampoFaltanteRuta, RespuestaRuta, SolicitudRuta } from '../../models/ruta.models';
import { RutaApiService } from '../../data-access/planificador-api.service';
import { RouteRequestFormComponent } from '../../ui/route-request-form/route-request-form.component';
import { RouteResultPanelComponent } from '../../ui/route-result-panel/route-result-panel.component';

@Component({
  selector: 'app-planificador-page',
  imports: [FormsModule, DatePipe, RouteRequestFormComponent, RouteResultPanelComponent],
  templateUrl: './planificador-page.component.html',
  styleUrl: './planificador-page.component.scss',
})
export class PlanificadorPageComponent implements OnInit {
  private readonly api = inject(RutaApiService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly activeTab = signal<'inicio' | 'explorar' | 'rutas' | 'guardados' | 'perfil'>('inicio');
  protected readonly authMode = signal<'login' | 'registro' | null>(null);
  protected readonly authEmail = signal('');
  protected readonly authNombre = signal('');
  protected readonly authPassword = signal('');
  protected readonly authError = signal<string | null>(null);
  protected readonly authBusy = signal(false);
  protected readonly currentUser = signal<{id:string;email:string;nombre:string;rol:'admin'|'visitante'} | null>(null);
  protected readonly adminOpen = signal(false);
  protected readonly adminNombreLugar = signal('');
  protected readonly adminDepartamento = signal('Cochabamba');
  protected readonly adminMensaje = signal<string | null>(null);

  protected readonly lensOpen = signal(false);
  protected readonly scanning = signal(false);
  protected readonly scanError = signal<string | null>(null);
  protected readonly scanResult = signal<any>(null);
  protected readonly savedRoutes = signal<any[]>([]);
  protected readonly voiceSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  protected readonly listening = signal(false);
  protected readonly chatText = signal('');
  protected readonly chatOpen = signal(false);
  protected readonly selectedDepartment = signal('Cochabamba');
  protected readonly savedRoute = signal(false);
  protected readonly departamentos = [
    { nombre: 'La Paz', region: 'Altiplano', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Santa Cruz', region: 'Oriente', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Cochabamba', region: 'Valle', image: '/assets/images/cochabamba-valley-hero.png' },
    { nombre: 'Oruro', region: 'Altiplano', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Potosí', region: 'Altiplano', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Chuquisaca', region: 'Valles', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Tarija', region: 'Sur', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Beni', region: 'Amazonía', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=85' },
    { nombre: 'Pando', region: 'Amazonía', image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=700&q=85' },
  ];

  protected abrirAuth(mode: 'login' | 'registro'): void {
    this.authMode.set(mode); this.authError.set(null); this.authPassword.set('');
  }

  protected cerrarAuth(): void { this.authMode.set(null); this.authError.set(null); }

  protected enviarAuth(): void {
    this.authBusy.set(true); this.authError.set(null);
    const endpoint = this.authMode() === 'registro' ? '/api/auth/registro' : '/api/auth/login';
    const body = this.authMode() === 'registro'
      ? { email: this.authEmail(), nombre: this.authNombre(), password: this.authPassword() }
      : { email: this.authEmail(), password: this.authPassword() };
    this.http.post<any>(endpoint, body).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => {
        this.authBusy.set(false);
        if (!r?.ok || !r.datos?.token) { this.authError.set(r?.error || 'No se pudo iniciar sesión.'); return; }
        try { localStorage.setItem('bvia-session-token', r.datos.token); } catch {}
        this.currentUser.set(r.datos.usuario); this.authMode.set(null); this.authPassword.set('');
        this.irA('perfil');
      },
      error: (e: HttpErrorResponse) => { this.authBusy.set(false); this.authError.set(e.error?.error || 'No se pudo conectar con el servidor.'); }
    });
  }

  protected cerrarSesion(): void {
    const token = this.tokenSesion();
    this.http.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      complete: () => { try { localStorage.removeItem('bvia-session-token'); } catch {} this.currentUser.set(null); this.adminOpen.set(false); },
      error: () => { try { localStorage.removeItem('bvia-session-token'); } catch {} this.currentUser.set(null); this.adminOpen.set(false); }
    });
  }

  protected tokenSesion(): string {
    try { return localStorage.getItem('bvia-session-token') || ''; } catch { return ''; }
  }

  protected cargarSesion(): void {
    const token = this.tokenSesion();
    if (!token) return;
    this.http.get<any>('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => { if (r?.ok) this.currentUser.set(r.datos.usuario); },
      error: () => { try { localStorage.removeItem('bvia-session-token'); } catch {} }
    });
  }

  protected crearLugarAdmin(): void {
    this.adminMensaje.set(null);
    const token = this.tokenSesion();
    this.http.post<any>('/api/admin/lugares', {
      action: 'crear',
      lugar: {
        nombre: this.adminNombreLugar(), tipo: 'cultura', zona: null,
        descripcion: '', etiquetas: '', lat: -17.3935, lng: -66.1570,
        precio_min: 0, precio_max: 0, duracion_min: 60,
        fuente: 'Pendiente de verificación administrativa',
        departamento: this.adminDepartamento(), imagen_url: null, galeria_urls: []
      }
    }, { headers: { Authorization: `Bearer ${token}` } }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => { this.adminMensaje.set(r?.ok ? 'Lugar creado. Completa sus datos y verifica la información antes de publicarlo.' : (r?.error || 'No se pudo crear.')); this.adminNombreLugar.set(''); },
      error: e => this.adminMensaje.set(e.error?.error || 'No se pudo conectar con el backend.')
    });
  }

  protected irA(tab: 'inicio' | 'explorar' | 'rutas' | 'guardados' | 'perfil'): void {
    this.activeTab.set(tab);
    this.lensOpen.set(false);
    this.chatOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected abrirLens(): void {
    this.lensOpen.set(true);
    this.activeTab.set('explorar');
    this.scanError.set(null);
    this.scanResult.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected async analizarImagen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.scanError.set('Selecciona una imagen JPG, PNG o WebP.');
      input.value = '';
      return;
    }
    this.scanning.set(true);
    this.scanError.set(null);
    this.scanResult.set(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo procesar la imagen.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (value) => value ? resolve(value) : reject(new Error('No se pudo comprimir la imagen.')),
        'image/jpeg', 0.78,
      ));
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(blob);
      });
      const imagenBase64 = dataUrl.split(',')[1] ?? '';
      this.api.escanearPlato({ imagenBase64, mediaType: 'image/jpeg', idioma: 'es' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.scanning.set(false);
            if (response.ok) this.scanResult.set(response.datos);
            else this.scanError.set(response.error || 'No se pudo reconocer el plato.');
          },
          error: () => {
            this.scanning.set(false);
            this.scanError.set('El escáner no está disponible. Comprueba que el backend y Claude estén conectados.');
          },
        });
    } catch (error) {
      this.scanning.set(false);
      this.scanError.set(error instanceof Error ? error.message : 'No se pudo procesar la imagen.');
    } finally {
      input.value = '';
    }
  }

  protected hablarTexto(texto: string): void {
    if (!('speechSynthesis' in window)) {
      this.scanError.set('La lectura por voz no está disponible en este navegador.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-BO';
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  protected dictarChat(): void {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = 'es-BO';
    recognition.interimResults = false;
    recognition.onstart = () => this.listening.set(true);
    recognition.onend = () => this.listening.set(false);
    recognition.onerror = () => this.listening.set(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) this.chatText.set((this.chatText() + ' ' + transcript).trim());
    };
    recognition.start();
  }

  protected guardarRuta(): void {
    const route = this.resultado();
    if (!route?.ruta) return;
    const item = { id: Date.now(), titulo: route.itinerario?.titulo || 'Mi ruta por Bolivia', departamento: this.selectedDepartment(), guardada: new Date().toISOString(), ruta: route };
    const updated = [item, ...this.savedRoutes()].slice(0, 30);
    this.savedRoutes.set(updated);
    try { localStorage.setItem('bolivia-viva-saved-routes', JSON.stringify(updated)); } catch { /* almacenamiento no disponible */ }
    this.savedRoute.set(true);
  }

  protected eliminarGuardada(id: number): void {
    const updated = this.savedRoutes().filter((item) => item.id !== id);
    this.savedRoutes.set(updated);
    try { localStorage.setItem('bolivia-viva-saved-routes', JSON.stringify(updated)); } catch { /* almacenamiento no disponible */ }
  }

  protected abrirChat(): void {
    this.chatOpen.set(true);
    this.activeTab.set('rutas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected enviarChat(): void {
    const texto = this.chatText().trim();
    if (!texto) return;
    this.solicitarRuta({
      modo: 'ia',
      entrada: { texto, idioma: 'es', soloAbiertos: false },
    });
    this.chatOpen.set(false);
    this.activeTab.set('rutas');
  }

  protected elegirDepartamento(nombre: string): void {
    this.selectedDepartment.set(nombre);
    this.irA('explorar');
  }

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
        this.selectedDepartment.set(this.departamentoDesdeCoordenadas(position.coords.latitude, position.coords.longitude));
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

  private departamentoDesdeCoordenadas(lat: number, lng: number): string {
    if (lat > -11.5) return lng < -66 ? 'Pando' : 'Beni';
    if (lat > -15.5) return lng < -67 ? 'La Paz' : 'Beni';
    if (lat > -18.0) return lng < -67 ? 'La Paz' : lng < -64.5 ? 'Cochabamba' : 'Santa Cruz';
    if (lat > -19.5) return lng < -66.5 ? 'Oruro' : lng < -64.5 ? 'Potosí' : 'Santa Cruz';
    return lng < -66 ? 'Potosí' : lng < -64.5 ? 'Chuquisaca' : 'Tarija';
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
    this.cargarSesion();
    try {
      const stored = localStorage.getItem('bolivia-viva-saved-routes');
      if (stored) this.savedRoutes.set(JSON.parse(stored));
    } catch { this.savedRoutes.set([]); }
    this.api
      .salud()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => this.apiDisponible.set(respuesta.ok),
        error: () => this.apiDisponible.set(false),
      });
  }

  protected solicitarRuta(solicitud: SolicitudRuta): void {
    this.savedRoute.set(false);
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
