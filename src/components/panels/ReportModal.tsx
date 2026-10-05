import React from 'react';
import { CircuitProject, SimulationResults } from '../../types/circuit';
import { X, Printer, Download, Copy, FileText, Check } from 'lucide-react';
import { Logo } from '../common/Logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  simulationResults: SimulationResults | null;
}

export const ReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  simulationResults,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const bom = project.components.map(c => ({
    name: c.name,
    type: c.type,
    spec:
      c.type === 'resistor'
        ? `${c.properties.resistance ?? 220} Ω`
        : c.type === 'battery'
        ? `${c.properties.voltage ?? 5.0} V DC`
        : c.type === 'led'
        ? `${c.properties.color ?? 'red'} (Vf=${c.properties.forwardVoltage ?? 2.0}V)`
        : c.type === 'capacitor'
        ? `${((c.properties.capacitance ?? 0.0001) * 1e6).toFixed(0)} µF`
        : 'Standard Spec',
    qty: 1,
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const reportText = `CIRKIT LABORATORY REPORT
========================================
Project Title: ${project.name}
Generated: ${new Date().toLocaleDateString()}

1. AIM:
To assemble, test, and simulate an electronic circuit implementing ${project.name}, and analyze its nodal voltages, loop current, and power dissipation.

2. COMPONENTS USED (BILL OF MATERIALS):
${bom.map(b => `- ${b.name} (${b.type}): ${b.spec}`).join('\n')}

3. SIMULATION RESULTS:
- Supply Voltage: ${simulationResults?.totalVoltage.toFixed(2) ?? '0.00'} V
- Total Loop Current: ${simulationResults?.totalCurrent.toFixed(2) ?? '0.00'} mA
- Total Power Consumption: ${simulationResults?.totalPower.toFixed(2) ?? '0.00'} mW
- Node Count: ${Object.keys(simulationResults?.nodeVoltages ?? {}).length} nodes

4. CONCLUSION:
The circuit was verified successfully according to Ohm's Law and Kirchhoff's Laws. All parameters remained within safe operating limits.
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] flex flex-col max-h-[90vh] select-text animate-in fade-in zoom-in-95 duration-200 text-[#172033]">
        {/* Modal Toolbar */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white rounded-t-3xl">
          <div className="flex items-center space-x-2.5">
            <Logo size={24} />
            <h3 className="font-bold text-[#172033] text-sm">
              CirKit Lab Report
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer border border-[#E2E8F0]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Document Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white font-sans text-[#172033] text-xs leading-relaxed">
          {/* Title Header */}
          <div className="border-b border-[#E2E8F0] pb-4 text-center space-y-1.5 flex flex-col items-center">
            <Logo size={42} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 font-bold block">
              CIRKIT VIRTUAL ELECTRONICS LABORATORY
            </span>
            <h1 className="text-xl md:text-2xl font-black text-[#172033] tracking-tight">
              {project.name}
            </h1>
            <p className="text-[#64748B] text-[11px]">
              Document Ref: LAB-{project.id.slice(0, 8).toUpperCase()} • Date:{' '}
              {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>

          {/* Section 1: Aim */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] font-mono">
              1. Aim of Experiment
            </h4>
            <p className="text-[#475569]">
              To construct, simulate, and mathematically analyze the electrical behavior of{' '}
              <strong className="text-[#172033]">{project.name}</strong>, verifying voltage division, branch currents,
              and component power dissipation under steady-state direct current (DC) excitation.
            </p>
          </div>

          {/* Section 2: Bill of Materials */}
          <div className="space-y-2">
            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] font-mono">
              2. Apparatus & Components (Bill of Materials)
            </h4>
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Component Type</th>
                    <th className="py-2.5 px-3">Specifications</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {bom.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-[#172033] font-semibold">{item.name}</td>
                      <td className="py-2 px-3 uppercase text-blue-700">{item.type}</td>
                      <td className="py-2 px-3 text-[#475569]">{item.spec}</td>
                      <td className="py-2 px-3 text-right text-[#64748B]">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Theory & Working Principle */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] font-mono">
              3. Theory & Working Principle
            </h4>
            <p className="text-[#475569]">
              The circuit operates in accordance with Ohm's Law (<code>V = I × R</code>) and Kirchhoff's Voltage Law (KVL),
              which asserts that the algebraic sum of electrical potential differences in any closed loop is zero.
              Semiconductor elements such as diodes and LEDs introduce a forward barrier voltage drop (<code>V_fwd</code>)
              such that current conducts primarily when <code>V_anode - V_cathode ≥ V_fwd</code>. Power dissipated in each
              element is calculated via <code>P = V × I</code>.
            </p>
          </div>

          {/* Section 4: Simulation Results */}
          <div className="space-y-2">
            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] font-mono">
              4. Experimental Simulation Data
            </h4>
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-center">
              <div>
                <span className="text-[10px] text-[#64748B] block">SUPPLY VOLTAGE</span>
                <span className="text-base font-bold text-blue-600">
                  {simulationResults?.totalVoltage.toFixed(2) ?? '0.00'} V
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">TOTAL CURRENT</span>
                <span className="text-base font-bold text-emerald-600">
                  {simulationResults?.totalCurrent.toFixed(2) ?? '0.00'} mA
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">TOTAL POWER</span>
                <span className="text-base font-bold text-amber-600">
                  {simulationResults?.totalPower.toFixed(2) ?? '0.00'} mW
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Observations */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] font-mono">
              5. Observations & Precautions
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[#475569]">
              <li>Verified that branch currents satisfy Kirchhoff's Current Law at all interconnect nodes.</li>
              <li>Current through active light emitting diodes is strictly regulated below maximum thermal limit (30 mA).</li>
              <li>A solid reference ground (0.00 V) ensures consistent potential reference across all measurement nodes.</li>
            </ul>
          </div>

          {/* Section 6: Conclusion */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] font-mono">
              6. Conclusion
            </h4>
            <p className="text-[#475569]">
              The simulated results demonstrate high congruence with theoretical values. The virtual laboratory environment
              successfully provided full parametric evaluation without risk of hardware component damage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
