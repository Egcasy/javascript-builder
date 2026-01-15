import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONNIFY_BASE_URL = Deno.env.get('MONNIFY_BASE_URL') || 'https://sandbox.monnify.com';
const MONNIFY_API_KEY = Deno.env.get('MONNIFY_API_KEY');
const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY');
const MONNIFY_CONTRACT_CODE = Deno.env.get('MONNIFY_CONTRACT_CODE');

async function getMonnifyAccessToken(): Promise<string> {
  const credentials = btoa(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`);
  
  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('Monnify auth response:', data.responseMessage);
  
  if (!data.requestSuccessful) {
    throw new Error(`Monnify auth failed: ${data.responseMessage}`);
  }
  
  return data.responseBody.accessToken;
}

async function initializeTransaction(
  accessToken: string,
  amount: number,
  customerEmail: string,
  customerName: string,
  paymentReference: string,
  paymentDescription: string,
  redirectUrl: string
) {
  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      customerName,
      customerEmail,
      paymentReference,
      paymentDescription,
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT_CODE,
      redirectUrl,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
    }),
  });

  const data = await response.json();
  console.log('Monnify init response:', data.responseMessage);
  
  if (!data.requestSuccessful) {
    throw new Error(`Monnify init failed: ${data.responseMessage}`);
  }
  
  return data.responseBody;
}

async function verifyTransaction(accessToken: string, paymentReference: string) {
  const encodedRef = encodeURIComponent(paymentReference);
  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v2/transactions/${encodedRef}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  console.log('Monnify verify response:', data.responseMessage);
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();
    console.log(`Processing action: ${action}`);

    if (action === 'initialize') {
      const { orderId, amount, customerEmail, customerName, redirectUrl, description } = params;
      
      // Generate unique payment reference
      const paymentReference = `TIX-${orderId}-${Date.now()}`;
      
      const accessToken = await getMonnifyAccessToken();
      const result = await initializeTransaction(
        accessToken,
        amount,
        customerEmail,
        customerName,
        paymentReference,
        description || 'TixHub Ticket Purchase',
        redirectUrl
      );

      // Update order with payment reference
      await supabase
        .from('orders')
        .update({ 
          payment_reference: paymentReference,
          status: 'pending'
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: result.checkoutUrl,
          paymentReference,
          transactionReference: result.transactionReference,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      const { paymentReference, orderId } = params;
      
      const accessToken = await getMonnifyAccessToken();
      const result = await verifyTransaction(accessToken, paymentReference);

      if (result.requestSuccessful && result.responseBody.paymentStatus === 'PAID') {
        // Update order status to completed
        await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderId);

        // Update ticket statuses
        await supabase
          .from('tickets')
          .update({ status: 'valid' })
          .eq('order_id', orderId);

        return new Response(
          JSON.stringify({
            success: true,
            status: 'PAID',
            amount: result.responseBody.amountPaid,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          status: result.responseBody?.paymentStatus || 'PENDING',
          message: result.responseMessage,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Monnify error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
