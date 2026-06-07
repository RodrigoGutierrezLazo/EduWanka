import React, { useState } from 'react';
import { BookOpen, FileSpreadsheet, ShieldAlert, CheckCircle2, Printer, ChevronRight, ChevronLeft, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Step = 'identificacion' | 'bien' | 'reclamacion' | 'exito';

interface ComplaintFormData {
  // Step 1: Identificación
  name: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  isMinor: boolean;
  guardianName?: string;
  guardianDni?: string;

  // Step 2: Bien Contratado
  bienType: 'Producto' | 'Servicio';
  courseName: string;
  amountPaid: string;

  // Step 3: Reclamación/Queja
  claimType: 'Reclamación' | 'Queja'; // Reclamación (disconformidad bien), Queja (malestar atencion)
  description: string;
  request: string; // lo que solicita el cliente
}

const INITIAL_FORM: ComplaintFormData = {
  name: '',
  dni: '',
  email: '',
  phone: '',
  address: '',
  isMinor: false,
  guardianName: '',
  guardianDni: '',
  bienType: 'Servicio',
  courseName: '',
  amountPaid: '',
  claimType: 'Reclamación',
  description: '',
  request: '',
};

export default function ComplaintsBook() {
  const [step, setStep] = useState<Step>('identificacion');
  const [form, setForm] = useState<ComplaintFormData>(INITIAL_FORM);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedDate, setGeneratedDate] = useState('');
  const [formErrors, setFormErrors] = useState<string>('');

  const onChange = (k: keyof ComplaintFormData, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setFormErrors('');
  };

  const validateStep = (currentStep: Step): boolean => {
    if (currentStep === 'identificacion') {
      if (!form.name.trim()) return setError('El nombre completo es obligatorio.');
      if (!form.dni.trim() || form.dni.length < 8) return setError('El número de DNI o documento es obligatorio (mínimo 8 caracteres).');
      if (!form.email.trim() || !form.email.includes('@')) return setError('Ingresa un correo electrónico válido.');
      if (!form.phone.trim()) return setError('El número de celular es obligatorio.');
      if (!form.address.trim()) return setError('La dirección de domicilio es obligatoria.');
      if (form.isMinor) {
        if (!form.guardianName?.trim()) return setError('Al ser menor de edad, el nombre del padre/tutor legal es obligatorio.');
        if (!form.guardianDni?.trim() || form.guardianDni.length < 8) return setError('El DNI del padre/tutor es obligatorio.');
      }
    } else if (currentStep === 'bien') {
      if (!form.courseName.trim()) return setError('Debes ingresar el nombre del curso, diplomado o servicio contratado.');
    } else if (currentStep === 'reclamacion') {
      if (!form.description.trim()) return setError('Describe de forma detallada el motivo de tu reclamo o queja.');
      if (!form.request.trim()) return setError('Detalla qué acción o pedido esperas por parte de la institución.');
    }
    return true;
  };

  const setError = (msg: string): boolean => {
    setFormErrors(msg);
    return false;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 'identificacion') setStep('bien');
    else if (step === 'bien') setStep('reclamacion');
  };

  const handleBack = () => {
    setFormErrors('');
    if (step === 'bien') setStep('identificacion');
    else if (step === 'reclamacion') setStep('bien');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep('reclamacion')) return;

    // Generar código de reclamo con fecha actual
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `REC-${year}-${randomNum}`;
    const dateStr = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

    const newComplaint = {
      ...form,
      code,
      date: dateStr,
      status: 'Pendiente',
      response: '',
      responseDate: ''
    };

    // Guardar en LocalStorage
    try {
      const existing = localStorage.getItem('eduwanka_complaints');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newComplaint);
      localStorage.setItem('eduwanka_complaints', JSON.stringify(list));
    } catch (err) {
      console.error('Error saving complaint to localStorage', err);
    }

    setGeneratedCode(code);
    setGeneratedDate(dateStr);
    setStep('exito');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setStep('identificacion');
    setGeneratedCode('');
    setGeneratedDate('');
    setFormErrors('');
  };

  return (
    <div className="pt-24 font-sans bg-surface min-h-screen pb-16">
      {/* Hero Header */}
      <section className="bg-primary text-white py-12 px-6 lg:px-8 relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 opacity-5 h-full pointer-events-none">
          <FileSpreadsheet className="w-96 h-full text-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-accent">
            <BookOpen className="w-3.5 h-3.5" /> Libro de Reclamaciones Virtual
          </span>
          <h1 className="text-2xl md:text-4xl font-sans font-extrabold uppercase tracking-wide">
            Hoja de <span className="text-accent italic">Reclamación</span>
          </h1>
          <p className="font-serif text-slate-300 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Conforme a lo establecido en el Código de Protección y Defensa del Consumidor del Perú (D.S. N° 011-2011-PCM).
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 mt-10">
        {formErrors && (
          <div className="bg-red-55 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl text-xs font-bold mb-6 animate-pulse">
            ⚠️ {formErrors}
          </div>
        )}

        {/* Wizard step progress */}
        {step !== 'exito' && (
          <div className="grid grid-cols-3 gap-2 mb-8 print:hidden">
            {[
              { id: 'identificacion', label: "1. Consumidor" },
              { id: 'bien', label: "2. Detalle del Bien" },
              { id: 'reclamacion', label: "3. Reclamación" }
            ].map((s, idx) => {
              const active = step === s.id;
              const completed = (step === 'bien' && s.id === 'identificacion') || (step === 'reclamacion' && s.id !== 'reclamacion');
              return (
                <div key={s.id} className="text-center space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${
                    active ? 'bg-secondary' : completed ? 'bg-primary' : 'bg-slate-200'
                  }`} />
                  <span className={`text-[10px] font-sans font-black uppercase tracking-wider block ${
                    active ? 'text-secondary' : completed ? 'text-primary' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 md:p-10 relative">
          
          {/* STEP 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
          {step === 'identificacion' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-sans font-extrabold text-primary text-base uppercase tracking-wide flex items-center gap-2">
                  <User className="w-5 h-5 text-secondary shrink-0" />
                  1. Identificación del Consumidor Reclamante
                </h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Ingresa tus datos personales reales para mantener una comunicación fluida sobre tu caso.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nombre Completo *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => onChange('name', e.target.value)}
                    placeholder="Ej: Ana Lucía Flores Gálvez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">DNI / CE / Pasaporte *</label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={e => onChange('dni', e.target.value)}
                    placeholder="Número de documento"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correo Electrónico *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => onChange('email', e.target.value)}
                    placeholder="ana.flores@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Celular / Teléfono *</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => onChange('phone', e.target.value)}
                    placeholder="Ej: 987654321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dirección de Domicilio *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => onChange('address', e.target.value)}
                    placeholder="Av. Los Naranjos 450, Dpto. 201, Trujillo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>
              </div>

              {/* Minor of age validation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isMinor"
                    checked={form.isMinor}
                    onChange={e => onChange('isMinor', e.target.checked)}
                    className="w-4 h-4 text-secondary accent-secondary focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isMinor" className="text-xs font-bold text-primary select-none cursor-pointer">
                    Soy menor de edad (Estudiante menor)
                  </label>
                </div>

                {form.isMinor && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nombre de Padre/Tutor Legal *</label>
                      <input
                        type="text"
                        value={form.guardianName}
                        onChange={e => onChange('guardianName', e.target.value)}
                        placeholder="Ej: Carlos Flores Reyes"
                        className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-secondary font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">DNI de Padre/Tutor *</label>
                      <input
                        type="text"
                        value={form.guardianDni}
                        onChange={e => onChange('guardianDni', e.target.value)}
                        placeholder="DNI del tutor"
                        className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-secondary font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-secondary text-primary font-sans font-black text-xs uppercase tracking-widest px-6 py-3 rounded-lg shadow shadow-soft hover:brightness-105 active:translate-y-0.5 cursor-pointer transition-all"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETALLE DEL BIEN CONTRATADO */}
          {step === 'bien' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-sans font-extrabold text-primary text-base uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-secondary shrink-0" />
                  2. Detalle del Bien Contratado
                </h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Especifica las características del producto o servicio que adquiriste.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tipo de Bien *</label>
                  <div className="flex gap-4">
                    {[
                      { value: 'Servicio', label: "Servicio (Diplomados, Especializaciones, Cursos)" },
                      { value: 'Producto', label: "Producto (Libros, Certificados físicos, Materiales)" }
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer select-none">
                        <input
                          type="radio"
                          name="bienType"
                          checked={form.bienType === opt.value}
                          onChange={() => onChange('bienType', opt.value)}
                          className="w-4 h-4 text-secondary accent-secondary focus:ring-0"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nombre del Curso / Diplomado o Descripción del Bien *</label>
                  <input
                    type="text"
                    value={form.courseName}
                    onChange={e => onChange('courseName', e.target.value)}
                    placeholder="Ej: Diplomado en Formación de Árbitros"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Monto total pagado (Opcional - S/.)</label>
                  <input
                    type="text"
                    value={form.amountPaid}
                    onChange={e => onChange('amountPaid', e.target.value)}
                    placeholder="Ej: 850.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-lg cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-secondary text-primary font-sans font-black text-xs uppercase tracking-widest px-6 py-3 rounded-lg shadow shadow-soft hover:brightness-105 active:translate-y-0.5 cursor-pointer transition-all"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RECLAMACIÓN O QUEJA */}
          {step === 'reclamacion' && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-sans font-extrabold text-primary text-base uppercase tracking-wide flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-secondary shrink-0" />
                  3. Detalle de la Reclamación o Queja
                </h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Elige el tipo de solicitud y describe los motivos con total libertad y precisión.</p>
              </div>

              {/* Indecopi definitions */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Selecciona el Tipo *</label>
                  <div className="flex gap-6">
                    {[
                      { value: 'Reclamación', label: "Reclamación" },
                      { value: 'Queja', label: "Queja" }
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer select-none">
                        <input
                          type="radio"
                          name="claimType"
                          checked={form.claimType === opt.value}
                          onChange={() => onChange('claimType', opt.value)}
                          className="w-4 h-4 text-secondary accent-secondary focus:ring-0"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-secondary tracking-widest leading-none">¿Qué es un Reclamo?</span>
                    <p className="text-[10px] text-slate-500 font-serif leading-normal">Disconformidad relacionada directamente a los productos o servicios adquiridos (ej: no se emitió el diploma, error de plataforma).</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">¿Qué es una Queja?</span>
                    <p className="text-[10px] text-slate-500 font-serif leading-normal">Malestar, descontento o desatención referente a la atención al cliente, procesos comerciales o personal administrativo.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Descripción del Detalle del Reclamo o Queja *</label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={e => onChange('description', e.target.value)}
                    placeholder="Describe de forma clara los hechos y fechas de tu reclamo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pedido / Acción esperada del Consumidor *</label>
                  <textarea
                    rows={3}
                    value={form.request}
                    onChange={e => onChange('request', e.target.value)}
                    placeholder="¿Qué solución específica solicitas a la institución?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-lg cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-primary text-white font-sans font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:brightness-110 active:translate-y-0.5 cursor-pointer transition-all"
                >
                  <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
                  Enviar Reclamación
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: EXITO Y VOUCHER IMPRIMIBLE */}
          {step === 'exito' && (
            <div className="space-y-8 animate-fadeIn text-center">
              
              <div className="space-y-2 print:hidden">
                <div className="w-16 h-16 bg-secondary/15 rounded-full flex items-center justify-center text-secondary mx-auto border border-secondary/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-sans font-black text-primary text-xl uppercase tracking-wide pt-2">
                  ¡Reclamación Registrada con Éxito!
                </h3>
                <p className="font-serif text-slate-500 text-sm max-w-lg mx-auto">
                  Tu Hoja de Reclamación ha sido generada oficialmente. Hemos enviado una copia certificada a tu correo electrónico.
                </p>
              </div>

              {/* Official Voucher Sheet */}
              <div className="border border-slate-300 p-6 md:p-8 rounded-2xl bg-white text-left font-sans space-y-6 relative shadow-md max-w-xl mx-auto print:border-none print:shadow-none print:p-0">
                
                {/* Voucher Header */}
                <div className="border-b-2 border-slate-200 pb-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-sm text-primary tracking-wide leading-none">EduWanka</h4>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hoja de Reclamación Virtual</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-secondary/15 border border-secondary/20 text-secondary text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                      {generatedCode}
                    </span>
                    <p className="text-[8px] text-slate-400 font-bold mt-1.5">{generatedDate}</p>
                  </div>
                </div>

                {/* Voucher grid content */}
                <div className="space-y-4 text-[10px] md:text-xs">
                  
                  {/* Consumer Section */}
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[8px]">1. Datos del Consumidor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-medium text-primary">
                      <p><strong>Nombre:</strong> {form.name}</p>
                      <p><strong>DNI/Doc:</strong> {form.dni}</p>
                      <p><strong>Email:</strong> {form.email}</p>
                      <p><strong>Celular:</strong> {form.phone}</p>
                      {form.isMinor && (
                        <p className="sm:col-span-2"><strong>Padre/Tutor:</strong> {form.guardianName} ({form.guardianDni})</p>
                      )}
                    </div>
                  </div>

                  {/* Product/Service Section */}
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[8px]">2. Detalle del Bien</p>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-medium text-primary grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <p><strong>Tipo de Bien:</strong> {form.bienType}</p>
                      <p><strong>Monto:</strong> {form.amountPaid ? `S/. ${form.amountPaid}` : 'No especificado'}</p>
                      <p className="sm:col-span-2"><strong>Descripción:</strong> {form.courseName}</p>
                    </div>
                  </div>

                  {/* Claim Details */}
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[8px]">3. Detalle de Reclamación ({form.claimType})</p>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-medium text-primary space-y-2">
                      <p><strong>Motivo / Hechos:</strong> <span className="text-slate-600 block pt-0.5 leading-relaxed font-serif italic">"{form.description}"</span></p>
                      <p><strong>Pedido del Consumidor:</strong> <span className="text-slate-600 block pt-0.5 leading-relaxed font-serif italic">"{form.request}"</span></p>
                    </div>
                  </div>

                  {/* Regulatory deadlines warning */}
                  <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-lg text-[9px] leading-relaxed font-serif text-slate-600">
                    * De conformidad con las leyes vigentes del Estado Peruano, el proveedor resolverá y responderá los reclamos en un plazo no mayor a quince (15) días hábiles improrrogables a través de una comunicación formal enviada al correo del consumidor.
                  </div>

                </div>

              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center pt-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 bg-slate-150 hover:bg-slate-200 text-slate-800 font-sans font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-lg transition"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  Imprimir Hoja
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 bg-secondary text-primary font-sans font-black text-xs uppercase tracking-widest px-5 py-3 rounded-lg shadow-sm hover:brightness-105 transition"
                >
                  Registrar otro Reclamo
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
