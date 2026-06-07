import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Purchase } from '@/lib/types';
import { Check, X, Loader } from 'lucide-react';

interface PaymentsTableProps {
  purchases: Purchase[];
}

export function PaymentsTable({ purchases }: PaymentsTableProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { mutate: transitionStatus, isPending } = useMutation({
    mutationFn: async (data: { purchaseId: number; newStatus: string; reason: string }) => {
      return apiClient.post(`/api/v1/payments/${data.purchaseId}/status`, {
        new_status: data.newStatus,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
      setSelectedId(null);
    },
  });

  const handleValidate = (purchaseId: number) => {
    setSelectedId(purchaseId);
    transitionStatus({
      purchaseId,
      newStatus: 'validated',
      reason: 'Validado por admin',
    });
  };

  const handleReject = (purchaseId: number) => {
    setSelectedId(purchaseId);
    transitionStatus({
      purchaseId,
      newStatus: 'rejected',
      reason: 'Rechazado por admin',
    });
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Usuario</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Curso</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Monto</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                No hay pagos pendientes
              </td>
            </tr>
          ) : (
            purchases.map((purchase: any) => (
              <tr key={purchase.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{purchase.user?.name}</p>
                    <p className="text-sm text-slate-500">{purchase.user?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">{purchase.course?.title}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">S/ {Number(purchase.amount).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    {purchase.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(purchase.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidate(purchase.id)}
                      disabled={isPending || selectedId !== null}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                    >
                      {isPending && selectedId === purchase.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Validar</span>
                    </button>
                    <button
                      onClick={() => handleReject(purchase.id)}
                      disabled={isPending || selectedId !== null}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {isPending && selectedId === purchase.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Rechazar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
