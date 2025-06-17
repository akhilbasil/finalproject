'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAgencySubscribed } from "@/lib/queries";
import { Check, X} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
    params:{agencyId:string}
};

const Billing = ({ params }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("success");

  const [needPayment, setNeedPayment] = useState<boolean | null>(true);

  useEffect(() => {
    const checkSubscription = async () => {
      const isSubscribed = await isAgencySubscribed(params.agencyId);
      setNeedPayment(!isSubscribed);
    };
    checkSubscription();
  }, [params.agencyId]);

  const handlePayment = () => {
    router.push(`/agency/${params.agencyId}/payment`);
  };

  return (
    <div className="flex flex-col justify-center items-center overflow-hidden">
      { needPayment ?(
      <div className="w-full max-w-[600px]">
        <Card className="border-none shadow-lg p-4">
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Review your billing details and proceed with payment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {paymentSuccess && (
              <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg">
                Payment successful!
              </div>
            )}
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:flex-row">
                <X color="red"/>
                <p>Pay securely using your preferred method</p>
              </div>
              {needPayment === null ? (
                <p>Loading...</p> 
              ) : (
                needPayment && <Button className="bg-primary text-white" onClick={handlePayment}>Pay Now</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>) :
      (
        <div className="w-full max-w-[600px]">
      <Card className="border-none shadow-lg p-4">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Review your billing details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-4 mb-4 text-green-700 bg-green-100 rounded-lg">
            <Check color="green"/> <span>You have already paid!!!</span>
          </div>
        </CardContent>
      </Card>
    </div>
      )
      }
    </div>
  );
};

export default Billing;
