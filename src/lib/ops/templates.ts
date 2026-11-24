/** Quick-start messages for replies. "{name}" becomes the customer's first name. Edit freely. */

export const QUERY_TEMPLATES = [
  { label: "Thanks, we're on it", text: "Hi {name}, thank you for getting in touch with Naturo Wellness. We've received your message and will get back to you shortly." },
  { label: "Stockist info", text: "Hi {name}, thank you for your interest in stocking Naturo! We'd love to work with you. Could you share your shop name, location and roughly how many units a week you'd like? We'll send our wholesale price list." },
  { label: "Delivery areas", text: "Hi {name}, delivery is $3 in Harare CBD, $5 everywhere else in Zimbabwe (including the Harare suburbs) and $15 to South Africa, added to your order total. You can also collect from us for free. Place your order at getnaturo.com and choose delivery or collection at checkout." },
  { label: "Thank you for feedback", text: "Hi {name}, thank you so much for the kind words! Feedback like yours keeps us going. We'll share it with the team." },
  { label: "Resolved", text: "Hi {name}, just checking in: we believe this is now sorted. If there's anything else we can help with, simply reply to this message." },
];

export const ORDER_TEMPLATES = [
  { label: "Order confirmed", text: "Hi {name}, your Naturo order {order} is confirmed and we're preparing it now. We'll let you know when it's on the way." },
  { label: "On the way", text: "Hi {name}, good news: your Naturo order {order} is on its way! You can follow the rider live on your order page." },
  { label: "Ready to collect", text: "Hi {name}, your Naturo order {order} is ready for collection. See you soon!" },
  { label: "Payment reminder", text: "Hi {name}, a gentle reminder that payment for order {order} is still outstanding. Reply here if you need the payment details again." },
  { label: "Delivered, thank you", text: "Hi {name}, your order {order} has been delivered. Thank you for choosing Naturo Wellness! We'd love to hear what you think." },
];

export const withOrder = (templates: { label: string; text: string }[], orderNumber: string) =>
  templates.map((t) => ({ ...t, text: t.text.replace(/\{order\}/g, orderNumber) }));
