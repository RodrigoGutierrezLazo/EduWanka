import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, ArrowLeft, Award, CheckCircle2, CreditCard, FileCheck,
  ImageOff, Loader2, Phone, ShieldCheck, Upload, X,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface PublicCourse {
  id: number;
  slug?: string | null;
  title: string;
  code?: string | null;
  description?: string | null;
  price: number;
  price_label: string;
  duration_weeks: number;
  image_url?: string | null;
}

type CertDelivery = 'digital' | 'pickup' | 'delivery';
type PaymentModality = 'single' | 'installments';

const CERTIFICATION_INSTITUTIONS = [
  { value: 'EduWanka', label: 'EduWanka' },
  { value: 'CAJ-Junin', label: 'Colegio de Abogados de Junin' },
  { value: 'CAJ-Ayacucho', label: 'Colegio de Abogados de Ayacucho' },
  { value: 'CAJ-Huancavelica', label: 'Colegio de Abogados de Huancavelica' },
];

const BANKS = [
  { id: 'BCP', name: 'BCP', account: '193-12345678-0-99', holder: 'EduWanka' },
  { id: 'BBVA', name: 'BBVA', account: '0011-0123-0123456789', holder: 'EduWanka' },
  { id: 'Interbank', name: 'Interbank', account: '200-3001234567', holder: 'EduWanka' },
  { id: 'Scotiabank', name: 'Scotiabank', account: '000-1234567', holder: 'EduWanka' },
  { id: 'BancoNacion', name: 'Banco de la Nacion', account: '00-000-123456', holder: 'EduWanka' },
  { id: 'Yape', name: 'Yape', account: '942 899 979', holder: 'EduWanka Academico' },
  { id: 'Plin', name: 'Plin', account: '942 899 979', holder: 'EduWanka Academico' },
  { id: 'presencial', name: 'Pago presencial', account: 'Oficina Huancayo', holder: 'Atencion academica' },
  { id: 'Culqi', name: 'Tarjeta (Culqi)', account: '-', holder: 'Pago en linea inmediato' },
];

