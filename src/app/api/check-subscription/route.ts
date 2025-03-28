import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as const,
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Search for customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ hasSubscription: false });
    }

    const customer = customers.data[0];

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ hasSubscription: false });
    }

    const subscription = subscriptions.data[0];
    
    return NextResponse.json({
      hasSubscription: subscription.status === 'active' || subscription.status === 'trialing'
    });

  } catch (error) {
    console.error('Stripe check failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 