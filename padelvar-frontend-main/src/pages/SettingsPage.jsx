import { useState } from 'react';
import { authService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Navbar from '../components/common/Navbar';

const SettingsPage = () => {
  const [formData, setFormData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.changePassword({ old_password: formData.old_password, new_password: formData.new_password });
      setSuccess('Mot de passe mis à jour avec succès !');
      setFormData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Gérez les paramètres de votre compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-medium">Changer le mot de passe</h3>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert variant="default" className="bg-green-100 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label htmlFor="old_password">Ancien mot de passe</Label>
                <Input id="old_password" name="old_password" type="password" value={formData.old_password} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <Input id="new_password" name="new_password" type="password" value={formData.new_password} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                <Input id="confirm_password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} required />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Changer le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
