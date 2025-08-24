package com.example.elitescorebackend.schedulers;

import com.example.elitescorebackend.handlers.TokenRevocationHandler;
import com.example.elitescorebackend.handlers.VerificationCodeHandler;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.ejb.Schedule;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;

@Singleton
@Startup
public class CleanUpScheduler {

    @Schedule(hour = "*", minute = "0", persistent = false)
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void purgeExpiredAndUsed() {
        VerificationCodeHandler.getInstance().purgeExpiredAndUsed();
    }

    @Schedule(hour="*", minute="1", persistent=false)
    public void cleanupOldRevocations() {
        TokenRevocationHandler.getInstance().deleteOldTokens();
    }
}
