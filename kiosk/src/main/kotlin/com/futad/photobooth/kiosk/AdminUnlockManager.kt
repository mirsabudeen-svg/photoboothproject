package com.futad.photobooth.kiosk

import com.futad.photobooth.core.data.store.PinManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdminUnlockManager @Inject constructor(
    private val pinManager: PinManager,
) {
    private var unlockedUntilMs: Long = 0

    fun verifyPin(pin: String): Boolean {
        if (!pinManager.isPinSet()) return false
        if (pinManager.verifyPin(pin)) {
            unlockedUntilMs = System.currentTimeMillis() + ADMIN_UNLOCK_DURATION_MS
            return true
        }
        return false
    }

    fun isPinConfigured(): Boolean = pinManager.isPinSet()

    fun isAdminUnlocked(): Boolean = System.currentTimeMillis() < unlockedUntilMs

    fun lockNow() {
        unlockedUntilMs = 0
    }

    companion object {
        private const val ADMIN_UNLOCK_DURATION_MS = 5 * 60 * 1000L
    }
}
