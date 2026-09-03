
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreditScore, useCreditInsights } from '@/hooks/useCreditScore';
import CreditScoreGauge from '@/components/CreditScoreGauge';
import CreditScoreDetail from '@/components/CreditScoreDetail';
import CreditScoreHistory from '@/components/CreditScoreHistory';
import AIInsights from '@/components/AIInsights';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreditScorePage() {
  const navigate = useNavigate();
  const { data: creditScore, isLoading } = useCreditScore();
  const { data: insights, isLoading: insightsLoading } = useCreditInsights(creditScore);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex justify-center"><Skeleton className="h-32 w-32 rounded-full" /></div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Credit Score</h1>
          <p className="text-sm text-muted-foreground">
            Your trust score on Load Saathi — based on platform activity
          </p>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <CreditScoreGauge score={creditScore?.score ?? 550} size="lg" />
      </div>

      {creditScore?.factors ? (
        <Tabs defaultValue="breakdown">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="breakdown" className="mt-4">
            <CreditScoreDetail factors={creditScore.factors} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <CreditScoreHistory history={creditScore.history || []} />
          </TabsContent>
          <TabsContent value="insights" className="mt-4">
            <AIInsights insights={insights} loading={insightsLoading} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Score Yet</CardTitle>
            <CardDescription>
              Complete trips and receive reviews to build your credit score. New users start at 550.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">Starting Score: 550</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
