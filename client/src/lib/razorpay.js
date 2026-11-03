const SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loader;

function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  loader ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.onload = resolve;
    s.onerror = () => {
      loader = null;
      reject(new Error('The payment window could not be loaded. Please check your connection and try again.'));
    };
    document.body.appendChild(s);
  });
  return loader;
}

/**
 * Opens Razorpay Checkout. Resolves with the payment response on success,
 * resolves null if the customer closes the window, rejects on payment failure.
 */
export async function payWithRazorpay({ razorpay, order, customer }) {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: razorpay.keyId,
      order_id: razorpay.orderId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: 'RK FASHIONS',
      description: `Order ${order.orderNumber}`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      notes: { order_number: order.orderNumber },
      theme: { color: '#141210' },
      handler: resolve,
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'The payment was not completed.')));
    rzp.open();
  });
}
