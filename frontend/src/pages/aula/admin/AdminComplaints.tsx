import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Search, Eye, RefreshCw, CheckCircle2, ShieldAlert, X, AlertCircle, FileText, ChevronRight, MessageSquare, ShieldCheck, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Complaint {
  code: string;
  date: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  isMinor: boolean;
  guardianName?: string;
  guardianDni?: string;
  bienType: 'Producto' | 'Servicio';
  courseName: string;
  amountPaid: string;
  claimType: 'Reclamación' | 'Queja';
  description: string;
  request: string;
  status: 'Pendiente' | 'En Proceso' | 'Resuelto';
  response: string;
  responseDate?: string;
}

const MOCK_COMPLAINTS: Complaint[] = [
  {
    code: 'REC-2026-1049',
    date: '25/5/2026 15:30:22',
    name: 'Carlos Alberto Mendoza Torres',
    dni: '71234567',
    email: 'carlos.mendoza@gmail.com',
    phone: '951357456',
    address: 'Av. El Sol 1240, Trujillo',
    isMinor: false,
    bienType: 'Servicio',
    courseName: 'Diplomado en Formación de Árbitros',
    amountPaid: '750.00',
    claimType: 'Reclamación',
    description: 'Aún no se ha habilitado el módulo 4 del sílabo procesal en mi Aula Virtual, a pesar de que realicé el pago correspondiente el 20 de mayo y envié el voucher para la convalidación. Solicito la habilitación inmediata ya que las clases sincrónicas están por iniciar.',
    request: 'Habilitación inmediata del acceso académico y la correspondiente actualización de la matrícula del módulo 4.',
    status: 'Pendiente',
    response: '',
  },
  {
    code: 'REC-2026-8092',
    date: '24/5/2026 10:15:40',
    name: 'Silvia Valenzuela Roldán',
    dni: '45678912',
    email: 'silvia.val@outlook.com',
    phone: '962456789',
    address: 'Calle Las Orquídeas 300, Dpto 4, Lima',
    isMinor: false,
    bienType: 'Servicio',
    courseName: 'Formación de Peritos',
    amountPaid: '850.00',
    claimType: 'Queja',
    description: 'El personal de administración demoró más de 48 horas en validar mi pago mensual y responder mis consultas sobre la descarga del material de lectura del diplomado de peritos. Exijo una atención más fluida y canales rápidos de validación.',
    request: 'Mejora en los tiempos de atención y respuesta por correo electrónico administrativo.',
    status: 'Resuelto',
    response: 'Estimada Silvia, lamentamos profundamente el inconveniente en los tiempos de validación. Hemos optimizado nuestro sistema de cobros y el equipo financiero cuenta ahora con plazos máximos de 4 horas hábiles para convalidar vouchers. Tu acceso y material están plenamente garantizados. Quedamos a tu entera disposición.',
    responseDate: '24/5/2026 16:30:10',
  }
];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Reclamación' | 'Queja'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pendiente' | 'En Proceso' | 'Resuelto'>('All');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  
  // Modal Edit states
  const [editStatus, setEditStatus] = useState<'Pendiente' | 'En Proceso' | 'Resuelto'>('Pendiente');
  const [editResponse, setEditResponse] = useState('');

  // Load and seed if empty
  const loadComplaints = () => {
    try {
      const stored = localStorage.getItem('eduwanka_complaints');
      if (stored) {
        setComplaints(JSON.parse(stored));
      } else {
        // Seed mock complaints so the screen is not blank
        localStorage.setItem('eduwanka_complaints', JSON.stringify(MOCK_COMPLAINTS));
        setComplaints(MOCK_COMPLAINTS);
      }
    } catch {
      setComplaints(MOCK_COMPLAINTS);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const openDetail = (comp: Complaint) => {
    setSelectedComplaint(comp);
    setEditStatus(comp.status);
    setEditResponse(comp.response || '');
  };

  const closeDetail = () => {
    setSelectedComplaint(null);
  };

  const handleUpdate = () => {
    if (!selectedComplaint) return;

    try {
      const stored = localStorage.getItem('eduwanka_complaints');
      const list: Complaint[] = stored ? JSON.parse(stored) : [];
      
      const idx = list.findIndex(c => c.code === selectedComplaint.code);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status: editStatus,
          response: editResponse,
          responseDate: editResponse.trim() ? new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }) : undefined
        };
        localStorage.setItem('eduwanka_complaints', JSON.stringify(list));
        setComplaints(list);
        toast.success(`Hoja de reclamación ${selectedComplaint.code} actualizada con éxito.`);
        closeDetail();
      }
    } catch {
      toast.error('Error al actualizar el estado de la reclamación.');
    }
  };

  const handleDelete = (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el reclamo ${code}? Esta acción es irreversible.`)) return;

    try {
      const stored = localStorage.getItem('eduwanka_complaints');
      const list: Complaint[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(c => c.code !== code);
      localStorage.setItem('eduwanka_complaints', JSON.stringify(filtered));
      setComplaints(filtered);
      toast.error(`Reclamo ${code} eliminado de la base de datos.`);
    } catch {
      toast.error('Error al intentar eliminar el reclamo.');
    }
  };

  // Stats calculation
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pendiente').length;
  const inProgressCount = complaints.filter(c => c.status === 'En Proceso').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resuelto').length;

  // Filter complaints list
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dni.toLowerCase().includes(search.toLowerCase()) ||
      c.courseName.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'All' || c.claimType === typeFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-sans flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-secondary" /> Libro de Reclamaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Supervisa, responde y archiva los reclamos y quejas virtuales ingresados por los estudiantes.
          </p>
        </div>
        <button 
          onClick={loadComplaints}
          className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-secondary" /> Actualizar Lista
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Recibidos", value: totalCount, bg: "bg-white", text: "text-primary", border: "border-slate-150" },
          { label: "Pendientes", value: pendingCount, bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
          { label: "En Proceso", value: inProgressCount, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
          { label: "Resueltos", value: resolvedCount, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" }
        ].map((c, idx) => (
          <div key={idx} className={`${c.bg} p-5 rounded-2xl border ${c.border} shadow-sm space-y-1`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.label}</p>
            <h3 className={`text-2xl font-extrabold font-sans leading-none ${c.text}`}>{c.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters & Search Container */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, DNI o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 outline-none text-xs bg-slate-50 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition font-medium"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Tipo:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 outline-none font-bold"
            >
              <option value="All">Todos</option>
              <option value="Reclamación">Reclamación</option>
              <option value="Queja">Queja</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 outline-none font-bold"
            >
              <option value="All">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Resuelto">Resuelto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-5">Hoja</th>
                <th className="py-4 px-5">Fecha</th>
                <th className="py-4 px-5">Consumidor</th>
                <th className="py-4 px-5">Tipo</th>
                <th className="py-4 px-5">Curso / Diplomado</th>
                <th className="py-4 px-5">Estado</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((comp) => (
                <tr key={comp.code} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5 font-extrabold text-primary">{comp.code}</td>
                  <td className="py-4 px-5 text-slate-450 font-medium">{comp.date.split(' ')[0]}</td>
                  <td className="py-4 px-5">
                    <div>
                      <p className="font-extrabold text-primary leading-tight">{comp.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">DNI: {comp.dni}</p>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-block font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded ${
                      comp.claimType === 'Reclamación' ? 'bg-secondary/15 text-secondary border border-secondary/15' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {comp.claimType}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-600 max-w-xs truncate">{comp.courseName}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      comp.status === 'Pendiente' ? 'bg-red-50 text-red-700 border border-red-100' :
                      comp.status === 'En Proceso' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        comp.status === 'Pendiente' ? 'bg-red-600' : comp.status === 'En Proceso' ? 'bg-amber-600' : 'bg-emerald-600'
                      }`} />
                      {comp.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right space-x-1 shrink-0">
                    <button
                      onClick={() => openDetail(comp)}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold"
                      title="Ver Detalles y Responder"
                    >
                      <Eye className="w-3.5 h-3.5 text-secondary" /> Gestionar
                    </button>
                    <button
                      onClick={() => handleDelete(comp.code)}
                      className="inline-flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 p-1.5 rounded-lg transition"
                      title="Eliminar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 italic font-medium">
                    <AlertCircle className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                    No se encontraron reclamaciones que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLES & RESPUESTA SIMULADA */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-250 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              {/* Sticky Modal Title */}
              <div className="sticky top-0 bg-white border-b border-slate-150 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="font-sans font-extrabold text-primary text-base uppercase tracking-wide flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-secondary" />
                    Hoja de Reclamación: {selectedComplaint.code}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Ingresado en vivo: {selectedComplaint.date}</p>
                </div>
                <button onClick={closeDetail} className="p-1.5 rounded-full hover:bg-slate-100 transition">
                  <X className="w-5 h-5 text-slate-450" />
                </button>
              </div>

              {/* Detail Content */}
              <div className="p-6 space-y-6">
                
                {/* 2 Column Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Consumer Data */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      1. Identificación del Consumidor
                    </h4>
                    <div className="space-y-2 text-xs font-semibold text-primary">
                      <p><strong>Nombre:</strong> {selectedComplaint.name}</p>
                      <p><strong>DNI/Documento:</strong> {selectedComplaint.dni}</p>
                      <p><strong>Email:</strong> {selectedComplaint.email}</p>
                      <p><strong>Celular:</strong> {selectedComplaint.phone}</p>
                      <p><strong>Domicilio:</strong> {selectedComplaint.address}</p>
                      {selectedComplaint.isMinor && (
                        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-550 mt-1">
                          <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-0.5">Representante Legal</p>
                          <p><strong>Tutor:</strong> {selectedComplaint.guardianName}</p>
                          <p><strong>DNI Tutor:</strong> {selectedComplaint.guardianDni}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Contracted Item */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      2. Detalle del Bien Contratado
                    </h4>
                    <div className="space-y-2 text-xs font-semibold text-primary">
                      <p><strong>Tipo de Bien:</strong> {selectedComplaint.bienType}</p>
                      <p><strong>Nombre del Programa:</strong> {selectedComplaint.courseName}</p>
                      <p><strong>Monto Reclamado:</strong> {selectedComplaint.amountPaid ? `S/. ${selectedComplaint.amountPaid}` : 'No consignado'}</p>
                      
                      <div className="pt-4 mt-2 border-t border-slate-200 space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Registro</p>
                        <span className={`inline-block font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded ${
                          selectedComplaint.claimType === 'Reclamación' ? 'bg-secondary/15 text-secondary border border-secondary/15' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {selectedComplaint.claimType}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Hechos de la reclamación */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest border-b border-slate-200 pb-1.5">
                    3. Detalle de Reclamación / Hechos
                  </h4>
                  <div className="text-xs space-y-3">
                    <div className="space-y-1">
                      <p className="font-bold text-primary">Hechos del Consumidor:</p>
                      <p className="font-serif text-slate-600 leading-relaxed italic">"{selectedComplaint.description}"</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <p className="font-bold text-primary">Pedido o Solución Esperada:</p>
                      <p className="font-serif text-slate-600 leading-relaxed italic">"{selectedComplaint.request}"</p>
                    </div>
                  </div>
                </div>

                {/* ACTIONS & EDIT SECTION */}
                <div className="border-t-2 border-dashed border-slate-200 pt-6 space-y-4">
                  <h4 className="text-xs font-extrabold text-primary uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
                    Gestión de Respuesta e Historial Administrativo
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Select Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Actualizar Estado *</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 outline-none font-bold"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Resuelto">Resuelto (Aceptado/Concluido)</option>
                      </select>
                    </div>

                    {/* Response date preview if exists */}
                    {selectedComplaint.responseDate && (
                      <div className="space-y-1 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Última Respuesta Guardada</span>
                        <p className="text-xs font-bold text-slate-655 mt-0.5 leading-tight">{selectedComplaint.responseDate}</p>
                      </div>
                    )}
                  </div>

                  {/* Written response */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Redactar Respuesta Oficial para el Consumidor *</label>
                    <textarea
                      rows={4}
                      value={editResponse}
                      onChange={(e) => setEditResponse(e.target.value)}
                      placeholder="Escribe la carta o correo oficial de solución que se notificará al estudiante..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none font-medium resize-none"
                    />
                  </div>
                </div>

              </div>

              {/* Sticky Modal Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-150 px-6 py-4 flex justify-between gap-3 z-10">
                <button
                  onClick={closeDetail}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdate}
                  className="bg-primary text-white font-sans font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-lg shadow hover:brightness-110 transition"
                >
                  Guardar Cambios y Notificar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
