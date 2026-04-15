import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AuthWarning = () => {
  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-xl flex gap-3 text-amber-800 shadow-sm">
      <AlertTriangle size={24} className="text-amber-500 shrink-0" />
      <div>
        <p className="font-bold text-sm">Aviso de Autenticação (Firebase Auth não configurado)</p>
        <p className="text-xs mt-1">O sistema entrou em modo de desenvolvimento. Para testar localmente, você pode temporariamente usar <code className="bg-amber-200 px-1 rounded">allow read, write: if true;</code> nas Regras do Firestore, mas <strong>nunca use essa regra em produção</strong>.</p>
      </div>
    </div>
  );
};

export default AuthWarning;
