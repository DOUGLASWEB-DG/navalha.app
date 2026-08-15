'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [status, setStatus] = useState<string>('checking');
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setStatus('checking');
      const res = await fetch('/api/whatsapp/instance');
      const data = await res.json();
      console.log('Status data:', data);
      
      if (data?.instance?.state === 'open' || data?.state === 'open' || data?.state === 'CONNECTED') {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const createInstance = async () => {
    try {
      setStatus('checking');
      const res = await fetch('/api/whatsapp/instance', { method: 'POST' });
      const data = await res.json();
      console.log('Create instance data:', data);
      
      toast.success('Comando enviado!');
      
      // Evolution API v2 geralmente retorna o QR Code aqui
      if (data?.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
        setStatus('waiting_qr');
        toast.info('Leia o QR Code com o seu WhatsApp');
      } else {
        // Se não veio na criação, pedimos explicitamente
        await connectInstance();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar instância.');
      setStatus('error');
    }
  };

  const connectInstance = async () => {
    try {
      const res = await fetch('/api/whatsapp/connect');
      const data = await res.json();
      console.log('Connect data:', data);
      
      if (data?.base64) {
        setQrCode(data.base64);
        setStatus('waiting_qr');
        toast.info('Leia o QR Code com o seu WhatsApp');
      } else if (data?.code) {
        // Alguns retornos enviam 'code' em vez de 'base64'
        setQrCode(data.code);
        setStatus('waiting_qr');
        toast.info('Leia o QR Code com o seu WhatsApp');
      } else if (data?.instance?.state === 'open' || data?.state === 'open') {
        setStatus('connected');
      } else {
        toast.error('Não foi possível gerar o QR Code no momento.');
        setStatus('disconnected');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar QR Code.');
      setStatus('error');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              WhatsApp Notificações
            </h3>
            <p className="text-sm text-muted-foreground">
              Conecte seu WhatsApp para receber notificações financeiras.
            </p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              Status:{' '}
              {status === 'checking' && <span className="text-muted-foreground">Verificando...</span>}
              {status === 'connected' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Conectado</span>}
              {status === 'disconnected' && <span className="text-rose-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Desconectado</span>}
              {status === 'error' && <span className="text-rose-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Erro de conexão</span>}
              {status === 'waiting_qr' && <span className="text-amber-500">Aguardando leitura do QR</span>}
            </div>

            {status === 'disconnected' && (
              <Button onClick={createInstance} className="w-full">
                Criar / Conectar WhatsApp
              </Button>
            )}

            {(status === 'connected' || status === 'waiting_qr') && (
              <Button onClick={checkStatus} variant="outline" className="w-full">
                Atualizar Status
              </Button>
            )}

            {qrCode && status === 'waiting_qr' && (
              <div className="mt-4 flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                <p className="text-xs text-center mt-2 text-gray-500">Abra o WhatsApp &gt; Aparelhos Conectados &gt; Conectar Aparelho</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
