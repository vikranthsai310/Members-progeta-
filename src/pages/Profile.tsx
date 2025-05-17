import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MultiSelect } from "@/components/ui/multi-select";

// Define the validation schema for profile updates
const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  hobbies: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Hobby options
const hobbyOptions = [
  { label: "Programming", value: "programming" },
  { label: "Reading", value: "reading" },
  { label: "Sports", value: "sports" },
  { label: "Music", value: "music" },
  { label: "Gaming", value: "gaming" },
  { label: "Cooking", value: "cooking" },
  { label: "Travel", value: "travel" },
  { label: "Art", value: "art" },
  { label: "Photography", value: "photography" },
  { label: "Writing", value: "writing" },
];

export default function Profile() {
  const { currentUser, userData, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userData?.displayName || "",
      hobbies: userData?.hobbies || [],
    },
  });

  // Update form values when userData changes
  useEffect(() => {
    if (userData) {
      form.reset({
        displayName: userData.displayName || "",
        hobbies: userData.hobbies || [],
      });
    }
  }, [userData, form]);

  async function onSubmit(values: ProfileFormValues) {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        hobbies: values.hobbies || [],
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!currentUser || !userData) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={currentUser.photoURL || undefined} alt={userData.displayName || "User"} />
                <AvatarFallback>{userData.displayName?.charAt(0) || userData.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <CardTitle>{userData.displayName || "User"}</CardTitle>
              <CardDescription>{userData.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Role</p>
                <Badge variant={userData.role === "admin" ? "destructive" : "default"} className="capitalize">
                  {userData.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Member Since</p>
                <p className="text-sm">{userData.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Current Streak</p>
                <div className="flex items-center">
                  <span className="text-xl font-bold mr-2">{userData.streak.current}</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Best: {userData.streak.best} days</p>
                {userData.streak.description && (
                  <p className="text-xs mt-2 border-t pt-2">
                    Last activity: {userData.streak.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hobbies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hobbies & Interests</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={hobbyOptions}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder="Select hobbies..."
                          />
                        </FormControl>
                        <FormDescription>
                          Select hobbies and interests to connect with like-minded community members.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 