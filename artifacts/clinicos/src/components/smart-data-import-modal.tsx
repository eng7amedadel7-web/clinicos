import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Stethoscope,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface SmartDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'patients' | 'services' | 'appointments' | 'pdf_knowledge';
}

export function SmartDataImportModal({
  isOpen,
  onClose,
  defaultType = 'patients',
}: SmartDataImportModalProps) {
  const queryClient = useQueryClient();
  const [dataType, setDataType] = useState<'patients' | 'services' | 'appointments' | 'pdf_knowledge'>(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<Array<Record<string, any>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ count: number; type: string } | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    if (dataType === 'pdf_knowledge') {
      toast.info('يمكنك رفع أي ملف PDF يحتوي على سياسات العيادة أو قائمة الأسعار مباشرة.');
      return;
    }
    const link = document.createElement('a');
    link.href = `/api/organization/import/templates/${dataType}`;
    link.download = `${dataType}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل نموذج الملف بنجاح');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportSummary(null);
    setIsProcessing(true);

    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setDataType('pdf_knowledge');
      setPdfTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setParsedRows([{ text: `ملف لوائح العيادة: ${selectedFile.name} (حجم: ${(selectedFile.size / 1024).toFixed(1)} KB)` }]);
      setHeaders(['المستند']);
      setIsProcessing(false);
      return;
    }

    try {
      const text = await selectedFile.text();
      setFileContent(text);

      // Call Preview API
      const res = await fetch('/api/organization/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, type: dataType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذر تحليل الملف');
      }

      const data = await res.json();
      setHeaders(data.headers || []);
      setParsedRows(data.preview || []);
      toast.success(`تم قراءة الملف بنجاح (${data.totalRows} صف)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل في قراءة محتوى الملف');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) {
      toast.error('يرجى اختيار ملف أولاً');
      return;
    }

    setIsImporting(true);
    try {
      let recordsToSubmit: Array<Record<string, any>> = [];

      if (dataType === 'pdf_knowledge') {
        recordsToSubmit = [{ text: `مستند سياسات وقواعد: ${pdfTitle || file.name}` }];
      } else {
        // Parse entire file client side if CSV
        const lines = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim().length > 0);
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        recordsToSubmit = lines.slice(1).map((line) => {
          const cells = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const row: Record<string, any> = {};
          headers.forEach((h, i) => {
            row[h] = cells[i] || '';
          });
          return row;
        });
      }

      const res = await fetch('/api/organization/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: dataType,
          records: recordsToSubmit,
          knowledgeTitle: pdfTitle,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشلت عملية الاستيراد');
      }

      const result = await res.json();
      setImportSummary({ count: result.importedCount, type: dataType });
      toast.success(`تم استيراد ${result.importedCount} سجل بنجاح وحفظها في قاعدة البيانات! 🎉`);

      // Invalidate relevant queries
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileContent('');
    setParsedRows([]);
    setHeaders([]);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e3a4d] mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <UploadCloud className="size-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">استيراد بيانات العيادة الذكي (Excel / CSV / PDF)</h3>
              <p className="text-[11px] text-slate-400">نقل وحقن السجلات والملفات مباشرة إلى جداول سوبابيز المنظمة</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Data Type Tabs */}
          {!file && (
            <div>
              <label className="block font-semibold text-slate-300 mb-2">نوع البيانات المراد استيرادها:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDataType('patients')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-start gap-1.5 ${
                    dataType === 'patients'
                      ? 'bg-sky-500/15 border-sky-500/50 text-white font-bold'
                      : 'bg-[#081624] border-[#1e3a4d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="size-4 text-sky-400" />
                  <span>قائمة المرضى</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataType('services')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-start gap-1.5 ${
                    dataType === 'services'
                      ? 'bg-sky-500/15 border-sky-500/50 text-white font-bold'
                      : 'bg-[#081624] border-[#1e3a4d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Stethoscope className="size-4 text-emerald-400" />
                  <span>الخدمات والأسعار</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataType('appointments')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-start gap-1.5 ${
                    dataType === 'appointments'
                      ? 'bg-sky-500/15 border-sky-500/50 text-white font-bold'
                      : 'bg-[#081624] border-[#1e3a4d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="size-4 text-amber-400" />
                  <span>المواعيد السابقة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataType('pdf_knowledge')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-start gap-1.5 ${
                    dataType === 'pdf_knowledge'
                      ? 'bg-sky-500/15 border-sky-500/50 text-white font-bold'
                      : 'bg-[#081624] border-[#1e3a4d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="size-4 text-pink-400" />
                  <span>لوائح ومعرفة (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {/* Download Sample Template bar */}
          {!file && dataType !== 'pdf_knowledge' && (
            <div className="bg-[#081624] border border-[#1e3a4d] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <FileSpreadsheet className="size-4 text-sky-400 shrink-0" />
                <span>لأفضل نتيجة، استخدم القالب القياسي المصمم لهذه الخانة.</span>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-[#0f2a3f] hover:bg-[#183e5c] border border-sky-500/30 text-sky-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Download className="size-3.5" />
                <span>تحميل النموذج</span>
              </button>
            </div>
          )}

          {/* Dropzone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1e3a4d] hover:border-sky-500/50 bg-[#081624]/60 hover:bg-[#081624] rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-sky-500/10 rounded-full text-sky-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="size-8" />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-1">اضغط هنا لرفع الملف أو اسحبه وأفلته هنا</p>
                <p className="text-[11px] text-slate-400">يدعم ملفات CSV، Excel، وملفات PDF الخاصة بالمعرفة</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="bg-[#081624] border border-[#1e3a4d] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{file.name}</div>
                    <div className="text-[10px] text-slate-400">
                      الحجم: {(file.size / 1024).toFixed(1)} KB • النوع: {dataType}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="تغيير الملف"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span>معاينة البيانات المكتشفة (أول {parsedRows.length} صفوف):</span>
                    </span>
                  </div>
                  <div className="border border-[#1e3a4d] rounded-xl overflow-hidden overflow-x-auto bg-[#081624]">
                    <table className="w-full text-right text-[11px]">
                      <thead className="bg-[#0a1c2e] text-slate-400 border-b border-[#1e3a4d]">
                        <tr>
                          {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e3a4d]/50">
                        {parsedRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#10273d]/40">
                            {headers.map((h, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 text-slate-300">
                                {String(row[h] || '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Report */}
              {importSummary && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300 text-xs">اكتمل الاستيراد بنجاح!</div>
                    <div className="text-[11px] text-emerald-400/80">
                      تم حفظ {importSummary.count} سجل في قاعدة البيانات وتم تفعيلها في النظام فوراً.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#1e3a4d] flex items-center justify-end gap-3 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-[#081624] hover:bg-[#142c44] border border-[#1e3a4d] text-slate-300 rounded-xl transition-all font-semibold text-xs"
          >
            {importSummary ? 'إغلاق' : 'إلغاء'}
          </button>

          {file && !importSummary && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2 text-xs"
            >
              {isImporting ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              <span>تأكيد الحفظ في سوبابيز 🚀</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
