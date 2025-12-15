/**
 * Page "Mes Clips"
 * Affiche tous les clips créés par l'utilisateur
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ClipsList from '@/components/player/ClipsList';
import { Scissors } from 'lucide-react';

export default function MyClipsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg">
                                <Scissors className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Mes Clips</CardTitle>
                                <CardDescription>
                                    Gérez vos clips et partagez-les sur les réseaux sociaux
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ClipsList />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
