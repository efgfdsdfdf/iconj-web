import { createClient } from "@supabase/supabase-js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface CreateTransferRecipientResponse {
  success: boolean;
  recipient_code?: string;
  error?: string;
}

export interface InitiateTransferResponse {
  success: boolean;
  transfer_code?: string;
  reference?: string;
  error?: string;
}

export interface VerifyTransferResponse {
  success: boolean;
  status?: string;
  error?: string;
}

/**
 * Helper to get authorization headers for Paystack API requests.
 */
function getPaystackHeaders() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not defined in environment variables");
  }
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Creates a Paystack transfer recipient for NUBAN accounts.
 *
 * @param bankCode - Bank code (e.g. "058" for GTBank)
 * @param accountNumber - 10-digit NUBAN account number
 * @param accountName - Verified name of the account holder
 * @returns Object with success status and recipient_code or error message
 */
export async function createTransferRecipient(
  bankCode: string,
  accountNumber: string,
  accountName: string
): Promise<CreateTransferRecipientResponse> {
  try {
    const headers = getPaystackHeaders();

    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      const errorMessage = data.message || "Failed to create transfer recipient";
      console.error("Paystack createTransferRecipient error:", errorMessage, data);
      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      recipient_code: data.data?.recipient_code,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error creating transfer recipient";
    console.error("Paystack createTransferRecipient exception:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Initiates a transfer from the Paystack balance to a transfer recipient.
 *
 * @param amount - Amount in NGN (will be converted to kobo)
 * @param recipientCode - Paystack recipient code (e.g. "RCP_...")
 * @param reason - Reason / narration for the transfer
 * @param reference - Optional unique transaction reference
 * @returns Object with success status, transfer_code, reference, or error message
 */
export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reason: string,
  reference?: string
): Promise<InitiateTransferResponse> {
  try {
    const headers = getPaystackHeaders();

    const payload: {
      source: string;
      amount: number;
      recipient: string;
      reason: string;
      reference?: string;
    } = {
      source: "balance",
      amount: Math.round(amount * 100), // convert NGN to kobo
      recipient: recipientCode,
      reason,
    };

    if (reference) {
      payload.reference = reference;
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      const errorMessage = data.message || "Failed to initiate transfer";
      console.error("Paystack initiateTransfer error:", errorMessage, data);
      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      transfer_code: data.data?.transfer_code,
      reference: data.data?.reference,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error initiating transfer";
    console.error("Paystack initiateTransfer exception:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Verifies the status of a transfer by reference.
 *
 * @param reference - Paystack transfer reference
 * @returns Object with success status, transfer status ("success", "failed", "pending", etc.), or error message
 */
export async function verifyTransfer(reference: string): Promise<VerifyTransferResponse> {
  try {
    const headers = getPaystackHeaders();

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transfer/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      const errorMessage = data.message || "Failed to verify transfer";
      console.error("Paystack verifyTransfer error:", errorMessage, data);
      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      status: data.data?.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error verifying transfer";
    console.error("Paystack verifyTransfer exception:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Checks if automated Paystack transfers are enabled in wallet_settings.
 *
 * @returns true if payout_mode is 'PAYSTACK_TRANSFER', false otherwise.
 */
export async function isTransfersEnabled(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables missing for isTransfersEnabled check");
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("wallet_settings")
      .select("payout_mode")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error querying wallet_settings:", error);
      return false;
    }

    return data?.payout_mode === "PAYSTACK_TRANSFER";
  } catch (error) {
    console.error("Exception in isTransfersEnabled:", error);
    return false;
  }
}
