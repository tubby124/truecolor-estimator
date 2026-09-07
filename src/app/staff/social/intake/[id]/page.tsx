import { NextResponse } from 'next/server';
import { notFound, redirect } from 'next/navigation';
import { requireSocialBusiness } from '@/lib/social/business';
import { IntakePreview } from '@/components/social/IntakePreview';
import { getIntake } from '@/lib/social/intake/service';
export const dynamic = 'force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const auth=await requireSocialBusiness(); if(auth instanceof NextResponse) redirect('/staff/login');
 const {id}=await params;
 let preview;try{preview=await getIntake({businessId:auth.businessId,operatorId:auth.user.id},id);}catch{notFound();}
 return <IntakePreview {...preview}/>;
}
