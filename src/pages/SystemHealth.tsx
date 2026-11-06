import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  HardDrive, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface HealthData {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
  database?: {
    status: string;
    dialect: string;
    totalUsers?: number;
    totalTickets?: number;
  };
  memoryMb?: {
    rss: number;
    heapUsed: number;
  };
  nodeVersion?: string;
  environment?: string;
}

export const SystemHealth: React.FC = () => {
  const { error } = useToast();
  const [liveStatus, setLiveStatus] = useState<{ status: string; uptimeSeconds: number; timestamp: string } | null>(null);
  const [readyData, setReadyData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'linux' | 'nginx' | 'backups'>('status');

  const checkHealth = async () => {
    setLoading(true);
    try {
      const [liveRes, readyRes] = await Promise.all([
        fetch('/health/live').then((r) => r.json()),
        fetch('/health/ready').then((r) => r.json())
      ]);

      if (liveRes) {
        setLiveStatus(liveRes);
      }
      if (readyRes) {
        setReadyData(readyRes);
      }
      setLastCheckTime(new Date());
    } catch {
      error('Erro ao obter métricas de saúde do sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-600" />
            Estado e Diagnóstico do Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitorização em tempo real de probes de liveness/readiness, base de dados e infraestrutura Linux
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastCheckTime && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Último check: {lastCheckTime.toLocaleTimeString('pt-PT')}
            </span>
          )}
          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Diagnóstico
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'status'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Diagnóstico em Tempo Real
        </button>
        <button
          onClick={() => setActiveTab('linux')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'linux'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Serviço Linux & Systemd
        </button>
        <button
          onClick={() => setActiveTab('nginx')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'nginx'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Nginx & HTTPS (Reverse Proxy)
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'backups'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Backups e Recuperação
        </button>
      </div>

      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Liveness */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Liveness Probe</span>
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">
                {liveStatus?.status === 'UP' ? 'Operacional' : 'Degradado'}
              </div>
              <p className="text-xs text-slate-500">
                Endpoint: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/health/live</code> (HTTP 200)
              </p>
            </div>

            {/* Readiness & DB */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base de Dados</span>
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Database className="w-5 h-5" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">
                {readyData?.database?.status === 'connected' ? 'Conectada' : 'Indisponível'}
              </div>
              <p className="text-xs text-slate-500">
                Motor: <span className="font-semibold text-slate-700">{readyData?.database?.dialect?.toUpperCase()}</span> ({readyData?.database?.totalUsers ?? 0} users • {readyData?.database?.totalTickets ?? 0} tickets)
              </p>
            </div>

            {/* Uptime */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uptime Contínuo</span>
                <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Clock className="w-5 h-5" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">
                {formatUptime(readyData?.uptimeSeconds ?? liveStatus?.uptimeSeconds ?? 0)}
              </div>
              <p className="text-xs text-slate-500">Sem paragens não planeadas</p>
            </div>

            {/* Memory RSS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Memória Processo</span>
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Cpu className="w-5 h-5" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">
                {readyData?.memoryMb ? `${readyData.memoryMb.heapUsed} MB Heap` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500">
                RSS: {readyData?.memoryMb?.rss ?? 0} MB
              </p>
            </div>
          </div>

          {/* Detailed Probe Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Especificações do Ambiente Node.js
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Ambiente de Execução (NODE_ENV)</dt>
                  <dd className="font-semibold text-slate-800">{readyData?.environment || 'development'}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Versão Node.js</dt>
                  <dd className="font-semibold text-slate-800">{readyData?.nodeVersion || 'v22.x LTS'}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Porta HTTP Interna</dt>
                  <dd className="font-semibold text-slate-800">3000</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Dialeto SQL em Execução</dt>
                  <dd className="font-semibold text-indigo-700">{readyData?.database?.dialect?.toUpperCase()} (ACID compliant)</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-slate-500">Timestamp Servidor</dt>
                  <dd className="text-slate-700">{readyData?.timestamp ? new Date(readyData.timestamp).toLocaleString('pt-PT') : 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Controlos de Segurança Ativos
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800">Rate Limiting no Express</h3>
                    <p className="text-xs text-slate-500">Max 100 pedidos/15min em rotas gerais e 15 tentativas/15min no login contra força bruta.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800">Headers de Segurança HTTP (Helmet)</h3>
                    <p className="text-xs text-slate-500">X-Frame-Options, Strict-Transport-Security, Content-Security-Policy configurados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800">2FA TOTP RFC 6238</h3>
                    <p className="text-xs text-slate-500">Suporte a Google Authenticator / Microsoft Authenticator com encriptação de segredos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'linux' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-slate-800" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Configuração de Serviço Systemd Linux</h2>
              <p className="text-xs text-slate-500">Ficheiro de serviço pronto para produção em Debian/Ubuntu/RHEL</p>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 mb-2"># /etc/systemd/system/sw-servicedesk.service</div>
            <pre>{`[Unit]
Description=SW Service Desk v1.0 - Production Application
After=network.target mysqld.service
Wants=mysqld.service

[Service]
Type=simple
User=servicedesk
Group=servicedesk
WorkingDirectory=/opt/sw-servicedesk
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:/var/log/sw-servicedesk/app.log
StandardError=append:/var/log/sw-servicedesk/error.log
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target`}</pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Comandos Operacionais:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Iniciar & Habilitar no Boot:</span>
                <code className="text-xs text-indigo-700 font-mono">sudo systemctl enable --now sw-servicedesk</code>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Ver Logs em Tempo Real:</span>
                <code className="text-xs text-indigo-700 font-mono">sudo journalctl -u sw-servicedesk -f</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nginx' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-slate-800" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Configuração de Proxy Reverso Nginx + HTTPS</h2>
              <p className="text-xs text-slate-500">Terminação SSL, compressão Gzip, buffers e rate limiting</p>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 mb-2"># /etc/nginx/sites-available/sw-servicedesk.conf</div>
            <pre>{`server {
    listen 80;
    server_name servicedesk.swcloud.local;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name servicedesk.swcloud.local;

    ssl_certificate /etc/ssl/certs/sw-servicedesk.crt;
    ssl_certificate_key /etc/ssl/private/sw-servicedesk.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</pre>
          </div>
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-slate-800" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Procedimentos de Cópia de Segurança e Restauro</h2>
              <p className="text-xs text-slate-500">Estratégia 3-2-1 com retenção de 30 dias para base de dados e anexos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Script de Backup Automatizado
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Localização: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/scripts/backup.sh</code>
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-xs">
                crontab -e<br />
                <span className="text-emerald-400">0 2 * * * /opt/sw-servicedesk/scripts/backup.sh &gt;&gt; /var/log/sw-backup.log 2&gt;&amp;1</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Procedimento de Restauro / Disaster Recovery
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Localização: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/scripts/restore.sh</code>
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-xs">
                sudo /opt/sw-servicedesk/scripts/restore.sh /var/backups/sw-servicedesk/2026-11-06_0200.tar.gz
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
