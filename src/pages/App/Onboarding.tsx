import { CarFront, Loader2, Phone, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { doc, updateDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { generateUserSearchKeywords } from "@/lib/search-utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number must be at least 9 characters"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: userProfile?.name || "",
      phone: userProfile?.phone || "",
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    if (!currentUser) return;

    setIsLoading(true);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);

      // Generate new search keywords with updated data
      const searchKeywords = generateUserSearchKeywords({
        name: data.name,
        email: userProfile?.email || "",
      });

      await updateDoc(userDocRef, {
        name: data.name,
        phone: data.phone,
        searchKeywords,
      });

      toast.success("Profile completed successfully!");

      // Small delay to ensure user sees the success toast
      setTimeout(() => {
        // Redirect based on user role
        if (userProfile?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/app");
        }
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <CarFront className="size-4" />
        </div>
        {t("brand.name")}
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("onboarding.title")}</CardTitle>
          <CardDescription>{t("onboarding.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("profile.fullName")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("profile.fullNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t("profile.phoneNumber")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("profile.phoneNumberPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("onboarding.completeProfile")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
