import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from either location.state (from registration) or URL params (from email link)
    const searchParams = new URLSearchParams(location.search);
    const urlEmail = searchParams.get('email');
    const email = location.state?.email || urlEmail || '';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef([]);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Handle paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                const digits = text.replace(/\D/g, '').slice(0, 6).split('');
                const newCode = [...code];
                digits.forEach((digit, i) => {
                    if (i < 6) newCode[i] = digit;
                });
                setCode(newCode);
                // Focus last filled input
                const lastIndex = Math.min(digits.length, 5);
                inputRefs.current[lastIndex]?.focus();
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const verificationCode = code.join('');

        if (verificationCode.length !== 6) {
            setError('Veuillez entrer le code de vérification complet');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.verifyEmail(email, verificationCode);

            if (response.data.user) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Code de vérification incorrect');
            // Clear the code on error
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setIsLoading(true);

        try {
            await authService.resendVerificationCode(email);
            setResendCooldown(60); // 60 second cooldown
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du renvoi du code');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h2>
                            <p className="text-gray-600">
                                Votre compte a été activé avec succès. Redirection vers le dashboard...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="mx-auto mb-4">
                        <Mail className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Vérifiez votre email
                    </CardTitle>
                    <CardDescription className="text-center">
                        Nous avons envoyé un code de vérification à<br />
                        <span className="font-semibold text-gray-900">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                Entrez le code de vérification
                            </label>
                            <div className="flex gap-2 justify-center">
                                {code.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold"
                                        disabled={isLoading}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || code.some(d => !d)}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Vérification...
                                </>
                            ) : (
                                'Vérifier'
                            )}
                        </Button>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-600">
                                Vous n'avez pas reçu le code ?
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || isLoading}
                                className="text-sm"
                            >
                                {resendCooldown > 0
                                    ? `Renvoyer dans ${resendCooldown}s`
                                    : 'Renvoyer le code'
                                }
                            </Button>
                        </div>

                        <div className="text-center pt-4 border-t">
                            <p className="text-xs text-gray-500">
                                Le code est valide pendant 24 heures
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;
