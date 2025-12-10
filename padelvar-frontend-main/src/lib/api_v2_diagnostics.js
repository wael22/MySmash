// ========================================
// Tests Optionnels Frontend V2
// Fichier: src/lib/api_v2_diagnostics.js
// ========================================

/**
 * Extension optionnelle de l'API pour exploiter
 * les nouvelles fonctionnalités V2 (diagnostics, monitoring)
 * 
 * INSTALLATION:
 * 1. Copier ce fichier dans src/lib/api_v2_diagnostics.js
 * 2. Importer dans vos composants: import { diagnosticsService } from '@/lib/api_v2_diagnostics'
 * 3. Utiliser les méthodes ci-dessous
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Service pour diagnostics et monitoring avancés V2
 */
export const diagnosticsService = {
  
  /**
   * Obtenir les diagnostics complets d'un enregistrement
   * @param {string} recordingId - ID de l'enregistrement (ex: "rec_1_1762107366")
   * @returns {Promise<Object>} Diagnostics détaillés
   */
  async getRecordingDiagnostics(recordingId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/recording/v3/diagnostics/${recordingId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('[Diagnostics] Error fetching recording diagnostics:', error);
      throw error;
    }
  },

  /**
   * Obtenir le statut de tous les proxies RTSP
   * @returns {Promise<Object>} Statistiques des proxies
   */
  async getProxyStatus() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/proxy/status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('[Diagnostics] Error fetching proxy status:', error);
      throw error;
    }
  },

  /**
   * Vérifier la santé du système d'enregistrement
   * @returns {Promise<boolean>} True si système opérationnel
   */
  async checkSystemHealth() {
    try {
      const proxyStatus = await this.getProxyStatus();
      return proxyStatus && typeof proxyStatus.total_proxies === 'number';
    } catch (error) {
      console.error('[Diagnostics] System health check failed:', error);
      return false;
    }
  }
};

/**
 * Composant React pour afficher les diagnostics en temps réel
 * 
 * USAGE:
 * import { useRecordingDiagnostics } from '@/lib/api_v2_diagnostics';
 * 
 * function MyComponent({ recordingId }) {
 *   const { diagnostics, loading, error, refresh } = useRecordingDiagnostics(recordingId);
 *   
 *   if (loading) return <p>Chargement...</p>;
 *   if (error) return <p>Erreur: {error}</p>;
 *   
 *   return (
 *     <div>
 *       <p>Segments: {diagnostics.recording.segments.length}</p>
 *       <button onClick={refresh}>Actualiser</button>
 *     </div>
 *   );
 * }
 */
import { useState, useEffect, useCallback } from 'react';

