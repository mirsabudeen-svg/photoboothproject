package com.futad.photobooth.core.data.store

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.deviceCredentialsStore by preferencesDataStore("device_credentials")

@Singleton
class DeviceCredentialsStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val dataStore: DataStore<Preferences> = context.deviceCredentialsStore

    val tokenFlow: Flow<String?> = dataStore.data.map { it[TOKEN_KEY] }
    val deviceIdFlow: Flow<String?> = dataStore.data.map { it[DEVICE_ID_KEY] }
    val activeEventIdFlow: Flow<String?> = dataStore.data.map { it[ACTIVE_EVENT_ID_KEY] }

    suspend fun saveToken(token: String, deviceId: String) {
        dataStore.edit {
            it[TOKEN_KEY] = token
            it[DEVICE_ID_KEY] = deviceId
        }
    }

    suspend fun saveTokenExpiresAt(expiresAtIso: String) {
        val millis = java.time.Instant.parse(expiresAtIso).toEpochMilli()
        dataStore.edit { it[TOKEN_EXPIRES_AT_KEY] = millis }
    }

    suspend fun getToken(): String? = dataStore.data.first()[TOKEN_KEY]

    suspend fun getDeviceId(): String? = dataStore.data.first()[DEVICE_ID_KEY]

    suspend fun getTokenExpiresAt(): Long? = dataStore.data.first()[TOKEN_EXPIRES_AT_KEY]

    suspend fun isPaired(): Boolean = getToken() != null

    suspend fun setActiveEventId(eventId: String) {
        dataStore.edit { it[ACTIVE_EVENT_ID_KEY] = eventId }
    }

    suspend fun getActiveEventId(): String? = dataStore.data.first()[ACTIVE_EVENT_ID_KEY]

    suspend fun setCompanionHostIp(ip: String) {
        dataStore.edit { it[COMPANION_HOST_IP_KEY] = ip.trim() }
    }

    suspend fun getCompanionHostIp(): String? =
        dataStore.data.first()[COMPANION_HOST_IP_KEY]?.takeIf { it.isNotBlank() }

    suspend fun setCompanionPrintToken(token: String) {
        dataStore.edit { it[COMPANION_PRINT_TOKEN_KEY] = token.trim() }
    }

    suspend fun getCompanionPrintToken(): String? =
        dataStore.data.first()[COMPANION_PRINT_TOKEN_KEY]?.takeIf { it.isNotBlank() }

    suspend fun clear() {
        dataStore.edit { it.clear() }
    }

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("device_token")
        private val DEVICE_ID_KEY = stringPreferencesKey("device_id")
        private val ACTIVE_EVENT_ID_KEY = stringPreferencesKey("active_event_id")
        private val TOKEN_EXPIRES_AT_KEY = longPreferencesKey("token_expires_at")
        private val COMPANION_HOST_IP_KEY = stringPreferencesKey("companion_host_ip")
        private val COMPANION_PRINT_TOKEN_KEY = stringPreferencesKey("companion_print_token")
    }
}
