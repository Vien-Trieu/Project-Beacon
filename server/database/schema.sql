CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,

    public_id UUID NOT NULL UNIQUE,

    device_serial VARCHAR(100) NOT NULL,

    sales_order VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL,

    filename VARCHAR(255) NOT NULL,

    blob_path TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);