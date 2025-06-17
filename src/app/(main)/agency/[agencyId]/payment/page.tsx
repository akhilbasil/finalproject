'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOrUpdateSubscription, isAgencySubscribed } from "@/lib/queries";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
    params:{agencyId:string}
};

const Payment = ({params}: Props) => {
  const router = useRouter();

  const [needPayment, setNeedPayment] = useState<boolean | null>(true);

  useEffect(() => {
      const checkSubscription = async () => {
        const isSubscribed = await isAgencySubscribed(params.agencyId);
        setNeedPayment(!isSubscribed);
        if(!needPayment){
            router.push(`/agency/${params.agencyId}/billing`);
        }
      };
      checkSubscription();
    }, [params.agencyId]);

  const handlePaymentSuccess = () => {
    createOrUpdateSubscription(params.agencyId)
    router.push(`/agency/${params.agencyId}/billing?success=true`);
  };

  return (
    <div className="flex flex-col justify-center items-center ">
      <div className="w-full max-w-[400px]">
        <Card className="border-none shadow-lg p-4 text-center">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold mb-4">Amount: ₹100</p>
            <Button className="bg-primary text-white w-full" onClick={handlePaymentSuccess}>
              Pay Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
