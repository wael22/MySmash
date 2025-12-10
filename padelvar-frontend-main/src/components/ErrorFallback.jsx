import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Oups! Une erreur est survenue
          </CardTitle>
          <CardDescription className="text-center">
            Nous sommes désolés, quelque chose s'est mal passé lors du chargement de cette page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-3 rounded text-sm text-gray-800 overflow-auto max-h-40 mb-4">
            {error?.message || "Erreur inconnue"}
          </div>
          
          <div className="text-center space-y-4">
            <Button 
              variant="outline" 
              onClick={resetErrorBoundary}
              className="w-full"
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
            Retour à la page de connexion
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ErrorFallback;