const DELIVERY_COMPANIES = [
  { id: 'oficina', name: 'Recojo en oficina central (Huancayo) - Sin costo' },
  { id: 'shalom', name: 'Shalom - A pagar en destino' },
  { id: 'olva', name: 'Olva Courier - A pagar en destino' },
];

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const generateIdempotencyKey = (courseId: number) =>
  `aula-${courseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function StudentCoursePurchase() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: async (): Promise<PublicCourse | null> => {
      if (!id) return null;
      const { data } = await apiClient.get(`/api/v1/courses/${encodeURIComponent(id)}`);
      return data.data ?? null;
    },
    enabled: Boolean(id),
  });

  const { data: tenantInfo } = useQuery<any>({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/tenant/current');
      return data?.data ?? null;
    },
  });

  // Check if student already purchased this course
  const { data: studentData } = useQuery<{ purchases?: { status: string; course?: { id: number } | null }[] }>({
    queryKey: ['purchase-dup-check', course?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/aula/student-data');
      return data;
    },
    enabled: !!course,
  });

  const existingPurchase = (studentData?.purchases ?? []).find(
    p => p.course?.id === course?.id && ['pending_validation', 'pending_payment', 'validated', 'paid'].includes(p.status)
  );

  const [certificationInstitution, setCertificationInstitution] = useState('EduWanka');
  const [certDelivery, setCertDelivery] = useState<CertDelivery>('digital');

  useEffect(() => {
    if (tenantInfo?.name) {
      setCertificationInstitution(tenantInfo.name);
    }
  }, [tenantInfo]);
  const [deliveryCompany, setDeliveryCompany] = useState('oficina');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentModality, setPaymentModality] = useState<PaymentModality>('single');
  const [bankEntity, setBankEntity] = useState('');
  const [operationNumber, setOperationNumber] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [nextCourseInterest, setNextCourseInterest] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successId, setSuccessId] = useState<number | null>(null);

  const dynamicBanks = tenantInfo?.payment_methods && tenantInfo.payment_methods.length > 0
    ? tenantInfo.payment_methods
    : BANKS;

  const selectedBank = dynamicBanks.find(bank => bank.id === bankEntity);
  const isCulqi = bankEntity === 'Culqi';

  const certificationOptions = [
    { value: tenantInfo?.name || 'EduWanka', label: tenantInfo?.name || 'EduWanka' },
    { value: 'CAJ-Junin', label: 'Colegio de Abogados de Junin' },
    { value: 'CAJ-Ayacucho', label: 'Colegio de Abogados de Ayacucho' },
    { value: 'CAJ-Huancavelica', label: 'Colegio de Abogados de Huancavelica' },
  ];

  useEffect(() => {
    if (course && !declaredAmount) {
      setDeclaredAmount(String(course.price));
    }
  }, [course, declaredAmount]);

  const onReceipt = (file: File | null) => {
    setReceipt(file);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(file ? URL.createObjectURL(file) : null);
  };

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!bankEntity) nextErrors.bankEntity = 'Selecciona un metodo de pago';
    if (!isCulqi) {
      if (!operationNumber.trim()) nextErrors.operationNumber = 'Ingresa el numero de operacion';
      if (!receipt) nextErrors.receipt = 'Adjunta el comprobante';
    }
    if (certDelivery === 'delivery' && !deliveryAddress.trim()) {
      nextErrors.deliveryAddress = 'Indica distrito, provincia y departamento';
    }
    if (!acceptedTerms) nextErrors.acceptedTerms = 'Debes aceptar la declaracion jurada';
    return nextErrors;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !course) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('course_id', String(course.id));
      fd.append('amount', String(Math.round(Number(declaredAmount) || course.price)));
      fd.append('currency', 'PEN');
      fd.append('idempotency_key', generateIdempotencyKey(course.id));
      fd.append('payment_method', isCulqi ? 'culqi' : 'proof');
      fd.append('payment_modality', paymentModality);
      fd.append('certification_institution', certificationInstitution);
      fd.append('certificate_delivery', certDelivery);
      fd.append('accepted_terms', '1');

      if (!isCulqi) {
        fd.append('bank_entity', bankEntity);
        fd.append('operation_number', operationNumber.trim());
        fd.append('declared_amount', String(declaredAmount || course.price));
        if (receipt) fd.append('receipt', receipt);
      }

      if (certDelivery !== 'digital') {
        fd.append('delivery_company', deliveryCompany);
      }
      if (deliveryAddress.trim()) {
        fd.append('delivery_address', deliveryAddress.trim());
      }
      if (nextCourseInterest.trim()) {
        fd.append('next_course_interest', nextCourseInterest.trim());
      }

      const { data } = await apiClient.post('/api/v1/aula/purchases', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessId(data?.data?.id ?? 0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-data'] }),
        queryClient.invalidateQueries({ queryKey: ['student-data-for-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
      ]);
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const flat: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([key, messages]) => {
          flat[key] = (messages as string[])[0] ?? 'Campo invalido';
        });
        setErrors(flat);
      } else {
        setErrors({ _global: err?.response?.data?.message ?? 'No se pudo registrar la compra.' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <h1 className="text-2xl font-extrabold text-primary mb-2">Curso no encontrado</h1>
        <Link to="/aula/explorar-cursos" className="text-secondary font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al catalogo del aula
        </Link>
      </div>
    );
  }

  if (existingPurchase) {
    const approved = ['validated', 'paid'].includes(existingPurchase.status);
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
          {approved ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
        </div>
        <h1 className="text-2xl font-extrabold text-primary mb-2">
          {approved ? 'Ya estás inscrito en este curso' : 'Ya tienes una compra registrada'}
        </h1>
        <p className="text-slate-500">
          {approved
            ? <>Tu pago para <strong>{course.title}</strong> ya fue aprobado. Puedes acceder al contenido desde tu aula virtual.</>
            : <>Ya registraste tu pago para <strong>{course.title}</strong>. El equipo administrativo está revisando tu comprobante.</>
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          {approved ? (
            <Link to="/aula/cursos" className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90">
              Ir al aula virtual
            </Link>
          ) : (
            <Link to="/aula/pagos" className="px-6 py-3 rounded-full bg-amber-100 text-amber-800 text-sm font-bold hover:bg-amber-200">
              Ver estado de mi pago
            </Link>
          )}
          <Link to="/aula/explorar-cursos" className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">
            Explorar otros cursos
          </Link>
        </div>
      </div>
    );
  }

  if (successId !== null) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 mx-auto mb-5 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-primary mb-2">Compra registrada</h1>
        <p className="text-slate-500">
          Agregamos <strong>{course.title}</strong> a tu cuenta. El acceso quedara habilitado cuando el admin valide el pago.
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mt-6 mb-8 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Codigo de compra</p>
          <p className="font-mono text-2xl font-black text-primary">#{String(successId).padStart(6, '0')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/aula/pagos" className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90">
            Ver mis pagos
          </Link>
          <Link to="/aula/explorar-cursos" className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">
            Explorar mas cursos
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = resolveImg(course.image_url);

  return (
    <div className="space-y-6 pb-12">
      <button
        type="button"
        onClick={() => nav('/aula/explorar-cursos')}
        className="inline-flex items-center gap-2 text-secondary text-sm font-bold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al catalogo del aula
      </button>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary mb-2">
          Nueva compra
        </p>
        <h1 className="text-3xl font-extrabold text-primary">Agregar curso a mi cuenta</h1>
        <p className="text-slate-500 mt-1">
          Ya estas logueado. Solo confirma certificacion, pago y recomendacion futura.
        </p>
      </div>

      {errors._global && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{errors._global}</span>
        </div>
      )}
      {errors.course_id && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl px-4 py-3 text-sm">
          {errors.course_id}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Section title="Modalidad de certificacion" icon={<Award className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Institucion certificadora">
                <select
                  value={certificationInstitution}
                  onChange={event => setCertificationInstitution(event.target.value)}
                  className="form-input"
                >
                  {certificationOptions.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Entrega del certificado">
                <select
                  value={certDelivery}
                  onChange={event => setCertDelivery(event.target.value as CertDelivery)}
                  className="form-input"
                >
                  <option value="digital">Digital por email</option>
                  <option value="pickup">Recojo en oficina</option>
                  <option value="delivery">Envio a domicilio</option>
                </select>
              </Field>
            </div>

            {certDelivery === 'delivery' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                <Field label="Empresa de envio">
                  <select value={deliveryCompany} onChange={event => setDeliveryCompany(event.target.value)} className="form-input">
                    {DELIVERY_COMPANIES.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Direccion de envio" error={errors.deliveryAddress}>
                  <input
                    value={deliveryAddress}
                    onChange={event => setDeliveryAddress(event.target.value)}
                    placeholder="Distrito, provincia y departamento"
                    className="form-input"
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section title="Pago del nuevo curso" icon={<CreditCard className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <ChoiceButton
                active={paymentModality === 'single'}
                title="Pago unico"
                text="Un comprobante por el curso completo."
                onClick={() => setPaymentModality('single')}
              />
              <ChoiceButton
                active={paymentModality === 'installments'}
                title="Pago en cuotas"
                text="El equipo academico coordinara el saldo."
                onClick={() => setPaymentModality('installments')}
              />
            </div>

            {errors.bankEntity && <p className="text-red-600 text-sm mb-2">{errors.bankEntity}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {dynamicBanks.map(bank => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setBankEntity(bank.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    bankEntity === bank.id ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs text-primary">{bank.name}</p>
                </button>
              ))}
            </div>

            {selectedBank && !isCulqi && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1 text-sm mb-5 flex gap-4 items-start">
                {selectedBank.logo_path && (
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={selectedBank.logo_path.startsWith('http') || selectedBank.logo_path.startsWith('/storage') || selectedBank.logo_path.startsWith('blob:') ? selectedBank.logo_path : `/storage/${selectedBank.logo_path}`}
                      alt={selectedBank.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <p className="font-bold text-amber-900">Datos para {selectedBank.name}</p>
                  <p><span className="text-slate-600">Cuenta / Celular:</span> <strong className="font-mono">{selectedBank.account}</strong></p>
                  <p><span className="text-slate-600">Titular:</span> <strong>{selectedBank.holder}</strong></p>
                </div>
              </div>
            )}

            {selectedBank && isCulqi && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mb-5">
                El pago con tarjeta se registrara como pendiente de pago si Culqi esta habilitado.
              </div>
            )}

            {!isCulqi && bankEntity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Monto pagado (S/)">
                  <input
                    type="number"
                    step="0.01"
                    value={declaredAmount}
                    onChange={event => setDeclaredAmount(event.target.value)}
                    className="form-input"
                  />
                </Field>
                <Field label="Numero de operacion" error={errors.operationNumber}>
                  <input
                    value={operationNumber}
                    onChange={event => setOperationNumber(event.target.value)}
                    placeholder="Ej. 4827193"
                    className="form-input"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Comprobante" error={errors.receipt} hint="JPG, PNG o PDF. Max. 5 MB.">
                    <ReceiptUploader file={receipt} preview={receiptPreview} onChange={onReceipt} />
                  </Field>
                </div>
              </div>
            )}
          </Section>

          <Section title="Recomendacion futura" icon={<ShieldCheck className="w-5 h-5" />}>
            <Field label="Que curso te gustaria recibir despues?" hint="Opcional. Ayuda a recomendarte programas relevantes.">
              <input
                value={nextCourseInterest}
                onChange={event => setNextCourseInterest(event.target.value)}
                placeholder="Ej. Derecho penal empresarial"
                className="form-input"
              />
            </Field>
          </Section>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={event => setAcceptedTerms(event.target.checked)}
                className="mt-1 accent-secondary w-4 h-4"
              />
              <span className="text-sm text-slate-600">
                <strong className="block text-primary">Declaracion jurada</strong>
                Confirmo que el comprobante corresponde a un pago real del curso seleccionado.
              </span>
            </label>
            {errors.acceptedTerms && <p className="text-sm text-red-600">{errors.acceptedTerms}</p>}

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
              <Phone className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
              <span>
                Soporte academico: <strong className="font-mono">+51 942 899 979</strong>.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-secondary px-6 py-4 text-sm font-black uppercase tracking-widest text-primary hover:brightness-95 disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Registrando compra
                </span>
              ) : 'Confirmar nueva compra'}
            </button>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-20 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-40 bg-slate-100">
              {imageUrl ? (
                <img src={imageUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageOff className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-2">
                {course.code ?? 'Curso'}
              </p>
              <h2 className="text-xl font-extrabold text-primary leading-tight">{course.title}</h2>
              <p className="text-sm text-slate-500 mt-2">{course.duration_weeks} semanas</p>
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total del curso</p>
                <p className="text-3xl font-black text-primary">{course.price_label}</p>
              </div>
            </div>
          </div>
        </aside>
      </form>

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 150ms;
          background: white;
        }
        .form-input:focus { border-color: var(--color-secondary, #c9a961); }
      `}</style>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-lg font-extrabold text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">{label}</span>
      {children}
      {hint && !error && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 mt-1 font-medium">{error}</span>}
    </label>
  );
}

