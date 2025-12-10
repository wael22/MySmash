import { useState, useEffect } from 'react';
import { adminService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    FileText,
    Download,
    RefreshCw,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2
} from 'lucide-react';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [logLevel, setLogLevel] = useState('all');
    const [lineCount, setLineCount] = useState(100);
    const [totalLines, setTotalLines] = useState(0);
    const [logFile, setLogFile] = useState('');

    useEffect(() => {
        loadLogs();
    }, [logLevel, lineCount]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await adminService.getLogs({ lines: lineCount, level: logLevel });

            setLogs(response.data.logs || []);
            setTotalLines(response.data.total_lines || 0);
            setLogFile(response.data.log_file || '');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du chargement des logs');
            console.error('Error loading logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadLogs = async () => {
        try {
            const response = await adminService.downloadLogs();

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `padelvar_logs_${new Date().toISOString().split('T')[0]}.log`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Erreur lors du téléchargement des logs');
            console.error('Error downloading logs:', err);
        }
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'ERROR':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'WARNING':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'INFO':
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR':
                return 'text-red-700 bg-red-50';
            case 'WARNING':
                return 'text-yellow-700 bg-yellow-50';
            case 'INFO':
                return 'text-blue-700 bg-blue-50';
            default:
                return 'text-gray-700 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Logs Système</h2>
                <p className="text-gray-600 mt-1">Consultez les logs du serveur backend</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Journal des événements
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={loadLogs}
                                disabled={loading}
                                variant="outline"
                                size="sm"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                onClick={downloadLogs}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                            </Button>
                        </div>
                    </CardTitle>
                    <CardDescription>
                        {logFile && `Fichier: ${logFile} • `}
                        {totalLines} ligne{totalLines > 1 ? 's' : ''} affichée{totalLines > 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-4 mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Niveau:</label>
                            <Select value={logLevel} onValueChange={setLogLevel}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="debug">Debug</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Lignes:</label>
                            <Select
                                value={lineCount.toString()}
                                onValueChange={(value) => setLineCount(parseInt(value))}
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                    <SelectItem value="500">500</SelectItem>
                                    <SelectItem value="1000">1000</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Logs display */}
                    <div className="bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto font-mono text-sm">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">
                                Aucun log disponible
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start gap-2 px-2 py-1 rounded ${log.level === 'ERROR' ? 'bg-red-900/20 text-red-300' :
                                            log.level === 'WARNING' ? 'bg-yellow-900/20 text-yellow-300' :
                                                log.level === 'INFO' ? 'bg-blue-900/20 text-blue-300' :
                                                    'text-gray-300'
                                            }`}
                                    >
                                        <span className="flex-shrink-0 mt-0.5">
                                            {getLevelIcon(log.level)}
                                        </span>
                                        <span className="flex-1 break-all whitespace-pre-wrap">
                                            {log.raw}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {totalLines > 0 && (
                        <div className="mt-4 text-sm text-gray-500 text-center">
                            Affichage des {totalLines} dernière{totalLines > 1 ? 's' : ''} ligne{totalLines > 1 ? 's' : ''}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemLogs;
