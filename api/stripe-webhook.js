// api/stripe-webhook.js
//
// Travel Nurse Intel™
// Stripe Webhook + Supabase Subscriber Synchronization
//
// Required Vercel Environment Variables:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// -------------------------------------
// Stripe Initialization
// -------------------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// -------------------------------------
// Supabase Initialization
// -------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// -------------------------------------
// Disable Body Parsing for Stripe
// -------------------------------------
export const config = {
  api: {
    bodyParser: false,
  },
};

// -------------------------------------
// Read Raw Request Body
// -------------------------------------
async function readBuffer(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

// -------------------------------------
// Get Customer Email from Stripe
// -------------------------------------
async function getCustomerEmail(customerId) {
  if (!customerId) return null;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer.email || null;
  } catch (error) {
    console.error('Unable to retrieve customer email:', error.message);
    return null;
  }
}

// -------------------------------------
// Get Plan Name from Stripe Subscription
// -------------------------------------
function getPlanName(subscription) {
  try {
    return (
      subscription.items?.data?.[0]?.price?.product_data?.name ||
      subscription.items?.data?.[0]?.price?.nickname ||
      subscription.items?.data?.[0]?.price?.id ||
      'Unknown Plan'
    );
  } catch {
    return 'Unknown Plan';
  }
}

// -------------------------------------
// Upsert Subscriber Record
// -------------------------------------
async function upsertSubscriber({
  email,
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  status,
  current_period_end: currentPeriodEnd,
}) {
  if (!email) {
    console.log('No email provided. Skipping Supabase update.');
    return;
  }

  const { error } = await supabase
    .from('subscribers')
    .upsert(
      {
        email: email.toLowerCase(),
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan,
        status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
      }
    );

  if (error) {
    throw error;
  }

  console.log('Subscriber record synchronized:', {
    email,
    plan,
    status,
  });
}

// -------------------------------------
// Handle Subscription Events
// -------------------------------------
async function syncSubscription(subscription) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const plan = getPlanName(subscription);
  const email = await getCustomerEmail(customerId);

  await upsertSubscriber({
    email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan,
    status,
  });
}

// -------------------------------------
// Handle Checkout Completion
// -------------------------------------
async function handleCheckoutCompleted(session) {
  const email =
    session.customer_details?.email ||
    (await getCustomerEmail(session.customer));

  await upsertSubscriber({
    email,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    plan: 'Pending Activation',
    status: 'active',
  });

  console.log('Checkout completed:', {
    email,
    customerId: session.customer,
    subscriptionId: session.subscription,
  });
}

// -------------------------------------
// Main Webhook Handler
// -------------------------------------
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Stripe webhooks must use POST.',
    });
  }

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'Missing STRIPE_SECRET_KEY.',
    });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({
      error: 'Missing STRIPE_WEBHOOK_SECRET.',
    });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Supabase environment variables are missing.',
    });
  }

  let event;

  try {
    const rawBody = await readBuffer(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({
        error: 'Missing Stripe signature header.',
      });
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);

    return res.status(400).json({
      error: `Webhook Error: ${error.message}`,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(event.data.object);
        break;

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await syncSubscription({
          ...subscription,
          status: 'canceled',
        });

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        if (invoice.subscription) {
          await upsertSubscriber({
            email: await getCustomerEmail(invoice.customer),
            stripeCustomerId: invoice.customer,
            stripeSubscriptionId: invoice.subscription,
            plan: 'Payment Issue',
            status: 'past_due',
          });
        }

        console.log('Payment failed:', invoice.id);
        break;
      }

      case 'invoice.paid':
        console.log('Invoice paid:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({
      received: true,
      eventType: event.type,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);

    return res.status(500).json({
      error: 'Internal server error while processing webhook.',
    });
  }
};
