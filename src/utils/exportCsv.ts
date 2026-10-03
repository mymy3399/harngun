import { Expense, Member, MemberBalance } from '../types';
import { formatBaht } from './currency';

export function exportTripToCsv(
  tripName: string,
  expenses: Expense[],
  members: Member[],
  balances: MemberBalance[]
) {
  // UTF-8 BOM for Microsoft Excel
  let csvContent = '\uFEFF';

  // Section 1: Trip Summary
  csvContent += `สรุปรายงานค่าใช้จ่ายกลุ่ม: "${tripName}"\r\n`;
  csvContent += `วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}\r\n`;
  csvContent += `จำนวนสมาชิก: ${members.length} คน, จำนวนบิลทั้งหมด: ${expenses.length} รายการ\r\n\r\n`;

  // Section 2: Balances Summary
  csvContent += '--- สรุปยอดดุลสุทธิรายบุคคล ---\r\n';
  csvContent += 'ชื่อสมาชิก,เบอร์พร้อมเพย์,ยอดจ่ายรวม (บาท),ยอดส่วนหารที่ต้องจ่าย (บาท),สถานะสุทธิ (บาท)\r\n';
  balances.forEach(b => {
    const status = b.net_balance > 0 ? `+${formatBaht(b.net_balance)} (ได้รับเงินคืน)` : b.net_balance < 0 ? `-${formatBaht(Math.abs(b.net_balance))} (ต้องจ่ายเพิ่ม)` : '0.00 (เคลียร์ครบแล้ว)';
    csvContent += `"${b.name}","${b.promptpay}",${b.total_paid.toFixed(2)},${b.total_consumed.toFixed(2)},"${status}"\r\n`;
  });
  csvContent += '\r\n';

  // Section 3: Expense List
  csvContent += '--- รายการบิลทั้งหมด ---\r\n';
  const memberHeaders = members.map(m => `ส่วนหาร: ${m.name}`).join(',');
  csvContent += `วันที่,ชื่อรายการ,หมวดหมู่,ผู้จ่ายเงิน,ยอดตั้งต้น (บาท),Service Charge 10%,VAT 7%,ยอดสุทธิ (บาท),รูปแบบการหาร,${memberHeaders}\r\n`;

  expenses.forEach(exp => {
    const sc = exp.has_sc ? 'มี (10%)' : 'ไม่มี';
    const vat = exp.has_vat ? 'มี (7%)' : 'ไม่มี';
    const splitTypeMap: Record<string, string> = {
      EQUAL: 'หารเท่ากัน',
      EXACT: 'ระบุยอดตรงตัว',
      SHARES: 'ตามสัดส่วน (ส่วน)',
    };
    const splitTypeStr = splitTypeMap[exp.split_type] || exp.split_type;

    const memberSplitValues = members.map(m => {
      const share = exp.splits?.[m.id] ?? 0;
      return share > 0 ? share.toFixed(2) : '0';
    }).join(',');

    csvContent += `"${exp.date}","${exp.title.replace(/"/g, '""')}","${exp.category}","${exp.payer_name || ''}",${exp.base_amount.toFixed(2)},"${sc}","${vat}",${exp.total_amount.toFixed(2)},"${splitTypeStr}",${memberSplitValues}\r\n`;
  });

  // Download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `harngun-${tripName.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
