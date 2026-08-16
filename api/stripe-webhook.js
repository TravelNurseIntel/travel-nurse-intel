// api/stripe-webhook.js
//
// Travel Nurse Intel™
// Stripe Webhook + Supabase Subscriber Synchronization
//
// Required Vercel Environment Variables:
//
// STRIPE_SECRET_KEY
// STRIPE_WEBHOOK_SECRET
// NEXT_PUBLIC_SUPABASE_URL
// SUPABASE_SECRET_KEY
//

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
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

// -------------------------------------
// LIVE STRIPE PRICE ID → PLAN MAPPING
// -------------------------------------

const PLAN_BY_PRICE_ID = {

  'price_1U4U7tPDubW3gyakFjNhmxfS':
    'Basic',

  'price_1THWqsPDubW3gyak56HoB3sp':
    'Pro',

  'price_1U4UEnPDubW3gyakD3KyF0Ed':
    'Elite'

};

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

    chunks.push(
      typeof chunk === 'string'
        ? Buffer.from(chunk)
        : chunk
    );

  }

  return Buffer.concat(chunks);

}

// -------------------------------------
// Get Customer Email
// -------------------------------------

async function getCustomerEmail(customerId) {

  if (!customerId) {
    return null;
  }

  try {

    const customer =
      await stripe.customers.retrieve(customerId);

    return customer.email || null;

  } catch (error) {

    console.error(
      'Unable to retrieve customer email:',
      error.message
    );

    return null;

  }

}

// -------------------------------------
// Get Plan From Subscription
// -------------------------------------

function getPlanName(subscription) {

  const priceId =
    subscription.items?.data?.[0]?.price?.id;

  return PLAN_BY_PRICE_ID[priceId] || 'Unknown Plan';

}

// -------------------------------------
// Convert Stripe Unix Timestamp
// to ISO timestamp for Supabase
// -------------------------------------

function getCurrentPeriodEnd(subscription) {

  if (!subscription.current_period_end) {
    return null;
  }

  return new Date(
    subscription.current_period_end * 1000
  ).toISOString();

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
  currentPeriodEnd

}) {

  if (!email) {

    console.log(
      'No email provided. Skipping Supabase update.'
    );

    return;

  }

  const { error } = await supabase

    .from('subscribers')

    .upsert(

      {

        email: email.toLowerCase(),

        stripe_customer_id:
          stripeCustomerId,

        stripe_subscription_id:
          stripeSubscriptionId,

        plan,

        status,

        current_period_end:
          currentPeriodEnd,

        updated_at:
          new Date().toISOString()

      },

      {

        onConflict: 'email'

      }

    );

  if (error) {
    throw error;
  }

  console.log(
    'Subscriber record synchronized:',
    {
      email,
      plan,
      status,
      currentPeriodEnd
    }
  );

}

// -------------------------------------
// Synchronize Subscription
// -------------------------------------

async function syncSubscription(subscription) {

  const customerId =
    subscription.customer;

  const subscriptionId =
    subscription.id;

  const status =
    subscription.status;

  const plan =
    getPlanName(subscription);

  const currentPeriodEnd =
    getCurrentPeriodEnd(subscription);

  const email =
    await getCustomerEmail(customerId);

  await upsertSubscriber({

    email,

    stripeCustomerId:
      customerId,

    stripeSubscriptionId:
      subscriptionId,

    plan,

    status,

    currentPeriodEnd

  });

}

// -------------------------------------
// Checkout Completed
// -------------------------------------

async function handleCheckoutCompleted(session) {

  const email =
    session.customer_details?.email ||
    await getCustomerEmail(session.customer);

  await upsertSubscriber({

    email,

    stripeCustomerId:
      session.customer,

    stripeSubscriptionId:
      session.subscription,

    plan:
      'Pending Activation',

    status:
      'active',

    currentPeriodEnd:
      null

  });

  console.log(
    'Checkout completed:',
    {
      email,
      customerId: session.customer,
      subscriptionId: session.subscription
    }
  );

}

// -------------------------------------
// Main Webhook Handler
// -------------------------------------

module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {

    return res.status(405).json({

      error:
        'Method not allowed. Stripe webhooks must use POST.'

    });

  }

  // -------------------------------------
  // Validate Environment Variables
  // -------------------------------------

  if (!process.env.STRIPE_SECRET_KEY) {

    return res.status(500).json({

      error:
        'Missing STRIPE_SECRET_KEY.'

    });

  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {

    return res.status(500).json({

      error:
        'Missing STRIPE_WEBHOOK_SECRET.'

    });

  }

  if (!supabaseUrl || !supabaseSecretKey) {

    return res.status(500).json({

      error:
        'Supabase environment variables are missing.'

    });

  }

  let event;

  // -------------------------------------
  // Verify Stripe Signature
  // -------------------------------------

  try {

    const rawBody =
      await readBuffer(req);

    const signature =
      req.headers['stripe-signature'];

    if (!signature) {

      return res.status(400).json({

        error:
          'Missing Stripe signature header.'

      });

    }

    event =
      stripe.webhooks.constructEvent(

        rawBody,

        signature,

        process.env.STRIPE_WEBHOOK_SECRET

      );

  } catch (error) {

    console.error(
      'Webhook signature verification failed:',
      error.message
    );

    return res.status(400).json({

      error:
        `Webhook Error: ${error.message}`

    });

  }

  // -------------------------------------
  // Process Event
  // -------------------------------------

  try {

    switch (event.type) {

      // -------------------------------
      // Checkout
      // -------------------------------

      case 'checkout.session.completed':

        await handleCheckoutCompleted(
          event.data.object
        );

        break;


      // -------------------------------
      // Subscription Created / Updated
      // -------------------------------

      case 'customer.subscription.created':

      case 'customer.subscription.updated':

        await syncSubscription(
          event.data.object
        );

        break;


      // -------------------------------
      // Subscription Canceled
      // -------------------------------

      case 'customer.subscription.deleted': {

        const subscription =
          event.data.object;

        await syncSubscription({

          ...subscription,

          status:
            'canceled'

        });

        console.log(
          'Subscription canceled:',
          subscription.id
        );

        break;

      }


      // -------------------------------
      // Payment Failed
      // -------------------------------

      case 'invoice.payment_failed': {

        const invoice =
          event.data.object;

        if (invoice.subscription) {

          try {

            const subscription =
              await stripe.subscriptions.retrieve(
                invoice.subscription
              );

            await syncSubscription(
              subscription
            );

          } catch (error) {

            console.error(
              'Unable to synchronize failed-payment subscription:',
              error.message
            );

          }

        }

        console.log(
          'Payment failed:',
          invoice.id
        );

        break;

      }


      // -------------------------------
      // Invoice Paid
      // -------------------------------

      case 'invoice.paid':

        console.log(
          'Invoice paid:',
          event.data.object.id
        );

        break;


      // -------------------------------
      // Other Events
      // -------------------------------

      default:

        console.log(
          `Unhandled event type: ${event.type}`
        );

    }

    return res.status(200).json({

      received: true,

      eventType:
        event.type

    });

  } catch (error) {

    console.error(
      'Error processing webhook:',
      error
    );

    return res.status(500).json({

      error:
        'Internal server error while processing webhook.'

    });

  }

};
