import type { Metadata } from 'next';
import { WeeklyPlanner } from '@/components/social/WeeklyPlanner';
export const metadata: Metadata = { title: 'Weekly storyboard — Social Studio', robots: { index: false } };
export default function WeeklyPage() { return <WeeklyPlanner />; }
