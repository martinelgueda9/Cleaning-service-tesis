export type TipoLimpieza =
  | 'ESTANDAR'
  | 'PROFUNDA'
  | 'MUDANZA_ENTRADA'
  | 'MUDANZA_SALIDA'
  | 'POST_CONSTRUCCION'
  | 'OFICINA';

export interface ParametrosCalculoCotizacion {
  piesCuadrados?: number;
  metrosCuadrados?: number;
  numHabitaciones: number;
  numBanos: number;
  tipoLimpieza: TipoLimpieza;
  tieneMascotas?: boolean;
  extras?: {
    limpiezaHorno?: boolean;
    limpiezaRefrigerador?: boolean;
    ventanasInteriores?: boolean;
    lavadoPlatos?: boolean;
    armariosInteriores?: boolean;
  };
}

export interface ResultadoCotizacion {
  totalEstimado: number;
  desglose: {
    precioBase: number;
    costoHabitaciones: number;
    costoBanos: number;
    costoArea: number;
    recargoTipo: number;
    costoExtras: number;
    recargoMascotas: number;
  };
}
