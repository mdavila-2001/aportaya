-- Payment transaction external reference index
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_tx_extref
ON payments.payment_transaction(external_reference);
