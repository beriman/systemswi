import EquityDashboard from './equity';

export default function FinancePage() {
  return (
    <div className="space-y-8 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Finance & Capital</h1>
        <p className="text-gray-500">Monitoring kesehatan modal dan arus kas PT Sensasi Wangi Indonesia</p>
      </header>

      {/* Equity Section */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <EquityDashboard />
        </div>
      </section>

      {/* Financial Report Upload Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Laporan Keuangan Bulanan</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
            <div className="mb-3 text-gray-400 group-hover:text-blue-500">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">XLSX, CSV (Max 10MB)</p>
            <p className="text-xs text-blue-500 mt-4 font-mono bg-blue-100 py-1 px-2 rounded inline-block">
              Auto-sync: E:\SWI\SWI\1. Company Profile\financial-report.xlsx
            </p>
          </div>
        </div>

        {/* Quick Stats / Backend Mock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Live Cashflow Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded text-green-700">
              <span className="font-medium">Pemasukan (YTD)</span>
              <span className="font-bold text-lg">Rp 22.350.000</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded text-red-700">
              <span className="font-medium">Pengeluaran (YTD)</span>
              <span className="font-bold text-lg">Rp 18.200.000</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded text-blue-700 border-t-2 border-blue-200">
              <span className="font-medium">Net Profit</span>
              <span className="font-bold text-lg">Rp 4.150.000</span>
            </div>
            <p className="text-xs text-gray-400 text-right mt-2">*Data synced from last report</p>
          </div>
        </div>
      </section>
    </div>
  );
}
