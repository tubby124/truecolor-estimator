import type { Metadata } from 'next';
import { MonthlyBatchScheduler } from '@/components/social/MonthlyBatchScheduler';
export const metadata: Metadata = { title: 'Monthly review — Social Studio', robots: { index: false } };
export default function MonthlyPage() { return <MonthlyBatchScheduler />; }
