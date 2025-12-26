import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, AlertCircle, CheckCircle, Keyboard } from 'lucide-react';
import QRScanner from './QRScanner';

/**
 * QRScannerModal Component
 * User-friendly modal wrapper for QR code scanning
 */
const QRScannerModal = ({ isOpen, onClose, onCodeScanned }) => {
    const [scannedCode, setScannedCode] = useState('');
    const [error, setError] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const handleScanSuccess = (decodedText) => {
        setScannedCode(decodedText);
        setError('');

        // Notify parent and close modal after a short delay
        setTimeout(() => {
            if (onCodeScanned) {
                onCodeScanned(decodedText);
            }
            handleClose();
        }, 500);
    };

    const handleScanError = (err) => {
        console.error('Scanner error:', err);
        setError(
            'Impossible d\'accéder à la caméra. Veuillez vérifier les permissions ou utiliser la saisie manuelle.'
        );
        setShowManualInput(true);
    };

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            if (onCodeScanned) {
                onCodeScanned(manualCode.trim());
            }
            handleClose();
        }
    };

    const handleClose = () => {
        setScannedCode('');
        setError('');
        setShowManualInput(false);
        setManualCode('');
        if (onClose) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[95vw] max-w-lg mx-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        Scanner le QR Code du terrain
                    </DialogTitle>
                    <DialogDescription>
                        Pointez votre caméra vers le QR code affiché sur le terrain
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Success Message */}
                    {scannedCode && (
                        <Alert className="border-green-500 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <strong>Code scanné :</strong> {scannedCode}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* QR Scanner or Manual Input */}
                    {!showManualInput ? (
                        <div className="space-y-4">
                            {/* Scanner Instructions */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                <p className="text-blue-900">
                                    📱 Positionnez le QR code dans le cadre ci-dessous
                                </p>
                            </div>

                            {/* Scanner Component */}
                            <div className="relative w-full aspect-square max-w-sm mx-auto">
                                <QRScanner
                                    onScanSuccess={handleScanSuccess}
                                    onScanError={handleScanError}
                                />
                            </div>

                            {/* Toggle to Manual Input */}
                            <div className="text-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowManualInput(true)}
                                    className="text-xs"
                                >
                                    <Keyboard className="h-3 w-3 mr-1" />
                                    Saisir manuellement
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Manual Input */}
                            <div className="space-y-2">
                                <Label htmlFor="manual-code">Code du terrain</Label>
                                <Input
                                    id="manual-code"
                                    placeholder="Entrez le code manuellement"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleManualSubmit();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>

                            {/* Submit Manual Code */}
                            <div className="flex justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowManualInput(false)}
                                    className="flex-1"
                                >
                                    <Camera className="h-4 w-4 mr-1" />
                                    Utiliser caméra
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleManualSubmit}
                                    disabled={!manualCode.trim()}
                                    className="flex-1 btn-primary-modern"
                                >
                                    Valider
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Cancel Button */}
                    {!scannedCode && (
                        <div className="pt-2 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                className="w-full"
                            >
                                Annuler
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QRScannerModal;
