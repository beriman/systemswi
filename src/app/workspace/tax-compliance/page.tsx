"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaxCompliance() {
  const complianceItems = [
    { name: "PPh 21 (Gaji Karyawan)", deadline: "Tgl 10 Bulan Berikutnya", status: "Pending" },
    { name: "PPh 23 (Jasa Vendor)", deadline: "Tgl 10 Bulan Berikutnya", status: "Aman" },
    { name: "PPh Final UMKM (0.5%)", deadline: "Tgl 15 Bulan Berikutnya", status: "Warning", note: "Omset > 500jt?" },
    { name: "Lapor SPT Tahunan Badan", deadline: "30 April", status: "Upcoming" },
    { name: "BPJS Ketenagakerjaan", deadline: "Tgl 15 Bulan Berikutnya", status: "Aman" },
    { name: "BPJS Kesehatan", deadline: "Tgl 10 Bulan Berikutnya", status: "Aman" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">⚖️ Tax & Compliance Monitor</h2>
        <p className="text-muted-foreground">Monitoring kewajiban pajak dan kepatuhan — PT Sensasi Wangi Indonesia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalender Kepatuhan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">Kewajiban</th>
                  <th className="py-3 px-4 text-left font-medium">Tenggat Waktu</th>
                  <th className="py-3 px-4 text-center font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {complianceItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4">{item.deadline}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`py-1 px-3 rounded-full text-xs ${
                        item.status === "Aman" ? "bg-green-100 text-green-700" :
                        item.status === "Warning" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚠️ Peringatan Kepatuhan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700">
            <li>Pastikan bukti potong PPh 21 sudah didistribusikan ke karyawan sebelum Maret.</li>
            <li>Cek kembali status kepesertaan BPJS TK untuk tenaga kerja event/lepas.</li>
            <li>Omset tahunan perlu dimonitor untuk threshold PPh Final UMKM 0.5%.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
