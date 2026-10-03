import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ReceiptViewerModalProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-4 shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="min-w-0 pr-4">
            <h3 className="font-bold text-white text-sm truncate">สลิป/ใบเสร็จ: {title}</h3>
            <span className="text-[10px] text-slate-400">รูปภาพหลักฐานการชำระเงิน</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto my-3 flex items-center justify-center bg-slate-950/80 rounded-2xl p-2 border border-slate-800/60">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดรูปต้นฉบับ</span>
          </a>
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
