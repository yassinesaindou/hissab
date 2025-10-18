"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateSubscription } from "@/app/actions";
import { ProfileWithSubscription } from "./ProfilesColumns";
 
const subscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Please select a client"),
  months: z.string().transform(Number).refine((n) => n >= 1 && n <= 12, {
    message: "Months must be between 1 and 12",
  }),
});

type SubscriptionForm = z.infer<typeof subscriptionSchema>;

export default function SubscriptionUpdate({ profiles }: { profiles: ProfileWithSubscription[] }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [pendingData, setPendingData] = useState<SubscriptionForm | null>(null);

  const form = useForm<SubscriptionForm>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { subscriptionId: "", months: 1 },
  });

  const onSubmit = (data: SubscriptionForm) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingData) return;

    setIsConfirmOpen(false);

    const formData = new FormData();
    formData.append("subscriptionId", pendingData.subscriptionId);
    formData.append("months", pendingData.months.toString());

    const result = await updateSubscription(formData);
    setResultMessage(result.message);
    setIsResultOpen(true);

    if (result.success) {
      form.reset();
      setTimeout(() => window.location.reload(), 1000);
    }

    setPendingData(null);
  };

  return (
    <div className="bg-blue-500 p-6 rounded-2xl shadow-sm border border-green-100">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Update Subscription</h2>
      <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md flex justify-around">
          <FormField
            control={form.control}
            name="subscriptionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select a client</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profiles
                      .filter((p) => p.subscriptionId)
                      .map((p) => (
                        <SelectItem key={p.userId} value={p.subscriptionId!}>
                          {p.name || "Unnamed"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Months to Extend</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-gray-100"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Updating..." : "Update Subscription"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to extend the subscription by{" "}
              {pendingData?.months || 0} month(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-gray-100"
              onClick={confirmUpdate}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Result</DialogTitle>
            <DialogDescription>{resultMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-gray-100"
              onClick={() => setIsResultOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}