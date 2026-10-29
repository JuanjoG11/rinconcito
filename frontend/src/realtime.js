/**
 * Supabase Realtime — reemplaza Socket.IO
 *
 * Uso:
 *   import { suscribirPedidos, desuscribir } from '../realtime';
 *
 *   const canal = suscribirPedidos({
 *     onNuevo:      (pedido) => ...,
 *     onActualizado:(pedido) => ...,
 *     onCancelado:  (id)     => ...,
 *   });
 *   return () => desuscribir(canal);
 */
import { supabase } from './supabase';

// Carga los items de un pedido y los adjunta
async function enrichPedido(pedido) {
  const { data: items } = await supabase
    .from('pedido_items').select('*').eq('pedido_id', pedido.id);
  return { ...pedido, items: items || [] };
}

export function suscribirPedidos({ onNuevo, onActualizado, onCancelado } = {}) {
  const canal = supabase
    .channel('pedidos-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pedidos' },
      async (payload) => {
        if (onNuevo) {
          // Dar 300ms para que los items lleguen también
          setTimeout(async () => {
            const pedido = await enrichPedido(payload.new);
            onNuevo(pedido);
          }, 300);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pedidos' },
      async (payload) => {
        const pedido = payload.new;
        if (pedido.estado === 'cancelado') {
          if (onCancelado) onCancelado(pedido.id);
        } else {
          if (onActualizado) {
            const full = await enrichPedido(pedido);
            onActualizado(full);
          }
        }
      }
    )
    .subscribe();

  return canal;
}

export function desuscribir(canal) {
  if (canal) supabase.removeChannel(canal);
}
