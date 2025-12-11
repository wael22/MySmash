import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SuperAdminLogin = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        twoFactorCode: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeData, setQrCodeData] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleInitialLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/super-admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion');
            }

            if (data.requires_2fa_setup) {
                setQrCodeData({
                    uri: data.totp_uri,
                    secret: data.secret,
                });
                setBackupCodes(data.backup_codes);
                setStep(2);
            } else if (data.requires_2fa) {
                setStep(3);
            }
        } catch (err) {
            setError(err.message || 'Erreur lors de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetup2FA = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/super-admin/setup-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code: formData.twoFactorCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Code invalide');
            }

            if (data.user) {
                navigate('/admin');
            }
        } catch (err) {
            setError(err.message || 'Code invalide. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/super-admin/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    code: formData.twoFactorCode,
                    use_backup_code: useBackupCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Code invalide');
            }

            if (data.user) {
                navigate('/admin');
            }
        } catch (err) {
            setError(err.message || 'Code invalide. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #1e293b, #334155)',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '28rem',
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '2rem'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.75rem',
                        background: 'rgba(251, 191, 36, 0.1)',
                        borderRadius: '9999px',
                        marginBottom: '1rem'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V4l-8-2-8 2v8c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {step === 1 && 'Connexion Super Admin'}
                        {step === 2 && 'Configuration 2FA'}
                        {step === 3 && 'Vérification 2FA'}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {step === 1 && 'Accès réservé aux super administrateurs'}
                        {step === 2 && 'Configurez l\'authentification à deux facteurs'}
                        {step === 3 && 'Entrez votre code d\'authentification'}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleInitialLogin}>
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.375rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@mysmash.com"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.375rem',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.375rem',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1
                            }}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>

                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                            🔒 Connexion sécurisée avec authentification 2FA
                        </p>
                    </form>
                )}

                {step === 2 && qrCodeData && (
                    <form onSubmit={handleSetup2FA}>
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.375rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{
                            padding: '0.75rem',
                            background: '#dbeafe',
                            borderRadius: '0.375rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            Scannez le QR code avec Google Authenticator ou Authy
                        </div>

                        <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData.uri)}`}
                                alt="QR Code 2FA"
                                style={{ width: '200px', height: '200px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Secret manuel:
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={qrCodeData.secret}
                                    readOnly
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(qrCodeData.secret)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Copier
                                </button>
                            </div>
                        </div>

                        {backupCodes.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#f59e0b' }}>
                                    📝 Codes de secours (à conserver)
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '0.5rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    {backupCodes.map((code, index) => (
                                        <code key={index} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'white' }}>
                                            {code}
                                        </code>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    Copier tous les codes
                                </button>
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Code de vérification
                            </label>
                            <input
                                type="text"
                                name="twoFactorCode"
                                value={formData.twoFactorCode}
                                onChange={handleChange}
                                placeholder="123456"
                                maxLength={6}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.375rem',
                                    fontFamily: 'monospace',
                                    textAlign: 'center',
                                    fontSize: '1.125rem',
                                    letterSpacing: '0.1em'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1
                            }}
                        >
                            {isLoading ? 'Vérification...' : 'Activer 2FA et se connecter'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleVerify2FA}>
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.375rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{
                            padding: '0.75rem',
                            background: '#dbeafe',
                            borderRadius: '0.375rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            Entrez le code à 6 chiffres de votre application d'authentification
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                {useBackupCode ? 'Code de secours' : 'Code d\'authentification'}
                            </label>
                            <input
                                type="text"
                                name="twoFactorCode"
                                value={formData.twoFactorCode}
                                onChange={handleChange}
                                placeholder={useBackupCode ? "Entrez un code de secours" : "123456"}
                                maxLength={useBackupCode ? 10 : 6}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.375rem',
                                    fontFamily: 'monospace',
                                    textAlign: 'center',
                                    fontSize: '1.125rem',
                                    letterSpacing: '0.1em'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                                marginBottom: '1rem'
                            }}
                        >
                            {isLoading ? 'Vérification...' : 'Vérifier et se connecter'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setFormData({ ...formData, twoFactorCode: '' });
                            }}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '0.875rem',
                                color: '#64748b',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {useBackupCode ? 'Utiliser le code 2FA' : 'Utiliser un code de secours'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SuperAdminLogin;
