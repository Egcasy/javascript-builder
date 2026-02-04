import { useState } from "react";

const MONNIFY_BASE_URL = "https://sandbox.monnify.com";
const MONNIFY_API_KEY = "MK_TEST_VZ1UGXMXPJ";
const MONNIFY_SECRET_KEY = "YQFMQKM8TQ4GHCFKXB5E3ELYSHBF98DN";
const MONNIFY_CONTRACT_CODE = "3636171648";

interface InitializePaymentParams {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  description: string;
  redirectUrl: string;
}

interface VerifyPaymentResult {
  status: string;
  amount?: number;
  paymentReference?: string;
}

const getAuthToken = async () => {
  const credentials = btoa(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`);
  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to authenticate with Monnify");
  }

  const data = await response.json();
  return data?.responseBody?.accessToken as string;
};

export const useMonnifyPayment = () => {
  const [loading, setLoading] = useState(false);

  const initializePayment = async ({
    orderId,
    amount,
    customerEmail,
    customerName,
    description,
    redirectUrl,
  }: InitializePaymentParams) => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          customerName,
          customerEmail,
          paymentDescription: description,
          paymentReference: orderId,
          currencyCode: "NGN",
          contractCode: MONNIFY_CONTRACT_CODE,
          redirectUrl,
          paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to initialize Monnify payment");
      }

      const data = await response.json();
      return {
        success: true,
        checkoutUrl: data?.responseBody?.checkoutUrl as string,
        paymentReference: data?.responseBody?.paymentReference as string,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Payment initialization failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentReference: string): Promise<VerifyPaymentResult> => {
    const token = await getAuthToken();
    const response = await fetch(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to verify Monnify payment");
    }

    const data = await response.json();
    return {
      status: data?.responseBody?.paymentStatus,
      amount: data?.responseBody?.amountPaid,
      paymentReference: data?.responseBody?.paymentReference,
    };
  };

  return {
    loading,
    initializePayment,
    verifyPayment,
  };
};
