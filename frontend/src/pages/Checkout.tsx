import { useState, useEffect } from "react";
import type { FormEvent, ReactNode } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowLeft, CheckCircle2, Upload, AlertCircle, Loader2,
  GraduationCap, CreditCard, MapPin, FileCheck, ImageOff,
  ShieldCheck, Award, Phone, X,
} from "lucide-react";
import { apiClient } from "../lib/apiClient";
import { isAuthenticated, getCurrentUserRole } from "../lib/auth";

/* ─── Types ─────────────────────────────────────────────────────── */
interface PublicCourse {
  id: number; slug?: string | null; title: string; code?: string | null;
  description?: string | null; price: number; price_label: string;
  duration_weeks: number; image_url?: string | null;
  teacher_name?: string | null;
}

type CertDelivery = 'digital' | 'pickup' | 'delivery';
type PaymentModality = 'single' | 'installments';

const ACADEMIC_CONDITIONS = ['Abogado', 'Bachiller', 'Estudiante', 'Otro'];
const CERTIFICATION_INSTITUTIONS = [
  { value: 'EduWanka',          label: 'EduWanka' },
  { value: 'CAJ-Junin',        label: 'Colegio de Abogados de Junín' },
  { value: 'CAJ-Ayacucho',     label: 'Colegio de Abogados de Ayacucho' },
  { value: 'CAJ-Huancavelica', label: 'Colegio de Abogados de Huancavelica' },
];

const BANKS = [
  { id: 'BCP',          name: 'BCP',                  account: '193-12345678-0-99', holder: 'EduWanka' },
  { id: 'BBVA',         name: 'BBVA',                 account: '0011-0123-0123456789', holder: 'EduWanka' },
  { id: 'Interbank',    name: 'Interbank',            account: '200-3001234567', holder: 'EduWanka' },
  { id: 'Scotiabank',   name: 'Scotiabank',           account: '000-1234567', holder: 'EduWanka' },
  { id: 'BancoNacion',  name: 'Banco de la Nación',   account: '00-000-123456', holder: 'EduWanka' },
  { id: 'Yape',         name: 'Yape',                 account: '942 899 979', holder: 'EduWanka Académico' },
  { id: 'Plin',         name: 'Plin',                 account: '942 899 979', holder: 'EduWanka Académico' },
  { id: 'presencial',   name: 'Pago presencial',      account: 'Oficina Huancayo', holder: '—' },
  { id: 'MercadoPago',  name: 'Mercado Pago (Tarjeta/Banca)', account: '—', holder: 'Pago en línea inmediato' },
];

const DELIVERY_COMPANIES = [
  { id: 'oficina', name: 'Recojo en oficina central (Huancayo) — Sin costo' },
  { id: 'shalom',  name: 'Shalom — A pagar en destino' },
  { id: 'olva',    name: 'Olva Courier — A pagar en destino' },
];

