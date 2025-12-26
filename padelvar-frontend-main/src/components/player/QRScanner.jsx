import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * QRScanner Component
 * Uses html5-qrcode to scan QR codes with device camera
 */
const QRScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
        };

        // Initialize scanner
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');

        const startScanner = async () => {
            try {
                // Request camera permission and start scanning
                await html5QrCodeRef.current.start(
                    { facingMode: 'environment' }, // Use back camera on mobile
                    config,
                    (decodedText) => {
                        // Successfully scanned QR code
                        console.log('✅ QR Code scanned:', decodedText);
                        if (onScanSuccess) {
                            onScanSuccess(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // Scanning errors (not found, etc.) - can be ignored
                        // Only log actual errors, not "No QR code found"
                        if (!errorMessage.includes('No') && !errorMessage.includes('NotFoundException')) {
                            console.warn('QR Scanner error:', errorMessage);
                        }
                    }
                );
            } catch (err) {
                console.error('❌ Failed to start QR scanner:', err);
                if (onScanError) {
                    onScanError(err);
                }
            }
        };

        startScanner();

        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current
                    .stop()
                    .then(() => {
                        console.log('QR Scanner stopped');
                        html5QrCodeRef.current.clear();
                    })
                    .catch((err) => {
                        console.error('Error stopping QR scanner:', err);
                    });
            }
        };
    }, [onScanSuccess, onScanError]);

    return (
        <div className="w-full">
            {/* QR Scanner container */}
            <div
                id="qr-reader"
                ref={scannerRef}
                className="rounded-lg overflow-hidden border-2 border-blue-500"
                style={{ width: '100%' }}
            />
        </div>
    );
};

export default QRScanner;
