import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { CreditCard, CheckCircle, XCircle, Loader, Package, Truck, MapPin, Hash } from 'lucide-react';

interface Purchase { 
  id: number; 
  user?: { name: string; email: string; phone?: string; city?: string; academic_condition?: string; dni?: string }; 
  course?: { title: string }; 
  amount: number; 
  status: string; 
  created_at: string; 
  receipt_url?: string;
  payment_modality?: string;
  bank_entity?: string;
  operation_number?: string;
  payment_date?: string;
  paid_at?: string;
  certificate_delivery?: string;
  delivery_company?: string;
  delivery_address?: string;
  delivery_reference?: string;
  shipping_status?: string;
  tracking_number?: string;
  certification_institution?: string;
}

const SHIPPING_OPTIONS = [
  { value: 'pending',          label: 'Pendiente',           color: 'text-amber-600  bg-amber-50  border-amber-200' },
  { value: 'ready_for_pickup', label: 'Listo para recojo',   color: 'text-blue-600   bg-blue-50   border-blue-200' },
  { value: 'shipped',          label: 'Enviado',             color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { value: 'delivered',        label: 'Entregado',           color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'digital_sent',     label: 'Enviado Digital',     color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

function ShippingBadge({ status }: { status: string }) {
  const opt = SHIPPING_OPTIONS.find(o => o.value === status) ?? SHIPPING_OPTIONS[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export default function AdminPagos() {
  const [items, setItems]     = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);
  const [savingShipping, setSavingShipping] = useState<number | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [shippingInput, setShippingInput] = useState('pending');

  const load = async () => {
    setLoading(true);
    try { const { data } = await apiClient.get('/api/v1/aula/admin-data'); setItems(data.pending_payments ?? []); }
    catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Sync local inputs when a purchase is selected
  useEffect(() => {
    if (selectedPurchase) {
      setTrackingInput(selectedPurchase.tracking_number ?? '');
      setShippingInput(selectedPurchase.shipping_status ?? 'pending');
    }
  }, [selectedPurchase?.id]);

  const transition = async (id: number, status: string) => {
    setSaving(id);
    try { await apiClient.post(`/api/v1/payments/${id}/status`, { new_status: status, reason: 'Gestionado desde panel admin' }); load(); }
    catch { /* ignore */ } finally { setSaving(null); }
  };

  const saveShipping = async () => {
    if (!selectedPurchase) return;
    setSavingShipping(selectedPurchase.id);
    try {
      await apiClient.post(`/api/v1/admin/purchases/${selectedPurchase.id}/shipping-status`, {
        shipping_status: shippingInput,
        tracking_number: trackingInput || null,
      });
      setSelectedPurchase(prev => prev ? { ...prev, shipping_status: shippingInput, tracking_number: trackingInput } : null);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al actualizar envío');
    } finally {
      setSavingShipping(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2"><CreditCard className="w-6 h-6" /> Validar Pagos</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{['Estudiante','Curso','Monto','Fecha','Comprobante','Envío','Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="font-medium text-slate-800">{p.user?.name}</div><div className="text-xs text-slate-400">{p.user?.email}</div></td>
                  <td className="px-4 py-3 text-slate-600">{p.course?.title}</td>
                  <td className="px-4 py-3 font-bold text-primary">S/ {Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-3">{p.receipt_url ? <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-secondary text-xs underline">Ver</a> : <span className="text-slate-300 text-xs">—</span>}</td>
                  <td className="px-4 py-3">
                    {p.certificate_delivery && p.certificate_delivery !== 'digital'
                      ? <ShippingBadge status={p.shipping_status ?? 'pending'} />
                      : <span className="text-[10px] text-slate-400">Digital/N-A</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedPurchase(p)} className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">Ver Detalle</button>
                      <button onClick={() => transition(p.id, 'validated')} disabled={saving === p.id} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-50">
                        <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                      </button>
                      <button onClick={() => transition(p.id, 'rejected')} disabled={saving === p.id} className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No hay pagos pendientes</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-extrabold text-primary text-xl">Detalle de Inscripción</h3>
                <p className="text-sm text-slate-500 font-sans">{selectedPurchase.course?.title}</p>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* User Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Datos Personales
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Nombre:</dt><dd className="font-medium text-slate-800">{selectedPurchase.user?.name}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">DNI:</dt><dd className="font-medium text-slate-800">{selectedPurchase.user?.dni || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Correo:</dt><dd className="font-medium text-slate-800">{selectedPurchase.user?.email}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Teléfono:</dt><dd className="font-medium text-slate-800">{selectedPurchase.user?.phone || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Ciudad:</dt><dd className="font-medium text-slate-800">{selectedPurchase.user?.city || '—'}</dd></div>
                  </dl>
                </div>

                {/* Academic Profile */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> Perfil Académico
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex flex-col"><dt className="text-slate-500 mb-1">Condición Académica:</dt><dd className="font-medium text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded">{selectedPurchase.user?.academic_condition || '—'}</dd></div>
                    <div className="flex flex-col mt-2"><dt className="text-slate-500 mb-1">Institución de Certificación:</dt><dd className="font-medium text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded">{selectedPurchase.certification_institution || '—'}</dd></div>
                  </dl>
                </div>

                {/* Purchase Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Detalles del Pago
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Monto Pagado:</dt><dd className="font-bold text-primary text-base">S/ {Number(selectedPurchase.amount).toFixed(2)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Modalidad:</dt><dd className="font-medium text-slate-800">{selectedPurchase.payment_modality === 'transfer' ? 'Transferencia/Depósito' : (selectedPurchase.payment_modality === 'card' ? 'Tarjeta' : selectedPurchase.payment_modality || '—')}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Banco/Entidad:</dt><dd className="font-medium text-slate-800">{selectedPurchase.bank_entity || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Nº Operación:</dt><dd className="font-medium text-slate-800 font-mono">{selectedPurchase.operation_number || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Fecha de Pago:</dt><dd className="font-medium text-slate-800">{selectedPurchase.paid_at ? new Date(selectedPurchase.paid_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (selectedPurchase.payment_date || '—')}</dd></div>
                  </dl>
                </div>

                {/* Delivery Info — full width, editable */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2">
                  <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Gestión de Envío
                  </h4>

                  {/* Read-only delivery info */}
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-5">
                    <div className="flex flex-col">
                      <dt className="text-slate-500 mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Método de entrega:</dt>
                      <dd className="font-bold text-orange-600 bg-orange-50 px-2 py-1 border border-orange-200 rounded inline-block">{selectedPurchase.certificate_delivery || '—'}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-slate-500 mb-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Empresa / Agencia:</dt>
                      <dd className="font-medium text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded">{selectedPurchase.delivery_company || '—'}</dd>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <dt className="text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección / Sucursal:</dt>
                      <dd className="font-medium text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded min-h-[30px]">{selectedPurchase.delivery_address || '—'}</dd>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <dt className="text-slate-500 mb-1">Referencia:</dt>
                      <dd className="font-medium text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded min-h-[30px]">{selectedPurchase.delivery_reference || '—'}</dd>
                    </div>
                  </dl>

                  {/* Editable shipping controls */}
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado de Envío</label>
                        <select
                          value={shippingInput}
                          onChange={e => setShippingInput(e.target.value)}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400"
                        >
                          {SHIPPING_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Nº de Tracking / Guía
                        </label>
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={e => setTrackingInput(e.target.value)}
                          placeholder="Ej: SHA-2024-00012345"
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      onClick={saveShipping}
                      disabled={savingShipping === selectedPurchase.id}
                      className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {savingShipping === selectedPurchase.id ? <Loader className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                      Guardar estado de envío
                    </button>
                  </div>
                </div>

              </div>

              {selectedPurchase.receipt_url && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                   <p className="text-sm text-blue-800 font-bold mb-2">Comprobante Adjunto:</p>
                   <a href={selectedPurchase.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
                     Ver Comprobante
                   </a>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setSelectedPurchase(null)} className="px-6 py-2 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-100 transition-colors">
                Cerrar
              </button>
              <button
                onClick={() => { transition(selectedPurchase.id, 'validated'); setSelectedPurchase(null); }}
                disabled={saving === selectedPurchase.id}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Aprobar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
