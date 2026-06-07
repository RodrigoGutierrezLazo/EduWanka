import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { History, Loader, Eye, X, Receipt, CreditCard, Truck, FileText, User, MapPin, Image, ImageOff } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { pending_validation:'Pendiente', validated:'Validado', rejected:'Rechazado', paid:'Pagado' };
const STATUS_COLOR: Record<string, string> = { pending_validation:'bg-yellow-100 text-yellow-700', validated:'bg-blue-100 text-blue-700', rejected:'bg-red-100 text-red-700', paid:'bg-green-100 text-green-700' };
const MODALITY_LABEL: Record<string, string> = { single: 'Pago único', installments: 'Cuotas' };
const DELIVERY_LABEL: Record<string, string> = { digital: 'Digital', pickup: 'Recojo en oficina', delivery: 'Envío a domicilio' };
const SHIPPING_LABEL: Record<string, string> = { pending: 'Pendiente', ready_for_pickup: 'Listo para recojo', shipped: 'Enviado', delivered: 'Entregado', digital_sent: 'Enviado digital' };

interface PurchaseDetail {
  id: number;
  user?: { id: number; name: string; email?: string; dni?: string; phone?: string; city?: string };
  course?: { id: number; title: string; code?: string; price?: number };
  amount: number;
  currency?: string;
  status: string;
  payment_method?: string;
  payment_modality?: string;
  bank_entity?: string;
  operation_number?: string;
  declared_amount?: number;
  receipt_path?: string;
  receipt_url?: string;
  certificate_delivery?: string;
  delivery_company?: string;
  delivery_address?: string;
  shipping_status?: string;
  tracking_number?: string;
  next_course_interest?: string;
  certification_institution?: string;
  accepted_terms_at?: string;
  paid_at?: string;
  created_at: string;
}

export default function AdminHistorial() {
  const [items, setItems] = useState<PurchaseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<PurchaseDetail | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {}; if (status) params.status = status;
      const { data } = await apiClient.get('/api/v1/admin/payments/history', { params });
      setItems(data.data ?? data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2"><History className="w-6 h-6" /> Historial de Pagos</h1>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b"><tr>{['Estudiante','Curso','Monto','Entidad','Estado','Fecha',''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(p)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.user?.name ?? '—'}</p>
                      <p className="text-[10px] text-slate-400">{p.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.course?.title ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-primary">S/ {Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.bank_entity || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[p.status] ?? 'bg-slate-100 text-slate-600'}`}>{STATUS_LABEL[p.status] ?? p.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('es-PE')}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-slate-400 hover:text-secondary transition-colors rounded-lg hover:bg-slate-100" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">Sin registros</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <DetailModal purchase={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailModal({ purchase: p, onClose }: { purchase: PurchaseDetail; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const isImage = p.receipt_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(p.receipt_url);
  const isPdf = p.receipt_url && /\.pdf$/i.test(p.receipt_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Detalle de Pago #{p.id}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLOR[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
            <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Student info */}
          <Section icon={<User className="w-4 h-4 text-blue-500" />} title="Datos del Estudiante">
            <Row label="Nombre" value={p.user?.name} />
            <Row label="Email" value={p.user?.email} />
            <Row label="DNI" value={p.user?.dni} />
            <Row label="Teléfono" value={p.user?.phone} />
            <Row label="Ciudad" value={p.user?.city} />
            {p.certification_institution && <Row label="Institución de certificación" value={p.certification_institution} />}
          </Section>

          {/* Course info */}
          <Section icon={<FileText className="w-4 h-4 text-violet-500" />} title="Curso">
            <Row label="Curso" value={p.course?.title} />
            <Row label="Código" value={p.course?.code} />
            <Row label="Precio del curso" value={p.course?.price ? `S/ ${Number(p.course.price).toFixed(2)}` : undefined} />
          </Section>

          {/* Payment info */}
          <Section icon={<CreditCard className="w-4 h-4 text-emerald-500" />} title="Información de Pago">
            <Row label="Monto pagado" value={`S/ ${Number(p.amount).toFixed(2)}`} highlight />
            {p.declared_amount && <Row label="Monto declarado" value={`S/ ${Number(p.declared_amount).toFixed(2)}`} />}
            <Row label="Modalidad" value={p.payment_modality ? (MODALITY_LABEL[p.payment_modality] ?? p.payment_modality) : undefined} />
            <Row label="Método de pago" value={p.payment_method} />
            <Row label="Entidad bancaria" value={p.bank_entity} />
            <Row label="N° de operación" value={p.operation_number} highlight />
            <Row label="Fecha de pago" value={p.paid_at ? new Date(p.paid_at).toLocaleString('es-PE') : undefined} />
            {p.accepted_terms_at && <Row label="Términos aceptados" value={new Date(p.accepted_terms_at).toLocaleString('es-PE')} />}
          </Section>

          {/* Receipt */}
          {p.receipt_url && (
            <Section icon={<Image className="w-4 h-4 text-amber-500" />} title="Comprobante de Pago">
              <div className="mt-2">
                {isImage && !imgError ? (
                  <div className="space-y-2">
                    <img
                      src={p.receipt_url}
                      alt="Comprobante de pago"
                      className="w-full max-h-[400px] object-contain rounded-xl border border-slate-200 bg-slate-50"
                      onError={() => setImgError(true)}
                    />
                    <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-secondary font-bold hover:underline">
                      Abrir en nueva pestaña
                    </a>
                  </div>
                ) : isPdf ? (
                  <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center gap-3">
                      <FileText className="w-10 h-10 text-red-400" />
                      <p className="text-sm text-slate-600">Comprobante en formato PDF</p>
                    </div>
                    <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-secondary font-bold hover:underline">
                      Abrir PDF en nueva pestaña
                    </a>
                  </div>
                ) : (
                  <a href={p.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-bold hover:bg-secondary/20 transition-colors">
                    <Eye className="w-4 h-4" /> Ver comprobante
                  </a>
                )}
              </div>
            </Section>
          )}
          {!p.receipt_url && (
            <Section icon={<Image className="w-4 h-4 text-slate-400" />} title="Comprobante de Pago">
              <div className="flex items-center gap-3 py-4 text-slate-400">
                <ImageOff className="w-8 h-8" />
                <p className="text-sm">No se adjuntó comprobante</p>
              </div>
            </Section>
          )}

          {/* Delivery */}
          {(p.certificate_delivery || p.delivery_company || p.delivery_address) && (
            <Section icon={<Truck className="w-4 h-4 text-orange-500" />} title="Entrega de Certificado">
              <Row label="Tipo de entrega" value={p.certificate_delivery ? (DELIVERY_LABEL[p.certificate_delivery] ?? p.certificate_delivery) : undefined} />
              <Row label="Empresa de envío" value={p.delivery_company} />
              <Row label="Dirección de envío" value={p.delivery_address} />
              <Row label="Estado de envío" value={p.shipping_status ? (SHIPPING_LABEL[p.shipping_status] ?? p.shipping_status) : undefined} />
              <Row label="N° de seguimiento" value={p.tracking_number} />
            </Section>
          )}

          {/* Extra */}
          {p.next_course_interest && (
            <Section icon={<MapPin className="w-4 h-4 text-pink-500" />} title="Interés en Próximo Curso">
              <p className="text-sm text-slate-700">{p.next_course_interest}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
        {icon} {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-primary' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
