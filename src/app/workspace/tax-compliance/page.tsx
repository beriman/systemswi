'use client';

import React from 'react';

export default function TaxCompliance() {
  const complianceItems = [
    { name: 'PPh 21 (Gaji Karyawan)', deadline: 'Tgl 10 Bulan Berikutnya', status: 'Pending' },
    { name: 'PPh 23 (Jasa Vendor)', deadline: 'Tgl 10 Bulan Berikutnya', status: 'Aman' },
    { name: 'PPh Final UMKM (0.5%)', deadline: 'Tgl 15 Bulan Berikutnya', status: 'Warning', note: 'Omset > 500jt?' },
    { name: 'Lapor SPT Tahunan Badan', deadline: '30 April', status: 'Upcoming' },
    { name: 'BPJS Ketenagakerjaan', deadline: 'Tgl 15 Bulan Berikutnya', status: 'Aman' },
    { name: 'BPJS Kesehatan', deadline: 'Tgl 10 Bulan Berikutnya', status: 'Aman' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tax & Compliance Monitor</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
              <th className="py-3 px-6 text-left">Kewajiban</th>
              <th className="py-3 px-6 text-left">Tenggat Waktu</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {complianceItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{item.name}</td>
                <td className="py-3 px-6 text-left">{item.deadline}</td>
                <td className="py-3 px-6 text-center">
                  <span className={`py-1 px-3 rounded-full text-xs 
                    ${item.status === 'Aman' ? 'bg-green-200 text-green-600' : 
                      item.status === 'Warning' ? 'bg-yellow-200 text-yellow-600' : 
                      'bg-red-200 text-red-600'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-left">{item.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-yellow-50 p-4 rounded border border-yellow-200">
        <h3 className="font-bold text-yellow-800 mb-2">⚠️ Peringatan Kepatuhan</h3>
        <ul className="list-disc list-inside text-sm text-yellow-700">
          <li>Pastikan bukti potong PPh 21 sudah didistribusikan ke karyawan sebelum Maret.</li>
          <li>Cek kembali status kepesertaan BPJS TK untuk tenaga kerja event/lepas (Fragrance Sensations).</li>
        </ul>
      </div>
    </div>
  );
}
