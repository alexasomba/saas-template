"use client";

import { FormError } from "@/components/forms/FormError";
import { FormItem } from "@/components/forms/FormItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import React, { Fragment, useCallback } from "react";
import { useForm } from "react-hook-form";

type FormData = {
  accessToken: string;
  orderID: string;
};

export const FindOrderForm: React.FC = () => {
  const router = useRouter();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {},
  });

  const onSubmit = useCallback(
    async (data: FormData) => {
      router.push(
        `/checkout/confirm-order?orderId=${encodeURIComponent(data.orderID)}&accessToken=${encodeURIComponent(data.accessToken)}`,
      );
    },
    [router],
  );

  return (
    <Fragment>
      <h1 className="text-xl mb-4">Find my order</h1>
      <div className="prose dark:prose-invert mb-8">
        <p>{`Please enter the order ID and secure access token from your order email.`}</p>
      </div>
      <form className="max-w-lg flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="accessToken" className="mb-2">
            Access token
          </Label>
          <Input
            id="accessToken"
            {...register("accessToken", { required: "Access token is required." })}
            type="text"
          />
          {errors.accessToken && <FormError message={errors.accessToken.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="orderID" className="mb-2">
            Order ID
          </Label>
          <Input
            id="orderID"
            {...register("orderID", {
              required: "Order ID is required. You can find this in your email.",
            })}
            type="text"
          />
          {errors.orderID && <FormError message={errors.orderID.message} />}
        </FormItem>
        <Button type="submit" className="self-start" variant="default">
          Find my order
        </Button>
      </form>
    </Fragment>
  );
};
