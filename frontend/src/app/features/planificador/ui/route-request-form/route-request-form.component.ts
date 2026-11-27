import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CampoFaltanteRuta, SolicitudRuta, TipoLugar } from '../../models/ruta.models';

interface OpcionTipo {
  id: TipoLugar;
  label: string;
}

@Component({
  selector: 'app-route-request-form',
  imports: [FormsModule],
  templateUrl: './route-request-form.component.html',
  styleUrl: './route-request-form.component.scss',
})
export class RouteRequestFormComponent {
  @Input() cargando = false;
  @Input() errorMessage: string | null = null;
  @Input() alternativaDisponible = false;
  @Input() datosFaltantes: CampoFaltanteRuta[] = [];

  @Output() solicitud = new EventEmitter<SolicitudRuta>();
  @Output() usarFormularioManual = new EventEmitter<void>();

  protected modo: 'ia' | 'manual' = 'ia';
  protected texto = '';
  protected presupuesto = 60;
  protected horas = 2;
  protected presupuestoPendiente: number | null = null;
  protected horasPendientes: number | null = null;
  protected zona = '';
  protected soloAbiertos = false;
  protected tiposSeleccionados: TipoLugar[] = ['comida'];

  protected readonly tiposLugar: OpcionTipo[] = [
    { id: 'comida', label: 'Comida' },
    { id: 'mercado', label: 'Mercados' },
    { id: 'mirador', label: 'Miradores' },
    { id: 'cultura', label: 'Cultura' },
    { id: 'naturaleza', label: 'Naturaleza' },
    { id: 'otro', label: 'Otros' },
  ];

  protected get puedeGenerar(): boolean {
    if (this.cargando) return false;
    if (this.modo === 'manual') return true;
    if (this.texto.trim().length < 3) return false;
    if (this.datosFaltantes.includes('presupuesto') && !this.esNumeroPositivo(this.presupuestoPendiente)) return false;
    if (this.datosFaltantes.includes('horas') && !this.esNumeroPositivo(this.horasPendientes)) return false;
    return true;
  }

  protected get limiteTexto(): number {
    return this.datosFaltantes.length ? 420 : 500;
  }

  protected cambiarModo(modo: 'ia' | 'manual'): void {
    this.modo = modo;
    if (modo === 'manual') this.usarFormularioManual.emit();
  }

  protected tieneTipo(tipo: TipoLugar): boolean {
    return this.tiposSeleccionados.includes(tipo);
  }

  protected alternarTipo(tipo: TipoLugar): void {
    this.tiposSeleccionados = this.tieneTipo(tipo)
      ? this.tiposSeleccionados.filter((seleccionado) => seleccionado !== tipo)
      : [...this.tiposSeleccionados, tipo];
  }

  protected enviarSolicitud(): void {
    if (!this.puedeGenerar) return;

    if (this.modo === 'ia') {
      const aclaraciones: string[] = [];
      if (this.datosFaltantes.includes('presupuesto')) {
        aclaraciones.push(`Mi presupuesto es Bs ${this.presupuestoPendiente}`);
      }
      if (this.datosFaltantes.includes('horas')) {
        aclaraciones.push(`tengo ${this.horasPendientes} horas disponibles`);
      }

      this.solicitud.emit({
        modo: 'ia',
        entrada: {
          texto: [this.texto.trim(), ...aclaraciones].join('. ').slice(0, 500),
          idioma: 'es',
          soloAbiertos: this.soloAbiertos,
        },
      });
      return;
    }

    this.solicitud.emit({
      modo: 'manual',
      entrada: {
        presupuesto: Number(this.presupuesto),
        horas: Number(this.horas),
        tipos: this.tiposSeleccionados,
        zona: this.zona.trim() || null,
        idioma: 'es',
        soloAbiertos: this.soloAbiertos,
      },
    });
  }

  private esNumeroPositivo(valor: number | null): boolean {
    return valor !== null && Number.isFinite(valor) && valor > 0;
  }
}