export function useRecordingDiagnostics(recordingId, autoRefresh = false, intervalMs = 10000) {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDiagnostics = useCallback(async () => {
    if (!recordingId) return;
    
    try {
      setLoading(true);
      const data = await diagnosticsService.getRecordingDiagnostics(recordingId);
      setDiagnostics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    fetchDiagnostics();

    if (autoRefresh) {
      const interval = setInterval(fetchDiagnostics, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchDiagnostics, autoRefresh, intervalMs]);

  return {
    diagnostics,
    loading,
    error,
    refresh: fetchDiagnostics
  };
}

/**
 * Hook pour monitoring santé système
 * 
 * USAGE:
 * import { useSystemHealth } from '@/lib/api_v2_diagnostics';
 * 
 * function HealthIndicator() {
 *   const { isHealthy, loading } = useSystemHealth(true, 30000); // Check toutes les 30s
 *   
 *   return (
 *     <Badge variant={isHealthy ? 'success' : 'destructive'}>
 *       {isHealthy ? 'Système OK' : 'Système indisponible'}
 *     </Badge>
 *   );
 * }
 */
export function useSystemHealth(autoCheck = true, intervalMs = 30000) {
  const [isHealthy, setIsHealthy] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      const healthy = await diagnosticsService.checkSystemHealth();
      setIsHealthy(healthy);
    } catch (err) {
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    if (autoCheck) {
      const interval = setInterval(checkHealth, intervalMs);
      return () => clearInterval(interval);
    }
  }, [checkHealth, autoCheck, intervalMs]);

  return {
    isHealthy,
    loading,
    refresh: checkHealth
  };
}

/**
 * Composant prêt à l'emploi: Indicateur de santé système
 * 
 * USAGE:
 * import { SystemHealthBadge } from '@/lib/api_v2_diagnostics';
 * 
 * <nav>
 *   <SystemHealthBadge />
 * </nav>
 */
export function SystemHealthBadge({ autoCheck = true, intervalMs = 30000 }) {
  const { isHealthy, loading } = useSystemHealth(autoCheck, intervalMs);

  if (loading || isHealthy === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
        <span>Vérification...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
      <span>{isHealthy ? 'Système opérationnel' : 'Système indisponible'}</span>
    </div>
  );
}

/**
 * Composant prêt à l'emploi: Panel diagnostics complet
 * 
 * USAGE:
 * import { DiagnosticsPanel } from '@/lib/api_v2_diagnostics';
 * 
 * <DiagnosticsPanel 
 *   recordingId="rec_1_1762107366" 
 *   autoRefresh={true}
 *   intervalMs={10000}
 * />
 */
export function DiagnosticsPanel({ recordingId, autoRefresh = false, intervalMs = 10000 }) {
  const { diagnostics, loading, error, refresh } = useRecordingDiagnostics(
    recordingId,
    autoRefresh,
    intervalMs
  );

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Chargement des diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg border-red-200 bg-red-50">
        <p className="text-sm text-red-600">Erreur: {error}</p>
      </div>
    );
  }

  if (!diagnostics) return null;

  const { recording, proxies } = diagnostics;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Diagnostics - {recordingId}</h3>
        <button
          onClick={refresh}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Actualiser
        </button>
      </div>

      {/* Enregistrement */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-2">Enregistrement</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Terrain ID:</dt>
          <dd className="font-mono">{recording.terrain_id}</dd>

          <dt className="text-muted-foreground">Status:</dt>
          <dd className="capitalize font-medium">{recording.status}</dd>

          <dt className="text-muted-foreground">Segments créés:</dt>
          <dd className="font-semibold text-blue-600">
            {recording.segments?.length || 0}
          </dd>

          <dt className="text-muted-foreground">FFmpeg PID:</dt>
          <dd className="font-mono">{recording.ffmpeg_pid || 'N/A'}</dd>

          <dt className="text-muted-foreground">Démarré à:</dt>
          <dd>{new Date(recording.start_time).toLocaleString('fr-FR')}</dd>

          <dt className="text-muted-foreground">Durée prévue:</dt>
          <dd>{recording.duration_seconds / 60} minutes</dd>
        </dl>
      </div>

      {/* Proxies */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-2">Proxies RTSP</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Proxies actifs:</dt>
          <dd className="font-semibold">{proxies.total_proxies || 0}</dd>

          <dt className="text-muted-foreground">Ports alloués:</dt>
          <dd className="font-mono">{proxies.ports_allocated?.join(', ') || 'N/A'}</dd>
        </dl>
      </div>

      {/* Liste des segments */}
      {recording.segments && recording.segments.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">
            Segments ({recording.segments.length})
          </h4>
          <div className="max-h-48 overflow-y-auto">
            <ul className="text-xs font-mono space-y-1">
              {recording.segments.map((segment, idx) => (
                <li key={idx} className="text-muted-foreground">
                  {segment}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// Exemples d'utilisation
// ========================================

/**
 * EXEMPLE 1: Afficher diagnostics dans un modal
 * 
 * import { DiagnosticsPanel } from '@/lib/api_v2_diagnostics';
 * import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 * 
 * function RecordingDetailsModal({ isOpen, onClose, recordingId }) {
 *   return (
 *     <Dialog open={isOpen} onOpenChange={onClose}>
 *       <DialogContent className="max-w-2xl">
 *         <DialogHeader>
 *           <DialogTitle>Détails de l'enregistrement</DialogTitle>
 *         </DialogHeader>
 *         <DiagnosticsPanel 
 *           recordingId={recordingId} 
 *           autoRefresh={true}
 *           intervalMs={10000}
 *         />
 *       </DialogContent>
 *     </Dialog>
 *   );
 * }
 */

/**
 * EXEMPLE 2: Indicateur santé dans navbar
 * 
 * import { SystemHealthBadge } from '@/lib/api_v2_diagnostics';
 * 
 * function Navbar() {
 *   return (
 *     <nav className="flex items-center justify-between p-4">
 *       <Logo />
 *       <SystemHealthBadge autoCheck={true} intervalMs={30000} />
 *       <UserMenu />
 *     </nav>
 *   );
 * }
 */

/**
 * EXEMPLE 3: Dashboard admin avec proxy status
 * 
 * import { diagnosticsService } from '@/lib/api_v2_diagnostics';
 * 
 * function AdminDashboard() {
 *   const [proxyStats, setProxyStats] = useState(null);
 * 
 *   useEffect(() => {
 *     const loadStats = async () => {
 *       const stats = await diagnosticsService.getProxyStatus();
 *       setProxyStats(stats);
 *     };
 * 
 *     loadStats();
 *     const interval = setInterval(loadStats, 5000);
 *     return () => clearInterval(interval);
 *   }, []);
 * 
 *   return (
 *     <Card>
 *       <CardHeader>Statut Proxies</CardHeader>
 *       <CardContent>
 *         <p>Proxies actifs: {proxyStats?.total_proxies || 0}</p>
 *         <p>Ports: {proxyStats?.ports_allocated?.join(', ') || 'Aucun'}</p>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 */

/**
 * EXEMPLE 4: Segment counter dans ActiveRecordingBanner
 * 
 * import { useRecordingDiagnostics } from '@/lib/api_v2_diagnostics';
 * import { Database } from 'lucide-react';
 * 
 * function SegmentCounter({ recordingId }) {
 *   const { diagnostics, loading } = useRecordingDiagnostics(recordingId, true, 10000);
 * 
 *   if (loading || !diagnostics) return null;
 * 
 *   const segmentCount = diagnostics.recording.segments?.length || 0;
 * 
 *   return (
 *     <div className="flex items-center gap-2 text-sm text-muted-foreground">
 *       <Database className="h-4 w-4" />
 *       <span>{segmentCount} segments</span>
 *     </div>
 *   );
 * }
 * 
 * // Dans ActiveRecordingBanner.jsx
 * <div className="flex items-center gap-4">
 *   <RecordingTimer startTime={activeRecording.start_time} />
 *   <SegmentCounter recordingId={activeRecording.recording_id} />
 * </div>
 */

export default {
  diagnosticsService,
  useRecordingDiagnostics,
  useSystemHealth,
  SystemHealthBadge,
  DiagnosticsPanel
};
