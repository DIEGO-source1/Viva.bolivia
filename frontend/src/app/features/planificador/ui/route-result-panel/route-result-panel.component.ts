import { Component, Input } from '@angular/core';
import { RespuestaRuta, TipoLugar } from '../../models/ruta.models';

@Component({
  selector: 'app-route-result-panel',
  templateUrl: './route-result-panel.component.html',
  styleUrl: './route-result-panel.component.scss',
})
export class RouteResultPanelComponent {
  @Input() resultado: RespuestaRuta | null = null;
  @Input() cargando = false;

  protected formatoBs(valor: number): string {
    return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(valor);
  }

  protected formatoDuracion(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
  }

  protected formatoKm(kilometros: number): string {
    return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(kilometros);
  }

  protected textoParada(lugarId: string): string | null {
    return this.resultado?.itinerario?.paradas.find((parada) => parada.lugar_id === lugarId)?.texto ?? null;
  }

  protected nombreTipo(tipo: TipoLugar): string {
    const nombres: Record<TipoLugar, string> = {
      comida: 'Comida',
      mercado: 'Mercado',
      mirador: 'Mirador',
      cultura: 'Cultura',
      naturaleza: 'Naturaleza',
      otro: 'Otro',
    };
    return nombres[tipo];
  }
}
