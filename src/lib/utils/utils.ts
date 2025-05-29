import { isBefore } from "date-fns";
import { createSupabaseServerClient } from "../supabase/server";

export async function isUserSubscriptionActive(userId: string) {
    const supabase = createSupabaseServerClient();
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('endAt')
    .eq('userId', userId)
    .maybeSingle();

  if (error) {
    console.error('Subscription check error:', error.message);
    return false;
  }

  if (!subscription) return false;

  return !isBefore(new Date(subscription.endAt), new Date());
}