/* ─── Helpers ───────────────────────────────────────────────────── */
const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const generateIdempotencyKey = (courseCode: string) =>
  `eduwanka-${courseCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ─── Main Component ────────────────────────────────────────────── */
export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const { data: course, isLoading: loadingCourse, isError } = useQuery<PublicCourse | null>({
    queryKey: ["public-course", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/api/v1/courses/${encodeURIComponent(id)}`);
      return (data.data ?? null) as PublicCourse | null;
    },
    enabled: !!id,
  });

  const { data: tenantInfo } = useQuery<any>({
    queryKey: ["current-tenant"],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/tenant/current');
      return data?.data ?? null;
    }
  });

  /* Form State */
  const [name,      setName]      = useState('');
  const [lastName,  setLastName]  = useState('');
  const [dni,       setDni]       = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [city,      setCity]      = useState('');
  const [academicCondition,        setAcademicCondition]        = useState('');
  const [certificationInstitution, setCertificationInstitution] = useState('EduWanka');

  useEffect(() => {
    if (tenantInfo?.name) {
      setCertificationInstitution(tenantInfo.name);
    }
  }, [tenantInfo]);

  const [certDelivery, setCertDelivery] = useState<CertDelivery>('digital');
  const [deliveryCompany, setDeliveryCompany] = useState('oficina');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [paymentModality, setPaymentModality] = useState<PaymentModality>('single');
  const [bankEntity, setBankEntity] = useState<string>('');
  const [operationNumber, setOperationNumber] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState<string>('');
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

  const selectedBank = dynamicBanks.find(b => b.id === bankEntity);
  const isMercadoPago = bankEntity === 'MercadoPago';
  const totalLabel = course?.price_label ?? '—';

  const certificationOptions = [
    { value: tenantInfo?.name || 'EduWanka', label: tenantInfo?.name || 'EduWanka' },
    { value: 'CAJ-Junin',        label: 'Colegio de Abogados de Junín' },
    { value: 'CAJ-Ayacucho',     label: 'Colegio de Abogados de Ayacucho' },
    { value: 'CAJ-Huancavelica', label: 'Colegio de Abogados de Huancavelica' },
  ];
  const checkoutRole = getCurrentUserRole();
  const isStaffCheckout = isAuthenticated() && (checkoutRole === 'admin' || checkoutRole === 'superadmin' || checkoutRole === 'prof');

  /* Auto-rellenar el monto declarado con el precio del curso */
  useEffect(() => {
    if (course && !declaredAmount) {
      setDeclaredAmount(String(course.price));
    }
  }, [course]);

  /* Receipt preview */
  const onReceipt = (file: File | null) => {
    setReceipt(file);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(file ? URL.createObjectURL(file) : null);
  };

  /* Validation */
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!name.trim())      e.name     = 'Ingresa tus nombres';
    if (!lastName.trim())  e.lastName = 'Ingresa tus apellidos';
    if (!/^\d{8,12}$/.test(dni)) e.dni = 'DNI inválido (8-12 dígitos)';
    if (!/^\d{9,15}$/.test(phone)) e.phone = 'Celular inválido';
    if (!/.+@.+\..+/.test(email)) e.email = 'Correo inválido';
    if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!city.trim()) e.city = 'Ingresa tu ciudad';
    if (!academicCondition) e.academicCondition = 'Selecciona tu condición';
    if (!bankEntity) e.bankEntity = 'Selecciona método de pago';

    if (!isMercadoPago) {
      if (!operationNumber.trim()) e.operationNumber = 'Ingresa el número de operación';
      if (!receipt) e.receipt = 'Adjunta el comprobante';
    }

    if (certDelivery === 'delivery' && !deliveryAddress.trim()) {
      e.deliveryAddress = 'Indica distrito, provincia y departamento';
    }

    if (!acceptedTerms) e.acceptedTerms = 'Debes aceptar la declaración jurada';

    return e;
  };

  /* Submit */
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (isStaffCheckout) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Scroll al primer error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!course) return;

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('last_name', lastName.trim());
      fd.append('email', email.trim().toLowerCase());
      fd.append('password', password);
      fd.append('dni', dni);
      fd.append('phone', phone);
      fd.append('city', city.trim());
      fd.append('academic_condition', academicCondition);
      fd.append('certification_institution', certificationInstitution);

      fd.append('course_code', course.code ?? `COURSE-${course.id}`);
      fd.append('amount', String(Math.round(Number(declaredAmount) || course.price)));
      fd.append('currency', 'PEN');
      fd.append('idempotency_key', generateIdempotencyKey(course.code ?? String(course.id)));
      fd.append('payment_method', isMercadoPago ? 'mercadopago' : 'proof');
      fd.append('payment_modality', paymentModality);

      if (!isMercadoPago) {
        fd.append('bank_entity', bankEntity);
        fd.append('operation_number', operationNumber.trim());
        fd.append('declared_amount', String(declaredAmount || course.price));
        if (receipt) fd.append('receipt', receipt);
      }

      fd.append('certificate_delivery', certDelivery);
      if (certDelivery !== 'digital') {
        fd.append('delivery_company', deliveryCompany);
        if (deliveryAddress) fd.append('delivery_address', deliveryAddress.trim());
      }
      if (nextCourseInterest) fd.append('next_course_interest', nextCourseInterest.trim());

      fd.append('accepted_terms', '1');

      const { data } = await apiClient.post('/api/v1/checkout/register-purchase', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data?.data?.init_point) {
        window.location.href = data.data.init_point;
        return;
      }

      setSuccessId(data?.data?.id ?? null);
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const flat: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([k, msgs]) => {
          flat[k] = (msgs as string[])[0] ?? 'Campo inválido';
        });
        setErrors(flat);
      } else {
        setErrors({ _global: err?.response?.data?.message ?? 'No se pudo registrar tu inscripción.' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  /* Success Screen */
  if (successId !== null) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-soft p-10 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-primary mb-3">¡Inscripción registrada!</h1>
          <p className="text-slate-500 mb-2">
            Tu solicitud de inscripción al curso <strong>{course?.title}</strong> fue recibida.
          </p>
          <p className="text-slate-500 mb-8">
            Nuestro equipo validará tu comprobante en las próximas <strong>24 horas hábiles</strong>.
            Te notificaremos por WhatsApp al <strong>{phone}</strong>.
          </p>
          <div className="bg-slate-50 rounded-xl p-5 mb-8 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Código de inscripción</p>
            <p className="font-mono font-bold text-2xl text-primary">#{successId.toString().padStart(6, '0')}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="px-6 py-3 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition">
              Iniciar sesión en el aula
            </Link>
            <Link to="/cursos" className="px-6 py-3 border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-50 transition">
              Ver más cursos
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* Loading / Error */
  if (loadingCourse) {
    return (
      <div className="min-h-screen pt-40 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }
  if (isError || !course) {
    return (
      <div className="min-h-screen pt-40 text-center px-6">
        <h1 className="text-3xl font-bold text-primary mb-4">Curso no encontrado</h1>
        <Link to="/cursos" className="text-secondary font-bold inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Back link */}
        <Link to={`/cursos/${course.slug ?? course.id}`} className="text-secondary font-bold inline-flex items-center mb-6 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al curso
        </Link>

        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-primary mb-2">
          Finalizar Inscripción
        </h1>
        <p className="text-slate-500 mb-10 max-w-2xl">
          Completa tus datos, sube el comprobante de pago y nuestro equipo validará tu acceso al aula virtual.
        </p>

        {isStaffCheckout && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-6 py-5 mb-8 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-bold text-sm">
                Estás logueado como {checkoutRole === 'admin' ? 'Administrador' : checkoutRole === 'superadmin' ? 'Super Admin' : 'Profesor'}
              </p>
              <p className="text-amber-700 text-xs mt-1">
                Esta es una vista de solo lectura del formulario de inscripción. Las cuentas de staff no pueden realizar compras. Para inscribir a un estudiante, hazlo desde el panel de administración.
              </p>
            </div>
          </div>
        )}

        {errors._global && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm">{errors._global}</span>
          </div>
        )}

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Section 1: Datos del estudiante */}
            <Section number={1} title="Datos del Estudiante" icon={<GraduationCap className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nombres *" error={errors.name}>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Juan Carlos"
                    className="form-input" />
                </Field>
                <Field label="Apellidos *" error={errors.lastName}>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Pérez García"
                    className="form-input" />
                </Field>
                <Field label="DNI *" error={errors.dni}>
                  <input value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                    maxLength={12} placeholder="12345678" className="form-input" />
                </Field>
                <Field label="Celular (WhatsApp) *" error={errors.phone}>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={15} placeholder="987654321" className="form-input" />
                </Field>
                <Field label="Correo electrónico *" error={errors.email}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com" className="form-input" />
                </Field>
                <Field label="Contraseña (acceso al aula) *" error={errors.password}>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres" className="form-input" />
                </Field>
                <Field label="Ciudad de residencia *" error={errors.city}>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Lima" className="form-input" />
                </Field>
                <Field label="Condición académica *" error={errors.academicCondition}>
                  <select value={academicCondition} onChange={e => setAcademicCondition(e.target.value)} className="form-input">
                    <option value="">— Selecciona —</option>
                    {ACADEMIC_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Institución de certificación" hint="¿Dónde quieres tu certificado?">
                  <select value={certificationInstitution} onChange={e => setCertificationInstitution(e.target.value)} className="form-input">
                    {certificationOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Section 2: Certificación y envío */}
            <Section number={2} title="Certificación y Envío" icon={<Award className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {[
                  { v: 'digital' as const, label: 'Digital', desc: 'Recibe el PDF por email' },
                  { v: 'pickup'  as const, label: 'Recojo', desc: 'En oficina Huancayo' },
                  { v: 'delivery' as const, label: 'Delivery', desc: 'Envío a domicilio' },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setCertDelivery(opt.v)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      certDelivery === opt.v ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <p className="font-bold text-sm text-primary">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {certDelivery !== 'digital' && (
                <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                  {certDelivery === 'delivery' && (
                    <Field label="Empresa de delivery" hint="El costo de envío se paga al recibir">
                      <select value={deliveryCompany} onChange={e => setDeliveryCompany(e.target.value)} className="form-input">
                        {DELIVERY_COMPANIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label={certDelivery === 'delivery' ? 'Dirección de envío *' : 'Distrito / Provincia / Departamento'} error={errors.deliveryAddress}>
                    <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Av. Real 123, Huancayo, Junín" className="form-input" />
                  </Field>
                </div>
              )}
            </Section>

            {/* Section 3: Modalidad de pago */}
            <Section number={3} title="Modalidad de Pago" icon={<CreditCard className="w-5 h-5" />}>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentModality('single')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentModality === 'single' ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <p className="font-bold text-sm text-primary">Pago Único</p>
                  <p className="text-xs text-slate-500 mt-0.5">Acceso inmediato tras validación</p>
                </button>
                <button type="button" onClick={() => setPaymentModality('installments')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentModality === 'installments' ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <p className="font-bold text-sm text-primary">Pago en Cuotas</p>
                  <p className="text-xs text-slate-500 mt-0.5">Coordinaremos por WhatsApp</p>
                </button>
              </div>
            </Section>

            {/* Section 4: Bancos / billeteras */}
            <Section number={4} title="Selecciona tu Método de Pago" icon={<ShieldCheck className="w-5 h-5" />}>
              {errors.bankEntity && <p className="text-red-600 text-sm mb-2">{errors.bankEntity}</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {dynamicBanks.map(b => (
                  <button key={b.id} type="button" onClick={() => setBankEntity(b.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      bankEntity === b.id ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <p className="font-bold text-xs text-primary">{b.name}</p>
                  </button>
                ))}
              </div>

              {selectedBank && !isMercadoPago && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-sm flex gap-4 items-start">
                  {selectedBank.logo_path && (
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={selectedBank.logo_path.startsWith('http') || selectedBank.logo_path.startsWith('/storage') || selectedBank.logo_path.startsWith('blob:') ? selectedBank.logo_path : `/storage/${selectedBank.logo_path}`}
                        alt={selectedBank.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">Datos para {selectedBank.name}</p>
                    <p className="mt-1"><span className="text-slate-600">Cuenta / Celular:</span> <strong className="font-mono">{selectedBank.account}</strong></p>
                    <p><span className="text-slate-600">Titular:</span> <strong>{selectedBank.holder}</strong></p>
                  </div>
                </div>
              )}

              {isMercadoPago && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                  <p className="font-bold text-blue-900 mb-1">Pago en línea — Mercado Pago</p>
                  <p className="text-blue-800">Después de registrar tu inscripción serás redirigido a Mercado Pago para completar tu pago de forma segura.</p>
                </div>
              )}

              {/* Datos del depósito */}
              {!isMercadoPago && bankEntity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <Field label="Monto pagado (S/) *" error={errors.declaredAmount}>
                    <input type="number" step="0.01" value={declaredAmount}
                      onChange={e => setDeclaredAmount(e.target.value)}
                      className="form-input" />
                  </Field>
                  <Field label="Número de operación / Voucher *" error={errors.operationNumber}>
                    <input value={operationNumber} onChange={e => setOperationNumber(e.target.value)}
                      placeholder="Ej. 4827193" className="form-input" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Foto del comprobante *" error={errors.receipt}
                      hint="JPG, PNG o PDF. Máx. 5 MB.">
                      <ReceiptUploader file={receipt} preview={receiptPreview} onChange={onReceipt} />
                    </Field>
                  </div>
                </div>
              )}
            </Section>

            {/* Section 5: Próximo curso */}
            <Section number={5} title="Interés futuro (opcional)" icon={<MapPin className="w-5 h-5" />}>
              <Field label="¿Sobre qué curso te gustaría recibir información?" hint="Esto nos ayuda a sugerirte programas">
                <input value={nextCourseInterest} onChange={e => setNextCourseInterest(e.target.value)}
                  placeholder="Ej. Derecho Penal Empresarial" className="form-input" />
              </Field>
            </Section>

            {/* Declaration & Submit */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-1 accent-secondary w-4 h-4" />
                <div className="text-sm text-slate-700">
                  <p className="font-bold">Declaración Jurada</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Declaro bajo juramento que la información proporcionada es verídica y el comprobante adjunto corresponde a un pago real.
                    Subir comprobantes falsos invalidará la inscripción y podrá derivar en acciones legales.
                  </p>
                </div>
              </label>
              {errors.acceptedTerms && <p className="text-red-600 text-sm">{errors.acceptedTerms}</p>}

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
                <Phone className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                <span>
                  ¿Tienes problemas? Escribe al <strong>Área Académica</strong> al WhatsApp{' '}
                  <strong className="font-mono">+51 942 899 979</strong>.
                </span>
              </div>

              {isStaffCheckout ? (
                <div className="w-full py-4 bg-slate-200 text-slate-500 rounded-full font-bold uppercase tracking-widest text-sm text-center cursor-not-allowed">
                  No disponible para cuentas de staff
                </div>
              ) : (
                <button type="submit" disabled={submitting}
                  className="w-full py-4 bg-secondary text-white rounded-full font-bold uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl disabled:opacity-60 transition-all">
                  {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</span> : 'Confirmar inscripción'}
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Sticky Summary (1/3) ───────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                <div className="h-32 bg-slate-100 relative">
                  {course.image_url ? (
                    <img src={resolveImg(course.image_url)!} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageOff className="w-10 h-10" /></div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">{course.code ?? '—'}</p>
                  <h3 className="font-display text-lg font-bold text-primary leading-tight mb-3">{course.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">Duración: {course.duration_weeks} semanas</p>

                  <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
                    <Row label="Matrícula" value="Incluida" />
                    <Row label="Curso completo" value={totalLabel} />
                    <Row label="Certificado" value="Incluido" />
                  </div>

                  <div className="border-t border-slate-100 mt-4 pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total a pagar</span>
                    </div>
                    <p className="text-3xl font-extrabold text-primary">{totalLabel}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary text-white rounded-2xl p-5">
                <h4 className="font-bold mb-3 text-sm">Beneficios incluidos</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {[
                    'Acceso inmediato al aula tras validación',
                    'Garantía de aprendizaje con docentes expertos',
                    'Certificado oficial al finalizar',
                    'Soporte por WhatsApp Académico',
                  ].map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </form>
      </div>

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

/* ─── Subcomponents ─────────────────────────────────────────────── */
function Section({ number, title, icon, children }: { number: number; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paso {number}</p>
          <h3 className="font-display font-bold text-primary text-lg leading-tight">{title}</h3>
        </div>
      </div>
      {children}
    </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-bold text-primary">{value}</span>
    </div>
  );
}

function ReceiptUploader({ file, preview, onChange }: { file: File | null; preview: string | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <input type="file" id="receipt-input" accept="image/*,application/pdf" className="hidden"
        onChange={e => onChange(e.target.files?.[0] ?? null)} />
      <label htmlFor="receipt-input" className="cursor-pointer block">
        {preview && file?.type.startsWith('image/') ? (
          <div className="relative h-40 rounded-lg overflow-hidden border-2 border-slate-200 group">
            <img src={preview} alt="Comprobante" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-bold text-sm">Click para cambiar</span>
            </div>
            <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
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
            <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }}
              className="text-red-500 hover:text-red-600 shrink-0"><X className="w-5 h-5" /></button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex flex-col items-center justify-center hover:border-secondary hover:bg-slate-50 transition-all">
            <Upload className="w-7 h-7 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-primary">Subir comprobante</p>
            <p className="text-xs text-slate-400">JPG, PNG o PDF · máx 5 MB</p>
          </div>
        )}
      </label>
    </div>
  );
}
