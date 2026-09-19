// Payment adapter interface. Default is a development simulator that always succeeds.
export function getPaymentAdapter() {
  const provider = process.env.PAYMENT_PROVIDER || "dev-simulator";
  if (provider === "dev-simulator") {
    return {
      name: "dev-simulator",
      async charge({ amount, orderId }) {
        // Always succeed in development
        return {
          status: "SUCCEEDED",
          providerRef: `sim_${orderId}_${Date.now()}`,
          raw: { simulated: true, amount },
        };
      },
    };
  }
  throw new Error(`Unknown payment provider: ${provider}`);
}
