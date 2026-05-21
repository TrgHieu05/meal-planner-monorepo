-- Enforce one provider identity per external account
CREATE UNIQUE INDEX "user_providers_provider_provider_id_key" ON "user_providers"("provider", "provider_id");