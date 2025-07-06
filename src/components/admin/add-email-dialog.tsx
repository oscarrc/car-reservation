"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addAllowedEmail, getAllowedEmails } from "@/lib/allowed-emails-service";
import { getUsersByEmails } from "@/lib/users-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const addEmailSchema = z.object({
  emails: z.string().min(1, "Please enter at least one email address").refine((value) => {
    const emailList = value.split('\n').map(email => email.trim()).filter(email => email.length > 0);
    if (emailList.length === 0) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    
    return invalidEmails.length === 0;
  }, "All email addresses must be valid"),
});

type AddEmailFormData = z.infer<typeof addEmailSchema>;

interface AddEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmailDialog({ open, onOpenChange }: AddEmailDialogProps) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<AddEmailFormData>({
    resolver: zodResolver(addEmailSchema),
    defaultValues: {
      emails: "",
    },
  });

  const addEmailMutation = useMutation({
    mutationFn: async (data: AddEmailFormData) => {
      if (!currentUser) throw new Error("No current user");
      
      // Parse emails from textarea (one per line)
      const emailList = data.emails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      // Emails are already validated by the schema, so we can use them directly
      const validEmails = emailList;
      
      // Get existing allowed emails to check for duplicates
      const existingAllowedEmailsResponse = await getAllowedEmails();
      const existingAllowedEmails = existingAllowedEmailsResponse.emails.map(e => e.email.toLowerCase());
      
      // Get existing user accounts to check for registered users
      const existingUserEmails = await getUsersByEmails(validEmails);
      
      // Categorize emails
      const newEmails: string[] = [];
      const existingAllowedEmailList: string[] = [];
      const existingUserEmailList: string[] = [];
      
      for (const email of validEmails) {
        const emailLower = email.toLowerCase();
        
        if (existingAllowedEmails.includes(emailLower)) {
          existingAllowedEmailList.push(email);
        } else if (existingUserEmails.includes(emailLower)) {
          existingUserEmailList.push(email);
        } else {
          newEmails.push(email);
        }
      }
      
      // Add only new emails (not in allowed list and not registered users)
      for (const email of newEmails) {
        await addAllowedEmail(email, currentUser.uid);
      }
      
      return {
        added: newEmails,
        existingAllowed: existingAllowedEmailList,
        existingUsers: existingUserEmailList,
        total: validEmails.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["allowedEmails"] });
      onOpenChange(false);
      form.reset();
      
      // Build description with only relevant information
      const descriptions: string[] = [];
      
      if (result.added.length > 0) {
        descriptions.push(t("allowedEmails.bulkAddSuccessDesc", { count: result.added.length }));
      }
      
      if (result.existingAllowed.length > 0) {
        descriptions.push(t("allowedEmails.bulkAddAlreadyInListDesc", { count: result.existingAllowed.length }));
      }
      
      if (result.existingUsers.length > 0) {
        descriptions.push(t("allowedEmails.bulkAddAlreadyRegisteredDesc", { count: result.existingUsers.length }));
      }
      
      const description = descriptions.join(" ");
      
      if (result.added.length > 0) {
        // Some or all emails were added successfully
        toast.success(t("allowedEmails.bulkAddSuccess"), {
          description,
        });
      } else {
        // No emails were added
        toast.warning(t("allowedEmails.bulkAddNoNewEmails"), {
          description,
        });
      }
    },
    onError: (error) => {
      console.error("Error adding emails:", error);
      toast.error(t("allowedEmails.bulkAddFailed"), {
        description:
          "Please check your email addresses and try again.",
      });
    },
  });

  const onSubmit = (data: AddEmailFormData) => {
    addEmailMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("allowedEmails.bulkAddEmails")}</DialogTitle>
          <DialogDescription>
            {t("allowedEmails.bulkAddEmailsDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("allowedEmails.bulkAddEmails")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("allowedEmails.emailsPlaceholder")}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={addEmailMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={addEmailMutation.isPending}
              >
                {addEmailMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("allowedEmails.bulkAddEmails")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 