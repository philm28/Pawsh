import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    // Bundle subscription renewal — grant a fresh credit lot per paid invoice.
    if (event.type === 'invoice.paid') {
      await grantBundleCredits(customerId, stripeData as Stripe.Invoice);
    }

    // Bundle subscription cancelled — mark it inactive.
    if (event.type === 'customer.subscription.deleted') {
      await cancelBundleSubscription(customerId);
    }

    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);

      // If this was the initial checkout for a new bundle, activate the client_bundle_subscriptions row.
      if (event.type === 'checkout.session.completed') {
        await activateBundleSubscription(customerId, stripeData as Stripe.Checkout.Session);
      }
    } else if (mode === 'payment' && payment_status === 'paid') {
      const session = stripeData as Stripe.Checkout.Session;

      // Dog sitting one-time payment — mark the booking paid.
      if (session.metadata?.booking_type === 'dog_sitting' && session.metadata?.booking_id) {
        await supabase
          .from('dog_sitting_bookings')
          .update({ payment_status: 'paid' })
          .eq('id', session.metadata.booking_id);
      }

      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed', // assuming we want to mark it as completed since payment is successful
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

// Bundle tier config — keep in sync with src/lib/bundles.ts
const TIER_WALKS: Record<string, number> = { bundle_5: 5, bundle_10: 10, bundle_20: 20 };

async function getClientIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function activateBundleSubscription(customerId: string, session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription) return;
  const clientId = await getClientIdForCustomer(customerId);
  if (!clientId) return;

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

  await supabase
    .from('client_bundle_subscriptions')
    .update({ stripe_subscription_id: subscriptionId, status: 'active', updated_at: new Date().toISOString() })
    .eq('client_id', clientId);
}

async function cancelBundleSubscription(customerId: string) {
  const clientId = await getClientIdForCustomer(customerId);
  if (!clientId) return;

  await supabase
    .from('client_bundle_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('client_id', clientId);
}

async function grantBundleCredits(customerId: string, invoice: Stripe.Invoice) {
  if (!invoice.subscription) return; // only subscription invoices grant walk credits

  const clientId = await getClientIdForCustomer(customerId);
  if (!clientId) return;

  const { data: bundle } = await supabase
    .from('client_bundle_subscriptions')
    .select('tier')
    .eq('client_id', clientId)
    .maybeSingle();
  if (!bundle) return;

  const walksIncluded = TIER_WALKS[bundle.tier];
  if (!walksIncluded) return;

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // stripe_invoice_id has a unique constraint — this insert is naturally idempotent against webhook retries.
  const { error } = await supabase.from('credit_lots').insert({
    client_id: clientId,
    amount: walksIncluded,
    remaining: walksIncluded,
    expires_at: expiresAt,
    source: 'subscription_grant',
    stripe_invoice_id: invoice.id,
  });

  if (error && error.code !== '23505') {
    // 23505 = unique_violation (already granted for this invoice) — safe to ignore, anything else log it
    console.error('Error granting bundle credits:', error);
  }

  await supabase
    .from('client_bundle_subscriptions')
    .update({
      status: 'active',
      current_period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      current_period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', clientId);
}