import React from 'react';
import { format } from 'date-fns';

interface OrderItem {
  id: number;
  menu_name_snapshot: string;
  qty: number;
  item_note?: string;
  kitchen_status: 'pending' | 'preparing' | 'ready' | 'served';
  options?: { option_item_label_snapshot: string }[];
}

interface Order {
  id: number;
  order_code: string;
  table: { table_number: string };
  created_at: string;
  order_status: string;
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: number, status: string) => void;
}

export default function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-100 border-slate-200';
      case 'preparing': return 'bg-amber-50 border-amber-300';
      case 'ready': return 'bg-emerald-50 border-emerald-400';
      default: return 'bg-white border-gray-200';
    }
  };

  const getHeaderColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-200 text-slate-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'ready': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);

  return (
    <div className={`border-2 rounded-lg shadow-sm overflow-hidden flex flex-col h-full ${getStatusColor(order.order_status)}`}>
      <div className={`p-3 flex justify-between items-center ${getHeaderColor(order.order_status)}`}>
        <div>
          <h3 className="font-bold text-lg">MEJA {order.table?.table_number || '?'}</h3>
          <p className="text-xs opacity-75">{order.order_code}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-lg">{format(new Date(order.created_at), 'HH:mm')}</p>
          <p className={`text-xs font-bold ${elapsedMinutes > 15 ? 'text-red-600' : ''}`}>
            ⏱ {elapsedMinutes}m
          </p>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto text-gray-900">
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="text-sm">
              <div className="flex justify-between items-start">
                <span className="font-bold text-lg w-8">{item.qty}x</span>
                <div className="flex-1">
                  <p className="font-semibold">{item.menu_name_snapshot}</p>
                  {item.options && item.options.length > 0 && (
                    <p className="text-xs text-gray-600">
                      {item.options.map(opt => opt.option_item_label_snapshot).join(', ')}
                    </p>
                  )}
                  {item.item_note && (
                    <p className="text-xs text-red-600 italic mt-1">"{item.item_note}"</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 border-t border-black/5 bg-white/50">
        <div className="grid grid-cols-2 gap-2">
          {order.order_status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              className="col-span-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors"
            >
              MULAI
            </button>
          )}
          {order.order_status === 'preparing' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'ready')}
              className="col-span-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
            >
              SIAP SAJI
            </button>
          )}
          {order.order_status === 'ready' && (
            <div className="col-span-2 py-3 text-center font-bold text-emerald-700 bg-emerald-100 rounded-lg">
              SIAP DIANTAR
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
