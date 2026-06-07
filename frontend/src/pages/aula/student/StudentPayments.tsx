import React, { useState } from 'react';
import { useStudentData } from '@/hooks/useStudentData';
import { 
  CreditCard, Calendar, Receipt, Package, Truck, CheckCircle2, 
  Clock, AlertCircle, Loader, ChevronDown, ChevronUp, Hash, MapPin
} from 'lucide-react';

// ── Shipping config ────────────────────────────────────────────────────────────
const SHIPPING_STEPS = [
  { key: 'pending',          label: 'Pendiente',         icon: Clock,          color: 'bg-slate-200 text-slate-500',                activeBg: 'bg-amber-400',    activeText: 'text-amber-700',    activeBorder: 'border-amber-200',   activeBg2: 'bg-amber-50'   },
  { key: 'ready_for_pickup', label: 'Listo para recojo', icon: Package,        color: 'bg-slate-200 text-slate-500',                activeBg: 'bg-blue-500',     activeText: 'text-blue-700',     activeBorder: 'border-blue-200',    activeBg2: 'bg-blue-50'    },
  { key: 'shipped',          label: 'En camino',         icon: Truck,          color: 'bg-slate-200 text-slate-500',                activeBg: 'bg-indigo-500',   activeText: 'text-indigo-700',   activeBorder: 'border-indigo-200',  activeBg2: 'bg-indigo-50'  },
  { key: 'delivered',        label: 'Entregado',         icon: CheckCircle2,   color: 'bg-slate-200 text-slate-500',                activeBg: 'bg-emerald-500',  activeText: 'text-emerald-700',  activeBorder: 'border-emerald-200', activeBg2: 'bg-emerald-50' },
];
const DIGITAL_STEP = { key: 'digital_sent', label: 'Enviado Digital', icon: CheckCircle2, activeBg: 'bg-purple-500', activeText: 'text-purple-700', activeBorder: 'border-purple-200', activeBg2: 'bg-purple-50' };

function stepIndex(status: string) {
  return SHIPPING_STEPS.findIndex(s => s.key === status);
}

function ShippingTracker({ purchase }: { purchase: any }) {
  const [open, setOpen] = useState(false);
  const isDigital = purchase.certificate_delivery === 'digital';
  const isPhysical = purchase.certificate_delivery && !isDigital;
  const status = purchase.shipping_status ?? 'pending';
  const currentIdx = stepIndex(status);

  if (!purchase.certificate_delivery) return null;

  // Determine accent colour from current status
  const activeStep = isDigital
    ? DIGITAL_STEP
    : SHIPPING_STEPS[currentIdx] ?? SHIPPING_STEPS[0];

  return (
    <div className={`mt-2 rounded-2xl border ${activeStep.activeBorder} ${activeStep.activeBg2} overflow-hidden`}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 gap-3"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${activeStep.activeBg} text-white`}>
            <activeStep.icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className={`text-[10px] font-black uppercase tracking-widest ${activeStep.activeText}`}>
              {isDigital ? 'Certificado Digital' : 'Envío Físico'} — {purchase.course?.title}
            </p>
            <p className={`text-sm font-bold ${activeStep.activeText}`}>{activeStep.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {purchase.tracking_number && (
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold font-mono ${activeStep.activeBorder} ${activeStep.activeText} ${activeStep.activeBg2}`}>
              <Hash className="w-3 h-3" /> {purchase.tracking_number}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4">
          {/* Step progress bar (physical only) */}
          {isPhysical && (
            <div className="relative flex items-center gap-0">
              {SHIPPING_STEPS.map((step, i) => {
                const reached = i <= currentIdx;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center gap-1 min-w-[56px]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors ${reached ? activeStep.activeBg : 'bg-slate-200'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[9px] font-bold uppercase text-center leading-tight ${reached ? activeStep.activeText : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < SHIPPING_STEPS.length - 1 && (
                      <div className={`flex-1 h-1 rounded-full mb-5 transition-colors ${i < currentIdx ? activeStep.activeBg : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Tracking number */}
          {purchase.tracking_number && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${activeStep.activeBorder} ${activeStep.activeBg2}`}>
              <Hash className={`w-4 h-4 ${activeStep.activeText}`} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Número de Tracking / Guía</p>
                <p className={`font-mono font-bold text-sm ${activeStep.activeText}`}>{purchase.tracking_number}</p>
              </div>
            </div>
          )}

          {/* Delivery info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {purchase.delivery_company && (
              <div className="flex items-start gap-2">
                <Truck className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                <div><p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Agencia</p><p className="font-semibold text-slate-700">{purchase.delivery_company}</p></div>
              </div>
            )}
            {purchase.delivery_address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                <div><p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Dirección</p><p className="font-semibold text-slate-700">{purchase.delivery_address}</p></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentPayments() {
  const { data, isLoading, error } = useStudentData();

  if (isLoading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary w-8 h-8" /></div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">Error al cargar tus finanzas.</div>;

  const purchases = data?.purchases || [];
  const pendingPurchases = purchases.filter((p: any) => p.status === 'pending');
  const totalDebt = pendingPurchases.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);

  // Purchases with physical shipping that are NOT delivered yet
  const activeShipments = purchases.filter((p: any) =>
    p.certificate_delivery && p.certificate_delivery !== 'digital' && p.shipping_status !== 'delivered'
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Mis Finanzas</h1>
        <p className="text-slate-500 font-medium">Gestiona tus cuotas, matrículas y el envío de tus certificados.</p>
      </div>

      {/* ── Active Shipment Banner ───────────────────────────────────────────── */}
      {activeShipments.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado de Envío de Certificados</p>
          {activeShipments.map((p: any) => (
            <ShippingTracker key={p.id} purchase={p} />
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda Total Pendiente</p>
            <p className={`text-4xl font-black ${totalDebt > 0 ? 'text-red-500' : 'text-slate-800'}`}>
              S/ {totalDebt.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${totalDebt > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            <Receipt className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Vencimiento</p>
            <p className="text-2xl font-black text-slate-800">
              {totalDebt > 0 ? 'Pendiente de pago' : 'Al día 🥳'}
            </p>
          </div>
          <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
            <Calendar className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-800">Historial de Movimientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Pago</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Envío / Certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {purchases.length > 0 ? (
                purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <CreditCard className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.course?.title || 'Inscripción'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Ref: #{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 font-medium">{new Date(p.created_at).toLocaleDateString('es-PE')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-800">S/ {parseFloat(p.amount || 0).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4">
                      <ShippingTracker purchase={p} />
                      {!p.certificate_delivery && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No tienes registros de pagos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    paid: { label: 'Pagado', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 className="w-3 h-3" /> },
    validated: { label: 'Validado', classes: 'bg-blue-50 text-blue-600 border-blue-100', icon: <CheckCircle2 className="w-3 h-3" /> },
    pending: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock className="w-3 h-3" /> },
    rejected: { label: 'Rechazado', classes: 'bg-red-50 text-red-600 border-red-100', icon: <AlertCircle className="w-3 h-3" /> },
  };
  const config = configs[status] || configs.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${config.classes}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
