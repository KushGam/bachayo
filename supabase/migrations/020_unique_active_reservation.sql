-- Prevent duplicate active reservations for the same customer + bag
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_reservation
  ON public.orders (customer_id, bag_id)
  WHERE status IN ('confirmed'::public.order_status, 'pending'::public.order_status);
