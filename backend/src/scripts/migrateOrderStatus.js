/*
 * Backfills orderStatus / paymentStatus / fulfillmentStatus on orders created
 * before the status split. Derives them from the legacy `status` field.
 *
 * Safe to run more than once — it only touches orders missing `orderStatus`.
 *
 *   node src/scripts/migrateOrderStatus.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

// legacy status → [orderStatus, paymentStatus, fulfillmentStatus]
const MAP = {
  pending:    ['pending',    'pending',  'unfulfilled'],
  paid:       ['confirmed',  'captured', 'unfulfilled'],
  processing: ['processing', 'captured', 'unfulfilled'],
  shipped:    ['shipped',    'captured', 'shipped'],
  delivered:  ['delivered',  'captured', 'delivered'],
  cancelled:  ['cancelled',  'failed',   'unfulfilled'],
  refunded:   ['refunded',   'refunded', 'unfulfilled'],
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);

  const orders = await Order.find({ orderStatus: { $exists: false } }).lean();
  console.log(`Found ${orders.length} order(s) to migrate.`);

  let migrated = 0;
  for (const o of orders) {
    const [orderStatus, paymentStatus, fulfillmentStatus] = MAP[o.status] || MAP.pending;

    // A COD order is never "captured" online — its money arrives on delivery.
    const isCod = o.payment?.method === 'cod';
    const resolvedPayment = isCod && paymentStatus === 'captured' ? 'pending' : paymentStatus;

    await Order.updateOne(
      { _id: o._id },
      {
        $set: {
          orderStatus,
          paymentStatus: resolvedPayment,
          fulfillmentStatus,
          ...(o.payment?.paidAt || o.total ? { 'payment.amount': Math.round((o.total || 0) * 100) } : {}),
        },
      }
    );
    migrated += 1;
  }

  console.log(`Migrated ${migrated} order(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
