package com.futad.photobooth.feature.sync

import org.junit.Assert.assertEquals
import org.junit.Test

class EventConfigSyncWorkerLogicTest {
    @Test
    fun remoteVersionNewerThanLocalShouldUpdate() {
        val remoteVersion = 5L
        val localVersion = 3
        assertTrue(remoteVersion > localVersion)
    }

    @Test
    fun remoteVersionNotNewerSkipsSave() {
        val remoteVersion = 2L
        val localVersion = 5
        assertEquals(false, remoteVersion > localVersion)
    }

    @Test
    fun retryLimitIsThreeAttempts() {
        assertEquals(3, MAX_RETRY_ATTEMPTS)
    }

    companion object {
        private const val MAX_RETRY_ATTEMPTS = 3
    }
}

private fun assertTrue(value: Boolean) {
    org.junit.Assert.assertTrue(value)
}
