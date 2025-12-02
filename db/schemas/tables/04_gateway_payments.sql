-- =====================================================
-- GATEWAY PAYMENTS TABLE
-- Simula una pasarela de pagos interna
-- =====================================================

CREATE TABLE IF NOT EXISTS payments.gateway_payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES payments.donation(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    qr_code_url TEXT,
    payment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    
    CONSTRAINT gateway_payment_amount_positive CHECK (amount > 0),
    CONSTRAINT gateway_payment_status_allowed CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'))
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_gateway_payment_donation ON payments.gateway_payment(donation_id);
CREATE INDEX idx_gateway_payment_status ON payments.gateway_payment(status);
CREATE INDEX idx_gateway_payment_created ON payments.gateway_payment(created_at);

-- Comentarios para documentación
COMMENT ON TABLE payments.gateway_payment IS 'Tabla para simular pasarela de pagos interna con generación de QR';
COMMENT ON COLUMN payments.gateway_payment.donation_id IS 'Referencia a la donación asociada';
COMMENT ON COLUMN payments.gateway_payment.status IS 'Estado del pago: PENDING (inicial), CONFIRMED (pagado), FAILED (fallido), EXPIRED (expirado)';
COMMENT ON COLUMN payments.gateway_payment.qr_code_url IS 'URL del código QR generado para el pago';
COMMENT ON COLUMN payments.gateway_payment.payment_url IS 'URL de la página de confirmación de pago';
