import React from 'react';
import { CircuitProject } from '../../types/circuit';
import { generateBOM } from '../../engine/bomGenerator';
import { ClipboardList, Download, Printer, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
}

export const BOMModal: React.FC<Props> = ({ isOpen, onClose, project }) => {
  if (!isOpen) return null;

  const { items, totalEstCost, totalParts } = generateBOM(project);

  const handleExportCSV = () => {
    const header = 'Component,Type,Quantity,Value,Specification,Package,EstUnitCost,TotalCost\n';
    const rows = items
      .map(
        it =>
          `"${it.name}","${it.type}",${it.quantity},"${it.valueString}","${it.specification}","${it.packageType}",$${it.unitCostEst.toFixed(2)},$${(it.quantity * it.unitCostEst).toFixed(2)}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_BOM.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">Project Bill of Materials (BOM)</h2>
              <p className="text-xs text-[#64748B]">Complete part procurement list generated from active workbench topology</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 border-b border-[#E2E8F0] bg-white flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-[#64748B] block text-[10px]">TOTAL ITEMS</span>
              <span className="font-bold text-[#172033]">{totalParts} Parts</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">UNIQUE LINE ITEMS</span>
              <span className="font-bold text-[#172033]">{items.length} Types</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">ESTIMATED PROTOTYPE COST</span>
              <span className="font-bold text-teal-700 font-mono text-sm">${totalEstCost.toFixed(2)} USD</span>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F8FAFC]">
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-xs text-left border-collapse font-sans">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-mono text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Value / Rating</th>
                  <th className="p-3">Specification</th>
                  <th className="p-3">Package</th>
                  <th className="p-3 text-right">Est Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172033]">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#172033]">{it.name}</td>
                    <td className="p-3 font-mono font-extrabold text-blue-700">×{it.quantity}</td>
                    <td className="p-3 font-mono font-semibold">{it.valueString}</td>
                    <td className="p-3 text-xs text-[#64748B]">{it.specification}</td>
                    <td className="p-3 font-mono text-[11px] text-[#64748B]">{it.packageType}</td>
                    <td className="p-3 font-mono text-right font-bold text-[#172033]">
                      ${(it.quantity * it.unitCostEst).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <span className="text-xs text-[#64748B]">Procurement guide for real laboratory assembly</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