function ChoiceButton({ active, title, text, onClick }: { active: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-all ${
        active ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <p className="font-bold text-sm text-primary">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{text}</p>
    </button>
  );
}

function ReceiptUploader({ file, preview, onChange }: { file: File | null; preview: string | null; onChange: (file: File | null) => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      if (droppedFile.size <= 5 * 1024 * 1024) {
        onChange(droppedFile);
      }
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragEnter={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="aula-receipt-input"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={event => onChange(event.target.files?.[0] ?? null)}
      />
      <label htmlFor="aula-receipt-input" className="cursor-pointer block">
        {preview && file?.type.startsWith('image/') ? (
          <div className="relative h-40 rounded-lg overflow-hidden border-2 border-slate-200 group">
            <img src={preview} alt="Comprobante" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-bold text-sm">Click para cambiar</span>
            </div>
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); onChange(null); }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : file?.type === 'application/pdf' ? (
          <div className="border-2 border-slate-200 rounded-lg p-4 flex items-center gap-3 hover:border-secondary transition-colors">
            <FileCheck className="w-8 h-8 text-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-primary truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); onChange(null); }}
              className="text-red-500 hover:text-red-600 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center transition-all ${dragOver ? 'border-secondary bg-secondary/5 scale-[1.02]' : 'border-slate-300 hover:border-secondary hover:bg-slate-50'}`}>
            <Upload className="w-7 h-7 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-primary">Subir comprobante</p>
            <p className="text-xs text-slate-400">Arrastra o haz clic — JPG, PNG o PDF - max 5 MB</p>
          </div>
        )}
      </label>
    </div>
  );
}
