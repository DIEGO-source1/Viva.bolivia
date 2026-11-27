import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EntradaRutaIA,
  EntradaRutaSinIA,
  RespuestaApi,
  RespuestaRuta,
  SaludApi,
} from '../models/ruta.models';

@Injectable({ providedIn: 'root' })
export class RutaApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  escanearPlato(entrada: { imagenBase64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; idioma: 'es' | 'en' }): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/escanear`, entrada);
  }

  salud(): Observable<RespuestaApi<SaludApi>> {
    return this.http.get<RespuestaApi<SaludApi>>(`${this.apiUrl}/salud`);
  }

  generarConIA(entrada: EntradaRutaIA): Observable<RespuestaApi<RespuestaRuta>> {
    return this.http.post<RespuestaApi<RespuestaRuta>>(`${this.apiUrl}/ruta`, entrada);
  }

  generarSinIA(entrada: EntradaRutaSinIA): Observable<RespuestaApi<RespuestaRuta>> {
    return this.http.post<RespuestaApi<RespuestaRuta>>(`${this.apiUrl}/ruta-sin-ia`, entrada);
  }
}
