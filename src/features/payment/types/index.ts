export type PaymentProvider = "STRIPE" | "FLUTTERWAVE";

export type PaymentEventType =
	| "PaymentConfirmed"
	| "PaymentFailed"
	| "OrderAccepted"
	| "OrderPreparing"
	| "OrderReady"
	| "OrderOutForDelivery"
	| "OrderDelivered"
	| "OrderCancelled";
