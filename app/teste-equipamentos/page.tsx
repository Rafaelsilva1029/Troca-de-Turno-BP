"use client"

export default function TesteEquipamentos() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 border-l-4 border-green-500 p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-green-400 mb-2">🧪 TESTE - Equipamentos Localização</h1>
          <p className="text-slate-300">Se você está vendo esta tela, o roteamento está funcionando!</p>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">✅ Rota Funcionando</h3>
            <p className="text-sm text-slate-400">URL: /teste-equipamentos</p>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">🎯 Próximo Passo</h3>
            <p className="text-sm text-slate-400">Corrigir rota principal</p>
          </div>
        </div>

        {/* Simulação de Equipamentos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-100 mb-4">📍 Equipamentos (Simulação)</h2>

          {[
            { frota: "BP001", categoria: "PIPAS ÁGUA BRUTA", localizacao: "Setor A", status: "ATIVO" },
            { frota: "BP002", categoria: "MUNCK DISPONÍVEL", localizacao: "Oficina", status: "MANUTENÇÃO" },
            { frota: "BP003", categoria: "CAÇAMBAS DISPONÍVEIS", localizacao: "Pátio", status: "ATIVO" },
          ].map((eq, index) => (
            <div key={index} className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-green-400">Frota: {eq.frota}</h3>
                  <p className="text-slate-300 text-sm">{eq.categoria}</p>
                  <p className="text-slate-400 text-sm">📍 {eq.localizacao}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    eq.status === "ATIVO" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {eq.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-slate-800 p-4 rounded-lg border border-slate-600">
          <h3 className="font-semibold text-yellow-400 mb-2">🔧 Debug Info</h3>
          <div className="text-sm text-slate-400 space-y-1">
            <p>• Timestamp: {new Date().toLocaleString()}</p>
            <p>• User Agent: {typeof window !== "undefined" ? navigator.userAgent.slice(0, 50) + "..." : "Server"}</p>
            <p>• URL: {typeof window !== "undefined" ? window.location.href : "Server"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
