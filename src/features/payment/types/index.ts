export type PaymentProvider = "FLUTTERWAVE" | "PAYSTACK";

export type PaymentEventType =
	| "PaymentConfirmed"
	| "PaymentFailed"
	| "OrderAccepted"
	| "OrderPreparing"
	| "OrderReady"
	| "OrderOutForDelivery"
	| "OrderDelivered"
	| "OrderCancelled";
