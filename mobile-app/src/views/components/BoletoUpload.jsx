import React, { useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { formatCur } from '../../utils/formatters';

const BoletoUpload = ({ 
  onUpload, 
  isUploading, 
  uploadError, 
  boletoData, 
  extractionMethod,
  progress,
  onConfirm, 
  onCancel 
}) => {
  const fileInputRef = useRef(null);

  const handleCardClick = () => {
    if (!isUploading && !boletoData) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  // Estado de preview com dados extraídos
  if (boletoData) {
    const methodBadge = extractionMethod === 'tesseract' 
      ? { text: 'OCR Local (Gratuito)', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      : { text: 'IA Avançada (Mistral)', className: 'bg-blue-100 text-blue-700 border-blue-200' };

    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-900">Boleto Processado</h3>
            <p className="text-sm text-emerald-700">Dados extraídos com sucesso</p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${methodBadge.className}`}>
            {methodBadge.text}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Valor</p>
              <p className="text-xl font-black text-emerald-600">{formatCur(boletoData.valorCobrado || 0)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Vencimento</p>
              <p className="text-sm font-bold text-slate-700">{boletoData.vencimento || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Código de Barras</p>
              <p className="text-sm font-mono text-slate-600 truncate">
                {boletoData.codigoBarras ? `${boletoData.codigoBarras.substring(0, 20)}...` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Beneficiário</p>
              <p className="text-sm font-bold text-slate-700 truncate">{boletoData.beneficiario || '-'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onConfirm(boletoData)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle2 size={18} />
            Confirmar Importação
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <X size={18} />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (uploadError) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl border border-red-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-xl">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Erro no Processamento</h3>
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-red-600 bg-red-100 hover:bg-red-200 transition-all"
        >
          <Upload size={18} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Estado de loading
  if (isUploading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-6 rounded-2xl border border-indigo-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="text-indigo-600 animate-spin mb-4" size={40} />
          <h3 className="font-bold text-indigo-900">Processando boleto...</h3>
          <p className="text-sm text-indigo-600 mt-1">{progress || 'Extraindo dados do PDF'}</p>
        </div>
      </div>
    );
  }

  // Estado inicial
  return (
    <div 
      onClick={handleCardClick}
      className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200 shadow-sm cursor-pointer hover:shadow-md hover:from-emerald-100 hover:to-teal-100 transition-all group"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
          <Upload className="text-emerald-600" size={28} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-emerald-900">Importar Boleto PDF</h3>
          <p className="text-sm text-emerald-700">Clique para selecionar o arquivo</p>
        </div>
        <FileText className="text-emerald-300 group-hover:text-emerald-400 transition-colors" size={32} />
      </div>
    </div>
  );
};

export default BoletoUpload;
