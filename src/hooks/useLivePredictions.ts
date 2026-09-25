import { useState, useEffect } from 'react';
import { PREDICTIONS_DATA, PredictionItem } from '@/data/predictionsData';

export function useLivePredictions(category?: 'Market' | 'Arena') {
  const [predictions, setPredictions] = useState<PredictionItem[]>(PREDICTIONS_DATA);
  const [loading, setLoading] = useState(true);

  const fetchLivePools = async () => {
    try {
      const res = await fetch('/api/predictions');
      const data = await res.json();
      if (data.success && data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (e) {
      console.error('Error loading live memory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePools();
    // Hər 5 saniyədən bir Upstash canlı yaddaşını yeniləyir
    const interval = setInterval(fetchLivePools, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = category 
    ? predictions.filter(p => p.category === category)
    : predictions;

  return { predictions: filtered, loading, refresh: fetchLivePools };
}
