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
    const { timezone } = await request.json();
    console.log('Customer timezone:', timezone);

    // Create a product first
    const product = await stripe.products.create({
      name: 'Premium Plan',
      description: 'Full access to all features',
    });

    // Create a price for the subscription with trial
    const price = await stripe.prices.create({
      unit_amount: 1200, // $12.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product: product.id,
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 3, // 3-day free trial
      },
      success_url: `${process.env.NEXT_PUBLIC_API_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/pricing`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: { message: err.message } },
      { status: 500 }
    );
  }
} 