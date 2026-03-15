import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === "checkout.session.completed") {
    // Usually retrieved during checkout setup using client_reference_id
    const userId = session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (userId) {
      // Upsert subscription into Supabase
      const { error } = await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: "active",
        plan_tier: "pro", // user checked out a 'pro' product
      });
      if (error) {
        console.error("Subscription DB Error during checkout:", error);
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscriptionId = session.subscription as string;
    
    // Retrieve subscription details to find the end date
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    
    // Update the end period in database
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);
  }

  if (event.type === "invoice.payment_failed") {
    const subscriptionId = session.subscription as string;
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "past_due",
      })
      .eq("stripe_subscription_id", subscriptionId);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscriptionId = session.subscription as string;
    // Downgrade user back to free plan
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        plan_tier: "free",
      })
      .eq("stripe_subscription_id", subscriptionId);
  }

  return new NextResponse(null, { status: 200 });
}
