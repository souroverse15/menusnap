import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Icons
import {
  Coffee,
  ArrowRight,
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Check,
  FileText,
} from "lucide-react";

// API
import { cafeApi } from "@/lib/api";

// Validation schema
const applicationSchema = z.object({
  cafeName: z.string().min(2, "Café name must be at least 2 characters"),
  cafeDescription: z.string().optional(),
  logoUrl: z
    .string()
    .url("Please provide a valid logo URL")
    .optional()
    .or(z.literal("")),
  address: z.string().min(5, "Please provide a complete address"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(3, "Postal code is required"),
  phone: z.string(),
  email: z.string().email("Please provide a valid email address"),
  websiteUrl: z
    .string()
    .url("Please provide a valid URL")
    .optional()
    .or(z.literal("")),
  socialLinks: z
    .object({
      facebook: z
        .string()
        .url("Please provide a valid Facebook URL")
        .optional()
        .or(z.literal("")),
      instagram: z
        .string()
        .url("Please provide a valid Instagram URL")
        .optional()
        .or(z.literal("")),
      twitter: z
        .string()
        .url("Please provide a valid Twitter URL")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
  businessLicense: z.string().optional(),
  planType: z.enum(["FREE", "PLUS", "PRO"], {
    required_error: "Please select a plan",
  }),
  paymentDetails: z
    .object({
      cardNumber: z.string().optional(),
      expiryMonth: z.number().optional(),
      expiryYear: z.number().optional(),
      cvv: z.string().optional(),
      billingAddress: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    monthlyOrderQuota: 5,
    features: [
      "Basic menu management",
      "5 orders per month",
      "Email support",
      "QR code generation",
      "Mobile-friendly menus",
    ],
    recommended: false,
  },
  {
    id: "PLUS",
    name: "Plus",
    price: 29,
    monthlyOrderQuota: 10,
    features: [
      "Advanced menu management",
      "10 orders per month",
      "Priority support",
      "Basic analytics",
      "Custom branding",
      "Order notifications",
    ],
    recommended: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 79,
    monthlyOrderQuota: 25,
    features: [
      "Full menu management",
      "25 orders per month",
      "Premium support",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Multi-location support",
    ],
    recommended: false,
  },
];

const steps = [
  { id: 1, name: "Café Information", icon: Store },
  { id: 2, name: "Contact Details", icon: Phone },
  { id: 3, name: "Plan Selection", icon: CreditCard },
  { id: 4, name: "Review & Submit", icon: Check },
];

export default function CafeApplicationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      planType: "PLUS",
      cafeDescription: "",
      logoUrl: "",
      state: "",
      phone: "", // No pre-fill
      socialLinks: {
        facebook: "",
        instagram: "",
        twitter: "",
      },
      businessLicense: "",
      paymentDetails: {},
    },
  });

  const watchedValues = watch();

  const nextStep = async () => {
    let fieldsToValidate = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = [
          "cafeName",
          "cafeDescription",
          "logoUrl",
          "address",
          "city",
          "postalCode",
        ];
        break;
      case 2:
        fieldsToValidate = [
          "phone",
          "email",
          "websiteUrl",
          "businessLicense",
          "socialLinks.facebook",
          "socialLinks.instagram",
          "socialLinks.twitter",
        ];
        break;
      case 3:
        fieldsToValidate = ["planType"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      console.log("🔍 Submitting application data:", data);
      const token = await getToken();
      await cafeApi.submitApplication(data, token);

      toast.success("Application submitted successfully!");
      navigate("/apply/waiting");
    } catch (error) {
      console.error("Failed to submit application:", error);
      console.error("Error details:", error.error, error.details);
      toast.error(
        error.message || "Failed to submit application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-rose-600" />
              <span className="text-2xl font-bold gradient-text">MenuSnap</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-rose-600 border-rose-600 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-rose-600" : "text-gray-400"
                    }`}
                  >
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 h-0.5 ml-6 ${
                      currentStep > step.id ? "bg-rose-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Café Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="mr-2 h-5 w-5" />
                  Café Information
                </CardTitle>
                <CardDescription>
                  Tell us about your café and its location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cafeName">Café Name *</Label>
                  <Input
                    id="cafeName"
                    placeholder="e.g., The Coffee Corner"
                    {...register("cafeName")}
                    error={errors.cafeName?.message}
                  />
                  {errors.cafeName && (
                    <p className="text-sm text-destructive">
                      {errors.cafeName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cafeDescription">Description</Label>
                  <textarea
                    id="cafeDescription"
                    placeholder="Brief description of your café..."
                    className="input-field min-h-[100px] resize-none"
                    {...register("cafeDescription")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    {...register("logoUrl")}
                    error={errors.logoUrl?.message}
                  />
                  {errors.logoUrl && (
                    <p className="text-sm text-destructive">
                      {errors.logoUrl.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Provide a direct link to your café's logo image
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    {...register("address")}
                    error={errors.address?.message}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    {...register("city")}
                    error={errors.city?.message}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="State or Province (optional)"
                    {...register("state")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="12345"
                    {...register("postalCode")}
                    error={errors.postalCode?.message}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Details
                </CardTitle>
                <CardDescription>
                  How can customers and we reach you?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+8801XXXXXXX"
                    {...register("phone")}
                    error={errors.phone?.message}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@yourcafe.com"
                    {...register("email")}
                    error={errors.email?.message}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://yourcafe.com"
                    {...register("websiteUrl")}
                    error={errors.websiteUrl?.message}
                  />
                  {errors.websiteUrl && (
                    <p className="text-sm text-destructive">
                      {errors.websiteUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessLicense">
                    Business License Number
                  </Label>
                  <Input
                    id="businessLicense"
                    placeholder="Optional - for verification purposes"
                    {...register("businessLicense")}
                  />
                </div>

                {/* Social Links Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Social Media Links (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your social media accounts to help customers find
                      you
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        type="url"
                        placeholder="https://facebook.com/yourcafe"
                        {...register("socialLinks.facebook")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        type="url"
                        placeholder="https://instagram.com/yourcafe"
                        {...register("socialLinks.instagram")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        type="url"
                        placeholder="https://twitter.com/yourcafe"
                        {...register("socialLinks.twitter")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Plan Selection */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Choose Your Plan
                </CardTitle>
                <CardDescription>
                  Select the plan that best fits your café's needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                        watchedValues.planType === plan.id
                          ? "border-rose-500 bg-rose-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setValue("planType", plan.id)}
                    >
                      {plan.recommended && (
                        <Badge className="absolute -top-2 left-4 bg-rose-500">
                          Recommended
                        </Badge>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <input
                              type="radio"
                              value={plan.id}
                              checked={watchedValues.planType === plan.id}
                              onChange={(e) =>
                                setValue("planType", e.target.value)
                              }
                              className="mr-3"
                            />
                            <h3 className="text-lg font-semibold">
                              {plan.name}
                            </h3>
                          </div>

                          <div className="mb-4">
                            <span className="text-3xl font-bold">
                              ৳{plan.price}
                            </span>
                            <span className="text-muted-foreground">
                              /month
                            </span>
                          </div>

                          <ul className="space-y-2 text-sm">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Review Your Application
                </CardTitle>
                <CardDescription>
                  Please review your information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Café Information</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {watchedValues.cafeName}
                      </p>
                      <p>
                        <strong>Address:</strong> {watchedValues.address}
                      </p>
                      <p>
                        <strong>City:</strong> {watchedValues.city},{" "}
                        {watchedValues.postalCode}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Contact Details</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Phone:</strong> {watchedValues.phone}
                      </p>
                      <p>
                        <strong>Email:</strong> {watchedValues.email}
                      </p>
                      {watchedValues.websiteUrl && (
                        <p>
                          <strong>Website:</strong> {watchedValues.websiteUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Selected Plan</h4>
                  <div className="border rounded-lg p-4">
                    {plans.find((p) => p.id === watchedValues.planType) && (
                      <div>
                        <h5 className="font-medium">
                          {
                            plans.find((p) => p.id === watchedValues.planType)
                              ?.name
                          }{" "}
                          Plan
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          $
                          {
                            plans.find((p) => p.id === watchedValues.planType)
                              ?.price
                          }
                          /month
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-blue-800">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your application will be reviewed by our team</li>
                    <li>• You'll receive an email confirmation shortly</li>
                    <li>• Review typically takes 1-2 business days</li>
                    <li>
                      • Once approved, you can start setting up your digital
                      menu
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
