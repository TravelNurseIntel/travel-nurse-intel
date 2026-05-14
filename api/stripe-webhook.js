// api/stripe-webhook.js
//
// Travel Nurse Intel - Stripe Webhook Handler
//
// This Vercel serverless function receives webhook events from Stripe and
// provides the automation foundation for:
//
// - New subscription purchases
// - Subscription updates
// - Subscription cancellations
// - Failed payments
//
// Future integrations can extend this file to:
// - Create user accounts in Supabase
// - Send onboarding emails via Resend
// - Grant access to premium dashboards
// - Revoke access when subscriptions end
//
// Required Vercel Environment Variables:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET
//
// Webhook Endpoint URL:
// https://travel-nurse-intel.vercel.app/api/stripe-webhook

const Stripe = require('stripe');

// Initialize Stripe using your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable Vercel's default body parsing so Stripe can verify the raw payload
export const config = {
  api: {
    bodyParser: false,
  },
};

// Read the raw request body into a Buffer
async function readBuffer(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

// Main webhook handler
module.exports = async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Stripe webhooks must use POST.',
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable.');

    return res.status(500).json({
      error: 'Webhook secret is not configured.',
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable.');

    return res.status(500).json({
      error: 'Stripe secret key is not configured.',
    });
  }

  let event;

  try {
    // Read the raw body
    const rawBody = await readBuffer(req);

    // Get the Stripe signature header
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({
        error: 'Missing Stripe signature header.',
      });
    }

    // Verify and construct the Stripe event
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);

    return res.status(400).json({
      error: `Webhook Error: ${err.message}`,
    });
  }

  // Handle specific Stripe events
  try {
    switch (event.type) {
      // Customer completed checkout successfully
      case 'checkout.session.completed': {
        const session = event.data.object;

        console.log('Checkout completed:', {
          customerId: session.customer,
          customerEmail: session.customer_details?.email,
          subscriptionId: session.subscription,
        });

        // FUTURE AUTOMATION:
        // 1. Create user account in Supabase
        // 2. Save subscription metadata
        // 3. Send onboarding email
        // 4. Grant dashboard access

        break;
      }

      // New subscription created
      case 'customer.subscription.created': {
        const subscription = event.data.object;

        console.log('Subscription created:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });

        break;
      }

      // Subscription updated (plan changes, renewals, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        console.log('Subscription updated:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });

        break;
      }

      // Subscription canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        console.log('Subscription canceled:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });

        // FUTURE AUTOMATION:
        // 1. Mark user inactive in database
        // 2. Revoke dashboard access
        // 3. Disable API keys

        break;
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        console.log('Payment failed:', {
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          invoiceId: invoice.id,
        });

        // FUTURE AUTOMATION:
        // 1. Notify customer by email
        // 2. Grace-period logic
        // 3. Suspend access if payment remains unresolved

        break;
      }

      // Optional additional event: successful recurring payment
      case 'invoice.paid': {
        const invoice = event.data.object;

        console.log('Invoice paid:', {
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          invoiceId: invoice.id,
        });

        break;
      }

      // Ignore all other events
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt to Stripe
    return res.status(200).json({
      received: true,
      eventType: event.type,
    });
  } catch (err) {
    console.error('Error processing webhook:', err);

    return res.status(500).json({
      error: 'Internal server error while processing webhook.',
    });
  }
};
